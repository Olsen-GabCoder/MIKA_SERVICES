package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.projet.repository.SousProjetRepository
import com.mikaservices.platform.modules.qshe.dto.request.ChecklistTemplateCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.InspectionCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.InspectionUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.ChecklistTemplateResponse
import com.mikaservices.platform.modules.qshe.dto.response.InspectionResponse
import com.mikaservices.platform.modules.qshe.entity.*
import com.mikaservices.platform.modules.qshe.enums.ResultatItem
import com.mikaservices.platform.modules.qshe.enums.StatutInspection
import com.mikaservices.platform.modules.qshe.mapper.InspectionMapper
import com.mikaservices.platform.modules.qshe.repository.ChecklistTemplateRepository
import com.mikaservices.platform.modules.qshe.repository.InspectionRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class InspectionService(
    private val inspectionRepository: InspectionRepository,
    private val templateRepository: ChecklistTemplateRepository,
    private val projetRepository: ProjetRepository,
    private val sousProjetRepository: SousProjetRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(InspectionService::class.java)

    // ==================== Inspections ====================

    fun createInspection(request: InspectionCreateRequest): InspectionResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet introuvable : ${request.projetId}") }
        val sousProjet = request.sousProjetId?.let {
            sousProjetRepository.findById(it).orElseThrow { ResourceNotFoundException("Sous-projet introuvable : $it") }
        }
        val inspecteur = request.inspecteurId?.let {
            userRepository.findById(it).orElseThrow { ResourceNotFoundException("Utilisateur introuvable : $it") }
        }
        val template = request.checklistTemplateId?.let {
            templateRepository.findById(it).orElseThrow { ResourceNotFoundException("Checklist template introuvable : $it") }
        }

        val reference = "INS-%05d".format(inspectionRepository.count() + 1)

        val inspection = Inspection(
            projet = projet, reference = reference, titre = request.titre,
            description = request.description, typeInspection = request.typeInspection,
            inspecteur = inspecteur, datePlanifiee = request.datePlanifiee,
            zoneInspecte = request.zoneInspecte, sousProjet = sousProjet,
            checklistTemplate = template
        )

        // Pre-remplir les items depuis le template
        template?.items?.forEach { tItem ->
            inspection.items.add(InspectionItem(
                inspection = inspection, ordre = tItem.ordre, libelle = tItem.libelle,
                section = tItem.section, critique = tItem.critique, poids = tItem.poids
            ))
        }

        val saved = inspectionRepository.save(inspection)
        logger.info("Inspection créée : ${saved.reference} (type=${saved.typeInspection}, ${saved.items.size} items)")
        return InspectionMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, pageable: Pageable): Page<InspectionResponse> {
        return inspectionRepository.findByProjetId(projetId, pageable).map { InspectionMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): InspectionResponse {
        return InspectionMapper.toResponse(getById(id))
    }

    fun updateInspection(id: Long, request: InspectionUpdateRequest): InspectionResponse {
        val inspection = getById(id)

        request.titre?.let { inspection.titre = it }
        request.description?.let { inspection.description = it }
        request.statut?.let {
            inspection.statut = it
            if (it == StatutInspection.TERMINEE && inspection.dateRealisation == null) {
                inspection.dateRealisation = LocalDate.now()
            }
        }
        request.inspecteurId?.let { uid ->
            inspection.inspecteur = userRepository.findById(uid)
                .orElseThrow { ResourceNotFoundException("Utilisateur introuvable : $uid") }
        }
        request.datePlanifiee?.let { inspection.datePlanifiee = it }
        request.dateRealisation?.let { inspection.dateRealisation = it }
        request.zoneInspecte?.let { inspection.zoneInspecte = it }
        request.observations?.let { inspection.observations = it }

        // Mise a jour des items (resultats de la checklist)
        request.items?.forEach { itemReq ->
            val item = if (itemReq.id != null) {
                inspection.items.find { it.id == itemReq.id }
                    ?: throw ResourceNotFoundException("Item introuvable : ${itemReq.id}")
            } else null

            item?.let {
                it.resultat = itemReq.resultat
                itemReq.commentaire?.let { c -> it.commentaire = c }
                itemReq.photoUrl?.let { p -> it.photoUrl = p }
            }
        }

        // Recalculer le score global
        calculerScore(inspection)

        val saved = inspectionRepository.save(inspection)
        logger.info("Inspection mise à jour : ${saved.reference} (score=${saved.scoreGlobal})")
        return InspectionMapper.toResponse(saved)
    }

    fun deleteInspection(id: Long) {
        val inspection = getById(id)
        inspectionRepository.delete(inspection)
        logger.info("Inspection supprimée : ${inspection.reference}")
    }

    // ==================== Templates ====================

    fun createTemplate(request: ChecklistTemplateCreateRequest): ChecklistTemplateResponse {
        val template = ChecklistTemplate(
            code = request.code, nom = request.nom, description = request.description,
            typeInspection = request.typeInspection
        )
        request.items.forEach { iReq ->
            template.items.add(ChecklistTemplateItem(
                template = template, ordre = iReq.ordre, libelle = iReq.libelle,
                section = iReq.section, description = iReq.description,
                critique = iReq.critique, poids = iReq.poids
            ))
        }
        val saved = templateRepository.save(template)
        logger.info("Checklist template créé : ${saved.code} (${saved.items.size} items)")
        return InspectionMapper.toTemplateResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAllTemplates(): List<ChecklistTemplateResponse> {
        return templateRepository.findByActifTrue().map { InspectionMapper.toTemplateResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findTemplateById(id: Long): ChecklistTemplateResponse {
        val template = templateRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Checklist template introuvable : $id") }
        return InspectionMapper.toTemplateResponse(template)
    }

    // ==================== Utilitaires ====================

    private fun getById(id: Long): Inspection {
        return inspectionRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Inspection introuvable : $id") }
    }

    private fun calculerScore(inspection: Inspection) {
        val evaluated = inspection.items.filter { it.resultat != ResultatItem.NON_VERIFIE && it.resultat != ResultatItem.NON_APPLICABLE }
        if (evaluated.isEmpty()) { inspection.scoreGlobal = null; return }
        val totalPoids = evaluated.sumOf { it.poids }
        val poidsConformes = evaluated.filter { it.resultat == ResultatItem.CONFORME }.sumOf { it.poids }
        inspection.scoreGlobal = if (totalPoids > 0) ((poidsConformes.toDouble() / totalPoids) * 100).toInt() else null
    }
}
