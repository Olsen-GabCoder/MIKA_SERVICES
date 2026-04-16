package com.mikaservices.platform.modules.rapport.pdf

import com.lowagie.text.*
import com.lowagie.text.pdf.PdfPCell
import com.lowagie.text.pdf.PdfPTable
import com.lowagie.text.pdf.PdfWriter
import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.modules.rapport.data.ProjetRapportRow
import com.mikaservices.platform.modules.rapport.data.RapportHebdoData
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Génère côté serveur le PDF du rapport hebdomadaire MIKA Services.
 * Structure : page de garde → récapitulatif → projets par statut.
 * Style : bande orange, marine, barres de progression colorées.
 */
@Service
class RapportHebdoPdfGenerator {

    // ─── Couleurs ─────────────────────────────────────────────────
    private val ORANGE    = java.awt.Color(255, 107, 53)
    private val NAVY      = java.awt.Color(30, 58, 95)
    private val GREEN     = java.awt.Color(22, 163, 74)
    private val AMBER     = java.awt.Color(217, 119, 6)
    private val RED       = java.awt.Color(185, 28, 28)
    private val LIGHT_BG  = java.awt.Color(248, 250, 252)
    private val BORDER    = java.awt.Color(229, 231, 235)
    private val TEXT_DARK = java.awt.Color(17, 24, 39)
    private val TEXT_GRAY = java.awt.Color(107, 114, 128)
    private val WHITE     = java.awt.Color(255, 255, 255)
    private val BAR_EMPTY = java.awt.Color(229, 231, 235)
    private val NAVY_DARK = java.awt.Color(15, 30, 55)

