package com.mikaservices.platform.modules.qualite.service

import com.mikaservices.platform.modules.qualite.dto.response.*
import com.mikaservices.platform.modules.qualite.enums.*
import com.mikaservices.platform.modules.qualite.repository.AgrementMarcheRepository
import com.mikaservices.platform.modules.qualite.repository.DemandeReceptionRepository
import com.mikaservices.platform.modules.qualite.repository.EssaiLaboBetonRepository
import com.mikaservices.platform.modules.qualite.repository.EvenementQualiteRepository
import com.mikaservices.platform.modules.qualite.repository.LeveeTopoRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import jakarta.persistence.EntityNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.math.round

@Service
@Transactional(readOnly = true)
class SyntheseMensuelleService(
    private val projetRepository: ProjetRepository,
    private val receptionRepository: DemandeReceptionRepository,
    private val essaiLaboRepository: EssaiLaboBetonRepository,
    private val leveeTopoRepository: LeveeTopoRepository,
    private val agrementRepository: AgrementMarcheRepository,
    private val evenementRepository: EvenementQualiteRepository,
) {

    fun generer(projetId: Long?, mois: String): SyntheseMensuelleResponse {
        if (projetId != null) {
            val projet = projetRepository.findById(projetId)
                .orElseThrow { EntityNotFoundException("Projet $projetId introuvable") }
            return SyntheseMensuelleResponse(
                projetId = projet.id!!,
                projetNom = projet.nom,
                moisReference = mois,
                receptions = buildReceptions(projetId, mois),
                essaisLabo = buildEssaisLabo(projetId, mois),
                leveeTopo = buildLeveeTopo(projetId, mois),
                agrements = buildAgrements(projetId, mois),
                ncSynthese = buildNcSynthese(projetId),
            )
        }
        // Vue globale : agrège tous les projets
        return SyntheseMensuelleResponse(
            projetId = null,
            projetNom = null,
            moisReference = mois,
            receptions = buildReceptionsGlobal(mois),
            essaisLabo = buildEssaisLaboGlobal(mois),
            leveeTopo = buildLeveeTopoGlobal(mois),
            agrements = buildAgrementsGlobal(mois),
            ncSynthese = buildNcSyntheseGlobal(),
        )
    }

    /** Blocs 1-3 : agrégation DemandeReception par nature × sous-type × statut */
    private fun buildReceptions(projetId: Long, mois: String): List<BlocReceptionSynthese> {
        val results = mutableListOf<BlocReceptionSynthese>()
        for (nature in NatureReception.entries) {
            for (sousType in SousTypeReception.entries) {
                val rows = receptionRepository.countByProjetAndNatureAndSousTypeAndMois(
                    projetId, nature, sousType, mois
                )
                val parStatut = mutableMapOf<StatutReception, Long>()
                var total = 0L
                for (row in rows) {
                    val statut = row[0] as StatutReception
                    val count = row[1] as Long
                    parStatut[statut] = count
                    total += count
                }
                val stats = if (total > 0) {
                    parStatut.mapValues { (_, v) -> round(v.toDouble() / total * 10000) / 100 }
                } else emptyMap()
                results.add(BlocReceptionSynthese(nature, sousType, total, parStatut, stats))
            }
        }
        return results
    }

    /** Bloc 4 : lecture directe EssaiLaboratoireBeton du mois */
    private fun buildEssaisLabo(projetId: Long, mois: String): EssaisLaboSynthese? {
        return essaiLaboRepository.findByProjetIdAndMoisReference(projetId, mois)
            .map { e ->
                EssaisLaboSynthese(
                    nbCamionsMalaxeursVolumeCoulee = e.nbCamionsMalaxeursVolumeCoulee,
                    nbEssaisSlump = e.nbEssaisSlump,
                    nbJoursCoulage = e.nbJoursCoulage,
                    nbPrelevements = e.nbPrelevements,
                    observations = e.observations,
                )
            }.orElse(null)
    }

    /** Bloc 5 : lecture directe LeveeTopographique du mois */
    private fun buildLeveeTopo(projetId: Long, mois: String): LeveeTopoSynthese? {
        return leveeTopoRepository.findByProjetIdAndMoisReference(projetId, mois)
            .map { e ->
                LeveeTopoSynthese(
                    nbProfilsImplantes = e.nbProfilsImplantes,
                    nbProfilsReceptionnes = e.nbProfilsReceptionnes,
                    nbControlesRealises = e.nbControlesRealises,
                    observations = e.observations,
                )
            }.orElse(null)
    }

    /** Bloc 6 : agrégation AgrementMarche par statut */
    private fun buildAgrements(projetId: Long, mois: String): AgrementsSynthese {
        val rows = agrementRepository.countByProjetAndMois(projetId, mois)
        val parStatut = mutableMapOf<StatutAgrement, Long>()
        var total = 0L
        for (row in rows) {
            val statut = row[0] as StatutAgrement
            val count = row[1] as Long
            parStatut[statut] = count
            total += count
        }
        val stats = if (total > 0) {
            parStatut.mapValues { (_, v) -> round(v.toDouble() / total * 10000) / 100 }
        } else emptyMap()
        return AgrementsSynthese(total, parStatut, stats)
    }

    /** Encart NC : comptage global EvenementQualite pour le projet */
    private fun buildNcSynthese(projetId: Long): NcSynthese {
        val rows = evenementRepository.countByProjetGroupByStatut(projetId)
        return toNcSynthese(rows)
    }

    // ==================== Méthodes globales (tous projets) ====================

    private fun buildReceptionsGlobal(mois: String): List<BlocReceptionSynthese> {
        val results = mutableListOf<BlocReceptionSynthese>()
        for (nature in NatureReception.entries) {
            for (sousType in SousTypeReception.entries) {
                val rows = receptionRepository.countByNatureAndSousTypeAndMois(nature, sousType, mois)
                val parStatut = mutableMapOf<StatutReception, Long>()
                var total = 0L
                for (row in rows) {
                    val statut = row[0] as StatutReception
                    val count = row[1] as Long
                    parStatut[statut] = count
                    total += count
                }
                val stats = if (total > 0) {
                    parStatut.mapValues { (_, v) -> round(v.toDouble() / total * 10000) / 100 }
                } else emptyMap()
                results.add(BlocReceptionSynthese(nature, sousType, total, parStatut, stats))
            }
        }
        return results
    }

    private fun buildEssaisLaboGlobal(mois: String): EssaisLaboSynthese? {
        val essais = essaiLaboRepository.findByMoisReference(mois)
        if (essais.isEmpty()) return null
        return EssaisLaboSynthese(
            nbCamionsMalaxeursVolumeCoulee = essais.sumOf { it.nbCamionsMalaxeursVolumeCoulee },
            nbEssaisSlump = essais.sumOf { it.nbEssaisSlump },
            nbJoursCoulage = essais.sumOf { it.nbJoursCoulage },
            nbPrelevements = essais.sumOf { it.nbPrelevements },
            observations = null,
        )
    }

    private fun buildLeveeTopoGlobal(mois: String): LeveeTopoSynthese? {
        val levees = leveeTopoRepository.findByMoisReference(mois)
        if (levees.isEmpty()) return null
        return LeveeTopoSynthese(
            nbProfilsImplantes = levees.sumOf { it.nbProfilsImplantes },
            nbProfilsReceptionnes = levees.sumOf { it.nbProfilsReceptionnes },
            nbControlesRealises = levees.sumOf { it.nbControlesRealises },
            observations = null,
        )
    }

    private fun buildAgrementsGlobal(mois: String): AgrementsSynthese {
        val rows = agrementRepository.countByMois(mois)
        val parStatut = mutableMapOf<StatutAgrement, Long>()
        var total = 0L
        for (row in rows) {
            val statut = row[0] as StatutAgrement
            val count = row[1] as Long
            parStatut[statut] = count
            total += count
        }
        val stats = if (total > 0) {
            parStatut.mapValues { (_, v) -> round(v.toDouble() / total * 10000) / 100 }
        } else emptyMap()
        return AgrementsSynthese(total, parStatut, stats)
    }

    private fun buildNcSyntheseGlobal(): NcSynthese {
        val rows = evenementRepository.countAllGroupByStatut()
        return toNcSynthese(rows)
    }

    private fun toNcSynthese(rows: List<Array<Any>>): NcSynthese {
        val parStatut = mutableMapOf<StatutEvenement, Long>()
        for (row in rows) {
            parStatut[row[0] as StatutEvenement] = row[1] as Long
        }
        val total = parStatut.values.sum()
        val traitees = (parStatut[StatutEvenement.CLOTUREE] ?: 0) +
                       (parStatut[StatutEvenement.ANALYSEE] ?: 0) +
                       (parStatut[StatutEvenement.LEVEE] ?: 0)
        return NcSynthese(
            enregistrees = total,
            traitees = traitees,
            ouvertes = total - traitees,
            parStatut = parStatut,
        )
    }
}
