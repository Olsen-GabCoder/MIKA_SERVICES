package com.mikaservices.platform.modules.materiel

import com.mikaservices.platform.common.enums.EtatGeneralInspection
import com.mikaservices.platform.common.enums.GraviteIncident
import com.mikaservices.platform.common.enums.TypeEngin
import com.mikaservices.platform.common.enums.TypeIncidentEngin
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.modules.materiel.dto.request.ChecklistItemDto
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.InspectionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.response.IncidentEnginResponse
import com.mikaservices.platform.modules.materiel.entity.Engin
import com.mikaservices.platform.modules.materiel.entity.InspectionEngin
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.InspectionEnginRepository
import com.mikaservices.platform.modules.materiel.service.IncidentEnginService
import com.mikaservices.platform.modules.materiel.service.InspectionEnginService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import tools.jackson.databind.ObjectMapper
import java.time.LocalDate
import java.util.Optional

/**
 * Verrou du critère V1 n°4 (sécurité) : une inspection signalant une anomalie
 * - EXIGE au moins une photo (rejet 400 sinon) ;
 * - crée l'incident VIA IncidentEnginService (pour hériter de l'immobilisation
 *   automatique et de la notification logistique/responsable — l'ancien code
 *   court-circuitait le service et n'immobilisait ni ne notifiait rien).
 */
class InspectionIncidentAutoTest {

    private lateinit var inspectionRepository: InspectionEnginRepository
    private lateinit var enginRepository: EnginRepository
    private lateinit var incidentEnginService: IncidentEnginService
    private lateinit var objectMapper: ObjectMapper
    private lateinit var service: InspectionEnginService

    private val enginId = 100L

    /** Matcher any() compatible Kotlin : enregistre le matcher et renvoie null via cast effacé
     *  (évite le check-not-null Kotlin sur les paramètres non-nuls). */
    @Suppress("UNCHECKED_CAST")
    private fun <T> anyKt(): T {
        Mockito.any<T>()
        return null as T
    }

    private fun engin(): Engin {
        val e = Engin(code = "ENG$enginId", nom = "Pelle 20T", type = TypeEngin.entries.first())
        e.id = enginId
        return e
    }

    private fun nok(code: String) = ChecklistItemDto(code = code, label = "Frein $code", ok = false, commentaire = "usé")

    private fun incidentResponse(gravite: GraviteIncident) = IncidentEnginResponse(
        id = 5L, enginId = enginId, enginCode = "ENG$enginId",
        typeIncident = TypeIncidentEngin.DEFAUT_TECHNIQUE, gravite = gravite,
        dateIncident = LocalDate.now(), description = null, lieu = null, signalePar = null,
        resolu = false, dateResolution = null, actionsCorrectives = null,
        photoUrls = null, createdAt = null, updatedAt = null,
    )

    @BeforeEach
    fun setUp() {
        inspectionRepository = Mockito.mock(InspectionEnginRepository::class.java)
        enginRepository = Mockito.mock(EnginRepository::class.java)
        incidentEnginService = Mockito.mock(IncidentEnginService::class.java)
        objectMapper = Mockito.mock(ObjectMapper::class.java)
        service = InspectionEnginService(inspectionRepository, enginRepository, incidentEnginService, objectMapper)

        Mockito.`when`(enginRepository.findById(enginId)).thenReturn(Optional.of(engin()))
        Mockito.`when`(objectMapper.writeValueAsString(Mockito.any())).thenReturn("[]")
        // save renvoie une entité déjà « persistée » (id + colonnes JSON nulles → pas de readValue en toResponse)
        Mockito.`when`(inspectionRepository.save(Mockito.any())).thenAnswer {
            (it.arguments[0] as InspectionEngin).apply { id = 1L; checklistResultats = null; photoUrls = null }
        }
    }

    @Test
    fun `anomalie sans photo est refusee (400)`() {
        val req = InspectionEnginCreateRequest(
            dateInspection = LocalDate.now(),
            checklist = listOf(nok("A"), ChecklistItemDto("B", "Feux", true)),
            etatGeneral = EtatGeneralInspection.CORRECT,
            photoUrls = null,
        )
        assertThrows(BadRequestException::class.java) { service.create(enginId, req) }
        // Aucun incident ne doit être créé si l'inspection est rejetée.
        Mockito.verifyNoInteractions(incidentEnginService)
    }

    @Test
    fun `anomalie avec photo delegue a IncidentEnginService (immobilisation + notif)`() {
        val envoyes = mutableListOf<IncidentEnginCreateRequest>()
        Mockito.`when`(incidentEnginService.create(Mockito.anyLong(), anyKt())).thenAnswer {
            envoyes.add(it.arguments[1] as IncidentEnginCreateRequest)
            incidentResponse(GraviteIncident.MAJEURE)
        }

        val photos = listOf("https://cdn/p1.jpg")
        val req = InspectionEnginCreateRequest(
            dateInspection = LocalDate.now(),
            checklist = listOf(nok("A")),
            etatGeneral = EtatGeneralInspection.MAUVAIS,
            photoUrls = photos,
        )
        service.create(enginId, req)

        assertEquals(1, envoyes.size)
        val sent = envoyes.first()
        assertEquals(GraviteIncident.MAJEURE, sent.gravite) // etatGeneral MAUVAIS -> MAJEURE -> immobilisation
        assertEquals(TypeIncidentEngin.DEFAUT_TECHNIQUE, sent.typeIncident)
        assertEquals(photos, sent.photoUrls) // preuve photo transmise à l'incident
    }

    @Test
    fun `inspection sans anomalie ne cree aucun incident`() {
        val req = InspectionEnginCreateRequest(
            dateInspection = LocalDate.now(),
            checklist = listOf(ChecklistItemDto("A", "Frein", true)),
            etatGeneral = EtatGeneralInspection.BON,
        )
        service.create(enginId, req)
        Mockito.verifyNoInteractions(incidentEnginService)
    }
}
