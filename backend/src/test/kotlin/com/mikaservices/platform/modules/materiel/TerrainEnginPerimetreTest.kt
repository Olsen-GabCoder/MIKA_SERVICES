package com.mikaservices.platform.modules.materiel

import com.mikaservices.platform.common.enums.NiveauHierarchique
import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.TypeEngin
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.chantier.entity.AffectationUtilisateurProjet
import com.mikaservices.platform.modules.chantier.repository.AffectationUtilisateurProjetRepository
import com.mikaservices.platform.modules.communication.service.NotificationService
import com.mikaservices.platform.modules.materiel.dto.request.ConsommationCarburantCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.InspectionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.PositionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.ReleveCompteurCreateRequest
import com.mikaservices.platform.modules.materiel.entity.AffectationEnginChantier
import com.mikaservices.platform.modules.materiel.entity.Engin
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.ConsommationCarburantRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.InspectionEnginRepository
import com.mikaservices.platform.modules.materiel.service.CarnetEnginService
import com.mikaservices.platform.modules.materiel.service.ConsommationCarburantService
import com.mikaservices.platform.modules.materiel.service.IncidentEnginService
import com.mikaservices.platform.modules.materiel.service.InspectionEnginService
import com.mikaservices.platform.modules.materiel.service.MouvementEnginService
import com.mikaservices.platform.modules.materiel.service.PositionEnginService
import com.mikaservices.platform.modules.materiel.service.ReleveCompteurService
import com.mikaservices.platform.modules.materiel.service.TerrainService
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.entity.Role
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.service.CurrentUserService
import com.mikaservices.platform.common.enums.GraviteIncident
import com.mikaservices.platform.common.enums.TypeIncidentEngin
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import java.math.BigDecimal
import java.time.LocalDate

/**
 * Périmètre engin de l'API terrain (règle unique, validée) :
 * - trio LOGISTIQUE/ADMIN/SUPER_ADMIN = tout le parc ;
 * - sinon : engin affecté EN_COURS à un chantier où l'utilisateur est affecté EN_COURS ;
 * - engin au dépôt (sans affectation) = trio uniquement ;
 * - hors périmètre → 404 (jamais 403).
 * Appliqué à : carnet, position, relevé, ravitaillement, incident (tous rôles), inspection, photo.
 * Chantiers des formulaires : trio = tous les actifs, sinon affectations EN_COURS.
 */
class TerrainEnginPerimetreTest {

    private lateinit var enginRepository: EnginRepository
    private lateinit var affectationRepository: AffectationEnginChantierRepository
    private lateinit var inspectionRepository: InspectionEnginRepository
    private lateinit var consommationRepository: ConsommationCarburantRepository
    private lateinit var positionEnginService: PositionEnginService
    private lateinit var releveCompteurService: ReleveCompteurService
    private lateinit var consommationCarburantService: ConsommationCarburantService
    private lateinit var incidentEnginService: IncidentEnginService
    private lateinit var inspectionEnginService: InspectionEnginService
    private lateinit var carnetEnginService: CarnetEnginService
    private lateinit var mouvementEnginService: MouvementEnginService
    private lateinit var notificationService: NotificationService
    private lateinit var currentUserService: CurrentUserService
    private lateinit var affectationUtilisateurRepository: AffectationUtilisateurProjetRepository
    private lateinit var projetRepository: ProjetRepository
    private lateinit var service: TerrainService

    // ── Fixtures ─────────────────────────────────────────────────
    private fun role(code: String) = Role(code = code, nom = code, niveau = NiveauHierarchique.EMPLOYE)

    private fun user(id: Long, vararg roleCodes: String): User {
        val u = User(matricule = "MAT$id", nom = "Nom$id", prenom = "Prenom$id", email = "u$id@test.io", motDePasse = "x")
        u.id = id
        u.roles = roleCodes.map { role(it) }.toMutableSet()
        return u
    }

    private fun projet(id: Long, actif: Boolean = true): Projet {
        val p = Projet(codeProjet = "PRJ$id", nom = "Projet $id", type = TypeProjet.entries.first())
        p.id = id
        p.actif = actif
        return p
    }

