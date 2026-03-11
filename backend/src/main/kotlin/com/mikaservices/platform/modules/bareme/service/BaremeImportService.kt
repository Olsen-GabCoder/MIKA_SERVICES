package com.mikaservices.platform.modules.bareme.service

import com.mikaservices.platform.common.enums.TypeLigneBareme
import com.mikaservices.platform.modules.bareme.entity.CoefficientEloignement
import com.mikaservices.platform.modules.bareme.entity.CorpsEtatBareme
import com.mikaservices.platform.modules.bareme.entity.FournisseurBareme
import com.mikaservices.platform.modules.bareme.entity.LignePrixBareme
import com.mikaservices.platform.modules.bareme.repository.CoefficientEloignementRepository
import com.mikaservices.platform.modules.bareme.repository.CorpsEtatBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.FournisseurBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.LignePrixBaremeRepository
import org.apache.poi.ss.usermodel.Cell
import org.apache.poi.ss.usermodel.CellType
import org.apache.poi.ss.usermodel.Row
import org.apache.poi.ss.usermodel.Sheet
import org.apache.poi.ss.usermodel.WorkbookFactory
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.InputStream
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * Import des données du barème bâtiment depuis le fichier Excel (.xls / .xlsx).
 * - Feuille 0 : coefficients d'éloignement (ville, %, coef, note).
 * - Feuilles 1 à 15 : corps d'état avec lignes matériaux et prestations (sous-détails).
 */
