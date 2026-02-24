package com.mikaservices.platform.modules.reunionhebdo.mapper

import com.mikaservices.platform.modules.reunionhebdo.dto.response.*
import com.mikaservices.platform.modules.reunionhebdo.entity.ParticipantReunion
import com.mikaservices.platform.modules.reunionhebdo.entity.PointProjetPV
import com.mikaservices.platform.modules.reunionhebdo.entity.ReunionHebdo

object ReunionHebdoMapper {

    fun toUserSummary(user: com.mikaservices.platform.modules.user.entity.User?): ReunionUserSummary? {
        if (user == null) return null
        return ReunionUserSummary(
            id = user.id!!,
            nom = user.nom,
            prenom = user.prenom,
            email = user.email
        )
    }

    fun toParticipantResponse(p: ParticipantReunion): ParticipantReunionResponse = ParticipantReunionResponse(
        id = p.id!!,
        userId = p.user.id!!,
        nom = p.user.nom,
        prenom = p.user.prenom,
        email = p.user.email,
        initiales = p.initiales,
        telephone = p.telephone ?: p.user.telephone,
        present = p.present
    )

    fun toPointProjetPVResponse(pp: PointProjetPV): PointProjetPVResponse = PointProjetPVResponse(
        id = pp.id!!,
        projetId = pp.projet.id!!,
        projetCode = pp.projet.nom,
        projetNom = pp.projet.nom,
        chefProjetNom = pp.projet.responsableProjet?.let { "${it.prenom} ${it.nom}" },
        avancementPhysiquePct = pp.avancementPhysiquePct,
        avancementFinancierPct = pp.avancementFinancierPct,
        delaiConsommePct = pp.delaiConsommePct,
        resumeTravauxPrevisions = pp.resumeTravauxPrevisions,
        pointsBloquantsResume = pp.pointsBloquantsResume,
        besoinsMateriel = pp.besoinsMateriel,
        besoinsHumain = pp.besoinsHumain,
        propositionsAmelioration = pp.propositionsAmelioration,
        ordreAffichage = pp.ordreAffichage
    )

    fun toResponse(entity: ReunionHebdo): ReunionHebdoResponse = ReunionHebdoResponse(
        id = entity.id!!,
        dateReunion = entity.dateReunion,
        lieu = entity.lieu,
        heureDebut = entity.heureDebut,
        heureFin = entity.heureFin,
        ordreDuJour = entity.ordreDuJour,
        statut = entity.statut,
        divers = entity.divers,
        redacteur = toUserSummary(entity.redacteur),
        participants = entity.participants.map { toParticipantResponse(it) },
        pointsProjet = entity.pointsProjet.sortedBy { it.ordreAffichage }.map { toPointProjetPVResponse(it) },
        createdAt = entity.createdAt,
        updatedAt = entity.updatedAt
    )

    fun toSummaryResponse(entity: ReunionHebdo): ReunionHebdoSummaryResponse = ReunionHebdoSummaryResponse(
        id = entity.id!!,
        dateReunion = entity.dateReunion,
        lieu = entity.lieu,
        heureDebut = entity.heureDebut,
        heureFin = entity.heureFin,
        statut = entity.statut,
        redacteurNom = entity.redacteur?.let { "${it.prenom} ${it.nom}" },
        nombreParticipants = entity.participants.size,
        nombrePointsProjet = entity.pointsProjet.size
    )
}
