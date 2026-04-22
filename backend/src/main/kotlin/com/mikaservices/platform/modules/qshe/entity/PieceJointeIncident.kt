package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*

/**
 * Stub pour les pieces jointes (photos, rapports).
 * L'upload fonctionnel (S3/Cloudinary) sera implemente au livrable #1bis.
 */
@Entity
@Table(name = "qshe_pieces_jointes_incident", indexes = [
    Index(name = "idx_qpj_incident", columnList = "incident_id")
])
class PieceJointeIncident(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    var incident: Incident,

    @Column(name = "nom_fichier", nullable = false, length = 500)
    var nomFichier: String,

    @Column(name = "url_stockage", nullable = false, length = 1000)
    var urlStockage: String,

    @Column(name = "type_mime", length = 100)
    var typeMime: String? = null,

    @Column(name = "taille_octets")
    var tailleOctets: Long? = null,

    @Column(name = "description", length = 500)
    var description: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploade_par_id")
    var uploadePar: User? = null

) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PieceJointeIncident) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: nomFichier.hashCode()
    override fun toString(): String = "PieceJointeIncident(id=$id, nomFichier='$nomFichier')"
}