    // ─── Polices ──────────────────────────────────────────────────
    private val fCoverTitle  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 26f, WHITE)
    private val fCoverSub    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14f, ORANGE)
    private val fCoverDate   = FontFactory.getFont(FontFactory.HELVETICA,      11f, java.awt.Color(200, 210, 220))
    private val fCoverStat   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20f, WHITE)
    private val fCoverStatLb = FontFactory.getFont(FontFactory.HELVETICA,       9f, java.awt.Color(180, 195, 210))
    private val fTitle       = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18f, NAVY)
    private val fSub         = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11f, ORANGE)
    private val fDate        = FontFactory.getFont(FontFactory.HELVETICA,       9f, TEXT_GRAY)
    private val fSection     = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10f, WHITE)
    private val fProjet      = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11f, NAVY)
    private val fCode        = FontFactory.getFont(FontFactory.HELVETICA,       9f, TEXT_GRAY)
    private val fLabel       = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  9f, TEXT_GRAY)
    private val fValue       = FontFactory.getFont(FontFactory.HELVETICA,       9f, TEXT_DARK)
    private val fPct         = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  9f, TEXT_DARK)
    private val fPbTitle     = FontFactory.getFont(FontFactory.HELVETICA,       8f, TEXT_DARK)
    private val fPbPrio      = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  7f, WHITE)
    private val fFooter      = FontFactory.getFont(FontFactory.HELVETICA,       8f, TEXT_GRAY)

    private val DATE_LONG = DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH)
    private val DATE_SHORT = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    // ─── Logo ─────────────────────────────────────────────────────
    private fun loadLogo(maxWidth: Float, maxHeight: Float): Image? = try {
        val resource = ClassPathResource("Logo_mika_services.png")
        if (resource.exists()) {
            val img = Image.getInstance(resource.inputStream.readBytes())
            img.scaleToFit(maxWidth, maxHeight)
            img
        } else null
    } catch (_: Exception) { null }

    // ─── Point d'entrée ───────────────────────────────────────────

    fun generate(data: RapportHebdoData): ByteArray {
        val baos = ByteArrayOutputStream()
        val document = Document(PageSize.A4, 40f, 40f, 50f, 40f)
        PdfWriter.getInstance(document, baos)
        document.open()

        addCoverPage(document, data)
        document.newPage()
        addContentHeader(document, data)
        addSummaryBand(document, data)

        // Sections par statut (tous les projets non terminés)
        val sections = listOf(
            Triple("Projets en cours",            GREEN, data.projetsEnCours),
            Triple("Projets planifiés",            NAVY,  data.projetsPlanifies),
            Triple("En attente de démarrage",      AMBER, data.projetsEnAttente),
            Triple("Réception provisoire",         AMBER, data.projetsReceptionProvisoire),
            Triple("Réception définitive",         GREEN, data.projetsReceptionDefinitive),
            Triple("Projets suspendus",            RED,   data.projetsSuspendus)
        ).filter { it.third.isNotEmpty() }

        sections.forEach { (titre, color, projets) ->
            addSection(document, "$titre (${projets.size})", color, projets)
        }

        if (data.totalProjets == 0) {
            val p = Paragraph("Aucun projet actif à la date d'émission.", fValue)
            p.spacingBefore = 20f
            p.alignment = Element.ALIGN_CENTER
            document.add(p)
        }

        addFooter(document, data)
        document.close()
        return baos.toByteArray()
    }

    // ─── Page de garde ────────────────────────────────────────────

    private fun addCoverPage(document: Document, data: RapportHebdoData) {
        // Fond marine pleine page simulé via une table pleine largeur
        val coverTable = PdfPTable(1)
        coverTable.widthPercentage = 100f

        // Bande orange top
        val topBand = PdfPCell(Phrase(" "))
        topBand.backgroundColor = ORANGE
        topBand.fixedHeight = 8f
        topBand.border = PdfPCell.NO_BORDER
        coverTable.addCell(topBand)

        // Bloc marine principal
        val mainCell = PdfPCell()
        mainCell.backgroundColor = NAVY_DARK
        mainCell.setPadding(40f)
        mainCell.border = PdfPCell.NO_BORDER

        // Logo
        val logo = loadLogo(160f, 60f)
        if (logo != null) {
            logo.alignment = Image.ALIGN_CENTER
            mainCell.addElement(logo)
            mainCell.addElement(Paragraph(" "))
        }

        // Titre
        val titleP = Paragraph("RAPPORT HEBDOMADAIRE", fCoverTitle)
        titleP.alignment = Element.ALIGN_CENTER
        titleP.spacingAfter = 6f
        mainCell.addElement(titleP)

        val subP = Paragraph("MIKA Services", fCoverSub)
        subP.alignment = Element.ALIGN_CENTER
        subP.spacingAfter = 4f
        mainCell.addElement(subP)

        val weekP = Paragraph("Semaine ${data.semaine} — ${data.annee}", fCoverSub)
        weekP.alignment = Element.ALIGN_CENTER
        weekP.spacingAfter = 20f
        mainCell.addElement(weekP)

        val dateStr = data.dateEmission.format(DATE_LONG).replaceFirstChar { it.uppercase() }
        val dateP = Paragraph("Émis le $dateStr", fCoverDate)
        dateP.alignment = Element.ALIGN_CENTER
        dateP.spacingAfter = 40f
        mainCell.addElement(dateP)

        // Stats résumé
        val statsTable = PdfPTable(3)
        statsTable.widthPercentage = 80f
        statsTable.setHorizontalAlignment(Element.ALIGN_CENTER)

        fun coverStatCell(value: String, label: String, color: java.awt.Color) {
            val cell = PdfPCell()
            cell.backgroundColor = color
            cell.setPadding(14f)
            cell.border = PdfPCell.NO_BORDER
            val p = Paragraph()
            p.add(Chunk(value + "\n", fCoverStat))
            p.add(Chunk(label, fCoverStatLb))
            p.alignment = Element.ALIGN_CENTER
            cell.addElement(p)
            statsTable.addCell(cell)
        }

        coverStatCell("${data.totalProjets}", "projets actifs", java.awt.Color(40, 80, 120))
        coverStatCell("${data.projetsEnCours.size}", "en cours", java.awt.Color(16, 100, 50))
        coverStatCell("${data.totalPointsBloquants}", "points bloquants", if (data.totalPointsBloquants > 0) java.awt.Color(130, 20, 20) else java.awt.Color(40, 80, 120))

        mainCell.addElement(statsTable)
        mainCell.addElement(Paragraph(" "))
        mainCell.addElement(Paragraph(" "))
        mainCell.addElement(Paragraph(" "))

        coverTable.addCell(mainCell)

        // Bande orange bottom
        val bottomBand = PdfPCell(Phrase(" "))
        bottomBand.backgroundColor = ORANGE
        bottomBand.fixedHeight = 8f
        bottomBand.border = PdfPCell.NO_BORDER
        coverTable.addCell(bottomBand)

        document.add(coverTable)
    }

    // ─── En-tête des pages de contenu ─────────────────────────────

    private fun addContentHeader(document: Document, data: RapportHebdoData) {
        val accentTable = PdfPTable(1)
        accentTable.widthPercentage = 100f
        val accentCell = PdfPCell(Phrase(" "))
        accentCell.backgroundColor = ORANGE
        accentCell.fixedHeight = 4f
        accentCell.border = PdfPCell.NO_BORDER
        accentTable.addCell(accentCell)
        document.add(accentTable)

        document.add(Paragraph(" "))

        val title = Paragraph("RAPPORT HEBDOMADAIRE", fTitle)
        title.alignment = Element.ALIGN_CENTER
        title.spacingAfter = 4f
        document.add(title)

        val sub = Paragraph("MIKA Services — Semaine ${data.semaine} / ${data.annee}", fSub)
        sub.alignment = Element.ALIGN_CENTER
        sub.spacingAfter = 4f
        document.add(sub)

        val dateStr = data.dateEmission.format(DATE_LONG).replaceFirstChar { it.uppercase() }
        val datePara = Paragraph("Émis le $dateStr", fDate)
        datePara.alignment = Element.ALIGN_CENTER
        datePara.spacingAfter = 14f
        document.add(datePara)

        val sepTable = PdfPTable(1)
        sepTable.widthPercentage = 100f
        sepTable.setSpacingAfter(14f)
        val sepCell = PdfPCell(Phrase(" "))
        sepCell.backgroundColor = ORANGE
        sepCell.fixedHeight = 2f
        sepCell.border = PdfPCell.NO_BORDER
        sepTable.addCell(sepCell)
        document.add(sepTable)
    }

    // ─── Bandeau récapitulatif ─────────────────────────────────────

    private fun addSummaryBand(document: Document, data: RapportHebdoData) {
        val table = PdfPTable(4)
        table.widthPercentage = 100f
        table.setWidths(floatArrayOf(1f, 1f, 1f, 1f))
        table.setSpacingAfter(18f)

        fun statCell(label: String, value: String, color: java.awt.Color) {
            val cell = PdfPCell()
            cell.backgroundColor = color
            cell.setPadding(10f)
            cell.border = PdfPCell.NO_BORDER
            val fVal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16f, WHITE)
            val fLab = FontFactory.getFont(FontFactory.HELVETICA, 8f, java.awt.Color(210, 220, 230))
            val p = Paragraph()
            p.add(Chunk(value + "\n", fVal))
            p.add(Chunk(label, fLab))
            p.alignment = Element.ALIGN_CENTER
            cell.addElement(p)
            table.addCell(cell)
        }

        statCell("Projets actifs",    "${data.totalProjets}",           NAVY)
        statCell("En cours",          "${data.projetsEnCours.size}",    GREEN)
        statCell("Suspendus",         "${data.projetsSuspendus.size}",  AMBER)
        statCell("Points bloquants",  "${data.totalPointsBloquants}",   if (data.totalPointsBloquants > 0) RED else BORDER)

        document.add(table)
    }

    // ─── Section par statut ────────────────────────────────────────

    private fun addSection(document: Document, titre: String, color: java.awt.Color, projets: List<ProjetRapportRow>) {
        val headerTable = PdfPTable(1)
        headerTable.widthPercentage = 100f
        headerTable.setSpacingBefore(10f)
        headerTable.setSpacingAfter(6f)
        val hCell = PdfPCell(Phrase(titre.uppercase(), fSection))
        hCell.backgroundColor = color
        hCell.setPadding(8f)
        hCell.paddingLeft = 12f
        hCell.border = PdfPCell.NO_BORDER
        headerTable.addCell(hCell)
        document.add(headerTable)

        projets.forEachIndexed { idx, projet -> addProjetCard(document, projet, idx + 1) }
    }

    // ─── Carte d'un projet ─────────────────────────────────────────

    private fun addProjetCard(document: Document, p: ProjetRapportRow, num: Int) {
        val card = PdfPTable(1)
        card.widthPercentage = 100f

        // Titre du projet
        val titleRow = PdfPTable(2)
        titleRow.setWidths(floatArrayOf(75f, 25f))
        titleRow.widthPercentage = 100f

        val nameCell = PdfPCell()
        nameCell.backgroundColor = LIGHT_BG
        nameCell.setPadding(8f)
        nameCell.paddingLeft = 10f
        nameCell.border = Rectangle.BOTTOM
        nameCell.borderColor = BORDER
        val namePhrase = Phrase()
        namePhrase.add(Chunk("$num. ${p.nom}  ", fProjet))
        namePhrase.add(Chunk("(${p.codeProjet})", fCode))
        nameCell.addElement(Paragraph(namePhrase))
        if (!p.responsableNom.isNullOrBlank()) {
            val resp = Paragraph("Chef de projet : ${p.responsableNom}", fDate)
            resp.spacingBefore = 2f
            nameCell.addElement(resp)
        }
        titleRow.addCell(nameCell)

        val emptyCell = PdfPCell(Phrase(" "))
        emptyCell.backgroundColor = LIGHT_BG
        emptyCell.border = Rectangle.BOTTOM
        emptyCell.borderColor = BORDER
        emptyCell.setPadding(8f)
        titleRow.addCell(emptyCell)

        val titleCell = PdfPCell(titleRow)
        titleCell.border = PdfPCell.NO_BORDER
        titleCell.setPadding(0f)
        card.addCell(titleCell)

        // Barres d'avancement
        val avanTable = PdfPTable(3)
        avanTable.setWidths(floatArrayOf(1f, 1f, 1f))
        avanTable.widthPercentage = 100f
        addAvancementCell(avanTable, "Avancement physique",  p.avancementPhysiquePct,  NAVY)
        addAvancementCell(avanTable, "Avancement financier", p.avancementFinancierPct, ORANGE)
        addAvancementCell(avanTable, "Délai consommé",       p.delaiConsommePct,       AMBER)
        val avanContainer = PdfPCell(avanTable)
        avanContainer.border = PdfPCell.NO_BORDER
        avanContainer.setPadding(0f)
        card.addCell(avanContainer)

        // Champs texte
        val fields = listOf(
            "Besoins matériels" to p.besoinsMateriel,
            "Besoins humains"   to p.besoinsHumain,
            "Observations"      to p.observations,
            "Propositions"      to p.propositionsAmelioration
        ).filter { !it.second.isNullOrBlank() }

        if (fields.isNotEmpty()) {
            val fieldsTable = PdfPTable(2)
            fieldsTable.setWidths(floatArrayOf(30f, 70f))
            fieldsTable.widthPercentage = 100f
            fields.forEach { (label, value) ->
                val lCell = PdfPCell(Phrase(label, fLabel))
                lCell.setPadding(6f); lCell.paddingLeft = 10f
                lCell.backgroundColor = WHITE
                lCell.border = Rectangle.BOTTOM + Rectangle.RIGHT
                lCell.borderColor = BORDER
                fieldsTable.addCell(lCell)
                val vCell = PdfPCell(Phrase(value ?: "", fValue))
                vCell.setPadding(6f)
                vCell.backgroundColor = WHITE
                vCell.border = Rectangle.BOTTOM
                vCell.borderColor = BORDER
                fieldsTable.addCell(vCell)
            }
            val fc = PdfPCell(fieldsTable)
            fc.border = PdfPCell.NO_BORDER
            fc.setPadding(0f)
            card.addCell(fc)
        }

        // Points bloquants
        if (p.pointsBloquants.isNotEmpty()) {
            val pbTable = PdfPTable(1)
            pbTable.widthPercentage = 100f
            val pbHeader = PdfPCell(Phrase("Points bloquants (${p.pointsBloquants.size})", fLabel))
            pbHeader.backgroundColor = java.awt.Color(254, 242, 242)
            pbHeader.setPadding(6f); pbHeader.paddingLeft = 10f
            pbHeader.border = Rectangle.BOTTOM
            pbHeader.borderColor = java.awt.Color(254, 202, 202)
            pbTable.addCell(pbHeader)

            p.pointsBloquants.forEach { pb ->
                val prioColor = when (pb.priorite) {
                    Priorite.CRITIQUE, Priorite.URGENTE -> RED
                    Priorite.HAUTE -> ORANGE
                    Priorite.NORMALE -> NAVY
                    Priorite.BASSE -> TEXT_GRAY
                }
                val pbRow = PdfPTable(2)
                pbRow.setWidths(floatArrayOf(15f, 85f))
                pbRow.widthPercentage = 100f
                val prioCell = PdfPCell(Phrase(pb.priorite.name, fPbPrio))
                prioCell.backgroundColor = prioColor
                prioCell.setPadding(4f)
                prioCell.border = PdfPCell.NO_BORDER
                prioCell.verticalAlignment = Element.ALIGN_MIDDLE
                pbRow.addCell(prioCell)
                val pbTitleCell = PdfPCell(Phrase(pb.titre, fPbTitle))
                pbTitleCell.setPadding(5f)
                pbTitleCell.border = PdfPCell.NO_BORDER
                pbRow.addCell(pbTitleCell)
                val rowCell = PdfPCell(pbRow)
                rowCell.border = Rectangle.BOTTOM
                rowCell.borderColor = BORDER
                rowCell.setPadding(0f)
                pbTable.addCell(rowCell)
            }
            val pbc = PdfPCell(pbTable)
            pbc.border = PdfPCell.NO_BORDER
            pbc.setPadding(0f)
            card.addCell(pbc)
        }

        val outerCell = PdfPCell(card)
        outerCell.border = Rectangle.BOX
        outerCell.borderColor = BORDER
        outerCell.setPadding(0f)
        val outerTable = PdfPTable(1)
        outerTable.widthPercentage = 100f
        outerTable.setSpacingAfter(10f)
        outerTable.addCell(outerCell)
        document.add(outerTable)
    }

    // ─── Cellule barre de progression ─────────────────────────────

    private fun addAvancementCell(parent: PdfPTable, label: String, value: java.math.BigDecimal?, color: java.awt.Color) {
        val cell = PdfPCell()
        cell.setPadding(8f)
        cell.backgroundColor = WHITE
        cell.border = Rectangle.BOTTOM + Rectangle.RIGHT
        cell.borderColor = BORDER

        val labelP = Paragraph(label, fLabel)
        labelP.spacingAfter = 4f
        cell.addElement(labelP)

        val pctInt = value?.toInt()?.coerceIn(0, 100) ?: 0
        val pctStr = value?.let { "${it.toPlainString()}%" } ?: "—"

        if (value != null && pctInt > 0) {
            val barTable = PdfPTable(if (pctInt < 100) 2 else 1)
            barTable.widthPercentage = 100f
            if (pctInt < 100) barTable.setWidths(floatArrayOf(pctInt.toFloat(), (100 - pctInt).toFloat()))
            val filledCell = PdfPCell(Phrase(" "))
            filledCell.backgroundColor = color
            filledCell.fixedHeight = 8f
            filledCell.border = PdfPCell.NO_BORDER
            barTable.addCell(filledCell)
            if (pctInt < 100) {
                val emptyCell = PdfPCell(Phrase(" "))
                emptyCell.backgroundColor = BAR_EMPTY
                emptyCell.fixedHeight = 8f
                emptyCell.border = PdfPCell.NO_BORDER
                barTable.addCell(emptyCell)
            }
            cell.addElement(barTable)
        } else {
            val emptyBar = PdfPTable(1)
            emptyBar.widthPercentage = 100f
            val ec = PdfPCell(Phrase(" "))
            ec.backgroundColor = BAR_EMPTY
            ec.fixedHeight = 8f
            ec.border = PdfPCell.NO_BORDER
            emptyBar.addCell(ec)
            cell.addElement(emptyBar)
        }

        val pctPara = Paragraph(pctStr, fPct)
        pctPara.spacingBefore = 3f
        cell.addElement(pctPara)
        parent.addCell(cell)
    }

    // ─── Pied de page ─────────────────────────────────────────────

    private fun addFooter(document: Document, data: RapportHebdoData) {
        document.add(Paragraph(" "))
        val sepTable = PdfPTable(1)
        sepTable.widthPercentage = 100f
        sepTable.setSpacingAfter(8f)
        val sepCell = PdfPCell(Phrase(" "))
        sepCell.backgroundColor = ORANGE
        sepCell.fixedHeight = 2f
        sepCell.border = PdfPCell.NO_BORDER
        sepTable.addCell(sepCell)
        document.add(sepTable)
        val footer = Paragraph(
            "MIKA Services · Rapport généré le ${data.dateEmission.format(DATE_SHORT)} · " +
            "Semaine ${data.semaine}/${data.annee} · " +
            "${data.totalProjets} projet(s) · ${data.totalPointsBloquants} point(s) bloquant(s)",
            fFooter
        )
        footer.alignment = Element.ALIGN_CENTER
        document.add(footer)
    }
}
