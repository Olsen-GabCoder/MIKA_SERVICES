package com.mikaservices.platform.modules.materiel

import com.mikaservices.platform.common.enums.NiveauHierarchique
import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.StatutDemandeMateriel
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ForbiddenException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.chantier.entity.AffectationUtilisateurProjet
import com.mikaservices.platform.modules.chantier.repository.AffectationUtilisateurProjetRepository
import com.mikaservices.platform.modules.fournisseur.repository.CommandeRepository
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielCommentaireRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielLignePayload
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielRejetRequest
import com.mikaservices.platform.modules.materiel.entity.DemandeMateriel
import com.mikaservices.platform.modules.materiel.repository.DemandeMaterielRepository
import com.mikaservices.platform.modules.materiel.repository.MateriauRepository
import com.mikaservices.platform.modules.materiel.service.DemandeMaterielService
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
import org.mockito.ArgumentMatchers.anyString
import org.mockito.Mockito
import org.springframework.context.ApplicationEventPublisher
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional

/**
 * Matrice rôle × action × périmètre des DMA — CIRCUIT À UNE SEULE PORTE
 * (réforme 2026-08-20, docs/matrice-roles-perimetres.md §2.2) :
 * - create : affecté EN_COURS ou trio, statut toujours SOUMISE (plus de saut d'étape) ;
 * - SOUMISE = en attente logistique ; prendreEnCharge / rejeter = trio uniquement ;
 * - completer / livrer = créateur ou trio ; cloturer = trio ;
 * - lecture : trio = tout, sinon affectation EN_COURS ou créateur ; hors périmètre → 404 ;
 * - statuts EN_VALIDATION_* = legacy, lisibles mais plus aucune transition possible.
 */
class DemandeMaterielVisibiliteTest {

    private lateinit var demandeRepository: DemandeMaterielRepository
    private lateinit var projetRepository: ProjetRepository
    private lateinit var materiauRepository: MateriauRepository
    private lateinit var commandeRepository: CommandeRepository
    private lateinit var currentUserService: CurrentUserService
    private lateinit var eventPublisher: ApplicationEventPublisher
    private lateinit var affectationUtilisateurRepository: AffectationUtilisateurProjetRepository
    private lateinit var service: DemandeMaterielService

    private fun role(code: String) = Role(code = code, nom = code, niveau = NiveauHierarchique.EMPLOYE)

    private fun user(id: Long, vararg roleCodes: String): User {
        val u = User(matricule = "MAT$id", nom = "Nom$id", prenom = "Prenom$id", email = "u$id@test.io", motDePasse = "x")
        u.id = id
        u.roles = roleCodes.map { role(it) }.toMutableSet()
        return u
    }

    private fun projet(id: Long, responsableId: Long? = null): Projet {
        val p = Projet(codeProjet = "PRJ$id", nom = "Projet $id", type = com.mikaservices.platform.common.enums.TypeProjet.entries.first())
        p.id = id
        p.responsableProjetId = responsableId
        return p
    }

    private fun dma(id: Long, createur: User, projet: Projet, statut: StatutDemandeMateriel): DemandeMateriel {
        val d = DemandeMateriel(reference = "DMA-2026-%05d".format(id), projet = projet, createur = createur, statut = statut)
        d.id = id
        return d
    }

    private fun connecte(u: User, vararg projetsEnCours: Projet) {
        Mockito.`when`(currentUserService.getCurrentUser()).thenReturn(u)
        Mockito.`when`(
            affectationUtilisateurRepository.findByUserIdAndStatutIn(u.id!!, listOf(StatutAffectation.EN_COURS))
        ).thenReturn(projetsEnCours.map {
            AffectationUtilisateurProjet(user = u, projet = it, poste = "Poste", dateDebut = LocalDate.now())
        })
    }

    private fun stub(d: DemandeMateriel) {
        Mockito.`when`(demandeRepository.fetchWithBasicsById(d.id!!)).thenReturn(Optional.of(d))
    }

    private val ligne = DemandeMaterielLignePayload(designation = "Ciment", quantite = BigDecimal.TEN, unite = "sac")

    private fun createRequest(projetId: Long, dateSouhaitee: LocalDate? = null) =
        DemandeMaterielCreateRequest(projetId = projetId, lignes = listOf(ligne), dateSouhaitee = dateSouhaitee)

