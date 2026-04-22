package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.qshe.dto.request.EpiCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.EpiUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.EpiResponse
import com.mikaservices.platform.modules.qshe.dto.response.EpiSummaryResponse
import com.mikaservices.platform.modules.qshe.entity.Epi
import com.mikaservices.platform.modules.qshe.enums.EtatEpi
import com.mikaservices.platform.modules.qshe.mapper.EpiMapper
import com.mikaservices.platform.modules.qshe.repository.EpiRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class EpiService(
    private val epiRepository: EpiRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(EpiService::class.java)

    fun create(req: EpiCreateRequest): EpiResponse {
        val user = req.affecteAId?.let { userRepository.findById(it).orElse(null) }
        val epi = Epi(
            code = req.code, typeEpi = req.typeEpi, designation = req.designation,
            marque = req.marque, modele = req.modele, taille = req.taille,
            normeReference = req.normeReference, dateAchat = req.dateAchat,
            dateExpiration = req.dateExpiration, prixUnitaire = req.prixUnitaire,
            affecteA = user, quantiteStock = req.quantiteStock, stockMinimum = req.stockMinimum,
            observations = req.observations
        )
        if (user != null) epi.dateAffectation = LocalDate.now()
        val saved = epiRepository.save(epi)
        logger.info("EPI créé : ${saved.code} (${saved.typeEpi})")
        return EpiMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<EpiResponse> = epiRepository.findAll(pageable).map { EpiMapper.toResponse(it) }

    @Transactional(readOnly = true)
    fun findById(id: Long): EpiResponse = EpiMapper.toResponse(getById(id))

    @Transactional(readOnly = true)
    fun findByUser(userId: Long): List<EpiResponse> = epiRepository.findByAffecteAId(userId).map { EpiMapper.toResponse(it) }

    fun update(id: Long, req: EpiUpdateRequest): EpiResponse {
        val epi = getById(id)
        req.designation?.let { epi.designation = it }
        req.typeEpi?.let { epi.typeEpi = it }
        req.marque?.let { epi.marque = it }
        req.modele?.let { epi.modele = it }
        req.taille?.let { epi.taille = it }
        req.normeReference?.let { epi.normeReference = it }
        req.etat?.let { epi.etat = it }
        req.datePremiereUtilisation?.let { epi.datePremiereUtilisation = it }
        req.dateExpiration?.let { epi.dateExpiration = it }
        req.dateProchaineInspection?.let { epi.dateProchaineInspection = it }
        req.prixUnitaire?.let { epi.prixUnitaire = it }
        req.affecteAId?.let { uid -> epi.affecteA = userRepository.findById(uid).orElse(null); epi.dateAffectation = LocalDate.now() }
        req.quantiteStock?.let { epi.quantiteStock = it }
        req.stockMinimum?.let { epi.stockMinimum = it }
        req.observations?.let { epi.observations = it }
        val saved = epiRepository.save(epi)
        logger.info("EPI mis à jour : ${saved.code}")
        return EpiMapper.toResponse(saved)
    }

    fun delete(id: Long) { epiRepository.delete(getById(id)); logger.info("EPI supprimé : id=$id") }

    @Transactional(readOnly = true)
    fun findExpires(): List<EpiResponse> = epiRepository.findExpires(LocalDate.now()).map { EpiMapper.toResponse(it) }

    @Transactional(readOnly = true)
    fun findStockBas(): List<EpiResponse> = epiRepository.findStockBas().map { EpiMapper.toResponse(it) }

    @Transactional(readOnly = true)
    fun getSummary(): EpiSummaryResponse {
        val all = epiRepository.findAll()
        val enService = all.count { it.etat == EtatEpi.EN_SERVICE }.toLong()
        val expires = epiRepository.countExpires(LocalDate.now())
        val stocksBas = epiRepository.findStockBas().size.toLong()
        return EpiSummaryResponse(all.size.toLong(), enService, expires, stocksBas)
    }

    private fun getById(id: Long): Epi = epiRepository.findById(id)
        .orElseThrow { ResourceNotFoundException("EPI introuvable : $id") }
}
