package com.mikaservices.platform.modules.planning.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypeDependance
import jakarta.persistence.*

@Entity
@Table(
    name = "dependances_taches",
    indexes = [
        Index(name = "idx_dep_source", columnList = "tache_source_id"),
        Index(name = "idx_dep_cible", columnList = "tache_cible_id")
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_dep_source_cible", columnNames = ["tache_source_id", "tache_cible_id"])
    ]
)
class DependanceTache(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tache_source_id", nullable = false)
    var tacheSource: Tache,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tache_cible_id", nullable = false)
    var tacheCible: Tache,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_dependance", nullable = false, length = 20)
    var typeDependance: TypeDependance = TypeDependance.FIN_DEBUT,

    @Column(name = "delai_jours")
    var delaiJours: Int = 0
) : BaseEntity()
