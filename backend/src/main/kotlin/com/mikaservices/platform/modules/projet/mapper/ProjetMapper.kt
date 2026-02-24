package com.mikaservices.platform.modules.projet.mapper

import com.mikaservices.platform.common.enums.StatutPointBloquant
import com.mikaservices.platform.common.enums.TypeProjet
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import com.mikaservices.platform.modules.projet.dto.response.AvancementEtudeProjetResponse
import com.mikaservices.platform.modules.projet.dto.response.ProjetResponse
import com.mikaservices.platform.modules.projet.dto.response.ProjetSummaryResponse
import com.mikaservices.platform.modules.projet.dto.response.ProjetUserSummary
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User

object ProjetMapper {

    private fun computeDelaiMois(dateDebut: LocalDate?, dateFin: LocalDate?): Int? {
        if (dateDebut == null || dateFin == null || dateFin.isBefore(dateDebut)) return null
        val mois = ChronoUnit.MONTHS.between(dateDebut, dateFin).toInt()
        return if (mois < 1) 1 else mois
    }

    fun toUserSummary(user: User?): ProjetUserSummary? {
        if (user == null) return null
        return ProjetUserSummary(
            id = user.id!!,
            nom = user.nom,
            prenom = user.prenom,
            email = user.email
        )
    }

    private fun effectiveTypes(entity: Projet): List<TypeProjet> {
        val list = entity.types.toList()
        return if (list.isEmpty()) listOf(entity.type) else list.sortedBy { it.name }
    }

    fun toResponse(entity: Projet): ProjetResponse = ProjetResponse(
        id = entity.id!!,
        numeroMarche = entity.numeroMarche,
        nom = entity.nom,
        description = entity.description,
        type = entity.type,
        types = effectiveTypes(entity),
        typePersonnalise = entity.typePersonnalise,
        statut = entity.statut,
        client = entity.client?.let { ClientMapper.toResponse(it) },
        sourceFinancement = entity.sourceFinancement,
        imputationBudgetaire = entity.imputationBudgetaire,
        province = entity.province,
        ville = entity.ville,
        quartier = entity.quartier,
        montantHT = entity.montantHT,
        montantTTC = entity.montantTTC,
        montantInitial = entity.montantInitial,
        montantRevise = entity.montantRevise,
        delaiMois = entity.delaiMois ?: computeDelaiMois(entity.dateDebut, entity.dateFin),
        dateDebut = entity.dateDebut,
        dateFin = entity.dateFin,
        dateDebutReel = entity.dateDebutReel,
        dateFinReelle = entity.dateFinReelle,
        avancementGlobal = entity.avancementGlobal,
        avancementPhysiquePct = entity.avancementPhysiquePct,
        avancementFinancierPct = entity.avancementFinancierPct,
        delaiConsommePct = entity.delaiConsommePct,
        besoinsMateriel = entity.besoinsMateriel,
        besoinsHumain = entity.besoinsHumain,
        observations = entity.observations,
        propositionsAmelioration = entity.propositionsAmelioration,
        responsableProjet = toUserSummary(entity.responsableProjet),
        partenairePrincipal = entity.partenairePrincipal,
        actif = entity.actif,
        nombreSousProjets = entity.sousProjets.size,
        nombrePointsBloquantsOuverts = entity.pointsBloquants.count { it.statut == StatutPointBloquant.OUVERT },
        avancementEtudes = entity.avancementEtudes.sortedBy { it.phase }.map { AvancementEtudeProjetMapper.toResponse(it) },
        createdAt = entity.createdAt,
        updatedAt = entity.updatedAt
    )

    fun toSummaryResponse(entity: Projet): ProjetSummaryResponse = ProjetSummaryResponse(
        id = entity.id!!,
        nom = entity.nom,
        type = entity.type,
        types = effectiveTypes(entity),
        typePersonnalise = entity.typePersonnalise,
        statut = entity.statut,
        clientNom = entity.client?.nom,
        montantHT = entity.montantHT,
        avancementGlobal = entity.avancementGlobal,
        dateDebut = entity.dateDebut,
        dateFin = entity.dateFin,
        responsableNom = entity.responsableProjet?.let { "${it.prenom} ${it.nom}" }
    )
}