    private fun engin(id: Long = 100L): Engin {
        val e = Engin(code = "ENG$id", nom = "Pelle 20T", type = TypeEngin.entries.first())
        e.id = id
        return e
    }

    /** Déclare l'utilisateur courant et ses affectations EN_COURS. */
    private fun connecte(u: User, vararg projetsEnCours: Projet) {
        Mockito.`when`(currentUserService.getCurrentUser()).thenReturn(u)
        Mockito.`when`(
            affectationUtilisateurRepository.findByUserIdAndStatutIn(u.id!!, listOf(StatutAffectation.EN_COURS))
        ).thenReturn(projetsEnCours.map {
            AffectationUtilisateurProjet(user = u, projet = it, poste = "Poste", dateDebut = LocalDate.now())
        })
    }

    /** L'engin est affecté EN_COURS au chantier donné (null = au dépôt). */
    private fun enginSurChantier(enginId: Long, chantier: Projet?) {
        val affectations = if (chantier == null) emptyList() else listOf(
            AffectationEnginChantier(
                projet = chantier, engin = engin(enginId),
                dateDebut = LocalDate.now(), statut = StatutAffectation.EN_COURS,
            )
        )
        Mockito.`when`(affectationRepository.findByEnginIdAndStatut(enginId, StatutAffectation.EN_COURS))
            .thenReturn(affectations)
    }

    @BeforeEach
    fun setUp() {
        enginRepository = Mockito.mock(EnginRepository::class.java)
        affectationRepository = Mockito.mock(AffectationEnginChantierRepository::class.java)
        inspectionRepository = Mockito.mock(InspectionEnginRepository::class.java)
        consommationRepository = Mockito.mock(ConsommationCarburantRepository::class.java)
        positionEnginService = Mockito.mock(PositionEnginService::class.java)
        releveCompteurService = Mockito.mock(ReleveCompteurService::class.java)
        consommationCarburantService = Mockito.mock(ConsommationCarburantService::class.java)
        incidentEnginService = Mockito.mock(IncidentEnginService::class.java)
        inspectionEnginService = Mockito.mock(InspectionEnginService::class.java)
        carnetEnginService = Mockito.mock(CarnetEnginService::class.java)
        mouvementEnginService = Mockito.mock(MouvementEnginService::class.java)
        notificationService = Mockito.mock(NotificationService::class.java)
        currentUserService = Mockito.mock(CurrentUserService::class.java)
        affectationUtilisateurRepository = Mockito.mock(AffectationUtilisateurProjetRepository::class.java)
        projetRepository = Mockito.mock(ProjetRepository::class.java)
        service = TerrainService(
            enginRepository, affectationRepository, inspectionRepository, consommationRepository,
            positionEnginService, releveCompteurService, consommationCarburantService,
            incidentEnginService, inspectionEnginService, carnetEnginService, mouvementEnginService,
            notificationService, currentUserService, affectationUtilisateurRepository, projetRepository,
        )
    }

    // ── assertEnginDansPerimetre : matrice trio / affecté / non affecté / dépôt ──

    @Test
    fun `perimetre - trio voit tout, meme un engin d'un chantier etranger`() {
        enginSurChantier(100, projet(10))
        for (code in listOf("LOGISTIQUE", "ADMIN", "SUPER_ADMIN")) {
            connecte(user(2, code)) // aucune affectation
            service.assertEnginDansPerimetre(100) // ne lève pas
        }
    }

    @Test
    fun `perimetre - utilisateur affecte au chantier de l'engin ok`() {
        val chantier = projet(10)
        enginSurChantier(100, chantier)
        connecte(user(2, "CONDUCTEUR"), chantier)
        service.assertEnginDansPerimetre(100)
    }

    @Test
    fun `perimetre - engin d'un autre chantier = 404`() {
        enginSurChantier(100, projet(10))
        connecte(user(2, "CONDUCTEUR"), projet(30))
        assertThrows(ResourceNotFoundException::class.java) { service.assertEnginDansPerimetre(100) }
    }

