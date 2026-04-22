package com.mikaservices.platform.modules.ia.service

import com.mikaservices.platform.common.enums.*
import com.mikaservices.platform.common.exception.AnthropicApiException
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.config.AnthropicProperties
import com.mikaservices.platform.modules.ia.dto.*
import com.mikaservices.platform.modules.ia.entity.AnalyseRapportLog
import com.mikaservices.platform.modules.ia.repository.AnalyseRapportLogRepository
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.repository.CAPrevisionnelRealiseRepository
import com.mikaservices.platform.modules.projet.repository.PointBloquantRepository
import com.mikaservices.platform.modules.projet.repository.PrevisionRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import jakarta.transaction.Transactional
import org.apache.poi.xwpf.usermodel.XWPFDocument
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import tools.jackson.databind.JsonNode
import java.math.BigDecimal
import java.security.MessageDigest
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.temporal.WeekFields
import java.util.*

@Service
class RapportAnalyseService(
    private val anthropicClient: AnthropicClientService,
    private val anthropicProperties: AnthropicProperties,
    private val projetRepository: ProjetRepository,
    private val caRepository: CAPrevisionnelRealiseRepository,
    private val previsionRepository: PrevisionRepository,
    private val pointBloquantRepository: PointBloquantRepository,
    private val analyseLogRepository: AnalyseRapportLogRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    companion object {
        const val MAX_FILE_SIZE = 10L * 1024 * 1024 // 10 MB
        const val MAX_TEXT_LENGTH = 20_000
        val SUPPORTED_EXTENSIONS = setOf("pdf", "docx", "xlsx", "xls", "jpg", "jpeg", "png")
        val IMAGE_EXTENSIONS = setOf("jpg", "jpeg", "png")
        val EXCEL_EXTENSIONS = setOf("xlsx", "xls")
    }

    @Transactional
    fun analyserRapport(projetId: Long, userId: Long, file: MultipartFile?, texte: String?): RapportAnalyseResponse {
        // Validation des entrées
        if (file == null && texte.isNullOrBlank()) {
            throw BadRequestException("Fournir un fichier ou un message texte")
        }

        val projet = projetRepository.findById(projetId)
            .orElseThrow { ResourceNotFoundException("Projet $projetId introuvable") }

        if (file != null) {
            validateFile(file)
        }
        if (texte != null && texte.length > MAX_TEXT_LENGTH) {
            throw BadRequestException("Le message ne doit pas dépasser $MAX_TEXT_LENGTH caractères")
        }

        // Préparer le contenu pour Claude
        val userContent = buildUserContent(file, texte)
        val contentHash = computeHash(file, texte)
        val formatSource = determineFormat(file)
        val tailleOctets = file?.size?.toInt() ?: texte?.toByteArray()?.size

        // Construire le prompt système avec contexte du projet
        val systemPrompt = buildSystemPrompt(projet)

        // Appel IA
        val startTime = System.currentTimeMillis()
        val (extractedJson, tokenUsage) = try {
            anthropicClient.callWithToolUse(systemPrompt, userContent, buildToolDefinition())
        } catch (e: AnthropicApiException) {
            logAnalyse(projetId, userId, startTime, 0, 0, false, e.errorCode, contentHash, formatSource, tailleOctets, 0)
            throw e
        }
        val dureeMs = (System.currentTimeMillis() - startTime).toInt()

        // Parser la réponse
        val response = parseExtraction(extractedJson)

        // Détecter les doublons
        val doublons = detecterDoublons(projetId, response)
        val responseWithDoublons = response.copy(doublons = doublons)

        // Logger
        logAnalyse(projetId, userId, startTime, tokenUsage.inputTokens, tokenUsage.outputTokens,
            true, null, contentHash, formatSource, tailleOctets, responseWithDoublons.champsExtraits.size)

        return responseWithDoublons
    }

    private fun validateFile(file: MultipartFile) {
        if (file.size > MAX_FILE_SIZE) {
            throw BadRequestException("Le rapport ne doit pas dépasser 10 MB")
        }
        val extension = file.originalFilename?.substringAfterLast('.')?.lowercase() ?: ""
        if (extension !in SUPPORTED_EXTENSIONS) {
            throw BadRequestException("Formats acceptés : .pdf, .docx, .xlsx, .xls, .jpg, .jpeg, .png")
        }
    }

    private fun buildUserContent(file: MultipartFile?, texte: String?): List<Map<String, Any>> {
        val content = mutableListOf<Map<String, Any>>()

        if (file != null) {
            val extension = file.originalFilename?.substringAfterLast('.')?.lowercase() ?: ""
            when {
                extension == "pdf" -> {
                    val base64 = Base64.getEncoder().encodeToString(file.bytes)
                    content.add(mapOf(
                        "type" to "document",
                        "source" to mapOf(
                            "type" to "base64",
                            "media_type" to "application/pdf",
                            "data" to base64
                        )
                    ))
                }
                extension == "docx" -> {
                    val extractedText = extractTextFromDocx(file)
                    content.add(mapOf(
                        "type" to "text",
                        "text" to extractedText
                    ))
                }
                extension in IMAGE_EXTENSIONS -> {
                    val base64 = Base64.getEncoder().encodeToString(file.bytes)
                    val mediaType = when (extension) {
                        "png" -> "image/png"
                        else -> "image/jpeg"
                    }
                    content.add(mapOf(
                        "type" to "image",
                        "source" to mapOf(
                            "type" to "base64",
                            "media_type" to mediaType,
                            "data" to base64
                        )
                    ))
                }
                extension in EXCEL_EXTENSIONS -> {
                    val extractedText = extractTextFromExcel(file)
                    content.add(mapOf(
                        "type" to "text",
                        "text" to "[Contenu du fichier Excel : ${file.originalFilename}]\n\n$extractedText"
                    ))
                }
            }
        }

        if (!texte.isNullOrBlank()) {
            content.add(mapOf(
                "type" to "text",
                "text" to texte
            ))
        }

        return content
    }

    private fun extractTextFromDocx(file: MultipartFile): String {
        file.inputStream.use { stream ->
            val document = XWPFDocument(stream)
            val sb = StringBuilder()
            document.paragraphs.forEach { paragraph ->
                val text = paragraph.text.trim()
                if (text.isNotEmpty()) {
                    sb.appendLine(text)
                }
            }
            document.tables.forEach { table ->
                table.rows.forEach { row ->
                    val cells = row.tableCells.joinToString(" | ") { it.text.trim() }
                    if (cells.isNotBlank()) {
                        sb.appendLine(cells)
                    }
                }
            }
            return sb.toString()
        }
    }

    private fun extractTextFromExcel(file: MultipartFile): String {
        file.inputStream.use { stream ->
            val workbook = org.apache.poi.ss.usermodel.WorkbookFactory.create(stream)
            val sb = StringBuilder()
            for (sheetIdx in 0 until workbook.numberOfSheets) {
                val sheet = workbook.getSheetAt(sheetIdx)
                val sheetName = sheet.sheetName
                if (workbook.numberOfSheets > 1) {
                    sb.appendLine("--- Feuille : $sheetName ---")
                }
                for (row in sheet) {
                    val cells = mutableListOf<String>()
                    for (cell in row) {
                        val value = when (cell.cellType) {
                            org.apache.poi.ss.usermodel.CellType.STRING -> cell.stringCellValue.trim()
                            org.apache.poi.ss.usermodel.CellType.NUMERIC -> {
                                if (org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(cell)) {
                                    cell.localDateTimeCellValue?.toLocalDate()?.toString() ?: ""
                                } else {
                                    val num = cell.numericCellValue
                                    if (num == num.toLong().toDouble()) num.toLong().toString() else num.toString()
                                }
                            }
                            org.apache.poi.ss.usermodel.CellType.BOOLEAN -> cell.booleanCellValue.toString()
                            org.apache.poi.ss.usermodel.CellType.FORMULA -> try { cell.stringCellValue } catch (_: Exception) { cell.numericCellValue.toString() }
                            else -> ""
                        }
                        cells.add(value)
                    }
                    val line = cells.joinToString(" | ").trim()
                    if (line.isNotBlank() && line != "|") {
                        sb.appendLine(line)
                    }
                }
            }
            workbook.close()
            return sb.toString().take(MAX_TEXT_LENGTH) // Limiter la taille
        }
    }

    private fun buildSystemPrompt(projet: Projet): String {
        val now = LocalDate.now()
        val weekFields = WeekFields.of(Locale.FRANCE)
        val currentWeek = now.get(weekFields.weekOfWeekBasedYear())
        val currentYear = now.get(weekFields.weekBasedYear())

        return """
Tu es un assistant spécialisé dans l'analyse de rapports de chantier BTP pour la plateforme MIKA Services.

## Ton rôle
Analyser le contenu fourni par le chef de projet et extraire TOUTES les informations de suivi exploitables, en utilisant le tool "extraire_suivi_projet". Tu dois raisonner comme un humain qui lit le document, pas comme un parseur qui coche des cases. Comprends ce que tu vois, déduis le contexte, restitue tout ce qui peut servir au suivi du chantier.

## Contexte du projet en cours
- Nom : ${projet.nom}
- Code : ${projet.codeProjet}
- Numéro de marché : ${projet.numeroMarche ?: "N/A"}
- Statut : ${projet.statut}
- Date début : ${projet.dateDebut ?: "N/A"}
- Date fin prévue : ${projet.dateFin ?: "N/A"}
- Montant HT : ${projet.montantHT ?: "N/A"} DH
- Semaine courante : S${currentWeek}/${currentYear}

## Format du contenu
Le contenu fourni peut être un rapport formel, un journal de chantier, une fiche de pointage, un email, un PV de réunion, un message conversationnel court, une photo de chantier, un tableau Excel, ou tout autre document lié au chantier. Traite tous ces formats de la même manière : extrais TOUT ce qui est exploitable.

## Instructions critiques pour les documents scannés et manuscrits
- Le document peut être un formulaire pré-imprimé rempli au stylo (bleu, noir, rouge). Lis attentivement le texte ÉCRIT À LA MAIN par-dessus les champs imprimés, pas uniquement les intitulés imprimés du formulaire vierge. Les notes manuscrites contiennent souvent les informations les plus importantes : tâches réellement exécutées, observations de dernière minute, commentaires du chef de chantier, ajouts en bas de page ou dans les marges.
- Le document peut être mal orienté (pivoté de 90°, 180° ou 270°, ou scanné tête-bêche). Si le texte semble à l'envers ou de côté, fais mentalement la rotation et lis quand même. N'abandonne JAMAIS sur un document mal orienté — un CDP sur le terrain scanne souvent rapidement avec son téléphone.
- Lis TOUT le document, de haut en bas et en entier — y compris les annotations manuscrites ajoutées hors des champs imprimés (bas de page, marges, espaces vides, recto ET verso). Ne suppose jamais qu'un document est vide ou peu informatif avant de l'avoir lu en entier dans toutes les orientations possibles.
- Si tu ne parviens pas à lire certaines parties (écriture illisible, tache, pli), signale-le dans les avertissements mais extrais tout ce que tu PEUX lire.

## Consignes d'extraction

### Suivi mensuel (CA)
- Identifie tout montant financier mentionné (chiffre d'affaires, facturation, décompte, situation de travaux, attachement)
- Distingue le CA prévisionnel (planifié, budgété) du CA réalisé (facturé, encaissé, constaté)
- Associe chaque montant au mois et à l'année correspondants
- Les montants sont en DH HT sauf indication contraire

### Prévisions (tâches planifiées)
- Extrais les tâches prévues pour la semaine en cours ou la semaine suivante
- Classe chaque tâche par type :
  - PRODUCTION : travaux physiques sur chantier (terrassement, coulage, ferraillage…)
  - APPROVISIONNEMENT : commandes, livraisons, réceptions de matériaux
  - RESSOURCES_HUMAINES : recrutement, affectation, déplacement de personnel
  - MATERIEL : engins, outillage, maintenance
  - HEBDOMADAIRE : tâche générique ou administrative
- Si un pourcentage d'avancement est mentionné pour une tâche, l'inclure
- Associe chaque tâche à la bonne semaine ISO et année

### Points bloquants
- Identifie tout problème, blocage, retard, difficulté, risque mentionné
- Identifie aussi les pannes matériel, absences critiques, retards fournisseur, intempéries bloquantes
- Évalue la priorité :
  - URGENTE : arrêt total du chantier ou danger immédiat
  - CRITIQUE : impact fort sur le délai global du projet
  - HAUTE : impact modéré, nécessite action rapide cette semaine
  - NORMALE : problème gérable sans urgence immédiate
  - BASSE : point de vigilance pour les semaines à venir
- Extrais l'action corrective si elle est mentionnée ou suggérée

### Avancement des études
- Si le contenu mentionne l'état d'études techniques, extraire :
  - Phase : APS, APD, EXE, GEOTECHNIQUE, HYDRAULIQUE, EIES, PAES
  - Pourcentage d'avancement
  - Statut de validation si mentionné

### Avancement global
- Extrais les pourcentages d'avancement physique, financier et de délai consommé s'ils sont mentionnés explicitement

### Besoins et observations
- Besoins matériel : engins, matériaux demandés — séparer par " • "
- Besoins humain : postes ou profils demandés — séparer par " • "
- Observations : constats généraux, remarques du chef de projet
- Propositions d'amélioration : suggestions mentionnées

### Extraction étendue dans "observations"
Peu importe la forme du document, si une information utile ne rentre dans aucun champ structuré ci-dessus, mets-la dans `observations` de manière ORGANISÉE avec des sous-sections. Notamment :
- **Personnel** : effectif présent/absent nominativement, pointage, heures
- **Matériel détaillé** : état de chaque engin (fonctionnel, en panne depuis X heures/jours, en maintenance), heures de fonctionnement
- **Météo** : conditions météo du jour si mentionnées
- **Horaires** : heures de début/fin effectives de travail
- **Sous-traitants** : entreprises présentes, effectifs, tâches réalisées
- **Visas/signatures** : qui a signé/visé le document
- **Travaux exécutés** : détail des travaux du jour (même si pas formulés comme "prévisions")
- **Sécurité** : observations sécurité, incidents évités, EPI
- **Approvisionnements** : livraisons reçues, matériaux consommés

## Avertissements
Remplis TOUJOURS le champ "avertissements" avec des messages concrets :
- Si une section attendue est absente ("Aucun CA mentionné")
- Si une information est ambiguë ("Montant 450 000 DH non attribué à un mois précis")
- Si le contenu ne semble pas lié au projet ("Le message mentionne un projet différent")
- Si le contenu est trop vague pour extraire des données utiles ("Information trop vague")
- Si certaines parties sont illisibles ("Écriture manuscrite partiellement illisible en bas de page")
- Si le document semble mal orienté ("Document scanné à l'envers — lecture après rotation mentale")

## Photos de chantier
Si le contenu inclut une image/photo :
- Analyse visuellement ce qui est visible (état des travaux, matériaux, engins, conditions)
- Estime l'avancement physique si le type de travaux est identifiable
- Signale tout problème visible (désordre, risque sécurité, défaut qualité) comme point bloquant potentiel
- Mets tes observations visuelles dans le champ "observations"
- Sois prudent dans tes estimations — indique clairement qu'il s'agit d'une estimation visuelle

## Fichiers Excel
Si le contenu provient d'un fichier Excel, identifie les colonnes et lignes pertinentes (montants, dates, pourcentages, tâches) et extrais les données structurées en conséquence.

## Règles impératives
1. MAXIMALISE l'extraction. Un document riche doit produire un champ "observations" riche et des champs structurés remplis au maximum. Ne laisse RIEN d'utile sur la table. Mieux vaut extraire trop (le CDP filtrera à la validation) que trop peu. Un journal de chantier d'une page doit produire une extraction dense.
2. N'INVENTE JAMAIS de données. Si une information n'est pas dans le contenu, ne la mets pas. Mais si elle Y EST, même partiellement lisible ou implicite, EXTRAIS-LA.
3. Tous les champs sauf "avertissements" sont optionnels — ne remplis que ce qui est explicitement mentionné ou clairement déductible.
4. En cas d'ambiguïté sur le classement, mets l'information dans "observations" plutôt que de la perdre.
5. Les descriptions doivent être concises mais fidèles au contenu original.
6. Pour les montants : ne convertis pas les devises, garde l'unité du contenu.
7. Pour les dates/semaines : déduis la semaine ISO à partir du contexte si non explicite.
8. Un message court = extraction courte. Ne compense jamais le manque d'information par de l'invention.
9. Pour les photos : base tes estimations uniquement sur ce qui est visuellement identifiable. Précise toujours que c'est une estimation visuelle.
        """.trimIndent()
    }

    private fun buildToolDefinition(): Map<String, Any> = mapOf(
        "name" to "extraire_suivi_projet",
        "description" to "Extrait les informations de suivi d'un rapport de chantier BTP. Ne remplir que les champs explicitement mentionnés.",
        "input_schema" to mapOf(
            "type" to "object",
            "properties" to mapOf(
                "suiviMensuel" to mapOf(
                    "type" to "array",
                    "description" to "Lignes de CA mensuel détectées",
                    "items" to mapOf(
                        "type" to "object",
                        "properties" to mapOf(
                            "mois" to mapOf("type" to "integer", "minimum" to 1, "maximum" to 12),
                            "annee" to mapOf("type" to "integer", "minimum" to 2000, "maximum" to 2100),
                            "caPrevisionnel" to mapOf("type" to "number", "description" to "CA prévu en DH HT"),
                            "caRealise" to mapOf("type" to "number", "description" to "CA réalisé en DH HT")
                        ),
                        "required" to listOf("mois", "annee")
                    )
                ),
                "previsions" to mapOf(
                    "type" to "array",
                    "description" to "Tâches planifiées pour la semaine en cours ou suivante",
                    "items" to mapOf(
                        "type" to "object",
                        "properties" to mapOf(
                            "description" to mapOf("type" to "string"),
                            "type" to mapOf("type" to "string", "enum" to listOf("PRODUCTION", "APPROVISIONNEMENT", "RESSOURCES_HUMAINES", "MATERIEL", "HEBDOMADAIRE")),
                            "semaine" to mapOf("type" to "integer", "minimum" to 1, "maximum" to 53),
                            "annee" to mapOf("type" to "integer"),
                            "avancementPct" to mapOf("type" to "integer", "minimum" to 0, "maximum" to 100)
                        ),
                        "required" to listOf("description", "type", "semaine", "annee")
                    )
                ),
                "pointsBloquants" to mapOf(
                    "type" to "array",
                    "description" to "Problèmes, blocages ou difficultés identifiés",
                    "items" to mapOf(
                        "type" to "object",
                        "properties" to mapOf(
                            "titre" to mapOf("type" to "string", "maxLength" to 200),
                            "description" to mapOf("type" to "string"),
                            "priorite" to mapOf("type" to "string", "enum" to listOf("BASSE", "NORMALE", "HAUTE", "CRITIQUE", "URGENTE")),
                            "actionCorrective" to mapOf("type" to "string")
                        ),
                        "required" to listOf("titre", "priorite")
                    )
                ),
                "avancementEtudes" to mapOf(
                    "type" to "array",
                    "items" to mapOf(
                        "type" to "object",
                        "properties" to mapOf(
                            "phase" to mapOf("type" to "string", "enum" to listOf("APS", "APD", "EXE", "GEOTECHNIQUE", "HYDRAULIQUE", "EIES", "PAES")),
                            "avancementPct" to mapOf("type" to "number", "minimum" to 0, "maximum" to 100),
                            "etatValidation" to mapOf("type" to "string", "enum" to listOf("NON_DEPOSE", "EN_ATTENTE", "EN_COURS", "VALIDE", "REFUSE"))
                        ),
                        "required" to listOf("phase")
                    )
                ),
                "avancementPhysiquePct" to mapOf("type" to "number", "minimum" to 0, "maximum" to 100),
                "avancementFinancierPct" to mapOf("type" to "number", "minimum" to 0, "maximum" to 100),
                "delaiConsommePct" to mapOf("type" to "number", "minimum" to 0, "maximum" to 100),
                "besoinsMateriel" to mapOf("type" to "string", "description" to "Séparés par ' • '"),
                "besoinsHumain" to mapOf("type" to "string", "description" to "Séparés par ' • '"),
                "observations" to mapOf("type" to "string"),
                "propositionsAmelioration" to mapOf("type" to "string"),
                "avertissements" to mapOf(
                    "type" to "array",
                    "description" to "Messages sur les informations manquantes, ambiguës ou non exploitables",
                    "items" to mapOf("type" to "string")
                )
            ),
            "required" to listOf("avertissements")
        )
    )

    private fun parseExtraction(json: JsonNode): RapportAnalyseResponse {
        val champsExtraits = mutableListOf<String>()

        val suiviMensuel = json.path("suiviMensuel").takeIf { !it.isMissingNode && it.size() > 0 }?.let { node ->
            champsExtraits.add("suiviMensuel")
            node.map { item ->
                SuiviMensuelExtrait(
                    mois = item.path("mois").asInt(),
                    annee = item.path("annee").asInt(),
                    caPrevisionnel = item.path("caPrevisionnel").takeIf { !it.isMissingNode && !it.isNull }?.let { BigDecimal(it.asText()) },
                    caRealise = item.path("caRealise").takeIf { !it.isMissingNode && !it.isNull }?.let { BigDecimal(it.asText()) }
                )
            }
        }

        val previsions = json.path("previsions").takeIf { !it.isMissingNode && it.size() > 0 }?.let { node ->
            champsExtraits.add("previsions")
            node.map { item ->
                PrevisionExtraite(
                    description = item.path("description").asText(),
                    type = TypePrevision.valueOf(item.path("type").asText()),
                    semaine = item.path("semaine").asInt(),
                    annee = item.path("annee").asInt(),
                    avancementPct = item.path("avancementPct").takeIf { !it.isMissingNode && !it.isNull }?.asInt()
                )
            }
        }

        val pointsBloquants = json.path("pointsBloquants").takeIf { !it.isMissingNode && it.size() > 0 }?.let { node ->
            champsExtraits.add("pointsBloquants")
            node.map { item ->
                PointBloquantExtrait(
                    titre = item.path("titre").asText(),
                    description = item.path("description").takeIf { !it.isMissingNode && !it.isNull }?.asText(),
                    priorite = Priorite.valueOf(item.path("priorite").asText()),
                    actionCorrective = item.path("actionCorrective").takeIf { !it.isMissingNode && !it.isNull }?.asText()
                )
            }
        }

        val avancementEtudes = json.path("avancementEtudes").takeIf { !it.isMissingNode && it.size() > 0 }?.let { node ->
            champsExtraits.add("avancementEtudes")
            node.map { item ->
                AvancementEtudeExtrait(
                    phase = PhaseEtude.valueOf(item.path("phase").asText()),
                    avancementPct = item.path("avancementPct").takeIf { !it.isMissingNode && !it.isNull }?.let { BigDecimal(it.asText()) },
                    etatValidation = item.path("etatValidation").takeIf { !it.isMissingNode && !it.isNull }?.asText()
                )
            }
        }

        val avancementPhysiquePct = json.path("avancementPhysiquePct").takeIf { !it.isMissingNode && !it.isNull }?.asDouble()
            ?.also { champsExtraits.add("avancementPhysiquePct") }
        val avancementFinancierPct = json.path("avancementFinancierPct").takeIf { !it.isMissingNode && !it.isNull }?.asDouble()
            ?.also { champsExtraits.add("avancementFinancierPct") }
        val delaiConsommePct = json.path("delaiConsommePct").takeIf { !it.isMissingNode && !it.isNull }?.asDouble()
            ?.also { champsExtraits.add("delaiConsommePct") }
        val besoinsMateriel = json.path("besoinsMateriel").takeIf { !it.isMissingNode && !it.isNull }?.asText()
            ?.also { champsExtraits.add("besoinsMateriel") }
        val besoinsHumain = json.path("besoinsHumain").takeIf { !it.isMissingNode && !it.isNull }?.asText()
            ?.also { champsExtraits.add("besoinsHumain") }
        val observations = json.path("observations").takeIf { !it.isMissingNode && !it.isNull }?.asText()
            ?.also { champsExtraits.add("observations") }
        val propositionsAmelioration = json.path("propositionsAmelioration").takeIf { !it.isMissingNode && !it.isNull }?.asText()
            ?.also { champsExtraits.add("propositionsAmelioration") }

        val avertissements = json.path("avertissements").takeIf { !it.isMissingNode }
            ?.map { it.asText() } ?: emptyList()

        return RapportAnalyseResponse(
            suiviMensuel = suiviMensuel,
            previsions = previsions,
            pointsBloquants = pointsBloquants,
            avancementEtudes = avancementEtudes,
            avancementPhysiquePct = avancementPhysiquePct,
            avancementFinancierPct = avancementFinancierPct,
            delaiConsommePct = delaiConsommePct,
            besoinsMateriel = besoinsMateriel,
            besoinsHumain = besoinsHumain,
            observations = observations,
            propositionsAmelioration = propositionsAmelioration,
            avertissements = avertissements,
            champsExtraits = champsExtraits,
            doublons = null
        )
    }

    private fun detecterDoublons(projetId: Long, response: RapportAnalyseResponse): DoublonsDetectes? {
        val doublonsCA = response.suiviMensuel?.mapNotNull { extrait ->
            caRepository.findByProjetIdAndMoisAndAnnee(projetId, extrait.mois, extrait.annee)
                .orElse(null)?.let { existing ->
                    DoublonCA(
                        mois = extrait.mois,
                        annee = extrait.annee,
                        caReelExistant = existing.caRealise,
                        caPrevisionnelExistant = existing.caPrevisionnel
                    )
                }
        }?.takeIf { it.isNotEmpty() }

        val doublonsPrevisions = response.previsions?.mapNotNull { extrait ->
            val existing = previsionRepository.findByProjetIdAndSemaineAndAnnee(projetId, extrait.semaine, extrait.annee)
            existing.firstOrNull { it.description?.contains(extrait.description.take(20), ignoreCase = true) == true }
                ?.let { match ->
                    DoublonPrevision(
                        previsionExistanteId = match.id ?: 0L,
                        descriptionExistante = match.description ?: "",
                        descriptionNouvelle = extrait.description,
                        semaine = extrait.semaine,
                        annee = extrait.annee
                    )
                }
        }?.takeIf { it.isNotEmpty() }

        val doublonsPB = response.pointsBloquants?.mapNotNull { extrait ->
            val openPBs = pointBloquantRepository.findByProjetIdAndStatut(projetId, StatutPointBloquant.OUVERT) +
                pointBloquantRepository.findByProjetIdAndStatut(projetId, StatutPointBloquant.EN_COURS)
            openPBs.firstOrNull { existing ->
                existing.titre.contains(extrait.titre.take(15), ignoreCase = true) ||
                    extrait.titre.contains(existing.titre.take(15), ignoreCase = true)
            }?.let { match ->
                DoublonPB(
                    pointBloquantExistantId = match.id ?: 0L,
                    titreExistant = match.titre,
                    titreNouveau = extrait.titre,
                    statutExistant = match.statut.name
                )
            }
        }?.takeIf { it.isNotEmpty() }

        return if (doublonsCA != null || doublonsPrevisions != null || doublonsPB != null) {
            DoublonsDetectes(doublonsCA, doublonsPrevisions, doublonsPB)
        } else null
    }

    private fun computeHash(file: MultipartFile?, texte: String?): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file?.bytes?.let { digest.update(it) }
        texte?.toByteArray()?.let { digest.update(it) }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun determineFormat(file: MultipartFile?): String {
        if (file != null) {
            return file.originalFilename?.substringAfterLast('.')?.uppercase() ?: "FICHIER"
        }
        return "TEXTE"
    }

    private fun logAnalyse(
        projetId: Long, userId: Long, startTimeMs: Long,
        tokensInput: Int, tokensOutput: Int,
        succes: Boolean, erreurCode: String?,
        hash: String, format: String, taille: Int?, nbChamps: Int
    ) {
        try {
            analyseLogRepository.save(AnalyseRapportLog(
                projetId = projetId,
                userId = userId,
                timestampDebut = LocalDateTime.now(),
                dureeMs = (System.currentTimeMillis() - startTimeMs).toInt(),
                modele = anthropicProperties.model,
                tokensInput = tokensInput,
                tokensOutput = tokensOutput,
                succes = succes,
                erreurCode = erreurCode,
                hashRapport = hash,
                formatSource = format,
                tailleOctets = taille,
                nbChampsExtraits = nbChamps
            ))
        } catch (e: Exception) {
            logger.error("Échec de log analyse_rapport_log: {}", e.message)
        }
    }
}
