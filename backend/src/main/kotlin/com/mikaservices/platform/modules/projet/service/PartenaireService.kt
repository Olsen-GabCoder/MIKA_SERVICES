package com.mikaservices.platform.modules.projet.service

import com.mikaservices.platform.common.enums.TypePartenaire
import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.dto.response.PartenaireResponse
import com.mikaservices.platform.modules.projet.entity.Partenaire
import com.mikaservices.platform.modules.projet.mapper.PartenaireMapper
import com.mikaservices.platform.modules.projet.repository.PartenaireRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class PartenaireService(
    private val partenaireRepository: PartenaireRepository
) {
    private val logger = LoggerFactory.getLogger(PartenaireService::class.java)

    fun create(code: String, nom: String, type: TypePartenaire, pays: String?, telephone: String?,
               email: String?, adresse: String?, contactPrincipal: String?): PartenaireResponse {
        if (partenaireRepository.existsByCode(code)) {
            throw ConflictException("Un partenaire avec le code '$code' existe déjà")
        }
        val partenaire = Partenaire(
            code = code, nom = nom, type = type, pays = pays,
            telephone = telephone, email = email, adresse = adresse,
            contactPrincipal = contactPrincipal
        )
        val saved = partenaireRepository.save(partenaire)
        logger.info("Partenaire créé: ${saved.code} - ${saved.nom}")
        return PartenaireMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<PartenaireResponse> {
        return partenaireRepository.findByActifTrue(pageable).map { PartenaireMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): PartenaireResponse {
        return PartenaireMapper.toResponse(getPartenaireById(id))
    }

    @Transactional(readOnly = true)
    fun findByType(type: TypePartenaire): List<PartenaireResponse> {
        return partenaireRepository.findByType(type).map { PartenaireMapper.toResponse(it) }
    }

    fun update(id: Long, nom: String?, type: TypePartenaire?, pays: String?, telephone: String?,
               email: String?, adresse: String?, contactPrincipal: String?): PartenaireResponse {
        val partenaire = getPartenaireById(id)
        nom?.let { partenaire.nom = it }
        type?.let { partenaire.type = it }
        pays?.let { partenaire.pays = it }
        telephone?.let { partenaire.telephone = it }
        email?.let { partenaire.email = it }
        adresse?.let { partenaire.adresse = it }
        contactPrincipal?.let { partenaire.contactPrincipal = it }
        val saved = partenaireRepository.save(partenaire)
        logger.info("Partenaire mis à jour: ${saved.code}")
        return PartenaireMapper.toResponse(saved)
    }

    fun delete(id: Long) {
        val partenaire = getPartenaireById(id)
        partenaire.actif = false
        partenaireRepository.save(partenaire)
        logger.info("Partenaire désactivé: ${partenaire.code}")
    }

    internal fun getPartenaireById(id: Long): Partenaire {
        return partenaireRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Partenaire non trouvé avec l'ID: $id") }
    }
}
