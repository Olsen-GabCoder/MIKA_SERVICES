package com.mikaservices.platform.modules.qualite.service

import com.mikaservices.platform.modules.qualite.dto.request.*
import com.mikaservices.platform.modules.qualite.dto.response.EvenementQualiteListResponse
import com.mikaservices.platform.modules.qualite.dto.response.EvenementQualiteResponse
import com.mikaservices.platform.modules.qualite.dto.response.SectionResponse
import com.mikaservices.platform.modules.qualite.entity.*
import com.mikaservices.platform.modules.qualite.enums.*
import com.mikaservices.platform.modules.qualite.mapper.EvenementQualiteMapper
import com.mikaservices.platform.modules.qualite.repository.EvenementQualiteRepository
import com.mikaservices.platform.modules.qualite.repository.SectionEvenementRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import jakarta.persistence.EntityNotFoundException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class EvenementQualiteService(
    private val repository: EvenementQualiteRepository,
    private val sectionRepository: SectionEvenementRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository,
) {

    // ==================== CRUD ====================

    fun create(request: EvenementQualiteCreateRequest): EvenementQualiteResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { EntityNotFoundException("Projet ${request.projetId} introuvable") }

        val count = repository.countByProjetId(request.projetId) + 1
        val prefix = request.typeEvenement.name
        val reference = "$prefix-${String.format("%04d", count)}"

        val createur = request.createurId?.let {
            userRepository.findById(it).orElseThrow { EntityNotFoundException("Utilisateur $it introuvable") }
        }

        val evenement = EvenementQualite(
            projet = projet,
            reference = reference,
            typeEvenement = request.typeEvenement,
            categories = request.categories.toMutableSet(),
            origine = request.origine,
            ouvrageConcerne = request.ouvrageConcerne,
            controleExigeCctp = request.controleExigeCctp,
            description = request.description,
            fournisseurNom = request.fournisseurNom,
            numeroBc = request.numeroBc,
            numeroBl = request.numeroBl,
            dateLivraison = request.dateLivraison,
            createur = createur,
        )

        val saved = repository.save(evenement)

        // Créer les 6 sections (1, 2, 4, 5, 6, 7)
        for (num in NumeroSection.WORKFLOW_ORDER) {
            val signataireId = request.signataires?.get(num)
            val signataire = signataireId?.let {
                userRepository.findById(it).orElse(null)
            }

            val section = SectionEvenement(
                evenement = saved,
                numeroSection = num,
                signataireDesigne = signataire,
            )

            // Section 1 : pré-remplir le contenu avec la description
            if (num == NumeroSection.SECTION_1) {
                section.contenu = request.description
            }

            val savedSection = sectionRepository.save(section)

            // Section 6 : créer les 4 lignes de signature collégiale
            if (num == NumeroSection.SECTION_6) {
                for (role in RoleCollegial.entries) {
                    val collegialSignataireId = request.signatairesSection6?.get(role)
                    val collegialSignataire = collegialSignataireId?.let {
                        userRepository.findById(it).orElse(null)
                    }
                    savedSection.signatairesCollegiaux.add(
                        SectionSignataireCollegial(
                            section = savedSection,
                            roleAttendu = role,
                            signataireDesigne = collegialSignataire,
                        )
                    )
                }
                sectionRepository.save(savedSection)
            }

            saved.sections.add(savedSection)
        }

        return EvenementQualiteMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAll(
        projetId: Long?,
        type: TypeEvenement?,
        statut: StatutEvenement?,
        pageable: Pageable
    ): Page<EvenementQualiteListResponse> {
        val page = when {
            projetId != null && type != null && statut != null ->
                repository.findByProjetIdAndTypeEvenementAndStatut(projetId, type, statut, pageable)
            projetId != null && type != null ->
                repository.findByProjetIdAndTypeEvenement(projetId, type, pageable)
            projetId != null && statut != null ->
                repository.findByProjetIdAndStatut(projetId, statut, pageable)
            projetId != null ->
                repository.findByProjetId(projetId, pageable)
            type != null && statut != null ->
                repository.findByTypeEvenementAndStatut(type, statut, pageable)
            type != null ->
                repository.findByTypeEvenement(type, pageable)
            statut != null ->
                repository.findByStatut(statut, pageable)
            else ->
                repository.findAll(pageable)
        }
        return page.map(EvenementQualiteMapper::toListResponse)
    }

    @Transactional(readOnly = true)
    fun findByProjet(
        projetId: Long,
        type: TypeEvenement?,
        statut: StatutEvenement?,
        pageable: Pageable
    ): Page<EvenementQualiteListResponse> = findAll(projetId, type, statut, pageable)

    @Transactional(readOnly = true)
    fun findById(id: Long): EvenementQualiteResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("EvenementQualite $id introuvable") }
        return EvenementQualiteMapper.toResponse(entity)
    }

    fun update(id: Long, request: EvenementQualiteUpdateRequest): EvenementQualiteResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("EvenementQualite $id introuvable") }

        request.ouvrageConcerne?.let { entity.ouvrageConcerne = it }
        request.description?.let { entity.description = it }
        request.fournisseurNom?.let { entity.fournisseurNom = it }
        request.numeroBc?.let { entity.numeroBc = it }
        request.numeroBl?.let { entity.numeroBl = it }
        request.dateLivraison?.let { entity.dateLivraison = it }
        request.controleExigeCctp?.let { entity.controleExigeCctp = it }

        return EvenementQualiteMapper.toResponse(repository.save(entity))
    }

    fun delete(id: Long) {
        if (!repository.existsById(id)) throw EntityNotFoundException("EvenementQualite $id introuvable")
        repository.deleteById(id)
    }

    // ==================== Workflow sections (#9) ====================

    /** Met à jour le contenu d'une section (texte, actions, choix traitement...). */
    fun updateSectionContenu(evenementId: Long, numSection: Int, request: SectionContenuRequest): SectionResponse {
        val section = sectionRepository.findByEvenementIdAndNumeroSection(
            evenementId, NumeroSection.fromNumero(numSection)
        ).orElseThrow { EntityNotFoundException("Section $numSection de l'événement $evenementId introuvable") }

        request.contenu?.let { section.contenu = it }
        request.choixTraitement?.let { section.choixTraitement = it }
        request.necessiteCapa?.let { section.necessiteCapa = it }

        // Actions de traitement (section 2)
        request.actions?.let { actionRequests ->
            section.actionsTraitement.clear()
            for (ar in actionRequests) {
                section.actionsTraitement.add(
                    ActionTraitement(
                        section = section,
                        descriptionAction = ar.descriptionAction,
                        responsable = ar.responsable,
                        delaiPrevu = ar.delaiPrevu,
                    )
                )
            }
        }

        val saved = sectionRepository.save(section)
        return EvenementQualiteMapper.toResponse(saved.evenement).sections
            .first { it.numeroSection == saved.numeroSection }
    }

    /** Signature d'une section standard (toutes sauf section 6). */
    fun signerSection(evenementId: Long, numSection: Int, request: SignatureSectionRequest): EvenementQualiteResponse {
        val evenement = repository.findById(evenementId)
            .orElseThrow { EntityNotFoundException("EvenementQualite $evenementId introuvable") }

        val section = evenement.sections.firstOrNull { it.numeroSection == NumeroSection.fromNumero(numSection) }
            ?: throw EntityNotFoundException("Section $numSection introuvable")

        if (section.signee) {
            throw IllegalStateException("La section $numSection est déjà signée")
        }

        val user = userRepository.findById(request.userId)
            .orElseThrow { EntityNotFoundException("Utilisateur ${request.userId} introuvable") }

        // Vérifier que l'utilisateur est le signataire désigné
        if (section.signataireDesigne != null && section.signataireDesigne!!.id != user.id) {
            throw IllegalStateException(
                "L'utilisateur ${user.nom} n'est pas le signataire désigné pour la section $numSection"
            )
        }

        // Pour la section 6 : utiliser la signature collégiale
        if (section.numeroSection == NumeroSection.SECTION_6) {
            throw IllegalStateException(
                "La section 6 nécessite une signature collégiale — utilisez l'endpoint de signature collégiale"
            )
        }

        section.signataireEffectif = user
        section.dateSignature = LocalDateTime.now()
        section.signee = true

        evenement.recalculerStatut()
        repository.save(evenement)

        return EvenementQualiteMapper.toResponse(evenement)
    }

    /** Signature collégiale pour la section 6. */
    fun signerCollegiale(evenementId: Long, request: SignatureCollegialeRequest): EvenementQualiteResponse {
        val evenement = repository.findById(evenementId)
            .orElseThrow { EntityNotFoundException("EvenementQualite $evenementId introuvable") }

        val section6 = evenement.sections.firstOrNull { it.numeroSection == NumeroSection.SECTION_6 }
            ?: throw EntityNotFoundException("Section 6 introuvable")

        val user = userRepository.findById(request.userId)
            .orElseThrow { EntityNotFoundException("Utilisateur ${request.userId} introuvable") }

        val collegial = section6.signatairesCollegiaux
            .firstOrNull { it.roleAttendu == request.roleCollegial }
            ?: throw EntityNotFoundException("Rôle collégial ${request.roleCollegial} introuvable dans la section 6")

        if (collegial.signee) {
            throw IllegalStateException("Le rôle ${request.roleCollegial} a déjà signé la section 6")
        }

        // Vérifier que l'utilisateur est le signataire désigné pour ce rôle
        if (collegial.signataireDesigne != null && collegial.signataireDesigne!!.id != user.id) {
            throw IllegalStateException(
                "L'utilisateur ${user.nom} n'est pas le signataire désigné pour le rôle ${request.roleCollegial}"
            )
        }

        collegial.signataireEffectif = user
        collegial.dateSignature = LocalDateTime.now()
        collegial.signee = true

        // Vérifier si les 4 signatures collégiales sont complètes
        if (section6.estCollegalementSignee()) {
            section6.signee = true
            section6.dateSignature = LocalDateTime.now()
            evenement.recalculerStatut()
        }

        repository.save(evenement)
        return EvenementQualiteMapper.toResponse(evenement)
    }

    // ==================== Stats ====================

    @Transactional(readOnly = true)
    fun getStatsByProjet(projetId: Long): Map<StatutEvenement, Long> {
        val rows = repository.countByProjetGroupByStatut(projetId)
        return rows.associate { (it[0] as StatutEvenement) to (it[1] as Long) }
    }

    @Transactional(readOnly = true)
    fun getStats(projetId: Long?): Map<StatutEvenement, Long> {
        val rows = if (projetId != null) {
            repository.countByProjetGroupByStatut(projetId)
        } else {
            repository.countAllGroupByStatut()
        }
        return rows.associate { (it[0] as StatutEvenement) to (it[1] as Long) }
    }
}
