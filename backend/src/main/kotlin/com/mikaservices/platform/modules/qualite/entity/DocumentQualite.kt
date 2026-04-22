package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*

@Entity
@Table(
    name = "qualite_documents",
    indexes = [
        Index(name = "idx_qdoc_code", columnList = "code_document"),
    ]
)
class DocumentQualite(

    @Column(name = "code_document", nullable = false, unique = true, length = 50)
    var codeDocument: String,

    @Column(name = "titre", nullable = false, length = 300)
    var titre: String,

    @Column(name = "version_courante", nullable = false, length = 20)
    var versionCourante: String = "1",

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "nom_original", length = 500)
    var nomOriginal: String? = null,

    @Column(name = "nom_stockage", length = 500)
    var nomStockage: String? = null,

    @Column(name = "type_mime", length = 200)
    var typeMime: String? = null,

    @Column(name = "actif", nullable = false)
    var actif: Boolean = true,

    @OneToMany(mappedBy = "document", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var versions: MutableList<VersionDocumentQualite> = mutableListOf(),

) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DocumentQualite) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: codeDocument.hashCode()
}
