package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.response.CarnetEnginEntry
import com.mikaservices.platform.modules.materiel.dto.response.CarnetEnginResponse
import com.mikaservices.platform.modules.materiel.repository.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalTime

@Service
@Transactional(readOnly = true)
class CarnetEnginService(
    private val enginRepository: EnginRepository,
    private val maintenanceRepository: OperationMaintenanceRepository,
    private val incidentRepository: IncidentEnginRepository,
    private val releveRepository: ReleveCompteurRepository,
    private val consoRepository: ConsommationCarburantRepository,
    private val mouvementRepository: MouvementEnginRepository,
    private val inspectionRepository: InspectionEnginRepository,
    private val auditRepository: JournalAuditTerrainRepository
) {
    fun getCarnet(enginId: Long): CarnetEnginResponse {
        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouve avec l'ID: $enginId") }

        val entries = mutableListOf<CarnetEnginEntry>()

        // Maintenances
        for (m in maintenanceRepository.findByEnginId(enginId)) {
            entries.add(CarnetEnginEntry(
                type = "MAINTENANCE",
                date = m.dateRealisation?.atTime(LocalTime.NOON) ?: m.createdAt,
                titre = "${m.typeOperation.name.replace('_', ' ')} - ${m.statut.name}",
                detail = m.description,
                couleur = "#F59E0B"
            ))
        }

        // Incidents
        for (i in incidentRepository.findByEnginId(enginId)) {
            entries.add(CarnetEnginEntry(
                type = "INCIDENT",
                date = i.dateIncident.atTime(LocalTime.NOON),
                titre = "${i.typeIncident.name.replace('_', ' ')} - ${i.gravite.name}",
                detail = i.description,
                couleur = if (i.resolu) "#10B981" else "#DC2626"
            ))
        }

        // Releves compteur
        for (r in releveRepository.findByEnginIdOrderByDateReleveDesc(enginId)) {
            entries.add(CarnetEnginEntry(
                type = "RELEVE_COMPTEUR",
                date = r.dateReleve.atTime(LocalTime.NOON),
                titre = "Releve compteur: ${r.valeurHeures}h",
                detail = r.commentaire,
                couleur = "#6366F1"
            ))
        }

        // Consommations
        for (c in consoRepository.findByEnginIdOrderByDatePleinDesc(enginId)) {
            entries.add(CarnetEnginEntry(
                type = "CARBURANT",
                date = c.datePlein.atTime(LocalTime.NOON),
                titre = "Plein: ${c.quantiteLitres}L",
                detail = c.commentaire,
                couleur = "#8B5CF6"
            ))
        }

        // Mouvements
        for (m in mouvementRepository.findByEnginIdOrderByDateDemandeDesc(enginId)) {
            entries.add(CarnetEnginEntry(
                type = "MOUVEMENT",
                date = m.dateDemande,
                titre = "Mouvement vers ${m.projetDestination.nom} - ${m.statut.name}",
                detail = m.commentaire,
                couleur = "#2563EB"
            ))
        }

        // Inspections quotidiennes
        for (ins in inspectionRepository.findByEnginId(enginId)) {
            entries.add(CarnetEnginEntry(
                type = "INSPECTION",
                date = ins.dateInspection.atTime(LocalTime.NOON),
                titre = "Inspection - ${ins.etatGeneral.name}" +
                    if (ins.anomaliesDetectees) " (anomalie)" else "",
                detail = ins.commentaire,
                couleur = if (ins.anomaliesDetectees) "#DC2626" else "#0EA5E9"
            ))
        }

        // Scans QR (journal d'audit terrain)
        for (s in auditRepository.findByActionAndEntiteTypeAndEntiteId("SCAN_QR", "ENGIN", enginId)) {
            entries.add(CarnetEnginEntry(
                type = "SCAN_QR",
                date = s.createdAt,
                titre = "Scan QR" + (s.acteurNom?.let { " par $it" } ?: ""),
                detail = null,
                couleur = "#64748B"
            ))
        }

        return CarnetEnginResponse(
            enginId = enginId,
            enginCode = engin.code,
            entries = entries.sortedByDescending { it.date }
        )
    }
}
