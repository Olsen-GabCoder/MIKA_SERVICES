package com.mikaservices.platform.modules.qualite.service

import com.mikaservices.platform.common.enums.StatutControleQualite
import com.mikaservices.platform.common.enums.StatutNonConformite
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.qualite.dto.request.ControleQualiteCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.ControleQualiteUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.request.NonConformiteCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.NonConformiteUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.ControleQualiteResponse
import com.mikaservices.platform.modules.qualite.dto.response.NonConformiteResponse
import com.mikaservices.platform.modules.qualite.dto.response.QualiteSummaryResponse
import com.mikaservices.platform.modules.qualite.entity.ControleQualite
import com.mikaservices.platform.modules.qualite.entity.NonConformite
import com.mikaservices.platform.modules.qualite.mapper.QualiteMapper
import com.mikaservices.platform.modules.qualite.repository.ControleQualiteRepository
import com.mikaservices.platform.modules.qualite.repository.NonConformiteRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class QualiteService(
    private val controleRepo: ControleQualiteRepository,
    private val ncRepo: NonConformiteRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(QualiteService::class.java)

    // ==================== CONTRÔLES QUALITÉ ====================

    fun createControle(request: ControleQualiteCreateRequest): ControleQualiteResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: ${request.projetId}") }

        val reference = generateControleReference(request.typeControle.name)

        val controle = ControleQualite(
            projet = projet,
            reference = reference,
            titre = request.titre,
            description = request.description,
            typeControle = request.typeControle,
            datePlanifiee = request.datePlanifiee,
            zoneControlee = request.zoneControlee,
            criteresVerification = request.criteresVerification
        )

        request.inspecteurId?.let { userId ->
            controle.inspecteur = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        val saved = controleRepo.save(controle)
        logger.info("Contrôle qualité créé: ${saved.reference} - ${saved.titre}")
        return QualiteMapper.toControleResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findControlesByProjet(projetId: Long, pageable: Pageable): Page<ControleQualiteResponse> {
        return controleRepo.findByProjetId(projetId, pageable).map { QualiteMapper.toControleResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findControleById(id: Long): ControleQualiteResponse {
        val controle = controleRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Contrôle qualité non trouvé avec l'ID: $id") }
        return QualiteMapper.toControleResponse(controle)
    }

    fun updateControle(id: Long, request: ControleQualiteUpdateRequest): ControleQualiteResponse {
        val controle = controleRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Contrôle qualité non trouvé avec l'ID: $id") }

        request.titre?.let { controle.titre = it }
        request.description?.let { controle.description = it }
        request.statut?.let { controle.statut = it }
        request.datePlanifiee?.let { controle.datePlanifiee = it }
        request.dateRealisation?.let { controle.dateRealisation = it }
        request.zoneControlee?.let { controle.zoneControlee = it }
        request.criteresVerification?.let { controle.criteresVerification = it }
        request.observations?.let { controle.observations = it }
        request.noteGlobale?.let { controle.noteGlobale = it }

        request.inspecteurId?.let { userId ->
            controle.inspecteur = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        // Si réalisé, mettre la date de réalisation
        if (controle.statut in listOf(StatutControleQualite.CONFORME, StatutControleQualite.NON_CONFORME)
            && controle.dateRealisation == null) {
            controle.dateRealisation = LocalDate.now()
        }

        val saved = controleRepo.save(controle)
        logger.info("Contrôle qualité mis à jour: ${saved.reference} (statut: ${saved.statut})")
        return QualiteMapper.toControleResponse(saved)
    }

    fun deleteControle(id: Long) {
        val controle = controleRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Contrôle qualité non trouvé avec l'ID: $id") }
        controleRepo.delete(controle)
        logger.info("Contrôle qualité supprimé: ${controle.reference}")
    }

    // ==================== NON-CONFORMITÉS ====================

    fun createNonConformite(request: NonConformiteCreateRequest): NonConformiteResponse {
        val controle = controleRepo.findById(request.controleQualiteId)
            .orElseThrow { ResourceNotFoundException("Contrôle qualité non trouvé avec l'ID: ${request.controleQualiteId}") }

        val reference = generateNcReference()

        val nc = NonConformite(
            controleQualite = controle,
            reference = reference,
            titre = request.titre,
            description = request.description,
            gravite = request.gravite,
            dateDetection = request.dateDetection ?: LocalDate.now(),
            dateEcheanceCorrection = request.dateEcheanceCorrection
        )

        request.responsableTraitementId?.let { userId ->
            nc.responsableTraitement = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        // Mettre le contrôle en NON_CONFORME s'il ne l'est pas déjà
        if (controle.statut != StatutControleQualite.NON_CONFORME) {
            controle.statut = StatutControleQualite.NON_CONFORME
            controleRepo.save(controle)
        }

        val saved = ncRepo.save(nc)
        logger.info("Non-conformité créée: ${saved.reference} (gravité: ${saved.gravite})")
        return QualiteMapper.toNonConformiteResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findNcByControle(controleId: Long, pageable: Pageable): Page<NonConformiteResponse> {
        return ncRepo.findByControleQualiteId(controleId, pageable).map { QualiteMapper.toNonConformiteResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findNcById(id: Long): NonConformiteResponse {
        val nc = ncRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Non-conformité non trouvée avec l'ID: $id") }
        return QualiteMapper.toNonConformiteResponse(nc)
    }

    @Transactional(readOnly = true)
    fun findNcEnRetard(): List<NonConformiteResponse> {
        return ncRepo.findEnRetard(LocalDate.now()).map { QualiteMapper.toNonConformiteResponse(it) }
    }

    fun updateNonConformite(id: Long, request: NonConformiteUpdateRequest): NonConformiteResponse {
        val nc = ncRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Non-conformité non trouvée avec l'ID: $id") }

        request.titre?.let { nc.titre = it }
        request.description?.let { nc.description = it }
        request.gravite?.let { nc.gravite = it }
        request.statut?.let { nc.statut = it }
        request.causeIdentifiee?.let { nc.causeIdentifiee = it }
        request.actionCorrective?.let { nc.actionCorrective = it }
        request.dateEcheanceCorrection?.let { nc.dateEcheanceCorrection = it }
        request.preuveCorrection?.let { nc.preuveCorrection = it }

        request.responsableTraitementId?.let { userId ->
            nc.responsableTraitement = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        // Clôture automatique
        if (nc.statut == StatutNonConformite.CLOTUREE && nc.dateCloture == null) {
            nc.dateCloture = LocalDate.now()
        }

        val saved = ncRepo.save(nc)
        logger.info("Non-conformité mise à jour: ${saved.reference} (statut: ${saved.statut})")
        return QualiteMapper.toNonConformiteResponse(saved)
    }

    fun deleteNonConformite(id: Long) {
        val nc = ncRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Non-conformité non trouvée avec l'ID: $id") }
        ncRepo.delete(nc)
        logger.info("Non-conformité supprimée: ${nc.reference}")
    }

    // ==================== TABLEAU DE BORD QUALITÉ ====================

    @Transactional(readOnly = true)
    fun getQualiteSummary(projetId: Long): QualiteSummaryResponse {
        val totalControles = controleRepo.countByProjetIdAndStatut(projetId, StatutControleQualite.CONFORME) +
                controleRepo.countByProjetIdAndStatut(projetId, StatutControleQualite.NON_CONFORME) +
                controleRepo.countByProjetIdAndStatut(projetId, StatutControleQualite.PLANIFIE) +
                controleRepo.countByProjetIdAndStatut(projetId, StatutControleQualite.EN_COURS) +
                controleRepo.countByProjetIdAndStatut(projetId, StatutControleQualite.ANNULE)

        val conformes = controleRepo.countByProjetIdAndStatut(projetId, StatutControleQualite.CONFORME)
        val nonConformes = controleRepo.countByProjetIdAndStatut(projetId, StatutControleQualite.NON_CONFORME)
        val planifies = controleRepo.countByProjetIdAndStatut(projetId, StatutControleQualite.PLANIFIE)
        val enCours = controleRepo.countByProjetIdAndStatut(projetId, StatutControleQualite.EN_COURS)
        val ncOuvertes = ncRepo.countOuvertesParProjet(projetId)

        val ncParGraviteRaw = ncRepo.countByGraviteForProjet(projetId)
        val ncParGravite = ncParGraviteRaw.associate { row -> (row[0] as Enum<*>).name to (row[1] as Long) }

        val controlesTermines = conformes + nonConformes
        val tauxConformite = if (controlesTermines > 0) (conformes.toDouble() / controlesTermines * 100) else 0.0

        return QualiteSummaryResponse(
            totalControles = totalControles,
            controlesConformes = conformes,
            controlesNonConformes = nonConformes,
            controlesPlanifies = planifies,
            controlesEnCours = enCours,
            ncOuvertes = ncOuvertes,
            ncParGravite = ncParGravite,
            tauxConformite = Math.round(tauxConformite * 100.0) / 100.0
        )
    }

    // ==================== UTILITAIRES ====================

    private fun generateControleReference(typePrefix: String): String {
        val count = controleRepo.count() + 1
        return "CQ-${typePrefix.take(3)}-${String.format("%04d", count)}"
    }

    private fun generateNcReference(): String {
        val count = ncRepo.count() + 1
        return "NC-${String.format("%05d", count)}"
    }
}
