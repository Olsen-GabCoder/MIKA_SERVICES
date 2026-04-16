package com.mikaservices.platform.modules.rapport.pdf

import com.lowagie.text.*
import com.lowagie.text.pdf.PdfPCell
import com.lowagie.text.pdf.PdfPTable
import com.lowagie.text.pdf.PdfWriter
import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.modules.rapport.data.ProjetRapportRow
import com.mikaservices.platform.modules.rapport.data.RapportHebdoData
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Génère côté serveur le PDF du rapport hebdomadaire MIKA Services.
 * Style similaire au PV de réunion : bande orange, titres marine, barres de progression colorées.
 * Utilise OpenPDF (fork libre d'iText 4) — aucune dépendance avec le rendu PDF client React.
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

    // ─── Polices ──────────────────────────────────────────────────
    private val fTitle   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20f, NAVY)
    private val fSub     = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11f, ORANGE)
    private val fDate    = FontFactory.getFont(FontFactory.HELVETICA,       9f, TEXT_GRAY)
    private val fSection = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10f, WHITE)
    private val fProjet  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11f, NAVY)
    private val fCode    = FontFactory.getFont(FontFactory.HELVETICA,       9f, TEXT_GRAY)
    private val fLabel   = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  9f, TEXT_GRAY)
    private val fValue   = FontFactory.getFont(FontFactory.HELVETICA,       9f, TEXT_DARK)
    private val fPct     = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  9f, TEXT_DARK)
    private val fPbTitle = FontFactory.getFont(FontFactory.HELVETICA,       8f, TEXT_DARK)
    private val fPbPrio  = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  7f, WHITE)
    private val fFooter  = FontFactory.getFont(FontFactory.HELVETICA,       8f, TEXT_GRAY)

    // ─── Point d'entrée ───────────────────────────────────────────

    fun generate(data: RapportHebdoData): ByteArray {
        val baos = ByteArrayOutputStream()
        val document = Document(PageSize.A4, 40f, 40f, 50f, 40f)
        PdfWriter.getInstance(document, baos)
        document.open()

        addHeader(document, data)
        addSummaryBand(document, data)

        if (data.projetsEnCours.isNotEmpty())
            addSection(document, "Projets en cours (${data.projetsEnCours.size})", GREEN, data.projetsEnCours)
        if (data.projetsPlanifies.isNotEmpty())
            addSection(document, "Projets planifiés (${data.projetsPlanifies.size})", NAVY, data.projetsPlanifies)
        if (data.projetsReceptionProvisoire.isNotEmpty())
            addSection(document, "Réception provisoire (${data.projetsReceptionProvisoire.size})", AMBER, data.projetsReceptionProvisoire)

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

    // ─── En-tête ──────────────────────────────────────────────────

    private fun addHeader(document: Document, data: RapportHebdoData) {
        // Bande orange top
        val accentTable = PdfPTable(1)
        accentTable.widthPercentage = 100f
        val accentCell = PdfPCell(Phrase(" "))
        accentCell.backgroundColor = ORANGE
        accentCell.fixedHeight = 5f
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

        val dateStr = data.dateEmission
            .format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH))
            .replaceFirstChar { it.uppercase() }
        val datePara = Paragraph("Émis le $dateStr", fDate)
        datePara.alignment = Element.ALIGN_CENTER
        datePara.spacingAfter = 16f
        document.add(datePara)

        // Séparateur orange
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
        val table = PdfPTable(3)
        table.widthPercentage = 100f
        table.setWidths(floatArrayOf(1f, 1f, 1f))
        table.setSpacingAfter(18f)

        fun statCell(label: String, value: String, color: java.awt.Color) {
            val cell = PdfPCell()
            cell.backgroundColor = color
            cell.setPadding(10f)
            cell.border = PdfPCell.NO_BORDER
            val fVal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18f, WHITE)
            val fLab = FontFactory.getFont(FontFactory.HELVETICA, 8f, java.awt.Color(220, 220, 220))
            val p = Paragraph()
            p.add(Chunk(value, fVal))
            p.add(Chunk("\n$label", fLab))
            p.alignment = Element.ALIGN_CENTER
            cell.addElement(p)
            table.addCell(cell)
        }

        statCell("Projets actifs", "${data.totalProjets}", NAVY)
        statCell("En cours", "${data.projetsEnCours.size}", GREEN)
        statCell("Points bloquants", "${data.totalPointsBloquants}", if (data.totalPointsBloquants > 0) RED else BORDER)

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

        // ── Titre du projet ──
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

        // ── Barres d'avancement ──
        val avanTable = PdfPTable(3)
        avanTable.setWidths(floatArrayOf(1f, 1f, 1f))
        avanTable.widthPercentage = 100f
        addAvancementCell(avanTable, "Avancement physique",  p.avancementPhysiquePct,   NAVY)
        addAvancementCell(avanTable, "Avancement financier", p.avancementFinancierPct,  ORANGE)
        addAvancementCell(avanTable, "Délai consommé",       p.delaiConsommePct,        AMBER)

        val avanContainer = PdfPCell(avanTable)
        avanContainer.border = PdfPCell.NO_BORDER
        avanContainer.setPadding(0f)
        card.addCell(avanContainer)

        // ── Champs texte ──
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
                lCell.setPadding(6f)
                lCell.paddingLeft = 10f
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
            val fieldsContainer = PdfPCell(fieldsTable)
            fieldsContainer.border = PdfPCell.NO_BORDER
            fieldsContainer.setPadding(0f)
            card.addCell(fieldsContainer)
        }

        // ── Points bloquants ──
        if (p.pointsBloquants.isNotEmpty()) {
            val pbTable = PdfPTable(1)
            pbTable.widthPercentage = 100f

            val pbHeader = PdfPCell(Phrase("Points bloquants (${p.pointsBloquants.size})", fLabel))
            pbHeader.backgroundColor = java.awt.Color(254, 242, 242)
            pbHeader.setPadding(6f)
            pbHeader.paddingLeft = 10f
            pbHeader.border = Rectangle.BOTTOM
            pbHeader.borderColor = java.awt.Color(254, 202, 202)
            pbTable.addCell(pbHeader)

            p.pointsBloquants.forEach { pb ->
                val prioColor = when (pb.priorite) {
                    Priorite.CRITIQUE, Priorite.URGENTE -> RED
                    Priorite.HAUTE                      -> ORANGE
                    Priorite.NORMALE                    -> NAVY
                    Priorite.BASSE                      -> TEXT_GRAY
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

            val pbContainer = PdfPCell(pbTable)
            pbContainer.border = PdfPCell.NO_BORDER
            pbContainer.setPadding(0f)
            card.addCell(pbContainer)
        }

        // Bordure extérieure de la carte
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

    private fun addAvancementCell(
        parent: PdfPTable,
        label: String,
        value: java.math.BigDecimal?,
        color: java.awt.Color
    ) {
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
            val emptyCell = PdfPCell(Phrase(" "))
            emptyCell.backgroundColor = BAR_EMPTY
            emptyCell.fixedHeight = 8f
            emptyCell.border = PdfPCell.NO_BORDER
            emptyBar.addCell(emptyCell)
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
            "MIKA Services — Rapport généré automatiquement le ${data.dateEmission} · " +
            "Semaine ${data.semaine}/${data.annee} · " +
            "${data.totalProjets} projet(s) · ${data.totalPointsBloquants} point(s) bloquant(s)",
            fFooter
        )
        footer.alignment = Element.ALIGN_CENTER
        document.add(footer)
    }
}
