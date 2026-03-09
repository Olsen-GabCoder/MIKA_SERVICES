package com.mikaservices.platform.modules.projet.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.dto.response.AvancementEtudeProjetResponse
import com.mikaservices.platform.modules.projet.dto.response.CAPrevisionnelRealiseResponse
import com.mikaservices.platform.modules.projet.dto.response.PointBloquantResponse
import com.mikaservices.platform.modules.projet.dto.response.PrevisionResponse
import com.mikaservices.platform.modules.projet.dto.response.ProjetResponse
import com.mikaservices.platform.modules.projet.mapper.PointBloquantMapper
import com.mikaservices.platform.modules.projet.repository.PointBloquantRepository
import com.mikaservices.platform.modules.reporting.dto.response.ProjetReportResponse
import com.mikaservices.platform.modules.reporting.service.ReportingService
import org.apache.poi.ss.usermodel.FillPatternType
import org.apache.poi.ss.usermodel.HorizontalAlignment
import org.apache.poi.ss.usermodel.IndexedColors
import org.apache.poi.ss.usermodel.VerticalAlignment
import org.apache.poi.xssf.usermodel.XSSFCell
import org.apache.poi.xssf.usermodel.XSSFCellStyle
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.apache.poi.xwpf.usermodel.ParagraphAlignment
import org.apache.poi.xwpf.usermodel.XWPFDocument
import org.apache.poi.xwpf.usermodel.XWPFParagraph
import org.apache.poi.xwpf.usermodel.XWPFRun
import org.apache.poi.xwpf.usermodel.XWPFTable
import org.apache.poi.xwpf.usermodel.XWPFTableRow
import org.springframework.core.io.ByteArrayResource
import org.springframework.core.io.Resource
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.math.BigDecimal
import java.time.format.DateTimeFormatter
import java.util.Locale

