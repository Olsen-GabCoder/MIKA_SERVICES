package com.mikaservices.platform.modules.chantier

import com.mikaservices.platform.common.enums.FamilleRoleProjet
import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.modules.chantier.dto.AffectationUtilisateurRequest
import com.mikaservices.platform.modules.chantier.dto.AffectationUtilisateurUpdateRequest
import com.mikaservices.platform.modules.chantier.entity.AffectationUtilisateurProjet
import com.mikaservices.platform.modules.chantier.repository.AffectationUtilisateurProjetRepository
import com.mikaservices.platform.modules.chantier.service.AffectationUtilisateurService
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.entity.RoleProjet
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.projet.repository.RoleProjetRepository
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.repository.UserRepository
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import java.time.LocalDate
import java.util.Optional

/**
 * Synchro de la dénormalisation projets.responsable_projet_id (matrice §4) :
 * la source de vérité est l'affectation EN_COURS dont le poste résout vers RP-CHEF-PROJET.
 * - affecter un chef → champ rempli ;
 * - terminer/annuler l'affectation chef → champ vidé ;
 * - idempotence (cas JARDIN BOTANIQUE : champ pré-rempli par le SQL) → aucun save projet ;
 * - affectation non-chef → responsable inchangé ;
 * - deux chefs EN_COURS simultanés → 409 (garde-fou).
 */
class AffectationResponsableSynchroTest {

    private lateinit var affectationRepository: AffectationUtilisateurProjetRepository
    private lateinit var userRepository: UserRepository
    private lateinit var projetRepository: ProjetRepository
    private lateinit var roleProjetRepository: RoleProjetRepository
    private lateinit var currentUserService: CurrentUserService
    private lateinit var service: AffectationUtilisateurService

    private val statutsOuverts = listOf(StatutAffectation.PLANIFIEE, StatutAffectation.EN_COURS)
    private val enCoursSeul = listOf(StatutAffectation.EN_COURS)

    private val posteChef = "Chef de projet"
    private val posteAutre = "Conducteur de travaux"

    private fun user(id: Long, nom: String = "Nom$id"): User {
        val u = User(matricule = "MAT$id", nom = nom, prenom = "Prenom$id", email = "u$id@test.io", motDePasse = "x")
        u.id = id
        return u
    }

    private fun projet(id: Long, responsable: User? = null): Projet {
        val p = Projet(codeProjet = "PRJ$id", nom = "Projet $id", type = TypeProjet.entries.first())
        p.id = id
        p.responsableProjet = responsable
        return p
    }

    private fun affectation(id: Long, u: User, p: Projet, poste: String,
                            statut: StatutAffectation = StatutAffectation.EN_COURS): AffectationUtilisateurProjet {
        val a = AffectationUtilisateurProjet(user = u, projet = p, poste = poste,
            dateDebut = LocalDate.of(2026, 1, 1), statut = statut)
        a.id = id
        return a
    }

    @BeforeEach
    fun setUp() {
        affectationRepository = Mockito.mock(AffectationUtilisateurProjetRepository::class.java)
        userRepository = Mockito.mock(UserRepository::class.java)
        projetRepository = Mockito.mock(ProjetRepository::class.java)
        roleProjetRepository = Mockito.mock(RoleProjetRepository::class.java)
        currentUserService = Mockito.mock(CurrentUserService::class.java)
        service = AffectationUtilisateurService(
            affectationRepository, userRepository, projetRepository, roleProjetRepository, currentUserService
        )

        // Admin partout pour ces tests (le scoping requireCanManage est couvert ailleurs)
        Mockito.`when`(currentUserService.canEditProjet(Mockito.any())).thenReturn(true)

        // Référentiel des rôles projet
        Mockito.`when`(roleProjetRepository.findFirstByNomIgnoreCaseAndActifTrue(posteChef))
            .thenReturn(RoleProjet(id = 1L, code = "RP-CHEF-PROJET", nom = posteChef,
                famille = FamilleRoleProjet.entries.first(), cumulable = true))
        Mockito.`when`(roleProjetRepository.findFirstByNomIgnoreCaseAndActifTrue(posteAutre))
            .thenReturn(RoleProjet(id = 2L, code = "RP-CONDUCTEUR-TRAVAUX", nom = posteAutre,
                famille = FamilleRoleProjet.entries.first(), cumulable = false))

        Mockito.`when`(affectationRepository.save(Mockito.any(AffectationUtilisateurProjet::class.java)))
            .thenAnswer {
                val a = it.arguments[0] as AffectationUtilisateurProjet
                if (a.id == null) a.id = 999L
                a
            }
    }

    @Test
    fun `affecter un chef de projet renseigne le responsable du projet`() {
        val gabriel = user(9L, "ONDO MVONO")
        val jardin = projet(40L, responsable = null)
        Mockito.`when`(userRepository.findById(9L)).thenReturn(Optional.of(gabriel))
        Mockito.`when`(projetRepository.findById(40L)).thenReturn(Optional.of(jardin))
        Mockito.`when`(affectationRepository.findByUserIdAndStatutIn(9L, statutsOuverts)).thenReturn(emptyList())
        Mockito.`when`(affectationRepository.findByProjetIdAndStatutIn(40L, statutsOuverts)).thenReturn(emptyList())
        Mockito.`when`(affectationRepository.findByProjetIdAndStatutIn(40L, enCoursSeul))
            .thenReturn(listOf(affectation(999L, gabriel, jardin, posteChef)))

        service.affecter(AffectationUtilisateurRequest(userId = 9L, projetId = 40L,
            poste = posteChef, dateDebut = LocalDate.of(2026, 1, 1)))

        assertEquals(9L, jardin.responsableProjet?.id)
        Mockito.verify(projetRepository).save(jardin)
    }

