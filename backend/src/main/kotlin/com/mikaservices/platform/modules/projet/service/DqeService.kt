package com.mikaservices.platform.modules.projet.service

import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ForbiddenException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.dto.request.DqeChapitreCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.DqeReorderItem
import com.mikaservices.platform.modules.projet.dto.request.DqeChapitreUpdateRequest
import com.mikaservices.platform.modules.projet.dto.request.DqeLigneCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.DqeLigneUpdateRequest
import com.mikaservices.platform.modules.projet.dto.response.DqeChapitreResponse
import com.mikaservices.platform.modules.projet.dto.response.DqeLigneResponse
import com.mikaservices.platform.modules.projet.dto.response.DqeSummaryResponse
import com.mikaservices.platform.modules.projet.entity.DqeChapitre
import com.mikaservices.platform.modules.projet.entity.DqeLigne
import com.mikaservices.platform.modules.projet.mapper.DqeMapper
import com.mikaservices.platform.modules.projet.repository.DqeChapitreRepository
import com.mikaservices.platform.modules.projet.repository.DqeLigneRepository
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

@Service
@Transactional
class DqeService(
    private val chapitreRepository: DqeChapitreRepository,
    private val ligneRepository: DqeLigneRepository,
    private val projetService: ProjetService,
    private val currentUserService: CurrentUserService
) {
    private val logger = LoggerFactory.getLogger(DqeService::class.java)

    // ── Chapitres ─────────────────────────────────────────────────────────

    fun createChapitre(request: DqeChapitreCreateRequest): DqeChapitreResponse {
        val projet = projetService.requireCanViewProjet(request.projetId)
        requireCanEdit(projet.responsableProjet?.id)

        if (chapitreRepository.existsByProjetIdAndNumero(request.projetId, request.numero)) {
            throw ConflictException("Un chapitre avec le numéro '${request.numero}' existe déjà pour ce projet")
        }

        val ordre = request.ordre ?: (chapitreRepository.findMaxOrdreByProjetId(request.projetId) + 1)

        val chapitre = DqeChapitre(
            projet = projet,
            numero = request.numero,
            designation = request.designation,
            ordre = ordre
        )

        val saved = chapitreRepository.save(chapitre)
        logger.info("DQE Chapitre créé: ${saved.numero} - ${saved.designation} pour projet ${projet.nom}")
        return DqeMapper.toChapitreResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findChapitresByProjetId(projetId: Long): List<DqeChapitreResponse> {
        projetService.requireCanViewProjet(projetId)
        val chapitres = chapitreRepository.findByProjetIdOrderByOrdreAsc(projetId)
        return chapitres.map { DqeMapper.toChapitreResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findChapitreById(id: Long): DqeChapitreResponse {
        val chapitre = getChapitreById(id)
        projetService.requireCanViewProjet(chapitre.projet.id!!)
        return DqeMapper.toChapitreResponse(chapitre)
    }

    fun updateChapitre(id: Long, request: DqeChapitreUpdateRequest): DqeChapitreResponse {
        val chapitre = getChapitreById(id)
        requireCanEdit(chapitre.projet.responsableProjet?.id)

        request.numero?.let { newNumero ->
            if (newNumero != chapitre.numero &&
                chapitreRepository.existsByProjetIdAndNumero(chapitre.projet.id!!, newNumero)) {
                throw ConflictException("Un chapitre avec le numéro '$newNumero' existe déjà pour ce projet")
            }
            chapitre.numero = newNumero
        }
        request.designation?.let { chapitre.designation = it }
        request.ordre?.let { chapitre.ordre = it }

        val saved = chapitreRepository.save(chapitre)
        logger.info("DQE Chapitre mis à jour: ${saved.numero}")
        return DqeMapper.toChapitreResponse(saved)
    }

    fun deleteChapitre(id: Long) {
        val chapitre = getChapitreById(id)
        requireCanEdit(chapitre.projet.responsableProjet?.id)
        chapitreRepository.delete(chapitre)
        logger.info("DQE Chapitre supprimé: ${chapitre.numero} - ${chapitre.designation}")
    }

    // ── Lignes ────────────────────────────────────────────────────────────

    fun createLigne(request: DqeLigneCreateRequest): DqeLigneResponse {
        val chapitre = getChapitreById(request.chapitreId)
        requireCanEdit(chapitre.projet.responsableProjet?.id)

        val ordre = request.ordre ?: (ligneRepository.findMaxOrdreByChapitreId(request.chapitreId) + 1)

        val montantTotal = request.montantTotal
            ?: computeMontantTotal(request.quantite, request.prixUnitaire)

        val ligne = DqeLigne(
            chapitre = chapitre,
            numeroPoste = request.numeroPoste,
            designation = request.designation,
            unite = request.unite,
            quantite = request.quantite,
            prixUnitaire = request.prixUnitaire,
            montantTotal = montantTotal,
            avancementPct = request.avancementPct ?: BigDecimal.ZERO,
            ordre = ordre
        )

        val saved = ligneRepository.save(ligne)
        logger.info("DQE Ligne créée: ${saved.numeroPoste} - ${saved.designation}")
        return DqeMapper.toLigneResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findLignesByChapitreId(chapitreId: Long): List<DqeLigneResponse> {
        val chapitre = getChapitreById(chapitreId)
        projetService.requireCanViewProjet(chapitre.projet.id!!)
        return ligneRepository.findByChapitreIdOrderByOrdreAsc(chapitreId).map { DqeMapper.toLigneResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findLigneById(id: Long): DqeLigneResponse {
        val ligne = getLigneById(id)
        projetService.requireCanViewProjet(ligne.chapitre.projet.id!!)
        return DqeMapper.toLigneResponse(ligne)
    }

    fun updateLigne(id: Long, request: DqeLigneUpdateRequest): DqeLigneResponse {
        val ligne = getLigneById(id)
        requireCanEdit(ligne.chapitre.projet.responsableProjet?.id)

        request.numeroPoste?.let { ligne.numeroPoste = it }
        request.designation?.let { ligne.designation = it }
        request.unite?.let { ligne.unite = it }
        request.quantite?.let { ligne.quantite = it }
        request.prixUnitaire?.let { ligne.prixUnitaire = it }
        request.avancementPct?.let { ligne.avancementPct = it }
        request.ordre?.let { ligne.ordre = it }

        // Recalcul montant si quantite ou prix changé et pas de montant explicite
        if (request.montantTotal != null) {
            ligne.montantTotal = request.montantTotal
        } else if (request.quantite != null || request.prixUnitaire != null) {
            ligne.montantTotal = computeMontantTotal(ligne.quantite, ligne.prixUnitaire)
        }

        val saved = ligneRepository.save(ligne)
        logger.info("DQE Ligne mise à jour: ${saved.id}")
        return DqeMapper.toLigneResponse(saved)
    }

    fun deleteLigne(id: Long) {
        val ligne = getLigneById(id)
        requireCanEdit(ligne.chapitre.projet.responsableProjet?.id)
        ligneRepository.delete(ligne)
        logger.info("DQE Ligne supprimée: ${ligne.numeroPoste} - ${ligne.designation}")
    }

    // ── Réordonnement ─────────────────────────────────────────────────────

    fun reorderChapitres(items: List<DqeReorderItem>) {
        if (items.isEmpty()) return
        val first = getChapitreById(items.first().id)
        requireCanEdit(first.projet.responsableProjet?.id)
        val projetId = first.projet.id!!

        val chapitres = chapitreRepository.findByProjetIdOrderByOrdreAsc(projetId).associateBy { it.id!! }
        for (item in items) {
            val chap = chapitres[item.id] ?: continue
            chap.ordre = item.ordre
        }
        chapitreRepository.saveAll(chapitres.values)
        logger.info("DQE Chapitres réordonnés pour projet $projetId")
    }

    fun reorderLignes(items: List<DqeReorderItem>) {
        if (items.isEmpty()) return
        val first = getLigneById(items.first().id)
        requireCanEdit(first.chapitre.projet.responsableProjet?.id)
        val chapitreId = first.chapitre.id!!

        val lignes = ligneRepository.findByChapitreIdOrderByOrdreAsc(chapitreId).associateBy { it.id!! }
        for (item in items) {
            val ligne = lignes[item.id] ?: continue
            ligne.ordre = item.ordre
        }
        ligneRepository.saveAll(lignes.values)
        logger.info("DQE Lignes réordonnées pour chapitre $chapitreId")
    }

    // ── Résumé ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getSummary(projetId: Long): DqeSummaryResponse {
        projetService.requireCanViewProjet(projetId)
        val chapitres = chapitreRepository.findByProjetIdOrderByOrdreAsc(projetId)
        return DqeMapper.toSummaryResponse(projetId, chapitres)
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private fun getChapitreById(id: Long): DqeChapitre {
        return chapitreRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Chapitre DQE non trouvé avec l'ID: $id") }
    }

    private fun getLigneById(id: Long): DqeLigne {
        return ligneRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Ligne DQE non trouvée avec l'ID: $id") }
    }

    private fun requireCanEdit(responsableId: Long?) {
        if (!currentUserService.canEditProjet(responsableId)) {
            throw ForbiddenException("Vous n'êtes pas autorisé à modifier le DQE de ce projet")
        }
    }

    private fun computeMontantTotal(quantite: BigDecimal?, prixUnitaire: BigDecimal?): BigDecimal? {
        if (quantite == null || prixUnitaire == null) return null
        return quantite.multiply(prixUnitaire).setScale(2, java.math.RoundingMode.HALF_UP)
    }
}
