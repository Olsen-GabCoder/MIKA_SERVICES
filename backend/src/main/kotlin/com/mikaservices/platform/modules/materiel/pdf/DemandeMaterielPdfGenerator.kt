package com.mikaservices.platform.modules.materiel.pdf

import com.lowagie.text.Document
import com.lowagie.text.Element
import com.lowagie.text.FontFactory
import com.lowagie.text.Image
import com.lowagie.text.PageSize
import com.lowagie.text.Paragraph
import com.lowagie.text.Phrase
import com.lowagie.text.pdf.ColumnText
import com.lowagie.text.pdf.PdfPCell
import com.lowagie.text.pdf.PdfPTable
import com.lowagie.text.pdf.PdfWriter
import com.mikaservices.platform.common.enums.PrioriteDemandeMateriel
import com.mikaservices.platform.common.enums.StatutDemandeMateriel
import com.mikaservices.platform.modules.materiel.entity.DemandeMateriel
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.math.BigDecimal
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * PDF d'une demande de matériel — équivalent numérique du carnet « Demande d'achat BTP » :
 * référence en évidence (le « numéro rouge »), bloc demandeur/chantier, tableau des lignes
 * avec total estimé, visas électroniques horodatés tirés de l'historique du workflow.
 *
 * Bandeau + filigrane selon l'état (un PDF intermédiaire ne doit jamais circuler comme
 * un bon d'achat validé) :
 * - SOUMISE (et statuts legacy EN_VALIDATION_*) → « EN COURS DE VALIDATION » ;
 * - REJETEE → « REJETÉE » ;
 * - à partir de PRISE_EN_CHARGE (porte logistique franchie) → aucun bandeau.
 */
@Service
class DemandeMaterielPdfGenerator {

    private val ORANGE = java.awt.Color(255, 107, 53)
    private val NAVY = java.awt.Color(30, 58, 95)
    private val RED = java.awt.Color(185, 28, 28)
    private val AMBER = java.awt.Color(217, 119, 6)
    private val LIGHT_BG = java.awt.Color(248, 250, 252)
    private val BORDER = java.awt.Color(229, 231, 235)
    private val TEXT_DARK = java.awt.Color(17, 24, 39)
    private val TEXT_GRAY = java.awt.Color(107, 114, 128)
    private val WHITE = java.awt.Color(255, 255, 255)

