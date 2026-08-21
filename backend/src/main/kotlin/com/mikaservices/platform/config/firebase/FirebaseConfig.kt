package com.mikaservices.platform.config.firebase

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import java.io.ByteArrayInputStream
import java.util.Base64

/**
 * Initialisation Firebase Admin SDK.
 *
 * Deux sources de credentials, par ordre de priorite :
 * 1. Variable d'environnement FIREBASE_CREDENTIALS_JSON (base64 du JSON service account)
 *    → utilisee en production (Render), le fichier n'est pas commite.
 * 2. Fichier classpath firebase-service-account.json → dev local.
 *
 * Si aucun des deux n'est present, Firebase n'est pas initialise et les push sont desactives
 * (l'app demarre quand meme).
 */
@Configuration
class FirebaseConfig(
    @Value("\${app.firebase.credentials-path:firebase-service-account.json}")
    private val credentialsPath: String,
    @Value("\${FIREBASE_CREDENTIALS_JSON:}")
    private val credentialsJson: String,
) {
    private val logger = LoggerFactory.getLogger(FirebaseConfig::class.java)

    @PostConstruct
    fun init() {
        if (FirebaseApp.getApps().isNotEmpty()) {
            logger.info("[Firebase] Deja initialise.")
            return
        }

        // 1. Variable d'environnement (prod Render) — base64 du JSON service account
        if (credentialsJson.isNotBlank()) {
            try {
                val json = try {
                    String(Base64.getDecoder().decode(credentialsJson))
                } catch (_: Exception) {
                    // Pas du base64 valide : essayer en texte brut (JSON direct)
                    credentialsJson
                }
                val options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(ByteArrayInputStream(json.toByteArray())))
                    .build()
                FirebaseApp.initializeApp(options)
                logger.info("[Firebase] Initialise via FIREBASE_CREDENTIALS_JSON (variable d'environnement)")
                return
            } catch (e: Exception) {
                logger.error("[Firebase] Erreur lecture FIREBASE_CREDENTIALS_JSON : ${e.message}")
            }
        }

        // 2. Fichier classpath (dev local)
        try {
            val resource = ClassPathResource(credentialsPath)
            if (!resource.exists()) {
                logger.warn("[Firebase] Ni FIREBASE_CREDENTIALS_JSON ni $credentialsPath — push notifications desactivees.")
                return
            }
            val options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(resource.inputStream))
                .build()
            FirebaseApp.initializeApp(options)
            logger.info("[Firebase] Initialise via fichier classpath ($credentialsPath)")
        } catch (e: Exception) {
            logger.error("[Firebase] Erreur initialisation fichier : ${e.message}")
        }
    }
}
