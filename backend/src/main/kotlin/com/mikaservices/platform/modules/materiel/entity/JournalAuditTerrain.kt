package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*

/**
 * Journal transverse append-only des actions de l'app mobile terrain.
 * Aucune mise à jour ni suppression : insertion seule (traçabilité/audit).
 */
@Entity
@Table(name = "journal_audit_terrain", indexes = [
    Index(name = "idx_audit_terrain_entite", columnList = "entite_type, entite_id"),
    Index(name = "idx_audit_terrain_acteur", columnList = "acteur_id"),
    Index(name = "idx_audit_terrain_action", columnList = "action")
])
class JournalAuditTerrain(
    /** Null si anonyme (mode dev sans authentification). */
    @Column(name = "acteur_id")
    var acteurId: Long? = null,

    @Column(name = "acteur_nom", length = 150)
    var acteurNom: String? = null,

    @Column(name = "action", nullable = false, length = 50)
    var action: String,

    @Column(name = "entite_type", nullable = false, length = 30)
    var entiteType: String,

    @Column(name = "entite_id")
    var entiteId: Long? = null,

    @Column(name = "projet_id")
    var projetId: Long? = null,

    @Column(name = "latitude")
    var latitude: Double? = null,

    @Column(name = "longitude")
    var longitude: Double? = null,

    /** Détails libres (JSON ou texte court). */
    @Column(name = "payload", columnDefinition = "TEXT")
    var payload: String? = null,
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is JournalAuditTerrain) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
    override fun toString(): String = "JournalAuditTerrain(id=$id, action=$action)"
}