    @BeforeEach
    fun setUp() {
        demandeRepository = Mockito.mock(DemandeMaterielRepository::class.java)
        projetRepository = Mockito.mock(ProjetRepository::class.java)
        materiauRepository = Mockito.mock(MateriauRepository::class.java)
        commandeRepository = Mockito.mock(CommandeRepository::class.java)
        currentUserService = Mockito.mock(CurrentUserService::class.java)
        eventPublisher = Mockito.mock(ApplicationEventPublisher::class.java)
        affectationUtilisateurRepository = Mockito.mock(AffectationUtilisateurProjetRepository::class.java)
        service = DemandeMaterielService(
            demandeRepository, projetRepository, materiauRepository, commandeRepository,
            currentUserService, eventPublisher, affectationUtilisateurRepository,
            com.mikaservices.platform.modules.materiel.pdf.DemandeMaterielPdfGenerator(), // réel : la génération fait partie de la matrice
        )
        Mockito.`when`(demandeRepository.save(any(DemandeMateriel::class.java))).thenAnswer {
            val d = it.arguments[0] as DemandeMateriel
            if (d.id == null) d.id = 100L // publishDmaNotification exige un id (dma.id!!)
            d.lignes.forEachIndexed { i, l -> if (l.id == null) l.id = 100L + i } // mapper exige lignes.id!!
            d
        }
        Mockito.`when`(demandeRepository.existsByReference(anyString())).thenReturn(false)
    }

    // ── Détail / historique : périmètre en lecture, 404 hors périmètre ──

    @Test
    fun `detail - trio logistique-admin voit tout`() {
        val d = dma(1, user(9, "USER"), projet(10), StatutDemandeMateriel.PRISE_EN_CHARGE)
        stub(d)
        for (code in listOf("LOGISTIQUE", "ADMIN", "SUPER_ADMIN")) {
            connecte(user(2, code))
            assertEquals(1L, service.findById(1).id)
        }
    }

    @Test
    fun `detail - affecte EN_COURS et createur voient sur tout le cycle de vie`() {
        val chantier = projet(10, responsableId = 5)
        val createur = user(9, "USER")
        for (statut in listOf(StatutDemandeMateriel.SOUMISE, StatutDemandeMateriel.EN_COMMANDE, StatutDemandeMateriel.CLOTUREE)) {
            val d = dma(1, createur, chantier, statut)
            stub(d)
            connecte(user(2, "CHEF_CHANTIER"), chantier) // affecté
            assertEquals(1L, service.findById(1).id)
            connecte(createur) // créateur sans affectation
            assertEquals(1L, service.findById(1).id)
            // Responsable NON affecté = hors périmètre (responsable ⇒ affecté, par construction)
            connecte(user(5, "CHEF_PROJET"))
            assertThrows(ResourceNotFoundException::class.java) { service.findById(1) }
        }
    }

    @Test
    fun `detail et historique - hors perimetre = 404, meme en SOUMISE`() {
        val d = dma(1, user(9, "USER"), projet(10), StatutDemandeMateriel.SOUMISE)
        stub(d)
        connecte(user(2, "CHEF_CHANTIER"), projet(30)) // affecté ailleurs
        assertThrows(ResourceNotFoundException::class.java) { service.findById(1) }
        assertThrows(ResourceNotFoundException::class.java) { service.findHistorique(1) }
    }

    @Test
    fun `detail - DMA migree en statut legacy reste lisible (ancien circuit)`() {
        val chantier = projet(10)
        for (statut in listOf(StatutDemandeMateriel.EN_VALIDATION_CHANTIER, StatutDemandeMateriel.EN_VALIDATION_PROJET)) {
            stub(dma(1, user(9, "USER"), chantier, statut))
            connecte(user(2, "CHEF_CHANTIER"), chantier)
            assertEquals(1L, service.findById(1).id)
        }
    }

    // ── Create : périmètre + dateSouhaitee, statut TOUJOURS SOUMISE ──

    @Test
    fun `create - hors affectation refuse, sauf trio`() {
        val chantier = projet(10, responsableId = 5)
        Mockito.`when`(projetRepository.findById(10L)).thenReturn(Optional.of(chantier))
        connecte(user(2, "USER"), projet(30))
        assertThrows(ForbiddenException::class.java) { service.create(createRequest(10)) }
        connecte(user(3, "LOGISTIQUE"))
        assertEquals(StatutDemandeMateriel.SOUMISE, service.create(createRequest(10)).statut)
        // Responsable non affecté = refusé (le champ responsable ne donne plus de droits)
        connecte(user(5, "CHEF_PROJET"))
        assertThrows(ForbiddenException::class.java) { service.create(createRequest(10)) }
    }

    @Test
    fun `create - affecte au projet ok, nait SOUMISE (en attente logistique)`() {
        val chantier = projet(10)
        Mockito.`when`(projetRepository.findById(10L)).thenReturn(Optional.of(chantier))
        connecte(user(2, "USER"), chantier)
        assertEquals(StatutDemandeMateriel.SOUMISE, service.create(createRequest(10)).statut)
    }