@Service
class ProjetExportService(
    private val projetService: ProjetService,
    private val reportingService: ReportingService,
    private val pointBloquantRepository: PointBloquantRepository
) {

    private val dateFormat = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRANCE)
    private val numberFormat = java.text.NumberFormat.getNumberInstance(Locale.FRANCE)

    fun exportDocument(projetId: Long, format: String): Pair<Resource, String> {
        val projet = projetService.findById(projetId)
        val rapport = try { reportingService.getProjetReport(projetId) } catch (_: Exception) { null }
        val previsions = projetService.getPrevisions(projetId)
        val suiviMensuel = projetService.getSuiviMensuel(projetId)
        val avancementEtudes = projetService.getAvancementEtudes(projetId)
        val pointsBloquants = pointBloquantRepository.findByProjetId(projetId).map { PointBloquantMapper.toResponse(it) }

        val baseName = "projet-${projet.id}-${projet.nom.replace(Regex("[^a-zA-Z0-9-_]"), "-").take(40)}-${java.time.LocalDate.now()}"

        when (format.lowercase()) {
            "docx" -> {
                val bytes = buildWordDocument(projet, rapport, previsions, suiviMensuel, avancementEtudes, pointsBloquants)
                return Pair(ByteArrayResource(bytes), "$baseName.docx")
            }
            "xlsx" -> {
                val bytes = buildExcelWorkbook(projet, rapport, previsions, suiviMensuel, avancementEtudes, pointsBloquants)
                return Pair(ByteArrayResource(bytes), "$baseName.xlsx")
            }
            else -> throw ResourceNotFoundException("Format d'export non supporté: $format. Utilisez docx ou xlsx.")
        }
    }

    private fun fmtMontant(v: BigDecimal?): String = if (v == null || v == BigDecimal.ZERO) "—" else "${numberFormat.format(v)} XAF"
    private fun fmtDate(d: java.time.LocalDate?): String = d?.format(dateFormat) ?: "—"
    private fun fmt(s: String?): String = s?.takeIf { it.isNotBlank() } ?: "—"

    private fun buildWordDocument(
        projet: ProjetResponse,
        rapport: ProjetReportResponse?,
        previsions: List<PrevisionResponse>,
        suiviMensuel: List<CAPrevisionnelRealiseResponse>,
        avancementEtudes: List<AvancementEtudeProjetResponse>,
        pointsBloquants: List<PointBloquantResponse>
    ): ByteArray {
        val doc = XWPFDocument()

        // Titre principal
        val title = doc.createParagraph()
        title.alignment = ParagraphAlignment.CENTER
        val titleRun = title.createRun()
        titleRun.setText("DOCUMENT DE PROJET — MIKA SERVICES")
        titleRun.setBold(true)
        titleRun.setFontSize(18)
        titleRun.setFontFamily("Arial")

        val subtitle = doc.createParagraph()
        subtitle.alignment = ParagraphAlignment.CENTER
        val subRun = subtitle.createRun()
        subRun.setText("${fmt(projet.numeroMarche)} — ${projet.nom}")
        subRun.setFontSize(14)
        subRun.setFontFamily("Arial")
        subRun.setColor("1E40AF")

        addEmptyParagraph(doc)

        // 1. Informations contractuelles
        addSectionTitle(doc, "1. Informations contractuelles")
        val table1 = doc.createTable()
        table1.width = 9635 // largeur en twips (~100 % page A4)
        addTableRow(table1, "Montant marché (HT)", fmtMontant(projet.montantHT))
        addTableRow(table1, "Montant TTC", fmtMontant(projet.montantTTC))
        addTableRow(table1, "Délai", projet.delaiMois?.let { "$it mois" } ?: "—")
        addTableRow(table1, "Date de début", fmtDate(projet.dateDebut))
        addTableRow(table1, "Date de fin", fmtDate(projet.dateFin))
        addTableRow(table1, "Date début réelle", fmtDate(projet.dateDebutReel))
        addTableRow(table1, "Date fin réelle", fmtDate(projet.dateFinReelle))
        addTableRow(table1, "Source de financement", fmt(projet.sourceFinancement?.name?.replace("_", " ")))
        addEmptyParagraph(doc)

        // 2. Tableau de suivi mensuel
        addSectionTitle(doc, "2. Tableau de suivi mensuel")
        if (suiviMensuel.isEmpty()) {
            addParagraph(doc, "Aucune donnée de suivi mensuel renseignée. Définir les dates de début et de fin du projet et renseigner le CA prévisionnel et réalisé via le module Budget.")
        } else {
            val tableCA = doc.createTable()
            tableCA.width = 9635
            val headerRow = tableCA.getRow(0)
            headerRow.getCell(0).setText("Mois")
            headerRow.addNewTableCell().setText("CA prévisionnel")
            headerRow.addNewTableCell().setText("CA réalisé")
            headerRow.addNewTableCell().setText("Écart")
            headerRow.addNewTableCell().setText("Avancement cumulé %")
            suiviMensuel.forEach { ligne ->
                val r = tableCA.createRow()
                r.getCell(0).setText("${ligne.mois}/${ligne.annee}")
                r.addNewTableCell().setText(fmtMontant(ligne.caPrevisionnel))
                r.addNewTableCell().setText(fmtMontant(ligne.caRealise))
                r.addNewTableCell().setText(fmtMontant(ligne.ecart))
                r.addNewTableCell().setText("${ligne.avancementCumule} %")
            }
            addParagraph(doc, "Budget total prévu : ${fmtMontant(rapport?.budget?.budgetTotalPrevu ?: projet.montantHT)} — Dépenses réalisées : ${fmtMontant(rapport?.budget?.depensesTotales)}.")
        }
        addEmptyParagraph(doc)

        // 3. État d'avancement des études
        addSectionTitle(doc, "3. État d'avancement des études")
        val phases = listOf("APS", "APD", "EXE", "GEOTECHNIQUE", "HYDRAULIQUE", "EIES", "PAES")
        val tableEtudes = doc.createTable()
        tableEtudes.width = 9635
        val hEtudes = tableEtudes.getRow(0)
        hEtudes.getCell(0).setText("Phase")
        hEtudes.addNewTableCell().setText("Avancement %")
        hEtudes.addNewTableCell().setText("Dépôt à l'administration")
        hEtudes.addNewTableCell().setText("État de validation")
        val etudesByPhase = avancementEtudes.associateBy { it.phase.name }
        phases.forEach { phase ->
            val e = etudesByPhase[phase]
            val row = tableEtudes.createRow()
            row.getCell(0).setText(phase.replace("_", " "))
            row.addNewTableCell().setText(if (e?.avancementPct != null) "${e.avancementPct} %" else "—")
            row.addNewTableCell().setText(fmtDate(e?.dateDepot))
            row.addNewTableCell().setText(fmt(e?.etatValidation))
        }
        addEmptyParagraph(doc)

        // 4. Avancement des travaux
        val now = java.time.LocalDate.now()
        val weekFields = java.time.temporal.WeekFields.ISO
        val semaineCalendaire = now.get(weekFields.weekOfWeekBasedYear())
        val anneeCalendaire = now.year
        val semaineSuivante = if (semaineCalendaire < 53) semaineCalendaire + 1 else 1
        val anneeSuivante = if (semaineCalendaire < 53) anneeCalendaire else anneeCalendaire + 1
        val tachesRealiseSemaine = previsions.filter { it.semaine == semaineCalendaire && it.annee == anneeCalendaire }
        val tachesPrevuesSuivante = previsions.filter { it.semaine == semaineSuivante && it.annee == anneeSuivante }
        val avancementsRealise = tachesRealiseSemaine.mapNotNull { it.avancementPct }
        val globalPct = if (avancementsRealise.isNotEmpty()) Math.round(avancementsRealise.sum().toDouble() / avancementsRealise.size * 100.0) / 100.0 else null

        addSectionTitle(doc, "4. Avancement des travaux — Semaine $semaineCalendaire ($anneeCalendaire)")
        if (globalPct != null) addParagraph(doc, "Taux d'avancement : $globalPct %", bold = true)

        addSubtitle(doc, "4.1 Réalisé — Semaine $semaineCalendaire ($anneeCalendaire)")
        if (tachesRealiseSemaine.isEmpty()) addParagraph(doc, "Aucune tâche enregistrée pour la semaine en cours.")
        else tachesRealiseSemaine.forEach { p ->
            val pct = if (p.avancementPct != null) " — ${p.avancementPct} %" else ""
            addParagraph(doc, "${fmt(p.description)}$pct")
        }

        addSubtitle(doc, "4.2 Prévisions — Semaine $semaineSuivante ($anneeSuivante)")
        if (tachesPrevuesSuivante.isEmpty()) addParagraph(doc, "Aucune tâche planifiée pour la semaine prochaine.")
        else tachesPrevuesSuivante.forEach { p ->
            addParagraph(doc, fmt(p.description))
        }

        addSubtitle(doc, "4.3 Points bloquants")
        if (pointsBloquants.isEmpty()) addParagraph(doc, "Aucun point bloquant.")
        else pointsBloquants.forEach { pb ->
            addParagraph(doc, "${pb.titre} — ${fmt(pb.description)} (Priorité : ${pb.priorite}, Statut : ${pb.statut}, Détecté le : ${fmtDate(pb.dateDetection)})")
        }
        addSubtitle(doc, "4.4 Besoins matériels")
        addParagraph(doc, fmt(projet.besoinsMateriel))
        addSubtitle(doc, "4.5 Besoins humains")
        addParagraph(doc, fmt(projet.besoinsHumain))
        addEmptyParagraph(doc)

        // 5. Description, observations et propositions
        addSectionTitle(doc, "5. Description, observations et propositions d'amélioration")
        addParagraph(doc, "Description : ${fmt(projet.description)}")
        addParagraph(doc, "Observations : ${fmt(projet.observations)}")
        addParagraph(doc, "Propositions d'amélioration : ${fmt(projet.propositionsAmelioration)}")
        addEmptyParagraph(doc)

        // Synthèse et indicateurs
        addSectionTitle(doc, "Synthèse projet")
        addParagraph(doc, "Type(s) : ${projet.types.joinToString(" | ") { it.name.replace("_", " ") }} | Sous-projets : ${projet.nombreSousProjets} | Points bloquants ouverts : ${projet.nombrePointsBloquantsOuverts} | Délai consommé : ${projet.delaiConsommePct?.toString() ?: "—"} % | Partenaire principal : ${fmt(projet.partenairePrincipal)}")
        rapport?.let {
            addParagraph(doc, "Indicateurs : Tâches en retard : ${it.planning.tachesEnRetard} | Risques critiques : ${it.securite.risquesCritiques} | Budget (écart) : ${fmtMontant(it.budget.ecart)}")
        }
        addEmptyParagraph(doc)

        // Client, chef de projet, localisation
        addSubtitle(doc, "Client")
        projet.client?.let { c -> addParagraph(doc, "${c.nom} — ${c.type.name.replace("_", " ")}${c.contactPrincipal?.let { " | Contact : $it" } ?: ""}") } ?: addParagraph(doc, "—")
        addSubtitle(doc, "Chef de projet")
        projet.responsableProjet?.let { r -> addParagraph(doc, "${r.prenom} ${r.nom} — ${r.email}") } ?: addParagraph(doc, "—")
        addSubtitle(doc, "Localisation")
        addParagraph(doc, listOf(projet.province, projet.ville, projet.quartier).filterNotNull().joinToString(" · ").ifBlank { "—" })

        addEmptyParagraph(doc)
        val footer = doc.createParagraph()
        footer.alignment = ParagraphAlignment.CENTER
        val footerRun = footer.createRun()
        footerRun.setText("Document généré le ${java.time.LocalDate.now().format(dateFormat)} — Mika Services — Confidentiel")
        footerRun.setFontSize(8)
        footerRun.setColor("6B7280")

        val out = ByteArrayOutputStream()
        doc.write(out)
        doc.close()
        return out.toByteArray()
    }

    private fun addSectionTitle(doc: XWPFDocument, text: String) {
        val p = doc.createParagraph()
        val run = p.createRun()
        run.setText(text)
        run.setBold(true)
        run.setFontSize(12)
        run.setFontFamily("Arial")
        run.setColor("1E40AF")
    }

    private fun addSubtitle(doc: XWPFDocument, text: String) {
        val p = doc.createParagraph()
        p.setSpacingBefore(120)
        val run = p.createRun()
        run.setText(text)
        run.setBold(true)
        run.setFontSize(10)
        run.setFontFamily("Arial")
    }

    private fun addParagraph(doc: XWPFDocument, text: String, bold: Boolean = false) {
        val p = doc.createParagraph()
        val run = p.createRun()
        run.setText(text)
        run.setBold(bold)
        run.setFontSize(10)
        run.setFontFamily("Arial")
    }

    private fun addEmptyParagraph(doc: XWPFDocument) {
        doc.createParagraph()
    }

    private fun addTableRow(table: XWPFTable, label: String, value: String) {
        val row = if (table.rows.size == 1 && table.getRow(0).tableCells.size == 1) table.getRow(0) else table.createRow()
        if (row.tableCells.size < 2) row.addNewTableCell()
        row.getCell(0).setText(label)
        row.getCell(1).setText(value)
    }

    private fun buildExcelWorkbook(
        projet: ProjetResponse,
        rapport: ProjetReportResponse?,
        previsions: List<PrevisionResponse>,
        suiviMensuel: List<CAPrevisionnelRealiseResponse>,
        avancementEtudes: List<AvancementEtudeProjetResponse>,
        pointsBloquants: List<PointBloquantResponse>
    ): ByteArray {
        val wb = XSSFWorkbook()
        val headerStyle = wb.createCellStyle().apply {
            fillForegroundColor = IndexedColors.DARK_BLUE.getIndex()
            setFillPattern(FillPatternType.SOLID_FOREGROUND)
            alignment = HorizontalAlignment.CENTER
            verticalAlignment = VerticalAlignment.CENTER
        }
        val headerFont = wb.createFont().apply { setBold(true); setColor(IndexedColors.WHITE.getIndex()) }
        headerStyle.setFont(headerFont)

        // Feuille 1 : Identification
        val shId = wb.createSheet("Identification")
        var rowNum = 0
        shId.createRow(rowNum++).apply { createCell(0).setCellValue("Champ"); getCell(0).cellStyle = headerStyle; createCell(1).setCellValue("Valeur"); getCell(1).cellStyle = headerStyle }
        listOf(
            "N° Marché" to fmt(projet.numeroMarche),
            "Nom" to projet.nom,
            "Type(s)" to projet.types.joinToString(" | ") { it.name.replace("_", " ") },
            "Statut" to projet.statut.name.replace("_", " "),
            "Montant HT" to fmtMontant(projet.montantHT),
            "Montant TTC" to fmtMontant(projet.montantTTC),
            "Délai (mois)" to (projet.delaiMois?.toString() ?: "—"),
            "Date début" to fmtDate(projet.dateDebut),
            "Date fin" to fmtDate(projet.dateFin),
            "Taux d'avancement %" to projet.avancementGlobal.toString(),
            "Source financement" to fmt(projet.sourceFinancement?.name?.replace("_", " ")),
            "Partenaire principal" to fmt(projet.partenairePrincipal),
            "Client" to (projet.client?.nom ?: "—"),
            "Chef de projet" to (projet.responsableProjet?.let { "${it.prenom} ${it.nom}" } ?: "—"),
            "Localisation" to listOf(projet.province, projet.ville, projet.quartier).filterNotNull().joinToString(" · ").ifBlank { "—" },
        ).forEach { (k, v) ->
            shId.createRow(rowNum++).apply { createCell(0).setCellValue(k); createCell(1).setCellValue(v) }
        }

        // Feuille 2 : Suivi mensuel
        val shCA = wb.createSheet("Suivi mensuel")
        rowNum = 0
        val rowHeaderCA = shCA.createRow(rowNum++)
        listOf("Mois", "Année", "CA prévisionnel", "CA réalisé", "Écart", "Avancement cumulé %").forEachIndexed { i, h ->
            rowHeaderCA.createCell(i).setCellValue(h)
            rowHeaderCA.getCell(i).cellStyle = headerStyle
        }
        suiviMensuel.forEach { ligne ->
            val row = shCA.createRow(rowNum++)
            row.createCell(0).setCellValue(ligne.mois.toDouble())
            row.createCell(1).setCellValue(ligne.annee.toDouble())
            row.createCell(2).setCellValue(ligne.caPrevisionnel.toDouble())
            row.createCell(3).setCellValue(ligne.caRealise.toDouble())
            row.createCell(4).setCellValue(ligne.ecart.toDouble())
            row.createCell(5).setCellValue(ligne.avancementCumule.toDouble())
        }
        if (suiviMensuel.isEmpty()) shCA.createRow(rowNum).apply { createCell(0).setCellValue("Aucune donnée") }

        // Feuille 3 : Études
        val shEtudes = wb.createSheet("Avancement études")
        rowNum = 0
        val rowHeaderE = shEtudes.createRow(rowNum++)
        listOf("Phase", "Avancement %", "Dépôt", "État validation").forEachIndexed { i, h ->
            rowHeaderE.createCell(i).setCellValue(h)
            rowHeaderE.getCell(i).cellStyle = headerStyle
        }
        val phases = listOf("APS", "APD", "EXE", "GEOTECHNIQUE", "HYDRAULIQUE", "EIES", "PAES")
        val etudesByPhase = avancementEtudes.associateBy { it.phase.name }
        phases.forEach { phase ->
            val e = etudesByPhase[phase]
            val row = shEtudes.createRow(rowNum++)
            row.createCell(0).setCellValue(phase.replace("_", " "))
            row.createCell(1).setCellValue(e?.avancementPct?.toDouble() ?: 0.0)
            row.createCell(2).setCellValue(fmtDate(e?.dateDepot))
            row.createCell(3).setCellValue(fmt(e?.etatValidation))
        }

        // Feuille 4 : Réalisé semaine en cours
        val nowXls = java.time.LocalDate.now()
        val weekFieldsXls = java.time.temporal.WeekFields.ISO
        val semaineXls = nowXls.get(weekFieldsXls.weekOfWeekBasedYear())
        val anneeXls = nowXls.year
        val semaineSuivanteXls = if (semaineXls < 53) semaineXls + 1 else 1
        val anneeSuivanteXls = if (semaineXls < 53) anneeXls else anneeXls + 1
        val tachesRealiseXls = previsions.filter { it.semaine == semaineXls && it.annee == anneeXls }
        val tachesPrevuesXls = previsions.filter { it.semaine == semaineSuivanteXls && it.annee == anneeSuivanteXls }

        val shRealise = wb.createSheet("Réalisé S$semaineXls")
        rowNum = 0
        val rowHeaderR = shRealise.createRow(rowNum++)
        listOf("Tâche", "Avancement (%)").forEachIndexed { i, h ->
            rowHeaderR.createCell(i).setCellValue(h)
            rowHeaderR.getCell(i).cellStyle = headerStyle
        }
        tachesRealiseXls.forEach { p ->
            val row = shRealise.createRow(rowNum++)
            row.createCell(0).setCellValue(fmt(p.description))
            row.createCell(1).setCellValue((p.avancementPct ?: 0).toDouble())
        }

        // Feuille 5 : Prévisions semaine suivante
        val shPrev = wb.createSheet("Prévisions S$semaineSuivanteXls")
        rowNum = 0
        val rowHeaderP = shPrev.createRow(rowNum++)
        listOf("Tâche").forEachIndexed { i, h ->
            rowHeaderP.createCell(i).setCellValue(h)
            rowHeaderP.getCell(i).cellStyle = headerStyle
        }
        tachesPrevuesXls.forEach { p ->
            val row = shPrev.createRow(rowNum++)
            row.createCell(0).setCellValue(fmt(p.description))
        }

        // Feuille 5 : Points bloquants
        val shPB = wb.createSheet("Points bloquants")
        rowNum = 0
        val rowHeaderPB = shPB.createRow(rowNum++)
        listOf("Titre", "Description", "Priorité", "Statut", "Date détection").forEachIndexed { i, h ->
            rowHeaderPB.createCell(i).setCellValue(h)
            rowHeaderPB.getCell(i).cellStyle = headerStyle
        }
        pointsBloquants.forEach { pb ->
            val row = shPB.createRow(rowNum++)
            row.createCell(0).setCellValue(pb.titre)
            row.createCell(1).setCellValue(fmt(pb.description))
            row.createCell(2).setCellValue(pb.priorite.name)
            row.createCell(3).setCellValue(pb.statut.name)
            row.createCell(4).setCellValue(fmtDate(pb.dateDetection))
        }

        // Feuille 6 : Synthèse
        val shSyn = wb.createSheet("Synthèse")
        rowNum = 0
        listOf(
            "Budget total prévu" to fmtMontant(rapport?.budget?.budgetTotalPrevu ?: projet.montantHT),
            "Dépenses réalisées" to fmtMontant(rapport?.budget?.depensesTotales),
            "Écart budget" to fmtMontant(rapport?.budget?.ecart),
            "Tâches en retard" to (rapport?.planning?.tachesEnRetard?.toString() ?: "—"),
            "Risques critiques" to (rapport?.securite?.risquesCritiques?.toString() ?: "—"),
            "Description" to fmt(projet.description),
            "Observations" to fmt(projet.observations),
            "Propositions d'amélioration" to fmt(projet.propositionsAmelioration),
        ).forEach { (k, v) ->
            val row = shSyn.createRow(rowNum++)
            row.createCell(0).setCellValue(k)
            row.createCell(1).setCellValue(v)
        }

        val out = ByteArrayOutputStream()
        wb.write(out)
        wb.close()
        return out.toByteArray()
    }
}
