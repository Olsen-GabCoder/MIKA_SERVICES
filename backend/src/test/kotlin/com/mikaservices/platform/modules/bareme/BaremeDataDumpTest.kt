package com.mikaservices.platform.modules.bareme

import com.mikaservices.platform.modules.bareme.repository.CorpsEtatBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.FournisseurBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.LignePrixBaremeRepository
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles

/**
 * Interroge la base (profil dev = MySQL) et affiche toutes les données barème.
 * Désactivé par défaut. Pour lancer : activer le profil dev et exécuter ce test.
 * Exemple : mvn test -Dtest=BaremeDataDumpTest -Dspring.profiles.active=dev
 */
@SpringBootTest
@ActiveProfiles("dev")
class BaremeDataDumpTest {

    @Autowired private lateinit var corpsEtatRepo: CorpsEtatBaremeRepository
    @Autowired private lateinit var fournisseurRepo: FournisseurBaremeRepository
    @Autowired private lateinit var lignePrixRepo: LignePrixBaremeRepository

    @Test
    fun `dump all bareme data to stdout`() {
        val sb = StringBuilder()
        sb.appendLine("========== CORPS D'ÉTAT ==========")
        corpsEtatRepo.findAllByOrderByOrdreAffichageAsc().forEach { c ->
            sb.appendLine("  id=${c.id} | code=${c.code} | libelle=${c.libelle} | ordre=${c.ordreAffichage}")
        }
        sb.appendLine("Total: ${corpsEtatRepo.count()}")

        sb.appendLine("\n========== FOURNISSEURS ==========")
        fournisseurRepo.findAllByOrderByNomAsc().forEach { f ->
            sb.appendLine("  id=${f.id} | nom=${f.nom} | contact=${f.contact}")
        }
        sb.appendLine("Total: ${fournisseurRepo.count()}")

        sb.appendLine("\n========== LIGNES PRIX (échantillon 50 premières) ==========")
        lignePrixRepo.findAll().take(50).forEach { l ->
            sb.appendLine("  id=${l.id} | type=${l.type} | ref=${l.reference} | libelle=${l.libelle?.take(40)} | unite=${l.unite} | prixTtc=${l.prixTtc} | datePrix=${l.datePrix} | fourn=${l.fournisseurBareme?.nom} | contact=${l.contactTexte} | debourse=${l.debourse} | pv=${l.prixVente}")
        }
        sb.appendLine("Total lignes: ${lignePrixRepo.count()}")

        println(sb.toString())
    }
}