    @Test
    fun `create - chef de chantier affecte nait aussi SOUMISE (plus de saut d'etape)`() {
        val chantier = projet(10)
        Mockito.`when`(projetRepository.findById(10L)).thenReturn(Optional.of(chantier))
        connecte(user(2, "CHEF_CHANTIER"), chantier)
        assertEquals(StatutDemandeMateriel.SOUMISE, service.create(createRequest(10)).statut)
        connecte(user(3, "CHEF_PROJET"), chantier)
        assertEquals(StatutDemandeMateriel.SOUMISE, service.create(createRequest(10)).statut)
    }

    @Test
    fun `create - date souhaitee passee refusee`() {
        val chantier = projet(10)
        Mockito.`when`(projetRepository.findById(10L)).thenReturn(Optional.of(chantier))
        connecte(user(2, "USER"), chantier)
        assertThrows(BadRequestException::class.java) {
            service.create(createRequest(10, dateSouhaitee = LocalDate.now().minusDays(1)))
        }
    }

    // ── prendreEnCharge : porte logistique unique ────────────────

    @Test
    fun `prendreEnCharge - trio ok depuis SOUMISE`() {
        val chantier = projet(10)
        for (code in listOf("LOGISTIQUE", "ADMIN", "SUPER_ADMIN")) {
            stub(dma(1, user(9, "USER"), chantier, StatutDemandeMateriel.SOUMISE))
            connecte(user(3, code))
            assertEquals(StatutDemandeMateriel.PRISE_EN_CHARGE, service.prendreEnCharge(1, null).statut)
        }
    }

    @Test
    fun `prendreEnCharge - non-trio refuse, meme affecte ou chef`() {
        val chantier = projet(10)
        stub(dma(1, user(9, "USER"), chantier, StatutDemandeMateriel.SOUMISE))
        for (code in listOf("USER", "CHEF_CHANTIER", "CHEF_PROJET")) {
            connecte(user(2, code), chantier)
            assertThrows(ForbiddenException::class.java) { service.prendreEnCharge(1, null) }
        }
    }

    @Test
    fun `prendreEnCharge - hors statut SOUMISE = 400 (y compris legacy)`() {
        connecte(user(3, "LOGISTIQUE"))
        for (statut in listOf(
            StatutDemandeMateriel.PRISE_EN_CHARGE,
            StatutDemandeMateriel.EN_VALIDATION_CHANTIER,
            StatutDemandeMateriel.EN_VALIDATION_PROJET,
        )) {
            stub(dma(1, user(9, "USER"), projet(10), statut))
            assertThrows(BadRequestException::class.java) { service.prendreEnCharge(1, null) }
        }
    }

    // ── rejeter : trio, depuis SOUMISE ou PRISE_EN_CHARGE, motif obligatoire ──

    @Test
    fun `rejeter - trio depuis SOUMISE et PRISE_EN_CHARGE`() {
        for (statut in listOf(StatutDemandeMateriel.SOUMISE, StatutDemandeMateriel.PRISE_EN_CHARGE)) {
            stub(dma(1, user(9, "USER"), projet(10), statut))
            connecte(user(3, "LOGISTIQUE"))
            assertEquals(StatutDemandeMateriel.REJETEE, service.rejeter(1, DemandeMaterielRejetRequest(commentaire = "Non justifié")).statut)
        }
    }

    @Test
    fun `rejeter - non-trio affecte 403, hors perimetre 404`() {
        val chantier = projet(10)
        stub(dma(1, user(9, "USER"), chantier, StatutDemandeMateriel.SOUMISE))
        connecte(user(2, "CHEF_CHANTIER"), chantier) // dans le périmètre mais pas trio
        assertThrows(ForbiddenException::class.java) { service.rejeter(1, DemandeMaterielRejetRequest(commentaire = "x")) }
        connecte(user(4, "CHEF_CHANTIER"), projet(30)) // hors périmètre : 404, jamais 403
        assertThrows(ResourceNotFoundException::class.java) { service.rejeter(1, DemandeMaterielRejetRequest(commentaire = "x")) }
    }

    @Test
    fun `rejeter - motif vide refuse, statut avance refuse`() {
        connecte(user(3, "LOGISTIQUE"))
        stub(dma(1, user(9, "USER"), projet(10), StatutDemandeMateriel.SOUMISE))
        assertThrows(BadRequestException::class.java) { service.rejeter(1, DemandeMaterielRejetRequest(commentaire = "  ")) }
        stub(dma(2, user(9, "USER"), projet(10), StatutDemandeMateriel.EN_COMMANDE))
        assertThrows(BadRequestException::class.java) { service.rejeter(2, DemandeMaterielRejetRequest(commentaire = "x")) }
    }

