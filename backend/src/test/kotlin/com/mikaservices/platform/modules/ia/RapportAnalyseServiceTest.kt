package com.mikaservices.platform.modules.ia

import com.mikaservices.platform.common.enums.*
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.config.AnthropicProperties
import com.mikaservices.platform.modules.ia.dto.*
import com.mikaservices.platform.modules.ia.entity.AnalyseRapportLog
import com.mikaservices.platform.modules.ia.repository.AnalyseRapportLogRepository
import com.mikaservices.platform.modules.ia.service.AnthropicClientService
import com.mikaservices.platform.modules.ia.service.RapportAnalyseService
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.repository.CAPrevisionnelRealiseRepository
import com.mikaservices.platform.modules.projet.repository.PointBloquantRepository
import com.mikaservices.platform.modules.projet.repository.PrevisionRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.*
import tools.jackson.databind.ObjectMapper
import java.math.BigDecimal
import java.time.LocalDate
import java.util.*

class RapportAnalyseServiceTest {

    private lateinit var anthropicClient: AnthropicClientService
    private lateinit var projetRepository: ProjetRepository
    private lateinit var caRepository: CAPrevisionnelRealiseRepository
    private lateinit var previsionRepository: PrevisionRepository
    private lateinit var pointBloquantRepository: PointBloquantRepository
    private lateinit var analyseLogRepository: AnalyseRapportLogRepository
    private lateinit var service: RapportAnalyseService

    private val objectMapper = ObjectMapper()
    private val anthropicProperties = AnthropicProperties(
        apiKey = "sk-ant-test",
        model = "claude-sonnet-4-5-20250929",
        maxTokens = 4096,
        timeoutSeconds = 60,
        maxRetries = 3
    )

    private val testProjet = createTestProjet()

    @BeforeEach
    fun setUp() {
        anthropicClient = mock(AnthropicClientService::class.java)
        projetRepository = mock(ProjetRepository::class.java)
        caRepository = mock(CAPrevisionnelRealiseRepository::class.java)
        previsionRepository = mock(PrevisionRepository::class.java)
        pointBloquantRepository = mock(PointBloquantRepository::class.java)
        analyseLogRepository = mock(AnalyseRapportLogRepository::class.java)

        `when`(projetRepository.findById(1L)).thenReturn(Optional.of(testProjet))
        `when`(analyseLogRepository.save(any(AnalyseRapportLog::class.java))).thenAnswer { it.arguments[0] }
        `when`(caRepository.findByProjetIdAndMoisAndAnnee(any(), any(), any())).thenReturn(Optional.empty())
        `when`(previsionRepository.findByProjetIdAndSemaineAndAnnee(any(), any(), any())).thenReturn(emptyList())
        `when`(pointBloquantRepository.findByProjetIdAndStatut(any(), any())).thenReturn(emptyList())

        service = RapportAnalyseService(
            anthropicClient = anthropicClient,
            anthropicProperties = anthropicProperties,
            projetRepository = projetRepository,
            caRepository = caRepository,
            previsionRepository = previsionRepository,
            pointBloquantRepository = pointBloquantRepository,
            analyseLogRepository = analyseLogRepository
        )
    }

    @Test
    fun `analyserRapport rejects when no content provided`() {
        assertThrows<BadRequestException> {
            service.analyserRapport(1L, 1L, null, null)
        }
    }

    @Test
    fun `analyserRapport rejects when text exceeds max length`() {
        val longText = "a".repeat(20_001)
        assertThrows<BadRequestException> {
            service.analyserRapport(1L, 1L, null, longText)
        }
    }

    @Test
    fun `analyserRapport parses complete extraction correctly`() {
        val toolUseJson = objectMapper.readTree("""
        {
            "suiviMensuel": [{"mois": 4, "annee": 2026, "caPrevisionnel": 450000, "caRealise": 380000}],
            "previsions": [{"description": "Réception acier", "type": "APPROVISIONNEMENT", "semaine": 17, "annee": 2026}],
            "pointsBloquants": [{"titre": "Retard livraison ciment", "priorite": "CRITIQUE", "actionCorrective": "relance fournisseur"}],
            "avancementEtudes": [{"phase": "APD", "avancementPct": 85, "etatValidation": "VALIDE"}],
            "avancementPhysiquePct": 42.0,
            "avancementFinancierPct": 38.0,
            "delaiConsommePct": 55.0,
            "besoinsMateriel": "Niveleuse • Camion 10T",
            "besoinsHumain": "Conducteur de travaux",
            "observations": "Météo défavorable",
            "propositionsAmelioration": "Stock tampon ciment",
            "avertissements": []
        }
        """.trimIndent())

        val tokenUsage = AnthropicClientService.TokenUsage(inputTokens = 1500, outputTokens = 800)
        `when`(anthropicClient.callWithToolUse(any(), any(), any())).thenReturn(Pair(toolUseJson, tokenUsage))

        val result = service.analyserRapport(1L, 1L, null, "Rapport complet test")

        assertNotNull(result)
        assertEquals(1, result.suiviMensuel?.size)
        assertEquals(BigDecimal("450000"), result.suiviMensuel!![0].caPrevisionnel)
        assertEquals(BigDecimal("380000"), result.suiviMensuel!![0].caRealise)
        assertEquals(1, result.previsions?.size)
        assertEquals(TypePrevision.APPROVISIONNEMENT, result.previsions!![0].type)
        assertEquals(1, result.pointsBloquants?.size)
        assertEquals(Priorite.CRITIQUE, result.pointsBloquants!![0].priorite)
        assertEquals(1, result.avancementEtudes?.size)
        assertEquals(PhaseEtude.APD, result.avancementEtudes!![0].phase)
        assertEquals(42.0, result.avancementPhysiquePct)
        assertEquals(38.0, result.avancementFinancierPct)
        assertEquals(55.0, result.delaiConsommePct)
        assertEquals("Niveleuse • Camion 10T", result.besoinsMateriel)
        assertEquals("Conducteur de travaux", result.besoinsHumain)
        assertTrue(result.champsExtraits.contains("suiviMensuel"))
        assertTrue(result.champsExtraits.contains("avancementPhysiquePct"))
    }

