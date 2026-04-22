package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.qshe.dto.request.CertificationCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.CertificationUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.CertificationResponse
import com.mikaservices.platform.modules.qshe.dto.response.CertificationSummaryResponse
import com.mikaservices.platform.modules.qshe.entity.Certification
import com.mikaservices.platform.modules.qshe.enums.StatutCertification
import com.mikaservices.platform.modules.qshe.mapper.CertificationMapper
import com.mikaservices.platform.modules.qshe.repository.CertificationRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class CertificationService(
    private val certRepository: CertificationRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(CertificationService::class.java)

    fun create(req: CertificationCreateRequest): CertificationResponse {
        val user = userRepository.findById(req.userId)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable : ${req.userId}") }

        val cert = Certification(
            user = user, typeCertification = req.typeCertification, libelle = req.libelle,
            categorieNiveau = req.categorieNiveau, organismeFormation = req.organismeFormation,
            numeroCertificat = req.numeroCertificat, dateObtention = req.dateObtention,
            dateExpiration = req.dateExpiration, dureeValiditeMois = req.dureeValiditeMois,
            documentUrl = req.documentUrl, observations = req.observations
        )
        val saved = certRepository.save(cert)
        logger.info("Certification créée : ${saved.typeCertification} pour user ${user.id}")
        return CertificationMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByUser(userId: Long, pageable: Pageable): Page<CertificationResponse> {
        return certRepository.findByUserId(userId, pageable).map { CertificationMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): CertificationResponse = CertificationMapper.toResponse(getById(id))

    fun update(id: Long, req: CertificationUpdateRequest): CertificationResponse {
        val cert = getById(id)
        req.typeCertification?.let { cert.typeCertification = it }
        req.libelle?.let { cert.libelle = it }
        req.categorieNiveau?.let { cert.categorieNiveau = it }
        req.organismeFormation?.let { cert.organismeFormation = it }
        req.numeroCertificat?.let { cert.numeroCertificat = it }
        req.dateObtention?.let { cert.dateObtention = it }
        req.dateExpiration?.let { cert.dateExpiration = it }
        req.dureeValiditeMois?.let { cert.dureeValiditeMois = it }
        req.documentUrl?.let { cert.documentUrl = it }
        req.observations?.let { cert.observations = it }
        val saved = certRepository.save(cert)
        logger.info("Certification mise à jour : id=${saved.id}")
        return CertificationMapper.toResponse(saved)
    }

    fun delete(id: Long) {
        certRepository.delete(getById(id))
        logger.info("Certification supprimée : id=$id")
    }

    /** Certifications expirant dans les N prochains jours */
    @Transactional(readOnly = true)
    fun findExpirantDans(jours: Int): List<CertificationResponse> {
        val today = LocalDate.now()
        return certRepository.findExpirantAvant(today, today.plusDays(jours.toLong()))
            .map { CertificationMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findExpirees(): List<CertificationResponse> {
        return certRepository.findExpirees(LocalDate.now()).map { CertificationMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun getSummary(): CertificationSummaryResponse {
        val all = certRepository.findAll()
        val valides = all.count { it.statutCalcule == StatutCertification.VALIDE }.toLong()
        val bientot = all.count { it.statutCalcule == StatutCertification.EXPIRE_BIENTOT }.toLong()
        val expirees = all.count { it.statutCalcule == StatutCertification.EXPIREE }.toLong()
        return CertificationSummaryResponse(all.size.toLong(), valides, bientot, expirees)
    }

    private fun getById(id: Long): Certification = certRepository.findById(id)
        .orElseThrow { ResourceNotFoundException("Certification introuvable : $id") }
}