    @Test
    fun `perimetre - engin au depot = trio uniquement`() {
        enginSurChantier(100, null)
        connecte(user(2, "CHEF_CHANTIER"), projet(10))
        assertThrows(ResourceNotFoundException::class.java) { service.assertEnginDansPerimetre(100) }
        connecte(user(3, "LOGISTIQUE"))
        service.assertEnginDansPerimetre(100) // trio ok
    }

    // ── Application de la garde sur chaque action engin ──

    private val releve = ReleveCompteurCreateRequest(dateReleve = LocalDate.now(), valeurHeures = 1200)
    private val plein = ConsommationCarburantCreateRequest(datePlein = LocalDate.now(), quantiteLitres = BigDecimal.TEN)
    private val incident = IncidentEnginCreateRequest(
        typeIncident = TypeIncidentEngin.entries.first(), gravite = GraviteIncident.entries.first(),
        dateIncident = LocalDate.now(),
    )
    private val inspection = InspectionEnginCreateRequest(dateInspection = LocalDate.now())
    private val position = PositionEnginCreateRequest(latitude = 0.4, longitude = 9.4)

    @Test
    fun `actions engin - hors perimetre = 404 avant toute delegation`() {
        enginSurChantier(100, projet(10))
        connecte(user(2, "CONDUCTEUR"), projet(30))
        assertThrows(ResourceNotFoundException::class.java) { service.carnet(100) }
        assertThrows(ResourceNotFoundException::class.java) { service.creerReleve(100, releve) }
        assertThrows(ResourceNotFoundException::class.java) { service.creerRavitaillement(100, plein) }
        assertThrows(ResourceNotFoundException::class.java) { service.signalerIncident(100, incident) }
        assertThrows(ResourceNotFoundException::class.java) { service.creerInspection(100, inspection) }
        assertThrows(ResourceNotFoundException::class.java) { service.confirmerPosition(100, position) }
        Mockito.verifyNoInteractions(
            carnetEnginService, releveCompteurService, consommationCarburantService,
            incidentEnginService, inspectionEnginService, positionEnginService,
        )
    }

    @Test
    fun `actions engin - affecte au chantier delegue au service metier`() {
        val chantier = projet(10)
        enginSurChantier(100, chantier)
        connecte(user(2, "CONDUCTEUR"), chantier)
        service.creerReleve(100, releve)
        service.creerRavitaillement(100, plein)
        service.signalerIncident(100, incident) // tout rôle : la sécurité prime, périmètre seul
        service.creerInspection(100, inspection)
        service.carnet(100)
        val nom = "Prenom2 Nom2" // traçabilité auto-remplie par TerrainService
        Mockito.verify(releveCompteurService).create(100L, releve.copy(relevePar = nom))
        Mockito.verify(consommationCarburantService).create(100L, plein.copy(pleinPar = nom))
        Mockito.verify(incidentEnginService).create(100L, incident.copy(signalePar = nom))
        Mockito.verify(inspectionEnginService).create(100L, inspection.copy(inspectePar = nom))
        Mockito.verify(carnetEnginService).getCarnet(100L)
    }

    // ── Chantiers des formulaires ──

    @Test
    fun `chantiers - trio voit tous les projets actifs`() {
        Mockito.`when`(projetRepository.findAll()).thenReturn(listOf(projet(10), projet(20, actif = false), projet(30)))
        connecte(user(2, "LOGISTIQUE"))
        assertEquals(listOf(10L, 30L), service.chantiersVisibles().map { it.id })
    }

    @Test
    fun `chantiers - non-trio limite a ses affectations EN_COURS actives`() {
        connecte(user(2, "CHEF_CHANTIER"), projet(10), projet(20, actif = false))
        assertEquals(listOf(10L), service.chantiersVisibles().map { it.id })
        Mockito.verifyNoInteractions(projetRepository)
    }

    @Test
    fun `chantiers - sans affectation = liste vide (pas de fuite des noms de chantiers)`() {
        connecte(user(2, "USER"))
        assertEquals(emptyList<Long>(), service.chantiersVisibles().map { it.id })
    }
}
