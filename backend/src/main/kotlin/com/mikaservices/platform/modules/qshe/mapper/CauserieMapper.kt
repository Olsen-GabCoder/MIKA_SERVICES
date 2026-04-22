package com.mikaservices.platform.modules.qshe.mapper

import com.mikaservices.platform.modules.qshe.dto.response.CauserieResponse
import com.mikaservices.platform.modules.qshe.dto.response.ParticipantResponse
import com.mikaservices.platform.modules.qshe.entity.Causerie

object CauserieMapper {
    fun toResponse(e: Causerie): CauserieResponse {
        val anim = e.animateur
        return CauserieResponse(
            id = e.id!!, reference = e.reference, sujet = e.sujet, description = e.description,
            dateCauserie = e.dateCauserie, heureDebut = e.heureDebut, dureeMinutes = e.dureeMinutes,
            lieu = e.lieu, projetId = e.projet.id!!, projetNom = e.projet.nom,
            animateurId = anim?.id, animateurNom = anim?.let { "${it.prenom} ${it.nom}" },
            observations = e.observations, nbParticipants = e.participants.size,
            participants = e.participants.map { ParticipantResponse(it.id!!, it.nom, it.prenom, it.matricule) },
            createdAt = e.createdAt, updatedAt = e.updatedAt
        )
    }
}
