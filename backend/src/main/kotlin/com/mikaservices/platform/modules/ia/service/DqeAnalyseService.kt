package com.mikaservices.platform.modules.ia.service

import com.mikaservices.platform.common.exception.AnthropicApiException
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.config.AnthropicProperties
import com.mikaservices.platform.modules.ia.dto.DqeAnalyseResponse
import com.mikaservices.platform.modules.ia.dto.DqeChapitreExtrait
import com.mikaservices.platform.modules.ia.dto.DqeLigneExtraite
import com.mikaservices.platform.modules.ia.entity.AnalyseRapportLog
import com.mikaservices.platform.modules.ia.repository.AnalyseRapportLogRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import jakarta.transaction.Transactional
import org.apache.poi.xwpf.usermodel.XWPFDocument
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import tools.jackson.databind.JsonNode
import java.math.BigDecimal
import java.security.MessageDigest
import java.time.LocalDateTime
import java.util.*

@Service
class DqeAnalyseService(
    private val anthropicClient: AnthropicClientService,
    private val anthropicProperties: AnthropicProperties,
    private val projetRepository: ProjetRepository,
    private val analyseLogRepository: AnalyseRapportLogRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    companion object {
        const val MAX_FILE_SIZE = 10L * 1024 * 1024
        const val MAX_TEXT_LENGTH = 30_000
        val SUPPORTED_EXTENSIONS = setOf("pdf", "docx", "xlsx", "xls", "jpg", "jpeg", "png")
        val IMAGE_EXTENSIONS = setOf("jpg", "jpeg", "png")
        val EXCEL_EXTENSIONS = setOf("xlsx", "xls")
    }

    @Transactional
    fun analyserDqe(projetId: Long, userId: Long, file: MultipartFile?, texte: String?): DqeAnalyseResponse {
        if (file == null && texte.isNullOrBlank()) {
            throw BadRequestException("Fournir un fichier DQE ou un texte descriptif")
        }

        val projet = projetRepository.findById(projetId)
            .orElseThrow { ResourceNotFoundException("Projet $projetId introuvable") }

        if (file != null) validateFile(file)
        if (texte != null && texte.length > MAX_TEXT_LENGTH) {
            throw BadRequestException("Le texte ne doit pas dépasser $MAX_TEXT_LENGTH caractères")
        }

        val userContent = buildUserContent(file, texte)
        val contentHash = computeHash(file, texte)
        val formatSource = determineFormat(file)
        val tailleOctets = file?.size?.toInt() ?: texte?.toByteArray()?.size

        val systemPrompt = buildDqeSystemPrompt(projet.nom, projet.codeProjet, projet.numeroMarche)

        val startTime = System.currentTimeMillis()
        val (extractedJson, tokenUsage) = try {
            anthropicClient.callWithToolUse(systemPrompt, userContent, buildDqeToolDefinition())
        } catch (e: AnthropicApiException) {
            logAnalyse(projetId, userId, startTime, 0, 0, false, e.errorCode, contentHash, formatSource, tailleOctets, 0)
            throw e
        }
        val dureeMs = (System.currentTimeMillis() - startTime).toInt()

        val response = parseDqeExtraction(extractedJson)

        logAnalyse(projetId, userId, startTime, tokenUsage.inputTokens, tokenUsage.outputTokens,
            true, null, contentHash, formatSource, tailleOctets, response.champsExtraits)

        logger.info("DQE analysé pour projet {} : {} chapitres, {} lignes en {}ms",
            projetId, response.chapitres.size,
            response.chapitres.sumOf { it.lignes.size }, dureeMs)

        return response
    }

    // ── Prompt système spécialisé DQE ─────────────────────────────────

    private fun buildDqeSystemPrompt(nomProjet: String, codeProjet: String?, numeroMarche: String?): String = """
Tu es un assistant spécialisé dans l'extraction de Devis Quantitatifs et Estimatifs (DQE) pour des projets BTP.

## Ton rôle

Analyser le document fourni (Excel, PDF, image ou texte) et extraire la structure complète du DQE : chapitres et lignes avec tous les détails chiffrés. Tu dois utiliser le tool "extraire_dqe" pour retourner les données structurées.

## Contexte
- Projet : $nomProjet
- Code : ${codeProjet ?: "N/A"}
- Marché : ${numeroMarche ?: "N/A"}

## Structure d'un DQE BTP
Un DQE est organisé en **chapitres** (ex: 100 - Travaux Préparatoires, 200 - Terrassements) contenant des **lignes/postes** (ex: 101-1 Installation de chantier).

Chaque ligne a :
- Un numéro de poste (N° Prix)
- Une désignation (description du poste)
- Une unité (m², ml, m³, kg, U, FT, FF, t, l, etc.)
- Une quantité
- Un prix unitaire
- Un montant total (= quantité × prix unitaire, ou fourni directement)

## Instructions d'extraction

### Chapitres
- Identifie les chapitres par leurs numéros ronds (100, 200, 300...) ou par des en-têtes en gras/majuscules
- Un chapitre n'a PAS de montant propre, PAS de quantité, PAS d'unité — c'est un regroupement
- Si le document utilise des "lots" (LOT 1, LOT 2...), traite chaque lot comme un chapitre
- Les sous-totaux et totaux ne sont PAS des chapitres ni des lignes
- **IMPORTANT** : Si le document NE contient PAS de chapitres (juste une liste plate de postes), tu DOIS proposer une structure logique en chapitres. Regroupe les postes par nature des travaux (ex: Terrassements, Gros Œuvre, Chaussées, Assainissement, Équipements, etc.) en te basant sur les désignations des postes. Numérote les chapitres créés en centaines (100, 200, 300...). Ne mets JAMAIS toutes les lignes dans un seul chapitre fourre-tout.

### Lignes
- Extrais TOUTES les lignes avec leurs données chiffrées
- Si le montant total est fourni, utilise-le tel quel (ne recalcule pas)
- Si le montant n'est pas fourni mais quantité et PU existent, laisse montantTotal à null (le backend calculera)
- Les lignes "PM" (Pour Mémoire / Pris en Mémoire) doivent être incluses avec montantTotal = 0
- Ignore les lignes de total, sous-total, TVA, CSS, TTC — ce sont des agrégats, pas des postes
- Ignore les lignes vides ou sans désignation

### Formats de document
- **Excel** : les données sont en colonnes. Repère les en-têtes (N° Prix, Désignation, Unité, Qté, PU, Montant). Les chapitres sont souvent des lignes fusionnées ou en gras.
- **PDF** : peut être un tableau ou un document scanné. Lis attentivement les colonnes.
- **Image** : peut être une photo d'un DQE papier. Lis chaque ligne avec attention.
- **Texte** : peut être un copier-coller brut. Déduis la structure.

### Avertissements
Ajoute un avertissement si :
- Certaines valeurs sont illisibles ou ambiguës
- Le document semble incomplet
- Il y a des incohérences entre quantité × PU et le montant affiché
- Le format du document est inhabituel
""".trimIndent()

    // ── Définition du tool Claude ─────────────────────────────────────

    private fun buildDqeToolDefinition(): Map<String, Any> = mapOf(
        "name" to "extraire_dqe",
        "description" to "Extraire la structure complète d'un DQE (Devis Quantitatif et Estimatif) avec ses chapitres et lignes",
        "input_schema" to mapOf(
            "type" to "object",
            "required" to listOf("chapitres", "avertissements"),
            "properties" to mapOf(
                "chapitres" to mapOf(
                    "type" to "array",
                    "description" to "Liste des chapitres du DQE, dans l'ordre du document",
                    "items" to mapOf(
                        "type" to "object",
                        "required" to listOf("numero", "designation", "lignes"),
                        "properties" to mapOf(
                            "numero" to mapOf("type" to "string", "description" to "Numéro du chapitre (ex: 100, 200, LOT1)"),
                            "designation" to mapOf("type" to "string", "description" to "Titre/désignation du chapitre"),
                            "lignes" to mapOf(
                                "type" to "array",
                                "description" to "Postes/lignes du chapitre",
                                "items" to mapOf(
                                    "type" to "object",
                                    "required" to listOf("designation"),
                                    "properties" to mapOf(
                                        "numeroPoste" to mapOf("type" to "string", "description" to "Numéro du poste (N° Prix)"),
                                        "designation" to mapOf("type" to "string", "description" to "Désignation du poste"),
                                        "unite" to mapOf("type" to "string", "description" to "Unité de mesure (m², ml, U, FT, kg...)"),
                                        "quantite" to mapOf("type" to "number", "description" to "Quantité"),
                                        "prixUnitaire" to mapOf("type" to "number", "description" to "Prix unitaire HT"),
                                        "montantTotal" to mapOf("type" to "number", "description" to "Montant total HT (0 pour les lignes PM)")
                                    )
                                )
                            )
                        )
                    )
                ),
                "avertissements" to mapOf(
                    "type" to "array",
                    "description" to "Avertissements et remarques sur l'extraction",
                    "items" to mapOf("type" to "string")
                )
            )
        )
    )

    // ── Parsing de la réponse Claude ──────────────────────────────────

    private fun parseDqeExtraction(json: JsonNode): DqeAnalyseResponse {
        val avertissements: List<String> = json.path("avertissements")
            .toList()
            .map { it.asText() }
            .filter { it.isNotBlank() }

        val chapitres: List<DqeChapitreExtrait> = json.path("chapitres").toList().mapNotNull { chapNode ->
            val numero = chapNode.path("numero").asText("").trim()
            val designation = chapNode.path("designation").asText("").trim()
            if (designation.isBlank()) return@mapNotNull null

            val lignes = chapNode.path("lignes").toList().mapNotNull { ligneNode ->
                val desig = ligneNode.path("designation").asText("").trim()
                if (desig.isBlank()) return@mapNotNull null

                DqeLigneExtraite(
                    numeroPoste = ligneNode.path("numeroPoste").asText(null)?.trim()?.takeIf { it.isNotBlank() },
                    designation = desig,
                    unite = ligneNode.path("unite").asText(null)?.trim()?.takeIf { it.isNotBlank() },
                    quantite = ligneNode.path("quantite").takeIf { !it.isMissingNode && !it.isNull }?.let { BigDecimal(it.asText("0")) },
                    prixUnitaire = ligneNode.path("prixUnitaire").takeIf { !it.isMissingNode && !it.isNull }?.let { BigDecimal(it.asText("0")) },
                    montantTotal = ligneNode.path("montantTotal").takeIf { !it.isMissingNode && !it.isNull }?.let { BigDecimal(it.asText("0")) }
                )
            }

            DqeChapitreExtrait(
                numero = numero.ifBlank { "${json.path("chapitres").toList().indexOf(chapNode) * 100 + 100}" },
                designation = designation,
                lignes = lignes
            )
        }

        val totalLignes = chapitres.sumOf { it.lignes.size }

        return DqeAnalyseResponse(
            chapitres = chapitres,
            avertissements = avertissements,
            champsExtraits = totalLignes
        )
    }

    // ── Utilitaires (réutilisés du RapportAnalyseService) ─────────────

    private fun validateFile(file: MultipartFile) {
        if (file.size > MAX_FILE_SIZE) throw BadRequestException("Le fichier ne doit pas dépasser 10 MB")
        val ext = file.originalFilename?.substringAfterLast('.')?.lowercase() ?: ""
        if (ext !in SUPPORTED_EXTENSIONS) throw BadRequestException("Formats acceptés : .pdf, .docx, .xlsx, .xls, .jpg, .jpeg, .png")
    }

    private fun buildUserContent(file: MultipartFile?, texte: String?): List<Map<String, Any>> {
        val content = mutableListOf<Map<String, Any>>()
        if (file != null) {
            val ext = file.originalFilename?.substringAfterLast('.')?.lowercase() ?: ""
            when {
                ext == "pdf" -> content.add(mapOf("type" to "document", "source" to mapOf("type" to "base64", "media_type" to "application/pdf", "data" to Base64.getEncoder().encodeToString(file.bytes))))
                ext == "docx" -> content.add(mapOf("type" to "text", "text" to extractTextFromDocx(file)))
                ext in IMAGE_EXTENSIONS -> content.add(mapOf("type" to "image", "source" to mapOf("type" to "base64", "media_type" to if (ext == "png") "image/png" else "image/jpeg", "data" to Base64.getEncoder().encodeToString(file.bytes))))
                ext in EXCEL_EXTENSIONS -> content.add(mapOf("type" to "text", "text" to "[Contenu du fichier Excel DQE : ${file.originalFilename}]\n\n${extractTextFromExcel(file)}"))
            }
        }
        if (!texte.isNullOrBlank()) content.add(mapOf("type" to "text", "text" to texte))
        return content
    }

    private fun extractTextFromDocx(file: MultipartFile): String {
        file.inputStream.use { stream ->
            val doc = XWPFDocument(stream)
            val sb = StringBuilder()
            doc.paragraphs.forEach { p -> val t = p.text.trim(); if (t.isNotEmpty()) sb.appendLine(t) }
            doc.tables.forEach { table -> table.rows.forEach { row -> val cells = row.tableCells.joinToString(" | ") { it.text.trim() }; if (cells.isNotBlank()) sb.appendLine(cells) } }
            return sb.toString()
        }
    }

    private fun extractTextFromExcel(file: MultipartFile): String {
        file.inputStream.use { stream ->
            val workbook = org.apache.poi.ss.usermodel.WorkbookFactory.create(stream)
            val sb = StringBuilder()
            for (sheetIdx in 0 until workbook.numberOfSheets) {
                val sheet = workbook.getSheetAt(sheetIdx)
                if (workbook.numberOfSheets > 1) sb.appendLine("--- Feuille : ${sheet.sheetName} ---")
                for (row in sheet) {
                    val cells = mutableListOf<String>()
                    for (cell in row) {
                        val value = when (cell.cellType) {
                            org.apache.poi.ss.usermodel.CellType.STRING -> cell.stringCellValue.trim()
                            org.apache.poi.ss.usermodel.CellType.NUMERIC -> { val n = cell.numericCellValue; if (n == n.toLong().toDouble()) n.toLong().toString() else n.toString() }
                            org.apache.poi.ss.usermodel.CellType.BOOLEAN -> cell.booleanCellValue.toString()
                            org.apache.poi.ss.usermodel.CellType.FORMULA -> try { cell.stringCellValue } catch (_: Exception) { cell.numericCellValue.toString() }
                            else -> ""
                        }
                        cells.add(value)
                    }
                    val line = cells.joinToString(" | ").trim()
                    if (line.isNotBlank() && line != "|") sb.appendLine(line)
                }
            }
            workbook.close()
            return sb.toString().take(MAX_TEXT_LENGTH)
        }
    }

    private fun computeHash(file: MultipartFile?, texte: String?): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file?.bytes?.let { digest.update(it) }
        texte?.toByteArray()?.let { digest.update(it) }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun determineFormat(file: MultipartFile?): String =
        file?.originalFilename?.substringAfterLast('.')?.lowercase() ?: "texte"

    private fun logAnalyse(projetId: Long, userId: Long, startTime: Long, inputTokens: Int, outputTokens: Int,
                           success: Boolean, errorCode: String?, hash: String, format: String, taille: Int?, champsExtraits: Int) {
        try {
            analyseLogRepository.save(AnalyseRapportLog(
                projetId = projetId, userId = userId,
                timestampDebut = LocalDateTime.now().minusSeconds((System.currentTimeMillis() - startTime) / 1000),
                dureeMs = (System.currentTimeMillis() - startTime).toInt(),
                modele = anthropicProperties.model,
                tokensInput = inputTokens, tokensOutput = outputTokens,
                succes = success, erreurCode = errorCode,
                hashRapport = hash, formatSource = format,
                tailleOctets = taille, nbChampsExtraits = champsExtraits
            ))
        } catch (e: Exception) {
            logger.warn("Erreur lors du log d'analyse DQE: {}", e.message)
        }
    }
}
