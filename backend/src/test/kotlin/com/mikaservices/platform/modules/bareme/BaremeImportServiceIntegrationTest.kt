package com.mikaservices.platform.modules.bareme

import com.mikaservices.platform.modules.bareme.repository.CoefficientEloignementRepository
import com.mikaservices.platform.modules.bareme.repository.CorpsEtatBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.LignePrixBaremeRepository
import com.mikaservices.platform.modules.bareme.service.BaremeImportService
import org.apache.poi.hssf.usermodel.HSSFWorkbook
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream

/**
 * Test d'intégration : import d'un Excel barème minimal (créé en mémoire),
 * vérification des comptes en base.
 */
@SpringBootTest
@ActiveProfiles("test")
class BaremeImportServiceIntegrationTest {

    @Autowired
    private lateinit var baremeImportService: BaremeImportService

    @Autowired
    private lateinit var coefficientRepo: CoefficientEloignementRepository

    @Autowired
    private lateinit var corpsEtatRepo: CorpsEtatBaremeRepository

    @Autowired
    private lateinit var lignePrixRepo: LignePrixBaremeRepository

    @Test
    fun `import Excel minimal - coefficients et une feuille corps d'etat`() {
        val workbook = HSSFWorkbook()
        try {
            // Feuille 0 : coefficients d'éloignement (en-têtes lignes 0-2, données à partir de 3)
            val sheet0 = workbook.createSheet("Coef d'éloignement")
            sheet0.createRow(0).createCell(0).setCellValue("Ville")
            sheet0.createRow(1).createCell(0).setCellValue("%")
            sheet0.createRow(2).createCell(0).setCellValue("Coef")
            sheet0.createRow(3).createCell(0).setCellValue("LIBREVILLE")
            sheet0.getRow(3).createCell(1).setCellValue(0.0)
            sheet0.getRow(3).createCell(2).setCellValue(1.0)
            sheet0.createRow(4).createCell(0).setCellValue("COCOBEACH")
            sheet0.getRow(4).createCell(1).setCellValue(5.0)
            sheet0.getRow(4).createCell(2).setCellValue(1.05)

            // Feuille 1 : Gros-Oeuvre (en-têtes 0-2, données à partir de 3)
            val sheet1 = workbook.createSheet("Gros-Oeuvre")
            sheet1.createRow(0).createCell(0).setCellValue("N°")
            sheet1.createRow(3).createCell(1).setCellValue("13")
            sheet1.getRow(3).createCell(2).setCellValue("Sable")
            sheet1.getRow(3).createCell(3).setCellValue("m3")
            sheet1.getRow(3).createCell(4).setCellValue(12500.0)
            sheet1.getRow(3).createCell(6).setCellValue("Transp")

            val out = ByteArrayOutputStream()
            workbook.write(out)
            workbook.close()

            val result = baremeImportService.importFromInputStream(ByteArrayInputStream(out.toByteArray()))

            assertTrue(result.coefficientsCount >= 2, "Au moins 2 coefficients")
            assertTrue(result.corpsEtatCount >= 1, "Au moins 1 corps d'état")
            assertTrue(result.lignesCount >= 1, "Au moins 1 ligne de prix")

            assertTrue(coefficientRepo.count() >= 2)
            assertTrue(corpsEtatRepo.count() >= 1)
            assertTrue(lignePrixRepo.count() >= 1)
        } finally {
            workbook.close()
        }
    }
}