    @Test
    fun `idempotence - responsable deja pre-rempli par le SQL - aucun save projet`() {
        // Cas JARDIN BOTANIQUE : responsable = Gabriel (SQL) ET affectation chef EN_COURS existante
        val gabriel = user(9L)
        val jardin = projet(40L, responsable = gabriel)
        val existante = affectation(40L, gabriel, jardin, posteChef)
        Mockito.`when`(affectationRepository.findById(40L)).thenReturn(Optional.of(existante))
        Mockito.`when`(affectationRepository.findByUserIdAndStatutIn(9L, statutsOuverts)).thenReturn(listOf(existante))
        Mockito.`when`(affectationRepository.findByProjetIdAndStatutIn(40L, statutsOuverts)).thenReturn(listOf(existante))
        Mockito.`when`(affectationRepository.findByProjetIdAndStatutIn(40L, enCoursSeul)).thenReturn(listOf(existante))

        service.modifier(40L, AffectationUtilisateurUpdateRequest(poste = posteChef,
            dateDebut = LocalDate.of(2026, 1, 1), observations = "maj"))

        assertEquals(9L, jardin.responsableProjet?.id)
        Mockito.verify(projetRepository, Mockito.never()).save(Mockito.any(Projet::class.java))
    }

    @Test
    fun `terminer l affectation chef vide le responsable`() {
        val gabriel = user(9L)
        val jardin = projet(40L, responsable = gabriel)
        val existante = affectation(40L, gabriel, jardin, posteChef)
        Mockito.`when`(affectationRepository.findById(40L)).thenReturn(Optional.of(existante))
        // Après clôture, plus aucune affectation chef EN_COURS
        Mockito.`when`(affectationRepository.findByProjetIdAndStatutIn(40L, enCoursSeul)).thenReturn(emptyList())

        service.terminer(40L)

        assertNull(jardin.responsableProjet)
        Mockito.verify(projetRepository).save(jardin)
    }

    @Test
    fun `annuler l affectation chef vide le responsable`() {
        val gabriel = user(9L)
        val jardin = projet(40L, responsable = gabriel)
        val existante = affectation(40L, gabriel, jardin, posteChef)
        Mockito.`when`(affectationRepository.findById(40L)).thenReturn(Optional.of(existante))
        Mockito.`when`(affectationRepository.findByProjetIdAndStatutIn(40L, enCoursSeul)).thenReturn(emptyList())

        service.annuler(40L)

        assertNull(jardin.responsableProjet)
        Mockito.verify(projetRepository).save(jardin)
    }

    @Test
    fun `affecter un non-chef ne touche pas au responsable`() {
        val gabriel = user(9L)
        val olivier = user(10L)
        val jardin = projet(40L, responsable = gabriel)
        val chefEnCours = affectation(40L, gabriel, jardin, posteChef)
        Mockito.`when`(userRepository.findById(10L)).thenReturn(Optional.of(olivier))
        Mockito.`when`(projetRepository.findById(40L)).thenReturn(Optional.of(jardin))
        Mockito.`when`(affectationRepository.findByUserIdAndStatutIn(10L, statutsOuverts)).thenReturn(emptyList())
        Mockito.`when`(affectationRepository.findByProjetIdAndStatutIn(40L, enCoursSeul))
            .thenReturn(listOf(chefEnCours, affectation(999L, olivier, jardin, posteAutre)))

        service.affecter(AffectationUtilisateurRequest(userId = 10L, projetId = 40L,
            poste = posteAutre, dateDebut = LocalDate.of(2026, 2, 1)))

        assertEquals(9L, jardin.responsableProjet?.id)
        Mockito.verify(projetRepository, Mockito.never()).save(Mockito.any(Projet::class.java))
    }

    @Test
    fun `deux chefs EN_COURS simultanes - 409 et responsable inchange`() {
        val gabriel = user(9L)
        val olivier = user(10L)
        val jardin = projet(40L, responsable = gabriel)
        val chefEnCours = affectation(40L, gabriel, jardin, posteChef)
        Mockito.`when`(userRepository.findById(10L)).thenReturn(Optional.of(olivier))
        Mockito.`when`(projetRepository.findById(40L)).thenReturn(Optional.of(jardin))
        Mockito.`when`(affectationRepository.findByUserIdAndStatutIn(10L, statutsOuverts)).thenReturn(emptyList())
        Mockito.`when`(affectationRepository.findByProjetIdAndStatutIn(40L, statutsOuverts)).thenReturn(listOf(chefEnCours))

        assertThrows(ConflictException::class.java) {
            service.affecter(AffectationUtilisateurRequest(userId = 10L, projetId = 40L,
                poste = posteChef, dateDebut = LocalDate.of(2026, 2, 1)))
        }
        assertEquals(9L, jardin.responsableProjet?.id)
        Mockito.verify(projetRepository, Mockito.never()).save(Mockito.any(Projet::class.java))
    }
}