    // ── completer / livrer / cloturer ────────────────────────────

    @Test
    fun `completer - createur ou trio, tiers interdit`() {
        val chantier = projet(10)
        val createur = user(9, "USER")
        stub(dma(1, createur, chantier, StatutDemandeMateriel.EN_ATTENTE_COMPLEMENT))
        connecte(user(2, "CHEF_CHANTIER"), chantier) // dans le périmètre mais ni créateur ni trio
        assertThrows(ForbiddenException::class.java) { service.completer(1, null) }
        connecte(createur)
        assertEquals(StatutDemandeMateriel.PRISE_EN_CHARGE, service.completer(1, null).statut)
        stub(dma(2, createur, chantier, StatutDemandeMateriel.EN_ATTENTE_COMPLEMENT))
        connecte(user(3, "ADMIN"))
        assertEquals(StatutDemandeMateriel.PRISE_EN_CHARGE, service.completer(2, null).statut)
    }

    @Test
    fun `livrer - createur ou trio (ADMIN inclus), tiers interdit`() {
        val chantier = projet(10)
        val createur = user(9, "USER")
        stub(dma(1, createur, chantier, StatutDemandeMateriel.EN_COMMANDE))
        connecte(user(2, "CHEF_CHANTIER"), chantier)
        assertThrows(ForbiddenException::class.java) { service.livrer(1, null) }
        connecte(user(3, "ADMIN"))
        assertEquals(StatutDemandeMateriel.LIVRE, service.livrer(1, null).statut)
    }

    @Test
    fun `cloturer - reserve au trio`() {
        val chantier = projet(10)
        stub(dma(1, user(9, "USER"), chantier, StatutDemandeMateriel.LIVRE))
        connecte(user(2, "CHEF_CHANTIER"), chantier)
        assertThrows(ForbiddenException::class.java) { service.cloturer(1, null) }
        connecte(user(3, "LOGISTIQUE"))
        assertEquals(StatutDemandeMateriel.CLOTUREE, service.cloturer(1, DemandeMaterielCommentaireRequest(commentaire = "ok")).statut)
    }

    // ── Export PDF : même périmètre que le détail + tous les statuts ──

    @Test
    fun `pdf - createur, affecte et trio telechargent, PDF valide`() {
        val chantier = projet(10)
        val createur = user(9, "USER")
        val d = dma(1, createur, chantier, StatutDemandeMateriel.SOUMISE)
        stub(d)
        for (setup in listOf<() -> Unit>(
            { connecte(createur) },                          // créateur sans affectation
            { connecte(user(2, "CHEF_CHANTIER"), chantier) }, // affecté EN_COURS
            { connecte(user(3, "LOGISTIQUE")) },              // trio
        )) {
            setup()
            val (reference, pdf) = service.exportPdf(1)
            assertEquals("DMA-2026-00001", reference)
            assertEquals("%PDF", String(pdf, 0, 4)) // en-tête PDF valide
        }
    }

    @Test
    fun `pdf - hors perimetre = 404, jamais 403`() {
        stub(dma(1, user(9, "USER"), projet(10, responsableId = 5), StatutDemandeMateriel.SOUMISE))
        connecte(user(2, "CHEF_CHANTIER"), projet(30)) // affecté ailleurs
        assertThrows(ResourceNotFoundException::class.java) { service.exportPdf(1) }
        connecte(user(5, "CHEF_PROJET")) // responsable non affecté : le champ ne donne plus de droits
        assertThrows(ResourceNotFoundException::class.java) { service.exportPdf(1) }
    }

    @Test
    fun `pdf - genere pour tous les statuts, legacy inclus (visas ancien circuit lisibles)`() {
        val chantier = projet(10)
        connecte(user(3, "LOGISTIQUE"))
        for (statut in StatutDemandeMateriel.entries) {
            stub(dma(1, user(9, "USER"), chantier, statut))
            val (_, pdf) = service.exportPdf(1)
            assertEquals("%PDF", String(pdf, 0, 4), "PDF invalide pour $statut")
        }
    }

    // ── Cas limite : affectation terminée en cours de cycle ──────

    @Test
    fun `cas limite - affectation terminee - garde ses DMA creees, perd le reste`() {
        val chantier = projet(10)
        val u = user(2, "CHEF_CHANTIER")
        val sienne = dma(1, u, chantier, StatutDemandeMateriel.EN_COMMANDE)
        val autre = dma(2, user(9, "USER"), chantier, StatutDemandeMateriel.EN_COMMANDE)
        stub(sienne); stub(autre)
        connecte(u) // plus aucune affectation EN_COURS
        assertEquals(1L, service.findById(1).id)
        assertThrows(ResourceNotFoundException::class.java) { service.findById(2) }
    }
}
