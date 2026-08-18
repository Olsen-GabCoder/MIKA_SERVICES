package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.response.CoutEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.LigneCoutResponse
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.ConsommationCarburantRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.OperationMaintenanceRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
@Transactional(readOnly = true)
class CoutEnginService(
    private val enginRepository: EnginRepository,
    private val maintenanceRepository: OperationMaintenanceRepository,
    private val consoRepository: ConsommationCarburantRepository,
    private val affectationRepository: AffectationEnginChantierRepository
) {
    fun getCouts(enginId: Long): CoutEnginResponse {
        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouvé avec l'ID: $enginId") }

        val lignes = mutableListOf<LigneCoutResponse>()

        // Maintenances (coût réel prioritaire, sinon estimé)
        var totalMaintenance = BigDecimal.ZERO
        for (m in maintenanceRepository.findByEnginId(enginId)) {
            val montant = m.coutReel ?: m.coutEstime ?: continue
            totalMaintenance += montant
            lignes.add(LigneCoutResponse(
                type = "MAINTENANCE",
                description = m.description ?: m.typeOperation.name.replace('_', ' '),
                date = m.dateRealisation ?: m.echeanceDate,
                montant = montant
            ))
        }

        // Carburant
        var totalCarburant = BigDecimal.ZERO
        for (c in consoRepository.findByEnginIdOrderByDatePleinDesc(enginId)) {
            val montant = c.coutTotal ?: continue
            totalCarburant += montant
            lignes.add(LigneCoutResponse(
                type = "CARBURANT",
                description = "Ravitaillement ${c.quantiteLitres} L${c.pleinPar?.let { " · $it" } ?: ""}",
                date = c.datePlein,
                montant = montant
            ))
        }

        // Location : coût journalier x durée des affectations
        var totalLocation = BigDecimal.ZERO
        val coutJournalier = engin.coutLocationJournalier
        if (engin.estLocation && coutJournalier != null) {
            for (a in affectationRepository.findByEnginId(enginId)) {
                val fin = a.dateFin ?: LocalDate.now()
                if (fin.isBefore(a.dateDebut)) continue
                val jours = ChronoUnit.DAYS.between(a.dateDebut, fin) + 1
                val montant = coutJournalier * BigDecimal(jours)
                totalLocation += montant
                lignes.add(LigneCoutResponse(
                    type = "LOCATION",
                    description = "Location ${jours} j · ${a.projet.nom}",
                    date = a.dateDebut,
                    montant = montant
                ))
            }
        }

        lignes.sortByDescending { it.date }

        val tco = totalMaintenance + totalCarburant + totalLocation + (engin.valeurAcquisition ?: BigDecimal.ZERO)

        return CoutEnginResponse(
            enginId = enginId,
            totalMaintenance = totalMaintenance,
            totalCarburant = totalCarburant,
            totalLocation = totalLocation,
            valeurAcquisition = engin.valeurAcquisition,
            tco = tco,
            lignes = lignes
        )
    }
}
