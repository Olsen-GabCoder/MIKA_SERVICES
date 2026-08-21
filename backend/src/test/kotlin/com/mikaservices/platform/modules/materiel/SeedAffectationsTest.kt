package com.mikaservices.platform.modules.materiel

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.TypeEngin
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.common.service.FileStorageService
import com.mikaservices.platform.modules.materiel.entity.AffectationEnginChantier
import com.mikaservices.platform.modules.materiel.entity.Engin
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.service.EnginService
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable

/**
 * Verrou de l'outil de données de test seedAffectations (SUPER_ADMIN, web pilotage).
 * Règles : idempotent (n'affecte que les engins sans localisation ouverte), répartition
 * round-robin sur les chantiers actifs, aucune modification d'affectation existante.
 */
class SeedAffectationsTest {

    private lateinit var enginRepository: EnginRepository
    private lateinit var affectationRepository: AffectationEnginChantierRepository
    private lateinit var projetRepository: ProjetRepository
    private lateinit var service: EnginService

    private fun engin(id: Long) = Engin(code = "ENG$id", nom = "Engin $id", type = TypeEngin.PELLETEUSE).apply { this.id = id }

    private fun projet(id: Long, statut: StatutProjet = StatutProjet.EN_COURS_EXECUTION) =
        Projet(codeProjet = "P$id", nom = "Chantier $id", type = TypeProjet.BATIMENT, statut = statut).apply { this.id = id }

    @BeforeEach
    fun setUp() {
        enginRepository = Mockito.mock(EnginRepository::class.java)
        affectationRepository = Mockito.mock(AffectationEnginChantierRepository::class.java)
        projetRepository = Mockito.mock(ProjetRepository::class.java)
        val fileStorage = Mockito.mock(FileStorageService::class.java)
        service = EnginService(enginRepository, affectationRepository, projetRepository, fileStorage)

        Mockito.`when`(affectationRepository.save(Mockito.any(AffectationEnginChantier::class.java)))
            .thenAnswer { it.arguments[0] }
    }

    private fun stubChantiers(vararg projets: Projet) {
        Mockito.`when`(projetRepository.findByActifTrue(Pageable.unpaged()))
            .thenReturn(PageImpl(projets.toList()))
    }

    @Test
    fun `repartit les engins non localises en round-robin sur les chantiers actifs`() {
        stubChantiers(projet(1L), projet(2L))
        Mockito.`when`(enginRepository.findByActifTrue()).thenReturn(listOf(engin(10L), engin(11L), engin(12L)))
        Mockito.`when`(affectationRepository.findByStatutIn(Mockito.anyList())).thenReturn(emptyList())

        val result = service.seedAffectations()

        assertEquals(3, result.totalEnginsActifs)
        assertEquals(0, result.dejaLocalises)
        assertEquals(3, result.nouvellesAffectations)
        // Round-robin : chantier 1 -> engins 10 et 12, chantier 2 -> engin 11
        assertEquals(mapOf("Chantier 1" to 2, "Chantier 2" to 1), result.repartition)

        val captor = ArgumentCaptor.forClass(AffectationEnginChantier::class.java)
        Mockito.verify(affectationRepository, Mockito.times(3)).save(captor.capture())
        assertTrue(captor.allValues.all { it.statut == StatutAffectation.EN_COURS && it.dateFin == null })
    }

    @Test
    fun `ignore les engins deja localises (idempotence)`() {
        stubChantiers(projet(1L))
        val dejaLocalise = engin(10L)
        val aAffecter = engin(11L)
        Mockito.`when`(enginRepository.findByActifTrue()).thenReturn(listOf(dejaLocalise, aAffecter))
        val affectationOuverte = AffectationEnginChantier(
            projet = projet(1L), engin = dejaLocalise,
            dateDebut = java.time.LocalDate.now(), dateFin = null,
            statut = StatutAffectation.EN_COURS,
        )
        Mockito.`when`(affectationRepository.findByStatutIn(Mockito.anyList())).thenReturn(listOf(affectationOuverte))

        val result = service.seedAffectations()

        assertEquals(1, result.dejaLocalises)
        assertEquals(1, result.nouvellesAffectations)
        // Un seul save : uniquement l'engin non localisé.
        val captor = ArgumentCaptor.forClass(AffectationEnginChantier::class.java)
        Mockito.verify(affectationRepository, Mockito.times(1)).save(captor.capture())
        assertEquals(11L, captor.value.engin.id)
    }

    @Test
    fun `un second appel ne cree aucune affectation quand tout est localise`() {
        stubChantiers(projet(1L))
        val e = engin(10L)
        Mockito.`when`(enginRepository.findByActifTrue()).thenReturn(listOf(e))
        val ouverte = AffectationEnginChantier(
            projet = projet(1L), engin = e,
            dateDebut = java.time.LocalDate.now(), dateFin = null,
            statut = StatutAffectation.EN_COURS,
        )
        Mockito.`when`(affectationRepository.findByStatutIn(Mockito.anyList())).thenReturn(listOf(ouverte))

        val result = service.seedAffectations()

        assertEquals(0, result.nouvellesAffectations)
        Mockito.verify(affectationRepository, Mockito.never()).save(Mockito.any(AffectationEnginChantier::class.java))
    }
}
