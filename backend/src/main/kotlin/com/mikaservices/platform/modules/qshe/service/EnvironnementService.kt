package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.qshe.dto.request.*
import com.mikaservices.platform.modules.qshe.dto.response.*
import com.mikaservices.platform.modules.qshe.entity.DechetRecord
import com.mikaservices.platform.modules.qshe.entity.ProduitChimique
import com.mikaservices.platform.modules.qshe.entity.SuiviEnvironnemental
import com.mikaservices.platform.modules.qshe.mapper.EnvironnementMapper
import com.mikaservices.platform.modules.qshe.repository.DechetRecordRepository
import com.mikaservices.platform.modules.qshe.repository.ProduitChimiqueRepository
import com.mikaservices.platform.modules.qshe.repository.SuiviEnvironnementalRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class EnvironnementService(
    private val suiviRepo: SuiviEnvironnementalRepository,
    private val dechetRepo: DechetRecordRepository,
    private val produitRepo: ProduitChimiqueRepository,
    private val projetRepository: ProjetRepository
) {
    private val logger = LoggerFactory.getLogger(EnvironnementService::class.java)

    // === Suivi environnemental ===

    fun createSuivi(req: SuiviEnvCreateRequest): SuiviEnvResponse {
        val projet = projetRepository.findById(req.projetId)
            .orElseThrow { ResourceNotFoundException("Projet introuvable : ${req.projetId}") }
        val e = SuiviEnvironnemental(
            projet = projet, typeMesure = req.typeMesure, parametre = req.parametre,
            valeur = req.valeur, unite = req.unite, limiteReglementaire = req.limiteReglementaire,
            dateMesure = req.dateMesure, localisation = req.localisation,
            observations = req.observations, conforme = req.conforme
        )
        val saved = suiviRepo.save(e)
        logger.info("Mesure environnementale créée : ${saved.typeMesure} / ${saved.parametre}")
        return EnvironnementMapper.toSuiviResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findSuiviByProjet(projetId: Long, pageable: Pageable): Page<SuiviEnvResponse> =
        suiviRepo.findByProjetId(projetId, pageable).map { EnvironnementMapper.toSuiviResponse(it) }

    fun deleteSuivi(id: Long) { suiviRepo.deleteById(id) }

    // === Dechets ===

    fun createDechet(req: DechetCreateRequest): DechetResponse {
        val projet = projetRepository.findById(req.projetId)
            .orElseThrow { ResourceNotFoundException("Projet introuvable : ${req.projetId}") }
        val d = DechetRecord(
            projet = projet, typeDechet = req.typeDechet, designation = req.designation,
            quantite = req.quantite, unite = req.unite, filiereElimination = req.filiereElimination,
            transporteur = req.transporteur, destination = req.destination, numeroBsd = req.numeroBsd,
            dateEnlevement = req.dateEnlevement, observations = req.observations
        )
        val saved = dechetRepo.save(d)
        logger.info("Déchet enregistré : ${saved.typeDechet} / ${saved.designation}")
        return EnvironnementMapper.toDechetResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findDechetsByProjet(projetId: Long, pageable: Pageable): Page<DechetResponse> =
        dechetRepo.findByProjetId(projetId, pageable).map { EnvironnementMapper.toDechetResponse(it) }

    fun deleteDechet(id: Long) { dechetRepo.deleteById(id) }

    // === Produits chimiques ===

    fun createProduit(req: ProduitChimiqueCreateRequest): ProduitChimiqueResponse {
        val p = ProduitChimique(
            code = req.code, nomCommercial = req.nomCommercial, nomChimique = req.nomChimique,
            fournisseur = req.fournisseur, pictogrammesGhs = req.pictogrammesGhs,
            mentionsDanger = req.mentionsDanger, epiRequis = req.epiRequis,
            conditionsStockage = req.conditionsStockage, premiersSecours = req.premiersSecours,
            fdsUrl = req.fdsUrl, dateFds = req.dateFds,
            localisationStockage = req.localisationStockage, quantiteStock = req.quantiteStock
        )
        val saved = produitRepo.save(p)
        logger.info("Produit chimique créé : ${saved.code}")
        return EnvironnementMapper.toProduitResponse(saved)
    }

    fun updateProduit(id: Long, req: ProduitChimiqueUpdateRequest): ProduitChimiqueResponse {
        val p = produitRepo.findById(id).orElseThrow { ResourceNotFoundException("Produit introuvable : $id") }
        req.nomCommercial?.let { p.nomCommercial = it }
        req.nomChimique?.let { p.nomChimique = it }
        req.fournisseur?.let { p.fournisseur = it }
        req.pictogrammesGhs?.let { p.pictogrammesGhs = it }
        req.mentionsDanger?.let { p.mentionsDanger = it }
        req.epiRequis?.let { p.epiRequis = it }
        req.conditionsStockage?.let { p.conditionsStockage = it }
        req.premiersSecours?.let { p.premiersSecours = it }
        req.mesuresIncendie?.let { p.mesuresIncendie = it }
        req.fdsUrl?.let { p.fdsUrl = it }
        req.dateFds?.let { p.dateFds = it }
        req.localisationStockage?.let { p.localisationStockage = it }
        req.quantiteStock?.let { p.quantiteStock = it }
        req.actif?.let { p.actif = it }
        return EnvironnementMapper.toProduitResponse(produitRepo.save(p))
    }

    @Transactional(readOnly = true)
    fun findProduits(pageable: Pageable): Page<ProduitChimiqueResponse> =
        produitRepo.findByActifTrue(pageable).map { EnvironnementMapper.toProduitResponse(it) }

    @Transactional(readOnly = true)
    fun findProduitById(id: Long): ProduitChimiqueResponse =
        EnvironnementMapper.toProduitResponse(produitRepo.findById(id).orElseThrow { ResourceNotFoundException("Produit introuvable : $id") })

    fun deleteProduit(id: Long) { produitRepo.deleteById(id) }

    // === Summary ===

    @Transactional(readOnly = true)
    fun getSummary(projetId: Long): EnvironnementSummaryResponse {
        val mesures = suiviRepo.countByProjetId(projetId)
        val dechets = dechetRepo.countByProjetId(projetId)
        val depassements = suiviRepo.findByProjetId(projetId, Pageable.unpaged()).content.count { it.depassement }.toLong()
        return EnvironnementSummaryResponse(mesures, dechets, depassements)
    }
}
