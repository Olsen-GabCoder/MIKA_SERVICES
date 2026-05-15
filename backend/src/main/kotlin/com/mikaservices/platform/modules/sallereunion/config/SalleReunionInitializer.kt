package com.mikaservices.platform.modules.sallereunion.config

import com.mikaservices.platform.modules.sallereunion.entity.SalleReunion
import com.mikaservices.platform.modules.sallereunion.repository.SalleReunionRepository
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom

@Component
class SalleReunionInitializer(
    private val salleReunionRepository: SalleReunionRepository
) {
    private val logger = LoggerFactory.getLogger(SalleReunionInitializer::class.java)

    @PostConstruct
    @Transactional
    fun init() {
        if (salleReunionRepository.count() > 0L) {
            logger.debug("Salle MIKA deja presente en base — skip init.")
            return
        }
        try {
            val slug = generateSlug()
            val roomName = "mika-bsg-salle-principale-$slug"
            val salle = SalleReunion(roomName = roomName, libelle = "Salle MIKA")
            salleReunionRepository.saveAndFlush(salle)
            logger.info("Salle MIKA initialisee avec roomName=$roomName")
        } catch (e: DataIntegrityViolationException) {
            logger.info("Salle MIKA deja creee par une autre instance — skip (concurrent init).")
        }
    }

    private fun generateSlug(length: Int = 8): String {
        val chars = "abcdefghijklmnopqrstuvwxyz0123456789"
        val random = SecureRandom()
        return (1..length).map { chars[random.nextInt(chars.length)] }.joinToString("")
    }
}
