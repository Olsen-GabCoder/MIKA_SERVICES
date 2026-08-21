package com.mikaservices.platform.modules.materiel.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "trajet_positions", indexes = [
    Index(name = "idx_trajet_pos_mouvement", columnList = "mouvement_id"),
    Index(name = "idx_trajet_pos_horodatage", columnList = "horodatage")
])
class TrajetPosition(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mouvement_id", nullable = false)
    val mouvement: MouvementEngin,

    @Column(nullable = false)
    val latitude: Double,

    @Column(nullable = false)
    val longitude: Double,

    @Column(name = "precision_metres")
    val precisionMetres: Int? = null,

    @Column(name = "vitesse_kmh")
    val vitesseKmh: Double? = null,

    @Column(name = "cap")
    val cap: Double? = null,

    @Column(name = "horodatage", nullable = false)
    val horodatage: Instant = Instant.now(),

    @Column(name = "eta_minutes")
    var etaMinutes: Int? = null,

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
)
