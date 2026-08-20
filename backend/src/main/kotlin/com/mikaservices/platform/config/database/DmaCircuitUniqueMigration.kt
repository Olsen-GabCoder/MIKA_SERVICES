package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Réforme du circuit DMA (2026-08-20) — modèle à une seule porte, aligné transferts :
 * SOUMISE (attente logistique) → PRISE_EN_CHARGE → EN_COMMANDE → LIVRE → CLOTUREE.
 * Les portes de validation chantier/projet sont supprimées du circuit.
 *
 * Data : les DMA encore en EN_VALIDATION_CHANTIER / EN_VALIDATION_PROJET reviennent en
 * SOUMISE, avec une trace dans l'historique (user = créateur de la DMA, faute d'acteur
 * système). Les valeurs d'enum restent lisibles pour l'historique et les visas PDF des
 * anciennes DMA. Idempotent : après migration, plus aucune ligne ne matche.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class DmaCircuitUniqueMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(DmaCircuitUniqueMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            val inserted = jdbcTemplate.update(
                """
                INSERT INTO demandes_materiel_historique
                    (created_at, updated_at, date_transition, de_statut, vers_statut, commentaire, demande_id, user_id)
                SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, d.statut, 'SOUMISE',
                       'Réforme du circuit 2026-08-20 : retour en attente logistique', d.id, d.createur_user_id
                FROM demandes_materiel d
                WHERE d.statut IN ('EN_VALIDATION_CHANTIER', 'EN_VALIDATION_PROJET')
                """.trimIndent()
            )
            val updated = jdbcTemplate.update(
                "UPDATE demandes_materiel SET statut = 'SOUMISE' WHERE statut IN ('EN_VALIDATION_CHANTIER', 'EN_VALIDATION_PROJET')"
            )
            if (updated > 0) {
                logger.warn("[DmaCircuitUniqueMigration] $updated DMA rebasculee(s) en SOUMISE ($inserted trace(s) historique).")
            }
        } catch (e: Exception) {
            logger.error("[DmaCircuitUniqueMigration] Echec migration circuit DMA : ${e.message}")
        }
        logger.info("[DmaCircuitUniqueMigration] Migration terminee.")
    }
}
