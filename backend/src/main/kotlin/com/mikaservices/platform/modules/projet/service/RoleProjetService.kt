package com.mikaservices.platform.modules.projet.service

import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.dto.RoleProjetRequest
import com.mikaservices.platform.modules.projet.dto.RoleProjetResponse
import com.mikaservices.platform.modules.projet.entity.RoleProjet
import com.mikaservices.platform.modules.projet.repository.RoleProjetRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.text.Normalizer

@Service
@Transactional
class RoleProjetService(
    private val roleProjetRepository: RoleProjetRepository
) {
    private val logger = LoggerFactory.getLogger(RoleProjetService::class.java)

    @Transactional(readOnly = true)
    fun findAll(): List<RoleProjetResponse> =
        roleProjetRepository.findAll()
            .sortedWith(compareBy({ it.famille.ordinal }, { it.nom.lowercase() }))
            .map { toResponse(it) }

    @Transactional(readOnly = true)
    fun findActive(): List<RoleProjetResponse> =
        roleProjetRepository.findByActifTrue()
            .sortedWith(compareBy({ it.famille.ordinal }, { it.nom.lowercase() }))
            .map { toResponse(it) }

    fun create(request: RoleProjetRequest): RoleProjetResponse {
        val nom = request.nom.trim()
        verifierNomDisponible(nom, excludeId = null)
        val role = RoleProjet(
            code = genererCode(nom),
            nom = nom,
            famille = request.famille,
            cumulable = request.cumulable,
            description = request.description?.trim()?.ifBlank { null }
        )
        val saved = roleProjetRepository.save(role)
        logger.info("Rôle projet créé : ${saved.code} (${saved.nom})")
        return toResponse(saved)
    }

    fun update(id: Long, request: RoleProjetRequest): RoleProjetResponse {
        val role = getById(id)
        val nom = request.nom.trim()
        verifierNomDisponible(nom, excludeId = id)
        role.nom = nom
        role.famille = request.famille
        role.cumulable = request.cumulable
        role.description = request.description?.trim()?.ifBlank { null }
        return toResponse(roleProjetRepository.save(role))
    }

    fun toggleActif(id: Long): RoleProjetResponse {
        val role = getById(id)
        role.actif = !role.actif
        logger.info("Rôle projet ${role.code} ${if (role.actif) "réactivé" else "désactivé"}")
        return toResponse(roleProjetRepository.save(role))
    }

    private fun getById(id: Long): RoleProjet =
        roleProjetRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Rôle projet non trouvé avec l'ID: $id") }

    private fun verifierNomDisponible(nom: String, excludeId: Long?) {
        val existant = roleProjetRepository.findAll()
            .firstOrNull { it.nom.equals(nom, ignoreCase = true) && it.id != excludeId }
        if (existant != null) {
            val etat = if (existant.actif) "" else " (actuellement désactivé — réactivez-le plutôt que d'en créer un doublon)"
            throw ConflictException(
                "Un rôle nommé « ${existant.nom} » existe déjà dans la famille ${existant.famille}$etat. " +
                    "Choisissez un autre nom ou modifiez le rôle existant."
            )
        }
    }

    /** Génère un code unique du type RP-CONDUCTEUR-DE-TRAVAUX à partir du nom (sans accents). */
    private fun genererCode(nom: String): String {
        val slug = Normalizer.normalize(nom, Normalizer.Form.NFD)
            .replace(Regex("\\p{M}"), "")
            .uppercase()
            .replace(Regex("[^A-Z0-9]+"), "-")
            .trim('-')
        var code = "RP-$slug".take(50).trimEnd('-')
        var suffixe = 2
        while (roleProjetRepository.existsByCode(code)) {
            code = "${code.take(50 - 2 - suffixe.toString().length)}-$suffixe"
            suffixe++
        }
        return code
    }

    private fun toResponse(r: RoleProjet) = RoleProjetResponse(
        id = r.id!!,
        code = r.code,
        nom = r.nom,
        famille = r.famille,
        cumulable = r.cumulable,
        description = r.description,
        actif = r.actif
    )
}
