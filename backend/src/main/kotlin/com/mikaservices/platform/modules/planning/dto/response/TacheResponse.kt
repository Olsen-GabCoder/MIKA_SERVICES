package com.mikaservices.platform.modules.planning.dto.response

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutTache
import com.mikaservices.platform.common.enums.TypePrevision
import com.mikaservices.platform.modules.projet.dto.response.ProjetUserSummary
import java.time.LocalDate
import java.time.LocalDateTime

data class TacheResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val titre: String,
    val description: String?,
    val statut: StatutTache,
    val priorite: Priorite,
    val assigneA: ProjetUserSummary?,
    val dateDebut: LocalDate?,
    val dateFin: LocalDate?,
    val dateEcheance: LocalDate?,
    val pourcentageAvancement: Int,
    val enRetard: Boolean,
    val tacheParentId: Long?,
    val semaine: Int?,
    val annee: Int?,
    val typePrevision: TypePrevision?,
    val estJalon: Boolean,
    val couleur: String?,
    val ordreAffichage: Int?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)