    @Test
    fun `analyserRapport handles minimal extraction from ambiguous message`() {
        val toolUseJson = objectMapper.readTree("""
        {
            "avancementPhysiquePct": 50.0,
            "avertissements": ["Information trop vague, aucun point bloquant ou prévision extractible"]
        }
        """.trimIndent())

        val tokenUsage = AnthropicClientService.TokenUsage(inputTokens = 200, outputTokens = 100)
        `when`(anthropicClient.callWithToolUse(any(), any(), any())).thenReturn(Pair(toolUseJson, tokenUsage))

        val result = service.analyserRapport(1L, 1L, null, "ça avance bien, ~50%")

        assertNull(result.suiviMensuel)
        assertNull(result.previsions)
        assertNull(result.pointsBloquants)
        assertEquals(50.0, result.avancementPhysiquePct)
        assertEquals(1, result.avertissements.size)
        assertTrue(result.avertissements[0].contains("trop vague"))
        assertEquals(listOf("avancementPhysiquePct"), result.champsExtraits)
    }

    @Test
    fun `analyserRapport handles empty extraction from off-topic document`() {
        val toolUseJson = objectMapper.readTree("""
        {
            "avertissements": ["Le contenu ne semble pas lié au projet", "Aucune donnée de suivi de chantier extractible"]
        }
        """.trimIndent())

        val tokenUsage = AnthropicClientService.TokenUsage(inputTokens = 500, outputTokens = 50)
        `when`(anthropicClient.callWithToolUse(any(), any(), any())).thenReturn(Pair(toolUseJson, tokenUsage))

        val result = service.analyserRapport(1L, 1L, null, "PV de réunion comité de direction...")

        assertNull(result.suiviMensuel)
        assertNull(result.previsions)
        assertNull(result.pointsBloquants)
        assertNull(result.avancementPhysiquePct)
        assertEquals(2, result.avertissements.size)
        assertTrue(result.champsExtraits.isEmpty())
    }

    @Test
    fun `analyserRapport logs analysis result`() {
        val toolUseJson = objectMapper.readTree("""{"avancementPhysiquePct": 50.0, "avertissements": []}""")
        val tokenUsage = AnthropicClientService.TokenUsage(inputTokens = 200, outputTokens = 100)
        `when`(anthropicClient.callWithToolUse(any(), any(), any())).thenReturn(Pair(toolUseJson, tokenUsage))

        service.analyserRapport(1L, 1L, null, "test")

        verify(analyseLogRepository).save(any(AnalyseRapportLog::class.java))
    }

    @Test
    fun `analyserRapport detects CA doublons`() {
        val existingCA = mock(com.mikaservices.platform.modules.projet.entity.CAPrevisionnelRealise::class.java)
        `when`(existingCA.caRealise).thenReturn(BigDecimal("350000"))
        `when`(existingCA.caPrevisionnel).thenReturn(BigDecimal("400000"))
        `when`(caRepository.findByProjetIdAndMoisAndAnnee(1L, 4, 2026)).thenReturn(Optional.of(existingCA))

        val toolUseJson = objectMapper.readTree("""
        {
            "suiviMensuel": [{"mois": 4, "annee": 2026, "caRealise": 380000}],
            "avertissements": []
        }
        """.trimIndent())
        val tokenUsage = AnthropicClientService.TokenUsage(inputTokens = 300, outputTokens = 150)
        `when`(anthropicClient.callWithToolUse(any(), any(), any())).thenReturn(Pair(toolUseJson, tokenUsage))

        val result = service.analyserRapport(1L, 1L, null, "CA avril : 380k")

        assertNotNull(result.doublons)
        assertNotNull(result.doublons!!.suiviMensuel)
        assertEquals(1, result.doublons!!.suiviMensuel!!.size)
        assertEquals(4, result.doublons!!.suiviMensuel!![0].mois)
        assertEquals(BigDecimal("350000"), result.doublons!!.suiviMensuel!![0].caReelExistant)
    }

    private fun createTestProjet(): Projet {
        val projet = Projet(
            codeProjet = "PRJ-TEST-001",
            nom = "Projet Test Réhabilitation",
            type = TypeProjet.VOIRIE
        )
        projet.numeroMarche = "M-2026-001"
        projet.statut = StatutProjet.EN_COURS
        projet.dateDebut = LocalDate.of(2026, 1, 15)
        projet.dateFin = LocalDate.of(2026, 12, 31)
        projet.montantHT = BigDecimal("5000000")
        return projet
    }
}
