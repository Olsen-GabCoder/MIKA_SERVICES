package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.StatutMaintenance
import com.mikaservices.platform.common.enums.TypeEngin
import com.mikaservices.platform.modules.materiel.dto.response.AlerteEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EcheanceEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginStatsResponse
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.DocumentEnginRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.IncidentEnginRepository
import com.mikaservices.platform.modules.materiel.repository.OperationMaintenanceRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
@Transactional(readOnly = true)
class EnginStatsService(
    private val enginRepository: EnginRepository,
    private val maintenanceRepository: OperationMaintenanceRepository,
    private val incidentRepository: IncidentEnginRepository,
    private val documentRepository: DocumentEnginRepository,
    private val affectationRepository: AffectationEnginChantierRepository
) {
    fun getStats(): EnginStatsResponse {
        val total = enginRepository.countByActifTrue()
        val disponibles = enginRepository.countByStatutAndActifTrue(StatutEngin.DISPONIBLE)
        val enService = enginRepository.countByStatutAndActifTrue(StatutEngin.EN_SERVICE)
        val enPanne = enginRepository.countByStatutAndActifTrue(StatutEngin.EN_PANNE)
        val enMaintenance = enginRepository.countByStatutAndActifTrue(StatutEngin.EN_MAINTENANCE)

        val parType = TypeEngin.entries.associate { it.name to enginRepository.countByTypeAndActifTrue(it) }
            .filter { it.value > 0 }
        val parStatut = StatutEngin.entries.associate { it.name to enginRepository.countByStatutAndActifTrue(it) }
            .filter { it.value > 0 }

        val tauxDispo = if (total > 0) (disponibles + enService).toDouble() / total * 100 else 0.0

        val alertesMaint = maintenanceRepository.countAllByStatutAndEnginActif(StatutMaintenance.PLANIFIEE)
        val incidentsNonResolus = incidentRepository.countAllNonResolusEnginActif()

        return EnginStatsResponse(
            totalEngins = total,
            enService = enService,
            disponibles = disponibles,
            enPanne = enPanne,
            enMaintenance = enMaintenance,
            tauxDisponibilite = Math.round(tauxDispo * 10.0) / 10.0,
            parType = parType,
            parStatut = parStatut,
            alertesMaintenance = alertesMaint,
            incidentsNonResolus = incidentsNonResolus
        )
    }

    /**
     * Genere la liste des alertes actives du parc, triees par priorite.
     * Sources : maintenances en retard, incidents non resolus, documents expirant bientot, engins en panne.
     */
    fun getAlertes(): List<AlerteEnginResponse> {
        val today = LocalDate.now()
        val dans30j = today.plusDays(30)
        val alertes = mutableListOf<AlerteEnginResponse>()

        // 1. Maintenances en retard (echeance depassee) → CRITIQUE
        val maintenancesRetard = maintenanceRepository.findMaintenancesEnRetard(today)
        for (m in maintenancesRetard) {
            val retardJours = ChronoUnit.DAYS.between(m.echeanceDate, today)
            alertes.add(AlerteEnginResponse(
                niveau = "CRITIQUE",
                titre = "${m.engin.nom} — maintenance depassee",
                detail = "${m.typeOperation.name.replace('_', ' ')} en retard de $retardJours jour(s) · ${m.engin.code}",
                enginId = m.engin.id,
                enginCode = m.engin.code,
                couleur = "#DC2626",
                pulse = true,
                sourceType = "MAINTENANCE",
                sourceId = m.id
            ))
        }

        // 2. Incidents non resolus → CRITIQUE si gravite CRITIQUE/MAJEURE, HAUTE sinon
        val incidents = incidentRepository.findIncidentsNonResolus()
        for (inc in incidents) {
            val isCritique = inc.gravite.name == "CRITIQUE" || inc.gravite.name == "MAJEURE"
            alertes.add(AlerteEnginResponse(
                niveau = if (isCritique) "CRITIQUE" else "HAUTE",
                titre = "${inc.engin.nom} — ${inc.typeIncident.name.lowercase().replace('_', ' ')}",
                detail = "${inc.description ?: inc.typeIncident.name.replace('_', ' ')} · signale le ${inc.dateIncident} · ${inc.engin.code}",
                enginId = inc.engin.id,
                enginCode = inc.engin.code,
                couleur = if (isCritique) "#DC2626" else "#D97706",
                pulse = isCritique,
                sourceType = "INCIDENT",
                sourceId = inc.id
            ))
        }

        // 3. Documents deja expires → HAUTE
        val docsExpires = documentRepository.findDocumentsExpires(today)
        for (d in docsExpires) {
            val retardJours = ChronoUnit.DAYS.between(d.dateExpiration, today)
            alertes.add(AlerteEnginResponse(
                niveau = "HAUTE",
                titre = "${d.engin.nom} — ${d.nom} expire",
                detail = "Expire depuis $retardJours jour(s) · document a renouveler · ${d.engin.code}",
                enginId = d.engin.id,
                enginCode = d.engin.code,
                couleur = "#D97706",
                pulse = false,
                sourceType = "DOCUMENT",
                sourceId = d.id
            ))
        }

        // 4. Documents expirant dans les 30 prochains jours → NORMALE
        val docsExpBientot = documentRepository.findDocumentsExpirantBientot(today, dans30j)
        for (d in docsExpBientot) {
            val dansJours = ChronoUnit.DAYS.between(today, d.dateExpiration)
            alertes.add(AlerteEnginResponse(
                niveau = "NORMALE",
                titre = "${d.engin.nom} — ${d.nom}",
                detail = "Expire dans $dansJours jour(s) · ${d.engin.code}",
                enginId = d.engin.id,
                enginCode = d.engin.code,
                couleur = "#2563EB",
                pulse = false,
                sourceType = "DOCUMENT",
                sourceId = d.id
            ))
        }

        // 5. Maintenances planifiees a venir (30 jours) → NORMALE
        val maintenancesAVenir = maintenanceRepository.findMaintenancesAVenir(today, dans30j)
        for (m in maintenancesAVenir) {
            val dansJours = ChronoUnit.DAYS.between(today, m.echeanceDate)
            alertes.add(AlerteEnginResponse(
                niveau = "NORMALE",
                titre = "${m.engin.nom} — ${m.typeOperation.name.lowercase().replace('_', ' ')}",
                detail = "Echeance dans $dansJours jour(s) · ${m.engin.code}",
                enginId = m.engin.id,
                enginCode = m.engin.code,
                couleur = "#2563EB",
                pulse = false,
                sourceType = "MAINTENANCE",
                sourceId = m.id
            ))
        }

        // 6. Engins en panne (sans incident associe — pour ne pas dupliquer) → HAUTE
        val enginsEnPanne = enginRepository.findByStatutAndActifTrue(StatutEngin.EN_PANNE)
        val enginIdsAvecIncident = incidents.map { it.engin.id }.toSet()
        for (e in enginsEnPanne) {
            if (e.id in enginIdsAvecIncident) continue
            alertes.add(AlerteEnginResponse(
                niveau = "HAUTE",
                titre = "${e.nom} — en panne",
                detail = "Equipement immobilise · ${e.code}",
                enginId = e.id,
                enginCode = e.code,
                couleur = "#DC2626",
                pulse = true,
                sourceType = "ENGIN",
                sourceId = e.id
            ))
        }

        // Tri par priorite : CRITIQUE > HAUTE > NORMALE > BASSE > INFO
        val priorityOrder = mapOf("CRITIQUE" to 0, "HAUTE" to 1, "NORMALE" to 2, "BASSE" to 3, "INFO" to 4)
        return alertes.sortedBy { priorityOrder[it.niveau] ?: 5 }
    }

    /**
     * Echeances a venir dans les N prochains jours.
     * Sources : maintenances planifiees, documents expirant, fins d'affectation.
     */
    fun getEcheances(jours: Int = 7): List<EcheanceEnginResponse> {
        val today = LocalDate.now()
        val limite = today.plusDays(jours.toLong())
        val echeances = mutableListOf<EcheanceEnginResponse>()

        // 1. Maintenances en retard (depassees) → rouge
        val maintenancesRetard = maintenanceRepository.findMaintenancesEnRetard(today)
        for (m in maintenancesRetard) {
            val retardJours = ChronoUnit.DAYS.between(m.echeanceDate, today)
            echeances.add(EcheanceEnginResponse(
                date = m.echeanceDate!!,
                titre = "${m.typeOperation.name.replace('_', ' ')} — ${m.engin.nom}",
                detail = "En retard de $retardJours jour(s)",
                couleur = "#DC2626",
                enginId = m.engin.id,
                enginCode = m.engin.code,
                sourceType = "MAINTENANCE",
                sourceId = m.id
            ))
        }

        // 2. Maintenances planifiees a venir → orange
        val maintenancesAVenir = maintenanceRepository.findMaintenancesAVenir(today, limite)
        for (m in maintenancesAVenir) {
            echeances.add(EcheanceEnginResponse(
                date = m.echeanceDate!!,
                titre = "${m.typeOperation.name.replace('_', ' ')} — ${m.engin.nom}",
                detail = m.engin.code,
                couleur = "#D97706",
                enginId = m.engin.id,
                enginCode = m.engin.code,
                sourceType = "MAINTENANCE",
                sourceId = m.id
            ))
        }

        // 3. Documents expirant bientot → orange
        val docsExp = documentRepository.findDocumentsExpirantBientot(today, limite)
        for (d in docsExp) {
            echeances.add(EcheanceEnginResponse(
                date = d.dateExpiration!!,
                titre = "${d.nom} — ${d.engin.nom}",
                detail = d.engin.code,
                couleur = "#D97706",
                enginId = d.engin.id,
                enginCode = d.engin.code,
                sourceType = "DOCUMENT",
                sourceId = d.id
            ))
        }

        // 4. Documents deja expires → rouge
        val docsExpires = documentRepository.findDocumentsExpires(today)
        for (d in docsExpires) {
            echeances.add(EcheanceEnginResponse(
                date = d.dateExpiration!!,
                titre = "${d.nom} — ${d.engin.nom} (expire)",
                detail = d.engin.code,
                couleur = "#DC2626",
                enginId = d.engin.id,
                enginCode = d.engin.code,
                sourceType = "DOCUMENT",
                sourceId = d.id
            ))
        }

        // 5. Fins d'affectation (retours location, etc.) → bleu
        val affFin = affectationRepository.findAffectationsFinissantEntre(today, limite)
        for (a in affFin) {
            val label = if (a.engin.estLocation) "Retour location" else "Fin d'affectation"
            echeances.add(EcheanceEnginResponse(
                date = a.dateFin!!,
                titre = "$label ${a.engin.nom}",
                detail = "${a.projet.nom} · ${a.engin.code}",
                couleur = "#2563EB",
                enginId = a.engin.id,
                enginCode = a.engin.code,
                sourceType = "AFFECTATION",
                sourceId = a.id
            ))
        }

        return echeances.sortedBy { it.date }
    }
}
