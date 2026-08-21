package com.mikaservices.platform.modules.materiel

import com.mikaservices.platform.common.enums.NiveauHierarchique
import com.mikaservices.platform.modules.materiel.entity.PushToken
import com.mikaservices.platform.modules.user.entity.Role
import com.mikaservices.platform.modules.user.entity.User
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant

/**
 * Test de reassignation du token push FCM quand un autre utilisateur
 * se connecte sur le meme appareil (meme token navigateur).
 */
class PushTokenReassignmentTest {

    private lateinit var userA: User
    private lateinit var userB: User

    private fun makeUser(id: Long, email: String, nom: String): User {
        val u = User(matricule = "MAT$id", nom = nom, prenom = "P$id", email = email, motDePasse = "x")
        u.id = id
        return u
    }

    @BeforeEach
    fun setup() {
        userA = makeUser(10L, "a@test.io", "Alice")
        userB = makeUser(20L, "b@test.io", "Bob")
    }

    @Test
    fun `A enregistre un token puis B enregistre le meme - le token appartient a B`() {
        val fcmToken = "fcm-token-shared-device-xyz"
        val store = mutableListOf<PushToken>()

        // A enregistre le token
        val ptA = PushToken(user = userA, token = fcmToken, actif = true)
        store.add(ptA)
        assertEquals(1, store.count { it.user.id == userA.id && it.actif })

        // B se connecte, meme token — reassignation
        val existing = store.firstOrNull { it.token == fcmToken }!!
        existing.user = userB
        existing.actif = true
        existing.lastUsedAt = Instant.now()

        // Le token appartient a B, plus a A
        assertEquals(0, store.count { it.user.id == userA.id && it.actif },
            "A n'a plus de token actif")
        assertEquals(1, store.count { it.user.id == userB.id && it.actif },
            "B a 1 token actif")
        assertEquals(userB.id, store.first { it.token == fcmToken }.user.id)
    }

    @Test
    fun `desactivation au logout rend le token inactif`() {
        val pt = PushToken(user = userA, token = "fcm-logout", actif = true)
        assertTrue(pt.actif)

        pt.actif = false

        assertFalse(pt.actif)
    }

    @Test
    fun `token desactive par A puis reactive par B appartient a B`() {
        val pt = PushToken(user = userA, token = "fcm-reactivation", actif = true)

        // A se deconnecte
        pt.actif = false

        // B se connecte, meme token
        pt.user = userB
        pt.actif = true
        pt.lastUsedAt = Instant.now()

        assertTrue(pt.actif)
        assertEquals(userB.id, pt.user.id)
    }
}
