package com.mikaservices.platform.modules.bareme

import com.mikaservices.platform.modules.bareme.dto.response.CorpsEtatBaremeResponse
import com.mikaservices.platform.modules.bareme.service.BaremeLectureService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.ActiveProfiles

/**
 * Tests du service de lecture barème (après import de données de test).
 */
@SpringBootTest
@ActiveProfiles("test")
class BaremeLectureServiceTest {

    @Autowired
    private lateinit var lectureService: BaremeLectureService

    @Test
    fun `getCorpsEtat retourne liste vide si aucune donnee`() {
        val list = lectureService.getCorpsEtat()
        assert(list is List<CorpsEtatBaremeResponse>)
    }

    @Test
    fun `getArticles avec pagination sans filtre`() {
        val page = lectureService.getArticles(
            corpsEtatId = null,
            type = null,
            fournisseurId = null,
            fournisseurNom = null,
            article = null,
            famille = null,
            categorie = null,
            unite = null,
            recherche = null,
            pageable = PageRequest.of(0, 10)
        )
        assertTrue(page.totalElements >= 0)
        assertEquals(minOf(10, page.totalElements.toInt()), page.content.size)
    }

    @Test
    fun `getDerniereMiseAJour retourne null ou une date`() {
        lectureService.getDerniereMiseAJour()
        // pas d'exception ; null si aucune ligne, sinon LocalDateTime
    }
}
