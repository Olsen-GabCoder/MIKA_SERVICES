package com.mikaservices.platform.modules.qualite.mapper

import com.mikaservices.platform.modules.qualite.dto.response.*
import com.mikaservices.platform.modules.qualite.entity.*
import com.mikaservices.platform.modules.qualite.enums.NumeroSection

object EvenementQualiteMapper {

    fun toResponse(e: EvenementQualite): EvenementQualiteResponse = EvenementQualiteResponse(
        id = e.id!!,
        reference = e.reference,
        typeEvenement = e.typeEvenement,
        categories = e.categories.toSet(),
        origine = e.origine,
        statut = e.statut,
        ouvrageConcerne = e.ouvrageConcerne,
        controleExigeCctp = e.controleExigeCctp,
        description = e.description,
        fournisseurNom = e.fournisseurNom,
        numeroBc = e.numeroBc,
        numeroBl = e.numeroBl,
        dateLivraison = e.dateLivraison,
        projetId = e.projet.id!!,
        projetNom = e.projet.nom,
        createurId = e.createur?.id,
        createurNom = e.createur?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        sections = e.sections
            .sortedBy { NumeroSection.WORKFLOW_ORDER.indexOf(it.numeroSection) }
            .map(::toSectionResponse),
        createdAt = e.createdAt,
        updatedAt = e.updatedAt,
    )

    fun toListResponse(e: EvenementQualite): EvenementQualiteListResponse = EvenementQualiteListResponse(
        id = e.id!!,
        reference = e.reference,
        typeEvenement = e.typeEvenement,
        categories = e.categories.toSet(),
        origine = e.origine,
        statut = e.statut,
        ouvrageConcerne = e.ouvrageConcerne,
        projetId = e.projet.id!!,
        projetNom = e.projet.nom,
        createurNom = e.createur?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        createdAt = e.createdAt,
    )

    private fun toSectionResponse(s: SectionEvenement): SectionResponse = SectionResponse(
        id = s.id!!,
        numeroSection = s.numeroSection,
        contenu = s.contenu,
        signataireDesigneId = s.signataireDesigne?.id,
        signataireDesigneNom = s.signataireDesigne?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        signataireEffectifId = s.signataireEffectif?.id,
        signataireEffectifNom = s.signataireEffectif?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        dateSignature = s.dateSignature,
        signee = s.signee,
        choixTraitement = s.choixTraitement,
        necessiteCapa = s.necessiteCapa,
        signatairesCollegiaux = s.signatairesCollegiaux.map(::toCollegialResponse),
        actionsTraitement = s.actionsTraitement.map(::toActionResponse),
        piecesJointes = s.piecesJointes.sortedBy { it.ordreAffichage }.map(::toPjResponse),
    )

    private fun toCollegialResponse(c: SectionSignataireCollegial): SignataireCollegialResponse = SignataireCollegialResponse(
        id = c.id!!,
        roleAttendu = c.roleAttendu,
        signataireDesigneId = c.signataireDesigne?.id,
        signataireDesigneNom = c.signataireDesigne?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        signataireEffectifId = c.signataireEffectif?.id,
        signataireEffectifNom = c.signataireEffectif?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        dateSignature = c.dateSignature,
        signee = c.signee,
    )

    private fun toActionResponse(a: ActionTraitement): ActionTraitementResponse = ActionTraitementResponse(
        id = a.id!!,
        descriptionAction = a.descriptionAction,
        responsable = a.responsable,
        delaiPrevu = a.delaiPrevu,
    )

    private fun toPjResponse(p: PieceJointeEvenement): PieceJointeResponse = PieceJointeResponse(
        id = p.id!!,
        urlFichier = p.urlFichier,
        legende = p.legende,
        ordreAffichage = p.ordreAffichage,
    )
}
