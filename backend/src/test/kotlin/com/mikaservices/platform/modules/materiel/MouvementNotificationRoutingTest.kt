package com.mikaservices.platform.modules.materiel

import com.mikaservices.platform.common.enums.NiveauHierarchique
import com.mikaservices.platform.common.enums.TypeNotification
import com.mikaservices.platform.modules.communication.service.NotificationService
import com.mikaservices.platform.modules.materiel.event.MouvementNotificationEvent
import com.mikaservices.platform.modules.materiel.event.MouvementNotificationKind
import com.mikaservices.platform.modules.materiel.event.MouvementNotificationListener
import com.mikaservices.platform.modules.user.entity.Role
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito

/**
 * Verrou du routage des notifications de transfert (Phase 7, Batch 2).
 *
 * Règle métier (validée user) : le responsable projet EST le chef de projet ;
 * il n'existe pas de rôle « chef de chantier » distinct dans le routage.
 * On vérifie donc :
 *   1. Aucune diffusion globale findByRoleCode("CHEF_CHANTIER") (fuite corrigée).
 *   2. L'initiateur de la demande est destinataire à chaque étape post-validation.
 */
class MouvementNotificationRoutingTest {

    private lateinit var notificationService: NotificationService
    private lateinit var userRepository: UserRepository
    private lateinit var listener: MouvementNotificationListener

    private val notifies = mutableListOf<Long>()

    private val logistiqueId = 1L
    private val cpDestinationId = 2L
    private val initiateurId = 3L
    private val cpOrigineId = 10L
    private val chefChantierGlobalId = 99L

    /** Matcher any() compatible Kotlin : enregistre le matcher et renvoie null via cast effacé. */
    @Suppress("UNCHECKED_CAST")
    private fun <T> anyKt(): T {
        Mockito.any<T>()
        return null as T
    }

    private fun role(code: String) = Role(code = code, nom = code, niveau = NiveauHierarchique.EMPLOYE)

    private fun user(id: Long, roleCode: String): User {
        val u = User(matricule = "MAT$id", nom = "Nom$id", prenom = "Prenom$id", email = "u$id@test.io", motDePasse = "x")
        u.id = id
        u.roles = mutableSetOf(role(roleCode))
        return u
    }

    @BeforeEach
    fun setUp() {
        notificationService = Mockito.mock(NotificationService::class.java)
        userRepository = Mockito.mock(UserRepository::class.java)
        listener = MouvementNotificationListener(notificationService, userRepository)
        notifies.clear()

        Mockito.`when`(userRepository.findByRoleCode("LOGISTIQUE"))
            .thenReturn(listOf(user(logistiqueId, "LOGISTIQUE")))
        // Si le code diffusait encore à tous les chefs de chantier, ce mock alimenterait la fuite.
        Mockito.`when`(userRepository.findByRoleCode("CHEF_CHANTIER"))
            .thenReturn(listOf(user(chefChantierGlobalId, "CHEF_CHANTIER")))

        Mockito.doAnswer { inv ->
            notifies.add(inv.arguments[0] as Long)
            null
        }.`when`(notificationService).envoyerNotification(
            Mockito.anyLong(), anyKt(), anyKt(), anyKt<TypeNotification>(), anyKt(),
        )
    }

    private fun event(kind: MouvementNotificationKind) = MouvementNotificationEvent(
        kind = kind,
        mouvementId = 500L,
        enginCode = "ENG1",
        enginNom = "Pelle 20T",
        projetOrigineNom = "Chantier A",
        projetOrigineResponsableId = cpOrigineId,
        projetDestinationNom = "Chantier B",
        projetDestinationResponsableId = cpDestinationId,
        initiateurUserId = initiateurId,
    )

    @Test
    fun `depart confirme ne diffuse pas a tous les chefs de chantier`() {
        listener.onMouvementNotification(event(MouvementNotificationKind.DEPART_CONFIRME))

        assertEquals(setOf(cpDestinationId, initiateurId, logistiqueId), notifies.toSet())
        assertFalse(notifies.contains(chefChantierGlobalId), "aucune diffusion globale CHEF_CHANTIER")
        Mockito.verify(userRepository, Mockito.never()).findByRoleCode("CHEF_CHANTIER")
    }

    @Test
    fun `reception confirmee notifie logistique cp destination et initiateur`() {
        listener.onMouvementNotification(event(MouvementNotificationKind.RECEPTION_CONFIRMEE))

        assertEquals(setOf(logistiqueId, cpDestinationId, initiateurId), notifies.toSet())
    }

    @Test
    fun `reception avec reserves inclut l initiateur`() {
        listener.onMouvementNotification(event(MouvementNotificationKind.RECEPTION_AVEC_RESERVES))

        assertTrue(notifies.contains(initiateurId), "l'initiateur doit être alerté des réserves")
        assertEquals(setOf(logistiqueId, cpDestinationId, initiateurId), notifies.toSet())
    }

    @Test
    fun `annule inclut l initiateur et les deux responsables projet`() {
        listener.onMouvementNotification(event(MouvementNotificationKind.ANNULE))

        assertEquals(setOf(cpOrigineId, cpDestinationId, initiateurId), notifies.toSet())
    }

    @Test
    fun `ordre cree ne diffuse pas a tous les chefs de chantier`() {
        listener.onMouvementNotification(event(MouvementNotificationKind.ORDRE_CREE))

        assertEquals(setOf(cpOrigineId, cpDestinationId, initiateurId), notifies.toSet())
        Mockito.verify(userRepository, Mockito.never()).findByRoleCode("CHEF_CHANTIER")
    }
}
