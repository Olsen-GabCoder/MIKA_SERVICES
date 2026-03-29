package com.mikaservices.platform.modules.bareme.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Version

/**
 * Compteur par année pour les références matériaux [MAT-YYYY-NNNNN] (allocation atomique).
 */
@Entity
@Table(name = "bareme_mat_ref_sequence")
class BaremeMatRefSequence(
    @Id
    @Column(name = "annee")
    var annee: Int,

    @Column(name = "dernier_numero", nullable = false)
    var dernierNumero: Int = 0,

    @Version
    @Column(name = "version", nullable = false)
    var version: Long = 0L
)
