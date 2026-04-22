package com.mikaservices.platform.modules.ia.entity

import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * Journal des appels IA pour l'analyse de rapports de chantier.
 * Sert au suivi des coûts (tokens), à l'audit et au monitoring.
 *
 * DÉPLOIEMENT PROD : cette table doit être créée en prod via le profil
 * `prod-postgres-init` (ddl-auto: update) avant le déploiement de la feature IA.
 * Après création, retirer le profil et redéployer (ddl-auto: none).
 */
@Entity
@Table(
    name = "analyse_rapport_log",
    indexes = [
        Index(name = "idx_arl_projet_timestamp", columnList = "projet_id, timestamp_debut"),
        Index(name = "idx_arl_hash", columnList = "hash_rapport")
    ]
)
class AnalyseRapportLog(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "projet_id", nullable = false)
    val projetId: Long = 0,

    @Column(name = "user_id", nullable = false)
    val userId: Long = 0,

    @Column(name = "timestamp_debut", nullable = false)
    val timestampDebut: LocalDateTime = LocalDateTime.now(),

    @Column(name = "duree_ms", nullable = false)
    val dureeMs: Int = 0,

    @Column(name = "modele", nullable = false, length = 50)
    val modele: String = "",

    @Column(name = "tokens_input", nullable = false)
    val tokensInput: Int = 0,

    @Column(name = "tokens_output", nullable = false)
    val tokensOutput: Int = 0,

    @Column(name = "succes", nullable = false)
    val succes: Boolean = true,

    @Column(name = "erreur_code", length = 50)
    val erreurCode: String? = null,

    @Column(name = "hash_rapport", nullable = false, length = 64)
    val hashRapport: String = "",

    @Column(name = "format_source", length = 10)
    val formatSource: String? = null,

    @Column(name = "taille_octets")
    val tailleOctets: Int? = null,

    @Column(name = "nb_champs_extraits")
    val nbChampsExtraits: Int? = null
)
