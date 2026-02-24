package com.mikaservices.platform.modules.fournisseur.service

import com.mikaservices.platform.common.enums.StatutCommande
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.fournisseur.dto.request.*
import com.mikaservices.platform.modules.fournisseur.dto.response.CommandeResponse
import com.mikaservices.platform.modules.fournisseur.dto.response.FournisseurResponse
import com.mikaservices.platform.modules.fournisseur.entity.Commande
import com.mikaservices.platform.modules.fournisseur.entity.Fournisseur
import com.mikaservices.platform.modules.fournisseur.mapper.FournisseurMapper
import com.mikaservices.platform.modules.fournisseur.repository.CommandeRepository
import com.mikaservices.platform.modules.fournisseur.repository.FournisseurRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class FournisseurService(
    private val fournisseurRepo: FournisseurRepository,
    private val commandeRepo: CommandeRepository,
    private val projetRepository: ProjetRepository
) {
    private val logger = LoggerFactory.getLogger(FournisseurService::class.java)

    // ==================== FOURNISSEURS ====================

    fun createFournisseur(request: FournisseurCreateRequest): FournisseurResponse {
        val code = generateFournisseurCode()
        val fournisseur = Fournisseur(
            code = code, nom = request.nom, adresse = request.adresse,
            telephone = request.telephone, email = request.email,
            contactNom = request.contactNom, specialite = request.specialite
        )
        val saved = fournisseurRepo.save(fournisseur)
        logger.info("Fournisseur créé: ${saved.code} - ${saved.nom}")
        return FournisseurMapper.toFournisseurResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAllFournisseurs(pageable: Pageable): Page<FournisseurResponse> =
        fournisseurRepo.findAll(pageable).map { FournisseurMapper.toFournisseurResponse(it) }

    @Transactional(readOnly = true)
    fun searchFournisseurs(query: String, pageable: Pageable): Page<FournisseurResponse> =
        fournisseurRepo.search(query, pageable).map { FournisseurMapper.toFournisseurResponse(it) }

    @Transactional(readOnly = true)
    fun findFournisseurById(id: Long): FournisseurResponse {
        val f = fournisseurRepo.findById(id).orElseThrow { ResourceNotFoundException("Fournisseur non trouvé: $id") }
        return FournisseurMapper.toFournisseurResponse(f)
    }

    fun updateFournisseur(id: Long, request: FournisseurUpdateRequest): FournisseurResponse {
        val f = fournisseurRepo.findById(id).orElseThrow { ResourceNotFoundException("Fournisseur non trouvé: $id") }
        request.nom?.let { f.nom = it }; request.adresse?.let { f.adresse = it }
        request.telephone?.let { f.telephone = it }; request.email?.let { f.email = it }
        request.contactNom?.let { f.contactNom = it }; request.specialite?.let { f.specialite = it }
        request.noteEvaluation?.let { f.noteEvaluation = it }; request.actif?.let { f.actif = it }
        return FournisseurMapper.toFournisseurResponse(fournisseurRepo.save(f))
    }

    fun deleteFournisseur(id: Long) {
        val f = fournisseurRepo.findById(id).orElseThrow { ResourceNotFoundException("Fournisseur non trouvé: $id") }
        fournisseurRepo.delete(f)
        logger.info("Fournisseur supprimé: ${f.code}")
    }

    // ==================== COMMANDES ====================

    fun createCommande(request: CommandeCreateRequest): CommandeResponse {
        val fournisseur = fournisseurRepo.findById(request.fournisseurId)
            .orElseThrow { ResourceNotFoundException("Fournisseur non trouvé: ${request.fournisseurId}") }
        val projet = request.projetId?.let { projetRepository.findById(it).orElseThrow { ResourceNotFoundException("Projet non trouvé: $it") } }
        val ref = generateCommandeReference()
        val cmd = Commande(
            reference = ref, fournisseur = fournisseur, projet = projet,
            designation = request.designation, montantTotal = request.montantTotal,
            dateCommande = request.dateCommande ?: LocalDate.now(),
            dateLivraisonPrevue = request.dateLivraisonPrevue, notes = request.notes
        )
        val saved = commandeRepo.save(cmd)
        logger.info("Commande créée: ${saved.reference}")
        return FournisseurMapper.toCommandeResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findCommandesByFournisseur(fournisseurId: Long, pageable: Pageable): Page<CommandeResponse> =
        commandeRepo.findByFournisseurId(fournisseurId, pageable).map { FournisseurMapper.toCommandeResponse(it) }

    @Transactional(readOnly = true)
    fun findAllCommandes(pageable: Pageable): Page<CommandeResponse> =
        commandeRepo.findAll(pageable).map { FournisseurMapper.toCommandeResponse(it) }

    fun updateCommande(id: Long, request: CommandeUpdateRequest): CommandeResponse {
        val cmd = commandeRepo.findById(id).orElseThrow { ResourceNotFoundException("Commande non trouvée: $id") }
        request.designation?.let { cmd.designation = it }; request.montantTotal?.let { cmd.montantTotal = it }
        request.statut?.let { cmd.statut = it }; request.dateLivraisonPrevue?.let { cmd.dateLivraisonPrevue = it }
        request.dateLivraisonEffective?.let { cmd.dateLivraisonEffective = it }; request.notes?.let { cmd.notes = it }
        if (cmd.statut == StatutCommande.LIVREE && cmd.dateLivraisonEffective == null) cmd.dateLivraisonEffective = LocalDate.now()
        return FournisseurMapper.toCommandeResponse(commandeRepo.save(cmd))
    }

    fun deleteCommande(id: Long) {
        val cmd = commandeRepo.findById(id).orElseThrow { ResourceNotFoundException("Commande non trouvée: $id") }
        commandeRepo.delete(cmd); logger.info("Commande supprimée: ${cmd.reference}")
    }

    private fun generateFournisseurCode(): String = "FRN-${String.format("%04d", fournisseurRepo.count() + 1)}"
    private fun generateCommandeReference(): String = "CMD-${String.format("%05d", commandeRepo.count() + 1)}"
}
