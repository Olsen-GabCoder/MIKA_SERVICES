package com.mikaservices.platform.modules.materiel

import com.mikaservices.platform.common.enums.NiveauHierarchique
import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.StatutMouvementEngin
import com.mikaservices.platform.common.enums.TypeEngin
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ForbiddenException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.chantier.entity.AffectationUtilisateurProjet
import com.mikaservices.platform.modules.chantier.repository.AffectationUtilisateurProjetRepository
import com.mikaservices.platform.modules.materiel.dto.request.RejetTransfertRequest
import com.mikaservices.platform.modules.materiel.dto.request.ReceptionTransfertRequest
import com.mikaservices.platform.modules.materiel.entity.AffectationEnginChantier
import com.mikaservices.platform.modules.materiel.entity.Engin
import com.mikaservices.platform.modules.materiel.entity.MouvementEngin
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.MouvementEnginEvenementRepository
import com.mikaservices.platform.modules.materiel.repository.MouvementEnginRepository
import com.mikaservices.platform.modules.materiel.service.IncidentEnginService
import com.mikaservices.platform.modules.materiel.service.MouvementEnginService
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.entity.Role
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito
import org.springframework.context.ApplicationEventPublisher
import java.time.LocalDate
import java.util.Optional

/**
 * Matrice rôle × action × périmètre des transferts d'engins (règle validée) :
 * - ADMIN / SUPER_ADMIN / LOGISTIQUE voient et pilotent tout ;
 * - les autres rôles ne voient que les transferts dont l'origine OU la destination est un
 *   projet affecté EN_COURS, plus ceux qu'ils ont initiés ;
 * - hors périmètre en lecture → 404 (ResourceNotFound), jamais 403 (fuite d'existence) ;
 * - actions : valider/rejeter = logistique seule, départ = acteurs de l'origine,
 *   réception = chef de chantier de destination ou logistique, annulation selon statut.
 *
 * Tests unitaires purs (mocks) : verrouillent la règle de périmètre pour éviter une
 * régression du type « mesEngins avant Phase 6 » (liste globale non scopée).
 */
class MouvementEnginVisibiliteTest {

    private lateinit var mouvementRepository: MouvementEnginRepository
    private lateinit var evenementRepository: MouvementEnginEvenementRepository
    private lateinit var enginRepository: EnginRepository
    private lateinit var projetRepository: ProjetRepository
    private lateinit var affectationRepository: AffectationEnginChantierRepository
    private lateinit var currentUserService: CurrentUserService
    private lateinit var eventPublisher: ApplicationEventPublisher
    private lateinit var affectationUtilisateurRepository: AffectationUtilisateurProjetRepository
    private lateinit var incidentEnginService: IncidentEnginService
    private lateinit var service: MouvementEnginService

    // ── Fixtures ─────────────────────────────────────────────────
    private fun role(code: String) = Role(code = code, nom = code, niveau = NiveauHierarchique.EMPLOYE)

    private fun user(id: Long, vararg roleCodes: String): User {
        val u = User(
            matricule = "MAT$id", nom = "Nom$id", prenom = "Prenom$id",
            email = "u$id@test.io", motDePasse = "x",
        )
        u.id = id
        u.roles = roleCodes.map { role(it) }.toMutableSet()
        return u
    }

    private fun projet(id: Long): Projet {
        val p = Projet(codeProjet = "PRJ$id", nom = "Projet $id", type = TypeProjet.entries.first())
        p.id = id
        return p
    }

    private fun engin(statut: StatutEngin = StatutEngin.EN_SERVICE): Engin {
        val e = Engin(code = "ENG1", nom = "Pelle 20T", type = TypeEngin.entries.first())
        e.id = 100L
        e.statut = statut
        return e
    }

    private fun mouvement(
        id: Long,
        initiateur: User,
        origine: Projet?,
        destination: Projet,
        statut: StatutMouvementEngin,
        enginStatut: StatutEngin = StatutEngin.EN_SERVICE,
    ): MouvementEngin {
        val m = MouvementEngin(
            engin = engin(enginStatut),
            projetOrigine = origine,
            projetDestination = destination,
            initiateur = initiateur,
            statut = statut,
        )
        m.id = id
        if (statut == StatutMouvementEngin.EN_ATTENTE_DEPART || statut == StatutMouvementEngin.EN_TRANSIT) {
            m.qrToken = "token-$id"
            m.codeReception = "123456"
        }
        return m
    }

