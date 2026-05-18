package com.mikaservices.platform.modules.reporting.service

import com.mikaservices.platform.common.enums.*
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.service.ProjetService
import com.mikaservices.platform.modules.budget.repository.DepenseRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.MateriauRepository
import com.mikaservices.platform.modules.planning.repository.TacheRepository
import com.mikaservices.platform.modules.projet.repository.PrevisionRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.projet.repository.CAPrevisionnelRealiseRepository
import com.mikaservices.platform.modules.qshe.repository.IncidentRepository
import com.mikaservices.platform.modules.qshe.repository.RisqueRepository
import com.mikaservices.platform.modules.qualite.repository.EvenementQualiteRepository
import com.mikaservices.platform.modules.reporting.dto.response.*
import com.mikaservices.platform.modules.qualite.enums.StatutEvenement
import com.mikaservices.platform.modules.qshe.enums.GraviteIncident
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.time.temporal.IsoFields
import kotlin.math.round

@Service
@Transactional(readOnly = true)
class ReportingService(
    private val projetService: ProjetService,
    private val projetRepository: ProjetRepository,
    private val depenseRepository: DepenseRepository,
    private val tacheRepository: TacheRepository,
    private val previsionRepository: PrevisionRepository,
    private val enginRepository: EnginRepository,
    private val materiauRepository: MateriauRepository,
    private val incidentRepository: IncidentRepository,
    private val risqueRepository: RisqueRepository,
    private val evenementQualiteRepository: EvenementQualiteRepository,
    private val caRepository: CAPrevisionnelRealiseRepository
) {

    fun getGlobalDashboard(): GlobalDashboardResponse {
        return GlobalDashboardResponse(
            projets = getProjetStats(),
            chantiers = getChantierStats(),
            budget = getGlobalBudgetStats(),
            planning = getGlobalPlanningStats(),
            qualite = getGlobalQualiteStats(),
            securite = getGlobalSecuriteStats(),
            materiel = getMaterielStats(),
            weeklyProgress = getWeeklyProgressStats()
        )
    }

    fun getProjetReport(projetId: Long): ProjetReportResponse {
        val projet = projetService.requireCanViewProjet(projetId)

        val budgetPrevu = projet.montantRevise ?: projet.montantHT ?: projet.montantInitial ?: BigDecimal.ZERO
        val depenses = depenseRepository.sumMontantByProjetId(projetId)
        val ecart = budgetPrevu.subtract(depenses)
        val tauxConso = if (budgetPrevu > BigDecimal.ZERO) {
            depenses.divide(budgetPrevu, 4, RoundingMode.HALF_UP).multiply(BigDecimal(100)).toDouble()
        } else 0.0

        val tachesTotal = listOf(
            StatutTache.A_FAIRE,
            StatutTache.EN_COURS,
            StatutTache.TERMINEE,
            StatutTache.EN_ATTENTE,
            StatutTache.ANNULEE
        ).sumOf { tacheRepository.countByProjetIdAndStatut(projetId, it).toLong() }
        val tachesTerminees = tacheRepository.countByProjetIdAndStatut(projetId, StatutTache.TERMINEE)
        val tachesEnCours = tacheRepository.countByProjetIdAndStatut(projetId, StatutTache.EN_COURS)
        val tauxAvancement = if (tachesTotal > 0) (tachesTerminees.toDouble() / tachesTotal * 100) else 0.0

        val today = LocalDate.now()
        val tachesEnRetard = tacheRepository.findByProjetIdAndStatut(projetId, StatutTache.EN_COURS).count { t ->
            t.dateEcheance != null && t.dateEcheance!!.isBefore(today)
        }.toLong()

        val projetSecurite = getProjetSecuriteStats(projetId)
        val projetQualite = getProjetQualiteStats(projetId)

        return ProjetReportResponse(
            projetId = projet.id!!,
            projetNom = projet.nom,
            statut = projet.statut.name,
            budget = BudgetStats(budgetPrevu, depenses, ecart, round(tauxConso * 100.0) / 100.0),
            planning = PlanningStats(tachesTotal, tachesTerminees, tachesEnCours, tachesEnRetard, round(tauxAvancement * 100.0) / 100.0),
            qualite = projetQualite,
            securite = projetSecurite,
            nbChantiers = 0L
        )
    }

    // ==================== Stats privées ====================

    @Suppress("SENSELESS_COMPARISON")
    private fun getProjetStats(): ProjetStats {
        val all = projetRepository.findAll().filter { it.actif }
        val today = LocalDate.now()
        val enRetard = all.count { p ->
            p.statut == StatutProjet.EN_COURS_EXECUTION && p.dateFin != null && p.dateFin!!.isBefore(today)
        }.toLong()

        val montantTotal = all.fold(BigDecimal.ZERO) { acc, p ->
            val ht = try { p.montantHT } catch (_: Exception) { null }
            acc.add(ht ?: BigDecimal.ZERO)
        }

        val avancementMoyen = if (all.isNotEmpty()) {
            val values = all.map { p ->
                val av = try { p.avancementGlobal } catch (_: Exception) { null }
                (av ?: BigDecimal.ZERO).toDouble()
            }
            round(values.average() * 100.0) / 100.0
        } else 0.0

        val parStatut = all.groupBy { it.statut.name }
            .mapValues { (_, v) -> v.size.toLong() }

        return ProjetStats(
            total = all.size.toLong(),
            enCours = all.count { it.statut == StatutProjet.EN_COURS_EXECUTION || it.statut == StatutProjet.EN_AVANCE }.toLong(),
            termines = all.count { it.statut == StatutProjet.RECEPTION_DEFINITIVE }.toLong(),
            enRetard = enRetard,
            montantTotal = montantTotal,
            avancementMoyen = avancementMoyen,
            parStatut = parStatut
        )
    }

    private fun getChantierStats(): ChantierStats {
        val projetsEnCours = projetRepository.findAll().filter {
            it.actif && it.statut in listOf(StatutProjet.EN_COURS_EXECUTION, StatutProjet.EN_AVANCE)
        }
        return ChantierStats(
            total = projetsEnCours.size.toLong(),
            actifs = projetsEnCours.count { it.chantierActif }.toLong(),
            termines = projetRepository.findAll().count {
                it.actif && it.statut == StatutProjet.RECEPTION_DEFINITIVE
            }.toLong()
        )
    }

    private fun getGlobalBudgetStats(): BudgetStats {
        val projets = projetRepository.findAll().filter { it.actif }
        val statutsEnCours = listOf(StatutProjet.EN_COURS_EXECUTION, StatutProjet.EN_AVANCE)

        // Montants marchés
        val montantTotalMarches = projets
            .map { it.montantHT ?: BigDecimal.ZERO }
            .fold(BigDecimal.ZERO) { acc, v -> acc.add(v) }
        val montantMarchesEnCours = projets
            .filter { it.statut in statutsEnCours }
            .map { it.montantHT ?: BigDecimal.ZERO }
            .fold(BigDecimal.ZERO) { acc, v -> acc.add(v) }

        // CA prévisionnel / réalisé cumulé (toutes les données en base)
        val allCA = caRepository.findAll()
        val caPrevisionnelCumule = allCA.fold(BigDecimal.ZERO) { acc, ca -> acc.add(ca.caPrevisionnel) }
        val caRealiseCumule = allCA.fold(BigDecimal.ZERO) { acc, ca -> acc.add(ca.caRealise) }
        val tauxRealisation = if (caPrevisionnelCumule > BigDecimal.ZERO) {
            caRealiseCumule.divide(caPrevisionnelCumule, 4, RoundingMode.HALF_UP).multiply(BigDecimal(100)).toDouble()
        } else 0.0

        // Évolution mensuelle (agrégée tous projets, triée par date)
        val evolutionMensuelle = allCA
            .groupBy { Pair(it.annee, it.mois) }
            .map { (key, items) ->
                EvolutionCA(
                    mois = key.second,
                    annee = key.first,
                    previsionnel = items.fold(BigDecimal.ZERO) { acc, ca -> acc.add(ca.caPrevisionnel) },
                    realise = items.fold(BigDecimal.ZERO) { acc, ca -> acc.add(ca.caRealise) }
                )
            }
            .sortedWith(compareBy({ it.annee }, { it.mois }))

        // Budget prévu (compatibilité) = montant total marchés
        val budgetPrevu = montantTotalMarches
        val depenses = projets.mapNotNull { it.id }.fold(BigDecimal.ZERO) { acc, id ->
            acc.add(depenseRepository.sumMontantByProjetId(id))
        }
        val ecart = budgetPrevu.subtract(depenses)
        val tauxConso = if (budgetPrevu > BigDecimal.ZERO) {
            depenses.divide(budgetPrevu, 4, RoundingMode.HALF_UP).multiply(BigDecimal(100)).toDouble()
        } else 0.0

        return BudgetStats(
            budgetTotalPrevu = budgetPrevu,
            depensesTotales = depenses,
            ecart = ecart,
            tauxConsommation = round(tauxConso * 100.0) / 100.0,
            montantTotalMarches = montantTotalMarches,
            montantMarchesEnCours = montantMarchesEnCours,
            caPrevisionnelCumule = caPrevisionnelCumule,
            caRealiseCumule = caRealiseCumule,
            tauxRealisation = round(tauxRealisation * 100.0) / 100.0,
            evolutionMensuelle = evolutionMensuelle
        )
    }

    private fun getGlobalPlanningStats(): PlanningStats {
        val all = tacheRepository.findAll()
        val total = all.size.toLong()
        val terminees = all.count { it.statut == StatutTache.TERMINEE }.toLong()
        val enCours = all.count { it.statut == StatutTache.EN_COURS }.toLong()
        val enRetard = all.count { t ->
            t.dateEcheance != null && t.dateEcheance!!.isBefore(java.time.LocalDate.now()) &&
                    t.statut in listOf(StatutTache.A_FAIRE, StatutTache.EN_COURS)
        }.toLong()
        val tauxAvancement = if (total > 0) (terminees.toDouble() / total * 100) else 0.0
        return PlanningStats(total, terminees, enCours, enRetard, round(tauxAvancement * 100.0) / 100.0)
    }

    private fun getGlobalSecuriteStats(): SecuriteStats {
        val projetsActifs = projetRepository.findAll().filter { it.actif }.mapNotNull { it.id }
        val gravesEtMortelles = listOf(GraviteIncident.GRAVE, GraviteIncident.MORTELLE)

        var incidentsTotal = 0L
        var incidentsGraves = 0L
        var joursArretTotal = 0L
        var risquesCritiques = 0L

        for (projetId in projetsActifs) {
            incidentsTotal += incidentRepository.countByProjetId(projetId)
            incidentsGraves += incidentRepository.countByProjetIdAndGraviteIn(projetId, gravesEtMortelles)
            joursArretTotal += incidentRepository.sumJoursArretByProjetId(projetId)
            risquesCritiques += risqueRepository.countActifsByProjetAndNiveauBrutIn(
                projetId, listOf(NiveauRisque.CRITIQUE, NiveauRisque.ELEVE)
            )
        }

        return SecuriteStats(
            incidentsTotal = incidentsTotal,
            incidentsGraves = incidentsGraves,
            joursArretTotal = joursArretTotal,
            risquesCritiques = risquesCritiques
        )
    }

    private fun getGlobalQualiteStats(): QualiteStats {
        val statuts = evenementQualiteRepository.countAllGroupByStatut()
        val parStatut = statuts.associate { (it[0] as StatutEvenement) to (it[1] as Long) }

        val total = parStatut.values.sum()
        val ncOuvertes = (parStatut[StatutEvenement.DETECTEE] ?: 0L) +
                (parStatut[StatutEvenement.EN_TRAITEMENT] ?: 0L) +
                (parStatut[StatutEvenement.EN_VERIFICATION] ?: 0L)
        val resolues = (parStatut[StatutEvenement.LEVEE] ?: 0L) +
                (parStatut[StatutEvenement.CLOTUREE] ?: 0L)
        val tauxConformite = if (total > 0) round(resolues.toDouble() / total * 100 * 100.0) / 100.0 else 0.0

        return QualiteStats(
            controlesTotal = total,
            tauxConformite = tauxConformite,
            ncOuvertes = ncOuvertes
        )
    }

    private fun getProjetSecuriteStats(projetId: Long): SecuriteStats {
        val gravesEtMortelles = listOf(GraviteIncident.GRAVE, GraviteIncident.MORTELLE)
        return SecuriteStats(
            incidentsTotal = incidentRepository.countByProjetId(projetId),
            incidentsGraves = incidentRepository.countByProjetIdAndGraviteIn(projetId, gravesEtMortelles),
            joursArretTotal = incidentRepository.sumJoursArretByProjetId(projetId),
            risquesCritiques = risqueRepository.countActifsByProjetAndNiveauBrutIn(
                projetId, listOf(NiveauRisque.CRITIQUE, NiveauRisque.ELEVE)
            )
        )
    }

    private fun getProjetQualiteStats(projetId: Long): QualiteStats {
        val statuts = evenementQualiteRepository.countByProjetGroupByStatut(projetId)
        val parStatut = statuts.associate { (it[0] as StatutEvenement) to (it[1] as Long) }

        val total = parStatut.values.sum()
        val ncOuvertes = (parStatut[StatutEvenement.DETECTEE] ?: 0L) +
                (parStatut[StatutEvenement.EN_TRAITEMENT] ?: 0L) +
                (parStatut[StatutEvenement.EN_VERIFICATION] ?: 0L)
        val resolues = (parStatut[StatutEvenement.LEVEE] ?: 0L) +
                (parStatut[StatutEvenement.CLOTUREE] ?: 0L)
        val tauxConformite = if (total > 0) round(resolues.toDouble() / total * 100 * 100.0) / 100.0 else 0.0

        return QualiteStats(
            controlesTotal = total,
            tauxConformite = tauxConformite,
            ncOuvertes = ncOuvertes
        )
    }

    private fun getMaterielStats(): MaterielStats {
        val engins = enginRepository.findAll()
        val disponibles = engins.count { it.statut == StatutEngin.DISPONIBLE }.toLong()
        val materiauxStockBas = materiauRepository.findStockBas().size.toLong()
        return MaterielStats(engins.size.toLong(), disponibles, materiauxStockBas)
    }

    private fun getWeeklyProgressStats(): WeeklyProgressStats {
        val today = LocalDate.now()
        val currentWeek = today.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR)
        val currentYear = today.get(IsoFields.WEEK_BASED_YEAR)

        val weekSlots = mutableListOf<Pair<Int, Int>>()
        var w = currentWeek
        var y = currentYear
        for (i in 0 until 5) {
            w--
            if (w < 1) { y--; w = LocalDate.of(y, 12, 28).get(IsoFields.WEEK_OF_WEEK_BASED_YEAR) }
            weekSlots.add(0, Pair(w, y))
        }
        weekSlots.add(Pair(currentWeek, currentYear))
        val nextWeek = if (currentWeek < 52) currentWeek + 1 else 1
        val nextYear = if (currentWeek < 52) currentYear else currentYear + 1
        weekSlots.add(Pair(nextWeek, nextYear))

        val startPair = weekSlots.first()
        val endPair = weekSlots.last()
        val allPrevisions = previsionRepository.findByWeekRange(
            startPair.second, startPair.first,
            endPair.second, endPair.first
        )

        val grouped = allPrevisions.groupBy { Pair(it.semaine ?: 0, it.annee) }

        val weeks = weekSlots.map { (sem, an) ->
            val items = grouped[Pair(sem, an)] ?: emptyList()
            val total = items.size.toLong()
            val terminees = items.count { (it.avancementPct ?: 0) >= 100 }.toLong()
            val enCours = items.count { val pct = it.avancementPct ?: 0; pct in 1..99 }.toLong()
            val nonCommencees = items.count { (it.avancementPct ?: 0) == 0 }.toLong()
            val avancementMoyen = if (items.isNotEmpty()) {
                round(items.map { (it.avancementPct ?: 0).toDouble() }.average() * 100.0) / 100.0
            } else 0.0

            WeekSummary(
                semaine = sem,
                annee = an,
                label = "S$sem",
                total = total,
                terminees = terminees,
                enCours = enCours,
                nonCommencees = nonCommencees,
                avancementMoyen = avancementMoyen,
                isCurrent = sem == currentWeek && an == currentYear
            )
        }

        return WeeklyProgressStats(
            semaineActuelle = currentWeek,
            anneeActuelle = currentYear,
            weeks = weeks
        )
    }
}
