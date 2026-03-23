package com.mikaservices.platform.modules.bareme.service

import com.mikaservices.platform.common.enums.TypeLigneBareme
import com.mikaservices.platform.modules.bareme.entity.CorpsEtatBareme
import com.mikaservices.platform.modules.bareme.entity.FournisseurBareme
import com.mikaservices.platform.modules.bareme.entity.LignePrixBareme
import com.mikaservices.platform.modules.bareme.repository.CorpsEtatBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.FournisseurBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.LignePrixBaremeRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/** Données d'une ligne de décomposition prestation pour le seed */
private data class LignePrestationSeed(
    val libelle: String,
    val qte: BigDecimal,
    val pu: BigDecimal,
    val unite: String,
    val somme: BigDecimal
)

/**
 * Peuplement complet de la base barème avec des données de test (aucun champ vide).
 */
@Service
class BaremeSeedService(
    private val corpsEtatBaremeRepository: CorpsEtatBaremeRepository,
    private val fournisseurBaremeRepository: FournisseurBaremeRepository,
    private val lignePrixBaremeRepository: LignePrixBaremeRepository
) {

    @Transactional
    fun seedAll() {
        lignePrixBaremeRepository.deleteAll()
        fournisseurBaremeRepository.deleteAll()
        corpsEtatBaremeRepository.deleteAll()

        val datePrix = LocalDate.now().minusDays(7).format(DateTimeFormatter.ISO_LOCAL_DATE)

        // 1) Corps d'état
        val corpsEtats = listOf(
            "GO" to "Gros-Œuvre",
            "ELEC" to "Électricité",
            "PLOMB" to "Plomberie",
            "ASS" to "Assainissement",
            "MENU" to "Menuiserie",
            "PEINT" to "Peinture",
            "CARREL" to "Carrelage",
            "COUV" to "Couverture"
        )
        val savedCorps = corpsEtats.mapIndexed { i, (code, libelle) ->
            corpsEtatBaremeRepository.save(
                CorpsEtatBareme(code = code, libelle = libelle, ordreAffichage = i)
            )
        }

        // 2) Fournisseurs
        val fournisseursData = listOf(
            "Bernabé BTP" to "M. Kouma – 06 12 34 56 78",
            "Dupont Matériaux" to "Mme Okou – 07 98 76 54 32",
            "Leroy Gabon" to "M. Mba – 06 11 22 33 44",
            "Point P Libreville" to "Service commercial – 01 76 54 32",
            "Bricomarché" to "Accueil – 01 23 45 67",
            "Socopa" to "M. Ndong – 06 55 44 33 22",
            "Batimat" to "Mme Nze – 07 77 88 99 00"
        )
        val savedFournisseurs = fournisseursData.map { (nom, contact) ->
            fournisseurBaremeRepository.save(FournisseurBareme(nom = nom, contact = contact))
        }

        // 3) Matériaux par corps d'état
        val materiauxParCorps = mapOf(
            "GO" to listOf(
                Triple("REF-GO-001", "Sable 0/4", "m³"),
                Triple("REF-GO-002", "Sable 0/2", "m³"),
                Triple("REF-GO-003", "Gravillon 5/15", "m³"),
                Triple("REF-GO-004", "Ciment CPA 42.5", "t"),
                Triple("REF-GO-005", "Béton prêt à l'emploi", "m³"),
                Triple("REF-GO-006", "Acier HA8", "kg"),
                Triple("REF-GO-007", "Acier HA10", "kg"),
                Triple("REF-GO-008", "Parpaing 15x20x50", "u"),
                Triple("REF-GO-009", "Parpaing 10x20x50", "u"),
                Triple("REF-GO-010", "Brique rouge 5x10x20", "u"),
                Triple("REF-GO-011", "Clous à béton", "kg"),
                Triple("REF-GO-012", "Fil à ligaturer", "kg"),
                Triple("REF-GO-013", "Chape fluide", "m²"),
                Triple("REF-GO-014", "Enduit de lissage", "kg"),
                Triple("REF-GO-015", "Hydrofuge", "L")
            ),
            "ELEC" to listOf(
                Triple("REF-EL-001", "Câble R2V 3x1,5 mm²", "m"),
                Triple("REF-EL-002", "Câble R2V 3x2,5 mm²", "m"),
                Triple("REF-EL-003", "Tableau prééquipé 3 rangées", "u"),
                Triple("REF-EL-004", "Disjoncteur 20A", "u"),
                Triple("REF-EL-005", "Interrupteur simple", "u"),
                Triple("REF-EL-006", "Prise 16A", "u"),
                Triple("REF-EL-007", "Gaine ICTA 20", "m"),
                Triple("REF-EL-008", "Ampoule LED E27", "u"),
                Triple("REF-EL-009", "Plafonnier", "u"),
                Triple("REF-EL-010", "Réglet LED", "m")
            ),
            "PLOMB" to listOf(
                Triple("REF-PL-001", "Tuyau PVC Ø32", "m"),
                Triple("REF-PL-002", "Tuyau PVC Ø40", "m"),
                Triple("REF-PL-003", "Collier de fixation", "u"),
                Triple("REF-PL-004", "Robinet cuivre 15/21", "u"),
                Triple("REF-PL-005", "Lavabo complet", "u"),
                Triple("REF-PL-006", "WC sortie horizontale", "u"),
                Triple("REF-PL-007", "Joint fibre", "rouleau"),
                Triple("REF-PL-008", "Colle PVC", "tube"),
                Triple("REF-PL-009", "Détartrant", "L"),
                Triple("REF-PL-010", "Siphon inox", "u")
            ),
            "ASS" to listOf(
                Triple("REF-AS-001", "Caniveau 100x100", "m"),
                Triple("REF-AS-002", "Regard 300x300", "u"),
                Triple("REF-AS-003", "Tuyau PVC assainissement Ø110", "m"),
                Triple("REF-AS-004", "Fosse septique 3 m³", "u"),
                Triple("REF-AS-005", "Pompe de relevage", "u"),
                Triple("REF-AS-006", "Grille fonte", "u"),
                Triple("REF-AS-007", "Joint caoutchouc", "u"),
                Triple("REF-AS-008", "Bouche d'égout", "u")
            ),
            "MENU" to listOf(
                Triple("REF-ME-001", "Bois rouge 50x75", "m"),
                Triple("REF-ME-002", "Contreplaqué 18 mm", "m²"),
                Triple("REF-ME-003", "Porte isoplane 73x204", "u"),
                Triple("REF-ME-004", "Ferraille de porte", "jeu"),
                Triple("REF-ME-005", "Paumelle 40 mm", "u"),
                Triple("REF-ME-006", "Serrure 3 points", "u"),
                Triple("REF-ME-007", "Linteau bois", "m"),
                Triple("REF-ME-008", "Lambris bois", "m²"),
                Triple("REF-ME-009", "Parquet contrecollé", "m²"),
                Triple("REF-ME-010", "Colle parquet", "L")
            ),
            "PEINT" to listOf(
                Triple("REF-PE-001", "Peinture acrylique mate blanche", "L"),
                Triple("REF-PE-002", "Peinture satinée", "L"),
                Triple("REF-PE-003", "Sous-couche universelle", "L"),
                Triple("REF-PE-004", "Enduit de rebouchage", "kg"),
                Triple("REF-PE-005", "Rouleau laine", "u"),
                Triple("REF-PE-006", "Pinceau 50 mm", "u"),
                Triple("REF-PE-007", "Scotch de masquage", "rouleau"),
                Triple("REF-PE-008", "Diluant", "L")
            ),
            "CARREL" to listOf(
                Triple("REF-CA-001", "Carreau 30x30 cm", "m²"),
                Triple("REF-CA-002", "Carreau 60x60 cm", "m²"),
                Triple("REF-CA-003", "Colle carrelage", "kg"),
                Triple("REF-CA-004", "Joint époxy", "kg"),
                Triple("REF-CA-005", "Croisillon 2 mm", "u"),
                Triple("REF-CA-006", "Ragréage", "kg"),
                Triple("REF-CA-007", "Primaire", "L")
            ),
            "COUV" to listOf(
                Triple("REF-CO-001", "Tôle bac acier", "m²"),
                Triple("REF-CO-002", "Tuile canal", "u"),
                Triple("REF-CO-003", "Liteau 40x40", "m"),
                Triple("REF-CO-004", "Écran sous toiture", "m²"),
                Triple("REF-CO-005", "Clou à toiture", "kg"),
                Triple("REF-CO-006", "Gouttière PVC", "m"),
                Triple("REF-CO-007", "Descente EP", "m")
            )
        )

        var ordreGlobal = 0
        savedCorps.forEach { corps ->
            val code = corpsEtats.find { it.second == corps.libelle }?.first ?: corps.code
            val materiaux = materiauxParCorps[code] ?: emptyList()
            materiaux.forEach { (ref, libelle, unite) ->
                savedFournisseurs.take(4).forEachIndexed { idx, fourn ->
                    val basePrix = 50 + (ordreGlobal % 200) + (idx * 5)
                    lignePrixBaremeRepository.save(
                        LignePrixBareme(
                            corpsEtat = corps,
                            type = TypeLigneBareme.MATERIAU,
                            reference = ref,
                            libelle = libelle,
                            unite = unite,
                            prixTtc = BigDecimal(basePrix + idx * 3),
                            datePrix = datePrix,
                            fournisseurBareme = fourn,
                            contactTexte = fourn.contact,
                            ordreLigne = ordreGlobal++,
                            numeroLigneExcel = ordreGlobal
                        )
                    )
                }
            }

            // Prestations
            val prestations = listOf(
                "Pose chape fluide" to listOf(
                    LignePrestationSeed("Préparation support", BigDecimal("1.00"), BigDecimal("8.50"), "m²", BigDecimal("8.50")),
                    LignePrestationSeed("Chape fluide", BigDecimal("1.00"), BigDecimal("22.00"), "m²", BigDecimal("22.00")),
                    LignePrestationSeed("Séchage", BigDecimal("1.00"), BigDecimal("2.50"), "m²", BigDecimal("2.50"))
                ),
                "Cloison en carreau plâtre" to listOf(
                    LignePrestationSeed("Montants", BigDecimal("3.00"), BigDecimal("4.20"), "m²", BigDecimal("12.60")),
                    LignePrestationSeed("Plaque plâtre", BigDecimal("2.00"), BigDecimal("6.80"), "m²", BigDecimal("13.60")),
                    LignePrestationSeed("Vis", BigDecimal("24.00"), BigDecimal("0.02"), "u", BigDecimal("0.48")),
                    LignePrestationSeed("Enduit joints", BigDecimal("0.50"), BigDecimal("3.20"), "kg", BigDecimal("1.60"))
                ),
                "Peinture murale" to listOf(
                    LignePrestationSeed("Sous-couche", BigDecimal("1.00"), BigDecimal("2.80"), "m²", BigDecimal("2.80")),
                    LignePrestationSeed("Peinture 2 couches", BigDecimal("1.00"), BigDecimal("5.50"), "m²", BigDecimal("5.50"))
                ),
                "Réseau électrique 3 points" to listOf(
                    LignePrestationSeed("Saignée", BigDecimal("3.00"), BigDecimal("4.00"), "m", BigDecimal("12.00")),
                    LignePrestationSeed("Câblage", BigDecimal("3.00"), BigDecimal("6.50"), "m", BigDecimal("19.50")),
                    LignePrestationSeed("Pose prises et interrupteur", BigDecimal("3.00"), BigDecimal("12.00"), "u", BigDecimal("36.00"))
                ),
                "Évacuation eaux usées" to listOf(
                    LignePrestationSeed("Tuyauterie PVC", BigDecimal("5.00"), BigDecimal("8.00"), "m", BigDecimal("40.00")),
                    LignePrestationSeed("Regard", BigDecimal("1.00"), BigDecimal("45.00"), "u", BigDecimal("45.00"))
                )
            )

            prestations.forEach { (titre, lignes) ->
                val entete = lignePrixBaremeRepository.save(
                    LignePrixBareme(
                        corpsEtat = corps,
                        type = TypeLigneBareme.PRESTATION_ENTETE,
                        libelle = titre,
                        parent = null,
                        ordreLigne = ordreGlobal++,
                        numeroLigneExcel = ordreGlobal
                    )
                )
                var sommeTotal = BigDecimal.ZERO
                lignes.forEach { ligne ->
                    sommeTotal = sommeTotal.add(ligne.somme)
                    lignePrixBaremeRepository.save(
                        LignePrixBareme(
                            corpsEtat = corps,
                            type = TypeLigneBareme.PRESTATION_LIGNE,
                            libelle = ligne.libelle,
                            quantite = ligne.qte,
                            prixUnitaire = ligne.pu,
                            unitePrestation = ligne.unite,
                            somme = ligne.somme,
                            parent = entete,
                            ordreLigne = ordreGlobal++,
                            numeroLigneExcel = ordreGlobal
                        )
                    )
                }
                val debourse = sommeTotal
                val pv = sommeTotal.multiply(BigDecimal("1.35")).setScale(2, java.math.RoundingMode.HALF_UP)
                lignePrixBaremeRepository.save(
                    LignePrixBareme(
                        corpsEtat = corps,
                        type = TypeLigneBareme.PRESTATION_TOTAL,
                        libelle = "Total $titre",
                        unitePrestation = "forfait",
                        debourse = debourse,
                        prixVente = pv,
                        coefficientPv = BigDecimal("1.35"),
                        parent = entete,
                        ordreLigne = ordreGlobal++,
                        numeroLigneExcel = ordreGlobal
                    )
                )
            }
        }
    }
}