    /** Déclare l'utilisateur courant et ses affectations EN_COURS. */
    private fun connecte(u: User, vararg projetsEnCours: Projet) {
        Mockito.`when`(currentUserService.getCurrentUser()).thenReturn(u)
        val affectations = projetsEnCours.map {
            AffectationUtilisateurProjet(user = u, projet = it, poste = "Poste", dateDebut = LocalDate.now())
        }
        Mockito.`when`(
            affectationUtilisateurRepository.findByUserIdAndStatutIn(u.id!!, listOf(StatutAffectation.EN_COURS))
        ).thenReturn(affectations)
    }

    private fun stub(m: MouvementEngin) {
        Mockito.`when`(mouvementRepository.findById(m.id!!)).thenReturn(Optional.of(m))
    }

    @BeforeEach
    fun setUp() {
        mouvementRepository = Mockito.mock(MouvementEnginRepository::class.java)
        evenementRepository = Mockito.mock(MouvementEnginEvenementRepository::class.java)
        enginRepository = Mockito.mock(EnginRepository::class.java)
        projetRepository = Mockito.mock(ProjetRepository::class.java)
        affectationRepository = Mockito.mock(AffectationEnginChantierRepository::class.java)
        currentUserService = Mockito.mock(CurrentUserService::class.java)
        eventPublisher = Mockito.mock(ApplicationEventPublisher::class.java)
        affectationUtilisateurRepository = Mockito.mock(AffectationUtilisateurProjetRepository::class.java)
        incidentEnginService = Mockito.mock(IncidentEnginService::class.java)
        service = MouvementEnginService(
            mouvementRepository, evenementRepository, enginRepository, projetRepository,
            affectationRepository, currentUserService, eventPublisher,
            affectationUtilisateurRepository, incidentEnginService,
        )
        Mockito.`when`(mouvementRepository.save(any(MouvementEngin::class.java))).thenAnswer { it.arguments[0] }
        Mockito.`when`(enginRepository.save(any(Engin::class.java))).thenAnswer { it.arguments[0] }
    }

    // ── Détail : périmètre de lecture (404 hors périmètre) ───────

    @Test
    fun `detail - admin, logistique et super admin voient tout`() {
        val m = mouvement(1, user(9, "USER"), projet(10), projet(20), StatutMouvementEngin.EN_TRANSIT)
        stub(m)
        for (code in listOf("ADMIN", "SUPER_ADMIN", "LOGISTIQUE")) {
            connecte(user(2, code)) // aucune affectation
            assertEquals(1L, service.findById(1).id)
        }
    }

    @Test
    fun `detail - affecte a l'origine ou a la destination voit le transfert`() {
        val origine = projet(10)
        val destination = projet(20)
        val m = mouvement(1, user(9, "USER"), origine, destination, StatutMouvementEngin.EN_TRANSIT)
        stub(m)
        connecte(user(2, "CHEF_CHANTIER"), origine)
        assertEquals(1L, service.findById(1).id)
        connecte(user(3, "CHEF_PROJET"), destination)
        assertEquals(1L, service.findById(1).id)
    }

    @Test
    fun `detail - initiateur non affecte suit sa propre demande`() {
        val initiateur = user(9, "CHEF_CHANTIER")
        val m = mouvement(1, initiateur, projet(10), projet(20), StatutMouvementEngin.DEMANDE)
        stub(m)
        connecte(initiateur) // plus aucune affectation EN_COURS
        assertEquals(1L, service.findById(1).id)
    }

    @Test
    fun `detail - hors perimetre = 404, pas 403`() {
        val m = mouvement(1, user(9, "USER"), projet(10), projet(20), StatutMouvementEngin.EN_TRANSIT)
        stub(m)
        connecte(user(2, "CHEF_PROJET"), projet(30)) // affecté ailleurs
        assertThrows(ResourceNotFoundException::class.java) { service.findById(1) }
    }

    @Test
    fun `detail - origine depot, seul le perimetre destination compte`() {
        val m = mouvement(1, user(9, "LOGISTIQUE"), null, projet(20), StatutMouvementEngin.EN_ATTENTE_DEPART)
        stub(m)
        connecte(user(2, "CHEF_CHANTIER"), projet(20))
        assertEquals(1L, service.findById(1).id)
        connecte(user(3, "CHEF_CHANTIER"), projet(30))
        assertThrows(ResourceNotFoundException::class.java) { service.findById(1) }
    }

    // ── Cas limite validé : affectation passée EN_COURS → TERMINEE ──

