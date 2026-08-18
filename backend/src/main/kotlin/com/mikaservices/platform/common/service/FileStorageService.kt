package com.mikaservices.platform.common.service

import com.cloudinary.Cloudinary
import com.cloudinary.utils.ObjectUtils
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.StandardCopyOption

/**
 * Service central de stockage de fichiers.
 *
 * - Si CLOUDINARY_URL est configurée : upload vers Cloudinary, l'identifiant persisté
 *   est l'URL sécurisée (https://res.cloudinary.com/...).
 * - Sinon : fallback disque local sous app.upload.dir (dev uniquement — le disque
 *   Render est éphémère), l'identifiant persisté est le chemin relatif.
 *
 * resolve() accepte les deux formats, ce qui garantit la compatibilité avec les
 * fichiers déjà stockés localement.
 */
@Service
class FileStorageService(
    @Value("\${app.upload.dir:uploads}") private val uploadDir: String,
    @Value("\${app.storage.cloudinary-url:}") private val cloudinaryUrl: String,
) {
    private val logger = LoggerFactory.getLogger(FileStorageService::class.java)

    private val cloudinary: Cloudinary? by lazy {
        if (cloudinaryUrl.isBlank()) {
            logger.warn("CLOUDINARY_URL non configurée — stockage sur disque local (éphémère en production)")
            null
        } else {
            Cloudinary(cloudinaryUrl).also { logger.info("Stockage Cloudinary actif (cloud: ${it.config.cloudName})") }
        }
    }

    val isCloudEnabled: Boolean get() = cloudinary != null

    /**
     * Stocke un fichier et retourne l'identifiant à persister en base :
     * URL Cloudinary complète, ou chemin relatif local en fallback.
     *
     * @param folder sous-dossier logique (engins, profil, messages, documents, qualite-documents)
     */
    fun store(file: MultipartFile, folder: String, filenameHint: String? = null): String {
        val cld = cloudinary
        if (cld != null) {
            val publicId = filenameHint?.substringBeforeLast('.')
                ?: "${System.currentTimeMillis()}_${(file.originalFilename ?: "fichier").substringBeforeLast('.').take(60)}"
            val result = cld.uploader().upload(
                file.bytes,
                ObjectUtils.asMap(
                    "folder", "mika-services/$folder",
                    "public_id", publicId,
                    "resource_type", "auto",
                    "overwrite", true,
                ),
            )
            val url = result["secure_url"] as String
            logger.info("Fichier uploadé sur Cloudinary: $url")
            return url
        }
        // Fallback disque local (dev)
        val base = Paths.get(uploadDir).toAbsolutePath().normalize()
        val dir = base.resolve(folder).normalize()
        if (!dir.startsWith(base)) throw IllegalArgumentException("Chemin de stockage invalide")
        Files.createDirectories(dir)
        val ext = (file.originalFilename ?: "").substringAfterLast('.', "")
            .takeIf { it.isNotBlank() }?.let { ".$it" } ?: ""
        val name = (filenameHint ?: "${System.currentTimeMillis()}${ext}").let {
            if (it.contains('.')) it else "$it$ext"
        }
        val target = dir.resolve(name).normalize()
        if (!target.startsWith(base)) throw IllegalArgumentException("Chemin de fichier invalide")
        Files.copy(file.inputStream, target, StandardCopyOption.REPLACE_EXISTING)
        return "$folder/$name"
    }

    /**
     * Résout un identifiant persistant en Resource téléchargeable.
     * Gère : URL Cloudinary (http/https), chemin relatif local, ou ancien chemin absolu.
     */
    fun resolve(stored: String?): Resource? {
        if (stored.isNullOrBlank()) return null
        if (stored.startsWith("http://") || stored.startsWith("https://")) {
            return UrlResource(stored)
        }
        val base = Paths.get(uploadDir).toAbsolutePath().normalize()
        val path = Paths.get(stored).let { if (it.isAbsolute) it else base.resolve(stored) }
            .toAbsolutePath().normalize()
        // Les chemins absolus historiques (cheminStockage) peuvent pointer hors de uploadDir
        if (!path.startsWith(base) && !Paths.get(stored).isAbsolute) return null
        if (!Files.exists(path)) return null
        return UrlResource(path.toUri())
    }

    /** Suppression best-effort (Cloudinary ou disque local). */
    fun delete(stored: String?) {
        if (stored.isNullOrBlank()) return
        try {
            if (stored.startsWith("http")) {
                val cld = cloudinary ?: return
                val publicId = extractPublicId(stored) ?: return
                // resource_type inconnu à ce stade : on tente image puis raw puis video
                for (type in listOf("image", "raw", "video")) {
                    val res = cld.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", type))
                    if (res["result"] == "ok") return
                }
            } else {
                val base = Paths.get(uploadDir).toAbsolutePath().normalize()
                val path = Paths.get(stored).let { if (it.isAbsolute) it else base.resolve(stored) }.normalize()
                Files.deleteIfExists(path)
            }
        } catch (e: Exception) {
            logger.warn("Impossible de supprimer le fichier: $stored", e)
        }
    }

    /**
     * Extrait le public_id d'une URL Cloudinary :
     * https://res.cloudinary.com/<cloud>/<type>/upload/v123/mika-services/engins/photo.jpg
     * → mika-services/engins/photo
     */
    private fun extractPublicId(url: String): String? {
        val afterUpload = url.substringAfter("/upload/", "").takeIf { it.isNotBlank() } ?: return null
        val withoutVersion = afterUpload.replace(Regex("^v\\d+/"), "")
        return withoutVersion.substringBeforeLast('.')
    }
}
