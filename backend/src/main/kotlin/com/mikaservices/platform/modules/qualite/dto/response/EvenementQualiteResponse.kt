package com.mikaservices.platform.modules.qualite.dto.response

import com.mikaservices.platform.modules.qualite.enums.*
import java.time.LocalDate
import java.time.LocalDateTime

data class EvenementQualiteResponse(
    val id: Long,
    val reference: String,
    val typeEvenement: TypeEvenement,
    val categories: Set<CategorieEvenement>,
    val origine: OrigineEvenement,
    val statut: StatutEvenement,
    val ouvrageConcerne: String?,
    val controleExigeCctp: Boolean,
    val description: String?,
    val fournisseurNom: String?,
    val numeroBc: String?,
    val numeroBl: String?,
    val dateLivraison: LocalDate?,
    val projetId: Long,
    val projetNom: String,
    val createurId: Long?,
    val createurNom: String?,
    val sections: List<SectionResponse>,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?,
)

data class SectionResponse(
    val id: Long,
    val numeroSection: NumeroSection,
    val contenu: String?,
    val signataireDesigneId: Long?,
    val signataireDesigneNom: String?,
    val signataireEffectifId: Long?,
    val signataireEffectifNom: String?,
    val dateSignature: LocalDateTime?,
    val signee: Boolean,
    val choixTraitement: ChoixTraitement?,
    val necessiteCapa: Boolean?,
    val signatairesCollegiaux: List<SignataireCollegialResponse>,
    val actionsTraitement: List<ActionTraitementResponse>,
    val piecesJointes: List<PieceJointeResponse>,
)

data class SignataireCollegialResponse(
    val id: Long,
    val roleAttendu: RoleCollegial,
    val signataireDesigneId: Long?,
    val signataireDesigneNom: String?,
    val signataireEffectifId: Long?,
    val signataireEffectifNom: String?,
    val dateSignature: LocalDateTime?,
    val signee: Boolean,
)

data class ActionTraitementResponse(
    val id: Long,
    val descriptionAction: String,
    val responsable: String?,
    val delaiPrevu: LocalDate?,
)

data class PieceJointeResponse(
    val id: Long,
    val urlFichier: String,
    val legende: String?,
    val ordreAffichage: Int,
)

/** Résumé léger pour les listes paginées. */
data class EvenementQualiteListResponse(
    val id: Long,
    val reference: String,
    val typeEvenement: TypeEvenement,
    val categories: Set<CategorieEvenement>,
    val origine: OrigineEvenement,
    val statut: StatutEvenement,
    val ouvrageConcerne: String?,
    val projetId: Long,
    val projetNom: String,
    val createurNom: String?,
    val createdAt: LocalDateTime?,
)