@Service
class BaremeImportService(
    private val coefficientEloignementRepository: CoefficientEloignementRepository,
    private val corpsEtatBaremeRepository: CorpsEtatBaremeRepository,
    private val fournisseurBaremeRepository: FournisseurBaremeRepository,
    private val lignePrixBaremeRepository: LignePrixBaremeRepository
) {
    private val logger = LoggerFactory.getLogger(BaremeImportService::class.java)

    data class ImportResult(
        var coefficientsCount: Int = 0,
        var corpsEtatCount: Int = 0,
        var fournisseursCount: Int = 0,
        var lignesCount: Int = 0,
        val errors: MutableList<String> = mutableListOf()
    )

    @Transactional
    fun importFromInputStream(inputStream: InputStream): ImportResult {
        val result = ImportResult()
        inputStream.use { stream ->
            val workbook = WorkbookFactory.create(stream)
            try {
                // 1) Supprimer les données existantes (ordre FK)
                lignePrixBaremeRepository.deleteAll()
                coefficientEloignementRepository.deleteAll()
                fournisseurBaremeRepository.deleteAll()
                corpsEtatBaremeRepository.deleteAll()

                // 2) Feuille 0 — Coefficients d'éloignement
                if (workbook.numberOfSheets > 0) {
                    val sheet0 = workbook.getSheetAt(0)
                    importCoefficientsEloignement(sheet0, result)
                }

                // 3) Feuilles 1 à 15 — Corps d'état et lignes de prix
                val corpsEtatSheetStart = 1
                val corpsEtatSheetEnd = minOf(16, workbook.numberOfSheets)
                for (sheetIndex in corpsEtatSheetStart until corpsEtatSheetEnd) {
                    val sheet = workbook.getSheetAt(sheetIndex)
                    val sheetName = sheet.sheetName
                    if (sheetName.isBlank() || sheetName.equals("Sheet1", ignoreCase = true)) continue
                    val corpsEtat = getOrCreateCorpsEtat(sheetName, sheetIndex, result)
                    importLignesCorpsEtat(sheet, corpsEtat, result)
                }
                result.corpsEtatCount = corpsEtatBaremeRepository.count().toInt()
                result.fournisseursCount = fournisseurBaremeRepository.count().toInt()
                result.lignesCount = lignePrixBaremeRepository.count().toInt()
            } finally {
                workbook.close()
            }
        }
        logger.info("Import barème terminé: ${result.coefficientsCount} coef, ${result.corpsEtatCount} corps, ${result.fournisseursCount} fournisseurs, ${result.lignesCount} lignes")
        return result
    }

    private fun importCoefficientsEloignement(sheet: Sheet, result: ImportResult) {
        // En-têtes lignes 0-2, données à partir de la ligne 3. Colonnes: 0=Ville, 1=%, 2=Coef, 3=Note
        // Tous les vides sont remplis pour ne laisser aucun champ vide.
        var count = 0
        for (rowIndex in 3 until sheet.lastRowNum + 1) {
            val row = sheet.getRow(rowIndex) ?: continue
            val villeRaw = cellString(row.getCell(0))?.trim()
            val pctRaw = cellNumeric(row.getCell(1))?.toBigDecimal()?.setScale(2, RoundingMode.HALF_UP)
            val coefRaw = cellNumeric(row.getCell(2))?.toBigDecimal()?.setScale(2, RoundingMode.HALF_UP)
            val noteRaw = cellString(row.getCell(3))?.trim()
            // Ignorer uniquement les lignes totalement vides (aucune donnée)
            if (villeRaw.isNullOrBlank() && pctRaw == null && coefRaw == null) continue
            // Sinon remplir les champs vides
            val ville = (villeRaw?.take(100)?.takeIf { it.isNotBlank() }) ?: "—"
            val pct = pctRaw ?: BigDecimal.ZERO
            val coef = coefRaw ?: BigDecimal.ONE
            val note = (noteRaw?.take(2000)?.takeIf { it.isNotBlank() }) ?: "—"
            coefficientEloignementRepository.save(
                CoefficientEloignement(
                    nom = ville,
                    pourcentage = pct,
                    coefficient = coef,
                    note = note,
                    ordreAffichage = count
                )
            )
            count++
        }
        result.coefficientsCount = count
    }

    private fun getOrCreateCorpsEtat(sheetName: String, ordre: Int, result: ImportResult): CorpsEtatBareme {
        val code = sheetName.uppercase().replace(Regex("[^A-Z0-9_]"), "_").take(80)
        return corpsEtatBaremeRepository.findByCode(code)
            ?: corpsEtatBaremeRepository.save(
                CorpsEtatBareme(code = code, libelle = sheetName.take(200), ordreAffichage = ordre)
            )
    }

    /** Fournisseur utilisé quand le nom est vide dans l'Excel (aucun fournisseur laissé vide). */
    private fun getOrCreateDefaultFournisseur(): FournisseurBareme {
        return fournisseurBaremeRepository.findByNomIgnoreCase("Non renseigné")
            ?: fournisseurBaremeRepository.save(
                FournisseurBareme(nom = "Non renseigné", contact = "—")
            )
    }

    private fun getOrCreateFournisseur(nom: String?, contact: String?): FournisseurBareme {
        val n = (nom?.trim() ?: "").take(200)
        if (n.isBlank()) return getOrCreateDefaultFournisseur()
        return fournisseurBaremeRepository.findByNomIgnoreCase(n)
            ?: fournisseurBaremeRepository.save(
                FournisseurBareme(nom = n, contact = (contact?.trim()?.take(100)) ?: "—")
            )
    }

    private fun importLignesCorpsEtat(sheet: Sheet, corpsEtat: CorpsEtatBareme, result: ImportResult) {
        // Colonnes: 0=Col1(G.), 1=N°, 2=Matériaux, 3=U, 4=P.TTC, 5=Date, 6=Fournisseurs, 7=Contacts,
        //          8=Libellé, 9=Qté, 10=P.U, 11=U, 12=Sommes, 13=Déboursé, 14=P.V, 15=Coef
        var ordreLigne = 0
        var currentParent: LignePrixBareme? = null
        val dataStartRow = 3
        for (rowIndex in dataStartRow until sheet.lastRowNum + 1) {
            val row = sheet.getRow(rowIndex) ?: continue
            val ref = cellString(row.getCell(1))
            val materiaux = cellString(row.getCell(2))
            val u = cellString(row.getCell(3))
            val prixTtc = cellNumeric(row.getCell(4))
            val datePrix = cellString(row.getCell(5))
            val fournisseurNom = cellString(row.getCell(6))
            val contact = cellString(row.getCell(7))
            val libelle = cellString(row.getCell(8))
            val qte = cellNumeric(row.getCell(9))
            val pu = cellNumeric(row.getCell(10))
            val u2 = cellString(row.getCell(11))
            val sommes = cellNumeric(row.getCell(12))
            val debourse = cellNumeric(row.getCell(13))
            val pv = cellNumeric(row.getCell(14))
            val coefPv = cellNumeric(row.getCell(15))

            val hasMaterial = materiaux?.trim()?.isNotEmpty() == true &&
                (prixTtc != null || fournisseurNom?.trim()?.isNotEmpty() == true)
            val hasPrestationLibelle = libelle?.trim()?.isNotEmpty() == true
            val hasPrestationDetail = qte != null && pu != null
            val hasPrestationTotal = debourse != null || pv != null

            // coefficient_pv = DECIMAL(4,2), typiquement 1.4 ou 1.6 ; ignorer si > 10 (souvent P.V lu en colonne 15)
            val coefPvSafe = coefPv?.takeIf { it in 0.0..10.0 }?.toBigDecimal()?.setScale(2, RoundingMode.HALF_UP)

            // 1) Ligne matériau (gauche) — tous les vides sont remplis
            if (hasMaterial) {
                val fourn = getOrCreateFournisseur(fournisseurNom, contact)
                val ligne = LignePrixBareme(
                    corpsEtat = corpsEtat,
                    type = TypeLigneBareme.MATERIAU,
                    reference = (ref?.trim()?.take(50)?.takeIf { it.isNotBlank() }) ?: "—",
                    libelle = materiaux.trim().take(2000),
                    unite = (u?.trim()?.take(20)?.takeIf { it.isNotBlank() }) ?: "u",
                    prixTtc = prixTtc?.toBigDecimal()?.setScale(2, RoundingMode.HALF_UP) ?: BigDecimal.ZERO,
                    datePrix = (datePrix?.trim()?.take(50)?.takeIf { it.isNotBlank() }) ?: LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE),
                    fournisseurBareme = fourn,
                    contactTexte = (contact?.trim()?.take(100)?.takeIf { it.isNotBlank() }) ?: "—",
                    ordreLigne = ordreLigne++,
                    numeroLigneExcel = rowIndex + 1
                )
                lignePrixBaremeRepository.save(ligne)
            }

            // 2) Ligne prestation (droite) : entête / ligne décomposition / total
            when {
                hasPrestationTotal && hasPrestationDetail.not() && hasPrestationLibelle.not() -> {
                    // Ligne total seule (Déboursé / P.V) — vides remplis
                    val totalLine = LignePrixBareme(
                        corpsEtat = corpsEtat,
                        type = TypeLigneBareme.PRESTATION_TOTAL,
                        libelle = (libelle?.trim()?.take(2000)?.takeIf { it.isNotBlank() }) ?: "—",
                        unitePrestation = (u2?.trim()?.take(20)?.takeIf { it.isNotBlank() }) ?: "u",
                        somme = sommes?.toBigDecimal()?.setScale(2, RoundingMode.HALF_UP) ?: BigDecimal.ZERO,
                        debourse = debourse?.toBigDecimal()?.setScale(2, RoundingMode.HALF_UP) ?: BigDecimal.ZERO,
                        prixVente = pv?.toBigDecimal()?.setScale(2, RoundingMode.HALF_UP) ?: BigDecimal.ZERO,
                        coefficientPv = coefPvSafe ?: BigDecimal.ONE,
                        parent = currentParent,
                        ordreLigne = ordreLigne++,
                        numeroLigneExcel = rowIndex + 1
                    )
                    lignePrixBaremeRepository.save(totalLine)
                    currentParent = null
                }
                hasPrestationTotal && (hasPrestationDetail || hasPrestationLibelle == true) -> {
                    // Même ligne contient détail ou libellé + total — vides remplis
                    if (hasPrestationDetail && qte != null && pu != null) {
                        val qteBd = qte.toBigDecimal().setScale(4, RoundingMode.HALF_UP)
                        val puBd = pu.toBigDecimal().setScale(2, RoundingMode.HALF_UP)
                        val sommeBd = sommes?.toBigDecimal()?.setScale(2, RoundingMode.HALF_UP) ?: qteBd.multiply(puBd).setScale(2, RoundingMode.HALF_UP)
                        val child = LignePrixBareme(
                            corpsEtat = corpsEtat,
                            type = TypeLigneBareme.PRESTATION_LIGNE,
                            libelle = (libelle?.trim()?.take(2000)?.takeIf { it.isNotBlank() }) ?: "—",
                            quantite = qteBd,
                            prixUnitaire = puBd,
                            unitePrestation = (u2?.trim()?.take(20)?.takeIf { it.isNotBlank() }) ?: "u",
                            somme = sommeBd,
                            parent = currentParent,
                            ordreLigne = ordreLigne++,
                            numeroLigneExcel = rowIndex + 1
                        )
                        lignePrixBaremeRepository.save(child)
                    }
                    val totalLine = LignePrixBareme(
                        corpsEtat = corpsEtat,
                        type = TypeLigneBareme.PRESTATION_TOTAL,
                        libelle = (if (hasPrestationDetail.not()) libelle?.trim()?.take(2000) else null)?.takeIf { it.isNotBlank() } ?: "—",
                        unitePrestation = (u2?.trim()?.take(20)?.takeIf { it.isNotBlank() }) ?: "u",
                        debourse = debourse?.toBigDecimal()?.setScale(2, RoundingMode.HALF_UP) ?: BigDecimal.ZERO,
                        prixVente = pv?.toBigDecimal()?.setScale(2, RoundingMode.HALF_UP) ?: BigDecimal.ZERO,
                        coefficientPv = coefPvSafe ?: BigDecimal.ONE,
                        parent = currentParent,
                        ordreLigne = ordreLigne++,
                        numeroLigneExcel = rowIndex + 1
                    )
                    lignePrixBaremeRepository.save(totalLine)
                    currentParent = null
                }
                hasPrestationDetail && qte != null && pu != null -> {
                    val qteBd = qte.toBigDecimal().setScale(4, RoundingMode.HALF_UP)
                    val puBd = pu.toBigDecimal().setScale(2, RoundingMode.HALF_UP)
                    val sommeBd = sommes?.toBigDecimal()?.setScale(2, RoundingMode.HALF_UP) ?: qteBd.multiply(puBd).setScale(2, RoundingMode.HALF_UP)
                    val child = LignePrixBareme(
                        corpsEtat = corpsEtat,
                        type = TypeLigneBareme.PRESTATION_LIGNE,
                        libelle = (libelle?.trim()?.take(2000)?.takeIf { it.isNotBlank() }) ?: "—",
                        quantite = qteBd,
                        prixUnitaire = puBd,
                        unitePrestation = (u2?.trim()?.take(20)?.takeIf { it.isNotBlank() }) ?: "u",
                        somme = sommeBd,
                        parent = currentParent,
                        ordreLigne = ordreLigne++,
                        numeroLigneExcel = rowIndex + 1
                    )
                    lignePrixBaremeRepository.save(child)
                }
                hasPrestationLibelle && hasPrestationDetail.not() && hasPrestationTotal.not() -> {
                    // Titre de bloc prestation (entête) — vide rempli
                    val entete = LignePrixBareme(
                        corpsEtat = corpsEtat,
                        type = TypeLigneBareme.PRESTATION_ENTETE,
                        libelle = (libelle?.trim()?.take(2000)?.takeIf { it.isNotBlank() }) ?: "—",
                        parent = null,
                        ordreLigne = ordreLigne++,
                        numeroLigneExcel = rowIndex + 1
                    )
                    val saved = lignePrixBaremeRepository.save(entete)
                    currentParent = saved
                }
            }
        }
    }

    private fun cellString(cell: Cell?): String? {
        if (cell == null) return null
        return when (cell.cellType) {
            CellType.STRING -> cell.stringCellValue?.trim()?.takeIf { it.isNotEmpty() }
            CellType.NUMERIC -> {
                val n = cell.numericCellValue
                if (n == n.toLong().toDouble()) n.toLong().toString() else n.toString()
            }
            CellType.BOOLEAN -> cell.booleanCellValue.toString()
            CellType.FORMULA -> try {
                when (cell.cachedFormulaResultType) {
                    CellType.STRING -> cell.stringCellValue?.trim()?.takeIf { it.isNotEmpty() }
                    CellType.NUMERIC -> cell.numericCellValue.toString()
                    else -> null
                }
            } catch (_: Exception) { null }
            else -> null
        }
    }

    private fun cellNumeric(cell: Cell?): Double? {
        if (cell == null) return null
        return when (cell.cellType) {
            CellType.NUMERIC -> cell.numericCellValue
            CellType.STRING -> cell.stringCellValue?.trim()?.replace(',', '.')?.toDoubleOrNull()
            CellType.FORMULA -> try {
                if (cell.cachedFormulaResultType == CellType.NUMERIC) cell.numericCellValue else null
            } catch (_: Exception) { null }
            else -> null
        }
    }
}