    @Test
    fun `cas limite - affectation terminee - garde ses demandes initiees, perd le reste`() {
        val chantier = projet(10)
        val u = user(2, "CHEF_CHANTIER")
        val sienne = mouvement(1, u, chantier, projet(20), StatutMouvementEngin.EN_TRANSIT)
        val autre = mouvement(2, user(9, "LOGISTIQUE"), chantier, projet(20), StatutMouvementEngin.EN_TRANSIT)
        stub(sienne); stub(autre)
        connecte(u) // affectation au chantier 10 terminée : plus rien EN_COURS
        assertEquals(1L, service.findById(1).id) // initiateur : visibilité conservée
        assertThrows(ResourceNotFoundException::class.java) { service.findById(2) } // le reste : perdu
    }

    // ── Bon de transfert : 404 hors périmètre, 403 dans le périmètre sans droit ──

    @Test
    fun `bon - hors perimetre = 404`() {
        val m = mouvement(1, user(9, "USER"), projet(10), projet(20), StatutMouvementEngin.EN_ATTENTE_DEPART)
        stub(m)
        connecte(user(2, "CHEF_PROJET"), projet(30))
        assertThrows(ResourceNotFoundException::class.java) { service.getBon(1) }
    }

    @Test
    fun `bon - affecte destination seulement = 403 (voit le transfert mais pas le bon)`() {
        val m = mouvement(1, user(9, "USER"), projet(10), projet(20), StatutMouvementEngin.EN_ATTENTE_DEPART)
        stub(m)
        connecte(user(2, "USER"), projet(20))
        assertThrows(ForbiddenException::class.java) { service.getBon(1) }
    }

    @Test
    fun `bon - logistique, initiateur et chef chantier origine y accedent`() {
        val origine = projet(10)
        val initiateur = user(9, "CHEF_CHANTIER")
        val m = mouvement(1, initiateur, origine, projet(20), StatutMouvementEngin.EN_ATTENTE_DEPART)
        stub(m)
        connecte(user(2, "LOGISTIQUE"))
        assertEquals("token-1", service.getBon(1).qrToken)
        connecte(initiateur)
        assertEquals("token-1", service.getBon(1).qrToken)
        connecte(user(3, "CHEF_CHANTIER"), origine)
        assertEquals("token-1", service.getBon(1).qrToken)
    }

    // ── Valider / rejeter : logistique ou admin uniquement ───────

    @Test
    fun `valider - reserve a la logistique et aux admins`() {
        val origine = projet(10)
        connecte(user(2, "CHEF_PROJET"), origine)
        stub(mouvement(1, user(9, "USER"), origine, projet(20), StatutMouvementEngin.DEMANDE))
        assertThrows(ForbiddenException::class.java) { service.valider(1, null) }
    }

    @Test
    fun `rejeter - reserve a la logistique et aux admins`() {
        connecte(user(2, "CHEF_CHANTIER"), projet(10))
        stub(mouvement(1, user(9, "USER"), projet(10), projet(20), StatutMouvementEngin.DEMANDE))
        assertThrows(ForbiddenException::class.java) { service.rejeter(1, RejetTransfertRequest(motif = "x")) }
    }

    @Test
    fun `rejeter - logistique ok`() {
        connecte(user(2, "LOGISTIQUE"))
        stub(mouvement(1, user(9, "USER"), projet(10), projet(20), StatutMouvementEngin.DEMANDE))
        assertEquals(StatutMouvementEngin.REJETE, service.rejeter(1, RejetTransfertRequest(motif = "Indisponible")).statut)
    }

    // ── Confirmer le départ : acteurs du chantier d'origine ──────

    @Test
    fun `depart - chef chantier affecte a l'origine ok`() {
        val origine = projet(10)
        val m = mouvement(1, user(9, "USER"), origine, projet(20), StatutMouvementEngin.EN_ATTENTE_DEPART)
        stub(m)
        connecte(user(2, "CHEF_CHANTIER"), origine)
        Mockito.`when`(
            affectationRepository.findOuvertesParEnginEtProjet(
                m.engin.id!!, origine.id!!, listOf(StatutAffectation.PLANIFIEE, StatutAffectation.EN_COURS)
            )
        ).thenReturn(listOf(AffectationEnginChantier(projet = origine, engin = m.engin, dateDebut = LocalDate.now(), statut = StatutAffectation.EN_COURS)))
        assertEquals(StatutMouvementEngin.EN_TRANSIT, service.confirmerDepart(1, null).statut)
    }

    @Test
    fun `depart - chef chantier non affecte a l'origine = interdit`() {
        val origine = projet(10)
        val destination = projet(20)
        stub(mouvement(1, user(9, "USER"), origine, destination, StatutMouvementEngin.EN_ATTENTE_DEPART))
        connecte(user(2, "CHEF_CHANTIER"), destination) // affecté destination, pas origine
        assertThrows(ForbiddenException::class.java) { service.confirmerDepart(1, null) }
    }

