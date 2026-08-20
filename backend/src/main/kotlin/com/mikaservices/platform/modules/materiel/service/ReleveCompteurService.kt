package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.ReleveCompteurCreateRequest
import com.mikaservices.platform.modules.materiel.dto.response.HeuresMensuellesResponse
import com.mikaservices.platform.modules.materiel.dto.response.HeuresMois
import com.mikaservices.platform.modules.materiel.dto.response.ReleveCompteurResponse
import com.mikaservices.platform.modules.materiel.entity.ReleveCompteur
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.ReleveCompteurRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

@Service
@Transactional
class ReleveCompteurService(
    private val releveRepository: ReleveCompteurRepository,
    private val enginRepository: EnginRepository
) {
    private val logger = LoggerFactory.getLogger(ReleveCompteurService::class.java)

    fun create(enginId: Long, request: ReleveCompteurCreateRequest): ReleveCompteurResponse {
        // Idempotence offline : requête déjà traitée -> renvoyer l'existant (pas de doublon au replay).
        request.clientRequestId?.let { crid ->
            releveRepository.findByClientRequestId(crid)?.let { return toResponse(it) }
        }

        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouve avec l'ID: $enginId") }
        val releve = ReleveCompteur(
            engin = engin,
            dateReleve = request.dateReleve,
            valeurHeures = request.valeurHeures,
            relevePar = request.relevePar,
            commentaire = request.commentaire,
            clientRequestId = request.clientRequestId
        )
        val saved = releveRepository.save(releve)
        engin.heuresCompteur = request.valeurHeures
        enginRepository.save(engin)
        logger.info("Releve compteur engin ${engin.code}: ${saved.valeurHeures}h")
        return toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<ReleveCompteurResponse> {
        return releveRepository.findByEnginId(enginId, pageable).map { toResponse(it) }
    }

    /**
     * Calcule les heures d'utilisation par mois sur les 12 derniers mois.
     * On prend le releve max de chaque mois et on calcule le delta avec le mois precedent.
     */
    @Transactional(readOnly = true)
    fun getHeuresMensuelles(enginId: Long): HeuresMensuellesResponse {
        enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouve avec l'ID: $enginId") }

        val depuis = LocalDate.now().minusMonths(12).withDayOfMonth(1)
        val releves = releveRepository.findByEnginIdAndDateReleveGreaterThanEqualOrderByDateReleveAsc(enginId, depuis)

        // Group by year-month, take max valeurHeures per month
        val parMois = releves.groupBy { "${it.dateReleve.year}-${it.dateReleve.monthValue.toString().padStart(2, '0')}" }
            .mapValues { (_, list) -> list.maxOf { it.valeurHeures } }

        // Build 12 months
        val moisList = mutableListOf<HeuresMois>()
        val now = LocalDate.now()
        for (i in 11 downTo 0) {
            val d = now.minusMonths(i.toLong())
            val key = "${d.year}-${d.monthValue.toString().padStart(2, '0')}"
            val label = d.month.getDisplayName(TextStyle.SHORT, Locale.FRENCH).replaceFirstChar { it.uppercase() }
            val maxThis = parMois[key]
            // Find previous month's max
            val prevD = d.minusMonths(1)
            val prevKey = "${prevD.year}-${prevD.monthValue.toString().padStart(2, '0')}"
            val maxPrev = parMois[prevKey]

            val heures = if (maxThis != null && maxPrev != null) {
                (maxThis - maxPrev).coerceAtLeast(0)
            } else {
                0
            }
            moisList.add(HeuresMois(mois = key, label = label, heures = heures))
        }

        return HeuresMensuellesResponse(enginId = enginId, mois = moisList)
    }

    private fun toResponse(e: ReleveCompteur) = ReleveCompteurResponse(
        id = e.id!!, enginId = e.engin.id!!, dateReleve = e.dateReleve,
        valeurHeures = e.valeurHeures, relevePar = e.relevePar,
        commentaire = e.commentaire, createdAt = e.createdAt
    )
}