    private val fTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16f, NAVY)
    private val fRef = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20f, RED)
    private val fBanner = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11f, WHITE)
    private val fLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, TEXT_GRAY)
    private val fValue = FontFactory.getFont(FontFactory.HELVETICA, 10f, TEXT_DARK)
    private val fValueBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10f, TEXT_DARK)
    private val fTableHead = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9f, WHITE)
    private val fCell = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, TEXT_DARK)
    private val fCellMuted = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, TEXT_GRAY)
    private val fTotal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, NAVY)
    private val fFooter = FontFactory.getFont(FontFactory.HELVETICA, 8f, TEXT_GRAY)

    private val DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    private val DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm")
    private val MONEY = DecimalFormat("#,##0.##", DecimalFormatSymbols(Locale.FRENCH))

    private val statutLabels = mapOf(
        // Circuit à une porte (réforme 2026-08-20) ; EN_VALIDATION_* = statuts legacy
        // conservés pour lire les anciennes DMA.
        StatutDemandeMateriel.SOUMISE to "En attente logistique",
        StatutDemandeMateriel.EN_VALIDATION_CHANTIER to "Validée chantier (ancien circuit)",
        StatutDemandeMateriel.EN_VALIDATION_PROJET to "Validée projet (ancien circuit)",
        StatutDemandeMateriel.PRISE_EN_CHARGE to "Prise en charge logistique",
        StatutDemandeMateriel.EN_ATTENTE_COMPLEMENT to "En attente de complément",
        StatutDemandeMateriel.EN_COMMANDE to "En commande",
        StatutDemandeMateriel.LIVRE to "Livrée",
        StatutDemandeMateriel.REJETEE to "Rejetée",
        StatutDemandeMateriel.CLOTUREE to "Clôturée",
    )

    private val prioriteLabels = mapOf(
        PrioriteDemandeMateriel.NORMALE to "Normale",
        PrioriteDemandeMateriel.URGENTE to "URGENTE",
    )

    /** Libellé lisible d'une transition pour le bloc visas. */
    private val visaLabels = mapOf(
        StatutDemandeMateriel.SOUMISE to "Demande créée",
        StatutDemandeMateriel.EN_VALIDATION_CHANTIER to "Visa chef de chantier",
        StatutDemandeMateriel.EN_VALIDATION_PROJET to "Visa chef de projet",
        StatutDemandeMateriel.PRISE_EN_CHARGE to "Prise en charge logistique",
        StatutDemandeMateriel.EN_ATTENTE_COMPLEMENT to "Complément demandé",
        StatutDemandeMateriel.EN_COMMANDE to "Commande passée",
        StatutDemandeMateriel.LIVRE to "Livraison",
        StatutDemandeMateriel.REJETEE to "Rejet",
        StatutDemandeMateriel.CLOTUREE to "Clôture",
    )

    private enum class Bandeau(val texte: String) {
        EN_COURS("EN COURS DE VALIDATION — NE VAUT PAS BON D'ACHAT"),
        REJETEE("DEMANDE REJETÉE"),
    }

    private fun bandeau(statut: StatutDemandeMateriel): Bandeau? = when (statut) {
        StatutDemandeMateriel.SOUMISE,
        StatutDemandeMateriel.EN_VALIDATION_CHANTIER,
        StatutDemandeMateriel.EN_VALIDATION_PROJET -> Bandeau.EN_COURS
        StatutDemandeMateriel.REJETEE -> Bandeau.REJETEE
        else -> null
    }

    fun generate(dma: DemandeMateriel): ByteArray {
        val baos = ByteArrayOutputStream()
        val document = Document(PageSize.A4, 40f, 40f, 42f, 42f)
        val writer = PdfWriter.getInstance(document, baos)
        document.open()

        bandeau(dma.statut)?.let { addWatermark(writer, it) }
        addHeader(document, dma)
        bandeau(dma.statut)?.let { addBanner(document, it) }
        addInfoBlock(document, dma)
        addLignesTable(document, dma)
        dma.commentaire?.takeIf { it.isNotBlank() }?.let { addCommentaire(document, it) }
        addVisas(document, dma)
        addFooter(document, dma)

        document.close()
        return baos.toByteArray()
    }

    // ── Filigrane diagonal (sous le contenu) ──────────────────────

    private fun addWatermark(writer: PdfWriter, bandeau: Bandeau) {
        val under = writer.directContentUnder
        val font = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 52f).baseFont
        val color = if (bandeau == Bandeau.REJETEE) java.awt.Color(252, 226, 226) else java.awt.Color(255, 233, 219)
        under.saveState()
        under.setColorFill(color)
        under.setFontAndSize(font, 46f)
        under.beginText()
        val texte = if (bandeau == Bandeau.REJETEE) "REJETÉE" else "EN COURS"
        under.showTextAligned(Element.ALIGN_CENTER, texte, PageSize.A4.width / 2, PageSize.A4.height / 2, 45f)
        under.endText()
        under.restoreState()
    }

    // ── En-tête : logo + titre + référence « numéro rouge » ───────

    private fun addHeader(document: Document, dma: DemandeMateriel) {
        val table = PdfPTable(floatArrayOf(1.1f, 2.4f, 1.5f))
        table.widthPercentage = 100f

        val logoCell = try {
            val resource = ClassPathResource("Logo_mika_services.png")
            if (resource.exists()) {
                val img = Image.getInstance(resource.inputStream.readBytes())
                img.scaleToFit(72f, 40f)
                PdfPCell(img)
            } else PdfPCell(Phrase("MIKA SERVICES", fValueBold))
        } catch (_: Exception) {
            PdfPCell(Phrase("MIKA SERVICES", fValueBold))
        }
        logoCell.border = PdfPCell.NO_BORDER
        logoCell.verticalAlignment = Element.ALIGN_MIDDLE
        table.addCell(logoCell)

        val titre = PdfPCell(Phrase("DEMANDE DE MATÉRIEL", fTitle))
        titre.border = PdfPCell.NO_BORDER
        titre.horizontalAlignment = Element.ALIGN_CENTER
        titre.verticalAlignment = Element.ALIGN_MIDDLE
        table.addCell(titre)

        // La référence : c'est ce que les gens se dictent au téléphone
        val ref = PdfPCell(Phrase(dma.reference, fRef))
        ref.border = PdfPCell.BOX
        ref.borderColor = RED
        ref.borderWidth = 1.4f
        ref.horizontalAlignment = Element.ALIGN_CENTER
        ref.verticalAlignment = Element.ALIGN_MIDDLE
        ref.setPadding(7f)
        table.addCell(ref)

        document.add(table)

        // Filet orange sous l'en-tête
        val band = PdfPTable(1)
        band.widthPercentage = 100f
        val cell = PdfPCell(Phrase(" "))
        cell.backgroundColor = ORANGE
        cell.fixedHeight = 3.5f
        cell.border = PdfPCell.NO_BORDER
        band.addCell(cell)
        band.setSpacingBefore(8f)
        document.add(band)
    }

    // ── Bandeau d'état ────────────────────────────────────────────

    private fun addBanner(document: Document, bandeau: Bandeau) {
        val table = PdfPTable(1)
        table.widthPercentage = 100f
        table.setSpacingBefore(10f)
        val cell = PdfPCell(Phrase(bandeau.texte, fBanner))
        cell.backgroundColor = if (bandeau == Bandeau.REJETEE) RED else AMBER
        cell.horizontalAlignment = Element.ALIGN_CENTER
        cell.setPadding(7f)
        cell.border = PdfPCell.NO_BORDER
        table.addCell(cell)
        document.add(table)
    }

    // ── Bloc demandeur / chantier ─────────────────────────────────

    private fun infoCell(label: String, value: String, bold: Boolean = false): PdfPCell {
        val phrase = Phrase()
        phrase.add(Phrase("$label\n", fLabel))
        phrase.add(Phrase(value, if (bold) fValueBold else fValue))
        val cell = PdfPCell(phrase)
        cell.backgroundColor = LIGHT_BG
        cell.borderColor = BORDER
        cell.setPadding(7f)
        return cell
    }

    private fun addInfoBlock(document: Document, dma: DemandeMateriel) {
        val chef = dma.projet.responsableProjet?.let { "${it.prenom} ${it.nom}" } ?: "—"
        val table = PdfPTable(3)
        table.widthPercentage = 100f
        table.setSpacingBefore(12f)
        table.addCell(infoCell("DATE DE LA DEMANDE", dma.createdAt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))))
        table.addCell(infoCell("DEMANDEUR", "${dma.createur.prenom} ${dma.createur.nom} (${dma.createur.matricule})"))
        table.addCell(infoCell("PRIORITÉ", prioriteLabels[dma.priorite] ?: dma.priorite.name,
            bold = dma.priorite == PrioriteDemandeMateriel.URGENTE))
        table.addCell(infoCell("CHANTIER / AFFAIRE", "${dma.projet.codeProjet} — ${dma.projet.nom}", bold = true))
        table.addCell(infoCell("CHEF DE PROJET", chef))
        table.addCell(infoCell("DATE SOUHAITÉE", dma.dateSouhaitee?.format(DATE) ?: "—"))
        val statutCell = infoCell("STATUT ACTUEL", statutLabels[dma.statut] ?: dma.statut.name, bold = true)
        statutCell.colspan = 3
        table.addCell(statutCell)
        document.add(table)
    }

    // ── Tableau des lignes + total estimé ─────────────────────────

    private fun headCell(text: String, align: Int = Element.ALIGN_LEFT): PdfPCell {
        val cell = PdfPCell(Phrase(text, fTableHead))
        cell.backgroundColor = NAVY
        cell.horizontalAlignment = align
        cell.setPadding(6f)
        cell.borderColor = BORDER
        return cell
    }

    private fun bodyCell(text: String, align: Int = Element.ALIGN_LEFT, muted: Boolean = false): PdfPCell {
        val cell = PdfPCell(Phrase(text, if (muted) fCellMuted else fCell))
        cell.horizontalAlignment = align
        cell.setPadding(6f)
        cell.borderColor = BORDER
        return cell
    }

    private fun addLignesTable(document: Document, dma: DemandeMateriel) {
        val avecPrix = dma.lignes.any { it.prixUnitaireEst != null }
        val table = if (avecPrix) PdfPTable(floatArrayOf(4.2f, 1.1f, 0.9f, 1.4f, 1.6f)) else PdfPTable(floatArrayOf(5f, 1.2f, 1f))
        table.widthPercentage = 100f
        table.setSpacingBefore(14f)

        table.addCell(headCell("DÉSIGNATION"))
        table.addCell(headCell("QUANTITÉ", Element.ALIGN_RIGHT))
        table.addCell(headCell("UNITÉ", Element.ALIGN_CENTER))
        if (avecPrix) {
            table.addCell(headCell("P.U. ESTIMÉ", Element.ALIGN_RIGHT))
            table.addCell(headCell("MONTANT EST.", Element.ALIGN_RIGHT))
        }

        var total = BigDecimal.ZERO
        var totalComplet = true
        for (ligne in dma.lignes) {
            val designation = buildString {
                append(ligne.designation)
                ligne.fournisseurSuggere?.takeIf { it.isNotBlank() }?.let { append("\nFournisseur suggéré : $it") }
            }
            table.addCell(bodyCell(designation))
            table.addCell(bodyCell(MONEY.format(ligne.quantite), Element.ALIGN_RIGHT))
            table.addCell(bodyCell(ligne.unite, Element.ALIGN_CENTER))
            if (avecPrix) {
                val pu = ligne.prixUnitaireEst
                if (pu != null) {
                    val montant = pu.multiply(ligne.quantite)
                    total = total.add(montant)
                    table.addCell(bodyCell(MONEY.format(pu), Element.ALIGN_RIGHT))
                    table.addCell(bodyCell(MONEY.format(montant), Element.ALIGN_RIGHT))
                } else {
                    totalComplet = false
                    table.addCell(bodyCell("—", Element.ALIGN_RIGHT, muted = true))
                    table.addCell(bodyCell("—", Element.ALIGN_RIGHT, muted = true))
                }
            }
        }

        if (avecPrix) {
            val label = PdfPCell(Phrase(if (totalComplet) "TOTAL ESTIMÉ (FCFA)" else "TOTAL ESTIMÉ (FCFA, lignes chiffrées)", fTotal))
            label.colspan = 4
            label.horizontalAlignment = Element.ALIGN_RIGHT
            label.setPadding(7f)
            label.backgroundColor = LIGHT_BG
            label.borderColor = BORDER
            table.addCell(label)
            val value = PdfPCell(Phrase(MONEY.format(total), fTotal))
            value.horizontalAlignment = Element.ALIGN_RIGHT
            value.setPadding(7f)
            value.backgroundColor = LIGHT_BG
            value.borderColor = BORDER
            table.addCell(value)
        }
        document.add(table)
    }

    private fun addCommentaire(document: Document, commentaire: String) {
        val table = PdfPTable(1)
        table.widthPercentage = 100f
        table.setSpacingBefore(10f)
        table.addCell(infoCell("OBSERVATIONS", commentaire))
        document.add(table)
    }

    // ── Visas électroniques (historique du workflow) ──────────────

    private fun addVisas(document: Document, dma: DemandeMateriel) {
        val titre = Paragraph("VISAS ÉLECTRONIQUES", fLabel)
        titre.spacingBefore = 16f
        document.add(titre)

        val table = PdfPTable(floatArrayOf(2.2f, 2f, 1.8f, 2.6f))
        table.widthPercentage = 100f
        table.setSpacingBefore(4f)
        table.addCell(headCell("ÉTAPE"))
        table.addCell(headCell("PAR"))
        table.addCell(headCell("LE"))
        table.addCell(headCell("COMMENTAIRE"))

        val transitions = dma.historique.sortedBy { it.dateTransition }
        if (transitions.isEmpty()) {
            val cell = bodyCell("Aucune transition enregistrée", muted = true)
            cell.colspan = 4
            table.addCell(cell)
        }
        for (t in transitions) {
            table.addCell(bodyCell(visaLabels[t.versStatut] ?: t.versStatut.name))
            table.addCell(bodyCell("${t.user.prenom} ${t.user.nom}"))
            table.addCell(bodyCell(t.dateTransition.format(DATE_TIME)))
            table.addCell(bodyCell(t.commentaire?.takeIf { it.isNotBlank() } ?: "—", muted = t.commentaire.isNullOrBlank()))
        }
        document.add(table)
    }

    private fun addFooter(document: Document, dma: DemandeMateriel) {
        val footer = Paragraph(
            "Document généré par la plateforme MIKA Services le " +
                java.time.LocalDateTime.now().format(DATE_TIME) +
                " — les visas ci-dessus sont horodatés électroniquement et font foi. Référence : ${dma.reference}",
            fFooter
        )
        footer.spacingBefore = 18f
        footer.alignment = Element.ALIGN_CENTER
        document.add(footer)
    }
}
