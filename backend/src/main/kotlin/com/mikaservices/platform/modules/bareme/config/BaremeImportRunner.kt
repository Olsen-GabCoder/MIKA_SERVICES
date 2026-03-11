package com.mikaservices.platform.modules.bareme.config

import com.mikaservices.platform.modules.bareme.service.BaremeImportService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.FileInputStream

/**
 * Si la propriété bareme.import.path est définie et que le fichier existe,
 * lance l'import du barème au démarrage (peuplement automatique de la base).
 */
@Configuration
class BaremeImportRunner(
    private val baremeImportService: BaremeImportService
) {
    private val logger = LoggerFactory.getLogger(BaremeImportRunner::class.java)

    @Bean
    fun runBaremeImportIfConfigured(
        @Value("\${bareme.import.path:}") path: String
    ): ApplicationRunner {
        return ApplicationRunner {
            val trimmed = path.trim()
            if (trimmed.isEmpty()) return@ApplicationRunner
            val file = resolveFile(trimmed)
            if (file == null || !file.isFile) {
                logger.warn("Barème: fichier non trouvé (ignoré): $trimmed")
                return@ApplicationRunner
            }
            logger.info("Barème: import automatique depuis ${file.absolutePath}")
            try {
                FileInputStream(file).use { stream ->
                    val result = baremeImportService.importFromInputStream(stream)
                    logger.info("Barème: import terminé — ${result.coefficientsCount} coef, ${result.corpsEtatCount} corps d'état, ${result.fournisseursCount} fournisseurs, ${result.lignesCount} lignes")
                }
            } catch (e: Exception) {
                logger.error("Barème: échec de l'import", e)
            }
        }
    }

    private fun resolveFile(path: String): java.io.File? {
        val f1 = java.io.File(path)
        if (f1.isFile) return f1
        val userDir = System.getProperty("user.dir")
        val f2 = java.io.File(userDir, path)
        if (f2.isFile) return f2
        val f3 = java.io.File(userDir, path.replace("..${java.io.File.separator}", ""))
        if (f3.isFile) return f3
        val backendDir = java.io.File(userDir, "backend")
        val docsDir = backendDir.parent?.let { java.io.File(it, "docs") }
        val f4 = docsDir?.let { java.io.File(it, "BAREME DES PRIX BÂTIMENT AVEC SOUS DETAILS (Tout_Corps_d'Etat).xls") }
        if (f4 != null && f4.isFile) return f4
        val f5 = java.io.File(java.io.File(userDir, "docs"), "BAREME DES PRIX BÂTIMENT AVEC SOUS DETAILS (Tout_Corps_d'Etat).xls")
        return if (f5.isFile) f5 else null
    }
}
