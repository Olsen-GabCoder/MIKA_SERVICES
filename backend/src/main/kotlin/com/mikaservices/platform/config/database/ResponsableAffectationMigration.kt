package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration modèle rôles (docs/matrice-roles-perimetres.md) — l'affectation EN_COURS
 * RP-CHEF-PROJET devient la source de vérité unique du responsable de projet :
 *
 * 1. roles_projet RP-CHEF-PROJET passe cumulable = TRUE (un chef peut piloter plusieurs
 *    projets ; l'invariant est « un seul chef PAR PROJET », jamais « un seul projet par chef »).
 * 2. Pour chaque projet ACTIF dont responsable_projet_id est renseigné SANS affectation
 *    ouverte correspondante : création de l'affectation chef de projet EN_COURS.
 *    Sans elle, la bascule du code (périmètre = affectations seules) couperait l'accès du chef.
 *
 * Idempotent (rejouable à chaque démarrage), compatible Postgres prod / MySQL dev.
 * Les cas ambigus (déjà un autre chef ouvert, ou le responsable déjà affecté sur un autre
 * poste) ne sont PAS forcés : ils sont journalisés pour arbitrage manuel.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class ResponsableAffectationMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(ResponsableAffectationMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            doMigrate()
        } catch (e: Exception) {
            // Ne jamais bloquer le démarrage : la synchro applicative reprend le relais ensuite.
            logger.error("[ResponsableAffectationMigration] Migration ignoree : ${e.message}")
        }
    }

    private fun doMigrate() {
        // 1. Chef de projet cumulable sur plusieurs projets
        val cumulableFixes = jdbcTemplate.update(
            "UPDATE roles_projet SET cumulable = TRUE WHERE code = 'RP-CHEF-PROJET' AND cumulable = FALSE"
        )
        if (cumulableFixes > 0) logger.warn("[ResponsableAffectationMigration] RP-CHEF-PROJET passe cumulable=TRUE.")

        val posteChef = jdbcTemplate.queryForList(
            "SELECT nom FROM roles_projet WHERE code = 'RP-CHEF-PROJET' AND actif = TRUE", String::class.java
        ).firstOrNull()
        if (posteChef == null) {
            logger.warn("[ResponsableAffectationMigration] Role RP-CHEF-PROJET absent du referentiel — rien a migrer.")
            return
        }

        // 2. Responsables actifs sans affectation chef ouverte
        val orphelins = jdbcTemplate.queryForList(
            """
            SELECT p.id AS projet_id, p.nom AS projet_nom, p.responsable_projet_id AS user_id
            FROM projets p
            WHERE p.actif = TRUE
              AND p.responsable_projet_id IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM affectations_utilisateur_projet a
                  JOIN roles_projet rp ON LOWER(rp.nom) = LOWER(a.poste) AND rp.code = 'RP-CHEF-PROJET'
                  WHERE a.projet_id = p.id
                    AND a.user_id = p.responsable_projet_id
                    AND a.statut IN ('PLANIFIEE', 'EN_COURS')
              )
            """.trimIndent()
        )
        if (orphelins.isEmpty()) {
            logger.info("[ResponsableAffectationMigration] Donnees deja coherentes (responsable => affectation chef).")
            return
        }

        var crees = 0
        for (row in orphelins) {
            val projetId = (row["projet_id"] as Number).toLong()
            val projetNom = row["projet_nom"] as String
            val userId = (row["user_id"] as Number).toLong()

            // Garde-fou 1 : un autre chef ouvert sur ce projet -> arbitrage manuel, on ne force pas.
            val autreChef = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM affectations_utilisateur_projet a
                JOIN roles_projet rp ON LOWER(rp.nom) = LOWER(a.poste) AND rp.code = 'RP-CHEF-PROJET'
                WHERE a.projet_id = ? AND a.user_id <> ? AND a.statut IN ('PLANIFIEE', 'EN_COURS')
                """.trimIndent(),
                Int::class.java, projetId, userId
            ) ?: 0
            if (autreChef > 0) {
                logger.warn(
                    "[ResponsableAffectationMigration] Projet $projetId « $projetNom » : un autre chef de projet " +
                        "est deja affecte — responsable_projet_id=$userId a arbitrer manuellement."
                )
                continue
            }

            // Garde-fou 2 : le responsable a deja une affectation ouverte sur ce projet (autre poste)
            // -> le perimetre est garanti, mais le poste chef reste a arbitrer manuellement.
            val dejaAffecte = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM affectations_utilisateur_projet WHERE projet_id = ? AND user_id = ? AND statut IN ('PLANIFIEE', 'EN_COURS')",
                Int::class.java, projetId, userId
            ) ?: 0
            if (dejaAffecte > 0) {
                logger.warn(
                    "[ResponsableAffectationMigration] Projet $projetId « $projetNom » : le responsable $userId est " +
                        "deja affecte sur un autre poste — poste chef a regulariser manuellement."
                )
                continue
            }

            jdbcTemplate.update(
                """
                INSERT INTO affectations_utilisateur_projet
                    (user_id, projet_id, poste, date_debut, statut, observations, created_at, updated_at, created_by)
                VALUES (?, ?, ?, CURRENT_DATE, 'EN_COURS', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'migration')
                """.trimIndent(),
                userId, projetId, posteChef,
                "Affectation créée par migration : officialisation du responsable de projet (matrice rôles 2026-08-20)."
            )
            crees++
            logger.warn("[ResponsableAffectationMigration] Projet $projetId « $projetNom » : affectation chef creee pour user $userId.")
        }
        logger.info("[ResponsableAffectationMigration] Terminee : $crees affectation(s) chef creee(s) sur ${orphelins.size} responsable(s) sans affectation.")
    }
}