    // ── Réception : chef de chantier de destination ou logistique ──

    private fun receptionRequest(token: String?) = ReceptionTransfertRequest(
        token = token, code = null, avecReserves = false, commentaire = null,
        latitude = null, longitude = null, precisionMetres = null, photos = null,
    )

    @Test
    fun `reception - chef chantier de destination avec token ok`() {
        val destination = projet(20)
        val m = mouvement(1, user(9, "USER"), projet(10), destination, StatutMouvementEngin.EN_TRANSIT)
        stub(m)
        connecte(user(2, "CHEF_CHANTIER"), destination)
        assertEquals(StatutMouvementEngin.RECU, service.receptionner(1, receptionRequest(m.qrToken)).statut)
    }

    @Test
    fun `reception - initiateur non affecte a destination = interdit`() {
        val initiateur = user(9, "CHEF_CHANTIER")
        val m = mouvement(1, initiateur, projet(10), projet(20), StatutMouvementEngin.EN_TRANSIT)
        stub(m)
        connecte(initiateur, projet(10)) // affecté origine, pas destination
        assertThrows(ForbiddenException::class.java) { service.receptionner(1, receptionRequest(m.qrToken)) }
    }

    // ── Annulation : selon statut ────────────────────────────────

    @Test
    fun `annuler - demande annulable par l'initiateur, pas par un tiers`() {
        val initiateur = user(9, "CHEF_CHANTIER")
        val m = mouvement(1, initiateur, projet(10), projet(20), StatutMouvementEngin.DEMANDE)
        stub(m)
        connecte(user(2, "CHEF_CHANTIER"), projet(10))
        assertThrows(ForbiddenException::class.java) { service.annuler(1, null) }
        connecte(initiateur, projet(10))
        assertEquals(StatutMouvementEngin.ANNULE, service.annuler(1, null).statut)
    }

    @Test
    fun `annuler - transfert valide annulable par la logistique seule`() {
        val initiateur = user(9, "CHEF_CHANTIER")
        val m = mouvement(1, initiateur, projet(10), projet(20), StatutMouvementEngin.EN_ATTENTE_DEPART)
        stub(m)
        connecte(initiateur, projet(10))
        assertThrows(ForbiddenException::class.java) { service.annuler(1, null) }
        connecte(user(2, "LOGISTIQUE"))
        assertEquals(StatutMouvementEngin.ANNULE, service.annuler(1, null).statut)
    }

    // ── Photos de réserves de réception : même périmètre que receptionner ──

    @Test
    fun `photos reception - chef de chantier destination ok, en transit comme juste apres reception`() {
        val destination = projet(20)
        for (statut in listOf(StatutMouvementEngin.EN_TRANSIT, StatutMouvementEngin.RECU)) {
            stub(mouvement(1, user(9, "USER"), projet(10), destination, statut))
            connecte(user(2, "CHEF_CHANTIER"), destination)
            service.assertPeutJoindrePhotosReception(1) // ne lève pas
        }
    }

    @Test
    fun `photos reception - logistique ok`() {
        stub(mouvement(1, user(9, "USER"), projet(10), projet(20), StatutMouvementEngin.EN_TRANSIT))
        connecte(user(2, "LOGISTIQUE"))
        service.assertPeutJoindrePhotosReception(1)
    }

    @Test
    fun `photos reception - hors perimetre de reception = 404`() {
        val m = mouvement(1, user(9, "USER"), projet(10), projet(20), StatutMouvementEngin.EN_TRANSIT)
        stub(m)
        connecte(user(2, "CHEF_CHANTIER"), projet(30)) // affecté ailleurs
        assertThrows(ResourceNotFoundException::class.java) { service.assertPeutJoindrePhotosReception(1) }
        connecte(user(3, "CHEF_CHANTIER"), projet(10)) // origine : voit le transfert mais ne réceptionne pas
        assertThrows(ResourceNotFoundException::class.java) { service.assertPeutJoindrePhotosReception(1) }
    }

    @Test
    fun `photos reception - statut invalide = 400`() {
        val destination = projet(20)
        stub(mouvement(1, user(9, "USER"), projet(10), destination, StatutMouvementEngin.DEMANDE))
        connecte(user(2, "CHEF_CHANTIER"), destination)
        assertThrows(BadRequestException::class.java) { service.assertPeutJoindrePhotosReception(1) }
    }
}
