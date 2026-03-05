/**
 * Génération d'un classeur Excel (.xlsx) complet — toutes les sections de la page détail projet.
 * Une feuille par thème : Résumé, Informations contractuelles, Suivi mensuel, Études, Points bloquants, Prévisions, Synthèse, Indicateurs.
 */
import type * as XLSXType from 'xlsx'
import type { ProjetDocumentPayload } from './types'
import { getAvancementEtudesWithLabels } from './types'
import { getTypeProjetDisplay, getProjetTypes } from '@/types/projet'

type XLSX = typeof XLSXType

function sheetFromAoa(XLSX: XLSX, data: (string | number)[][]): XLSXType.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(data)
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  for (let c = range.s.c; c <= range.e.c; c++) {
    let maxWidth = 10
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      if (cell?.v != null) {
        const w = String(cell.v).length
        if (w > maxWidth) maxWidth = Math.min(w, 50)
      }
    }
    ws['!cols'] = ws['!cols'] ?? []
    ;(ws['!cols'] as XLSXType.ColInfo[])[c] = { wch: maxWidth }
  }
  return ws
}

export async function buildProjetExcel(payload: ProjetDocumentPayload): Promise<Blob> {
  const XLSX: XLSX = await import('xlsx')
  const {
    projet,
    rapport,
    lignesCA,
    pointsBloquants,
    previsions,
    budgetPrevu,
    depensesTotales,
    semaineCalendaire,
    anneeCalendaire,
    delaiMois,
    formatMontant,
    formatDate,
  } = payload
  const etudes = getAvancementEtudesWithLabels(projet.avancementEtudes)

  const s = (data: (string | number)[][]) => sheetFromAoa(XLSX, data)
  const wb = XLSX.utils.book_new()

  // Feuille 1 : Résumé
  const resume = [
    ['RÉSUMÉ DU PROJET'],
    [],
    ['Numéro marché', projet.numeroMarche ?? '—'],
    ['Nom', projet.nom],
    ['Statut', projet.statut.replace(/_/g, ' ')],
    ['Type', getTypeProjetDisplay(getProjetTypes(projet), projet.typePersonnalise)],
    ['Chef de projet', projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'],
    ['Semaine en cours', `${semaineCalendaire} (${anneeCalendaire})`],
    [],
    ['Avancement global', `${projet.avancementGlobal} %`],
    ['Montant marché', formatMontant(projet.montantHT)],
    ['Budget prévu', formatMontant(budgetPrevu)],
    ['Dépenses réalisées', formatMontant(depensesTotales)],
    [],
    ['Date début', formatDate(projet.dateDebut)],
    ['Date fin', formatDate(projet.dateFin)],
    ['Délai (mois)', delaiMois ?? '—'],
    [],
    ['Document généré le', new Date().toLocaleDateString('fr-FR')],
  ]
  XLSX.utils.book_append_sheet(wb, s(resume), 'Résumé')

  // Feuille 2 : Informations contractuelles
  const infoContractuelles = [
    ['INFORMATIONS CONTRACTUELLES'],
    [],
    ['Montant marché', formatMontant(projet.montantHT), 'HT'],
    ['Délai', delaiMois != null ? `${delaiMois} mois` : '—'],
    ['Date début', formatDate(projet.dateDebut)],
    ['Date de fin', formatDate(projet.dateFin)],
  ]
  XLSX.utils.book_append_sheet(wb, s(infoContractuelles), 'Infos contractuelles')

  // Feuille 3 : Suivi mensuel
  const suiviHeader = ['Mois', 'CA prévisionnel', 'CA réalisé', 'Écart', 'Avancement cumulé %']
  const suiviRows = lignesCA.length > 0 ? lignesCA.map((l) => [l.label, l.caPrevisionnel, l.caRealise, l.ecart, l.avancementCumule != null ? l.avancementCumule : '—']) : []
  const suivi = [['TABLEAU DE SUIVI MENSUEL'], [], suiviHeader, ...suiviRows, [], ['Budget total prévu', budgetPrevu], ['Dépenses réalisées', depensesTotales]]
  XLSX.utils.book_append_sheet(wb, s(suivi), 'Suivi mensuel')

  // Feuille 4 : Avancement des études
  const etudesHeader = ['Type', 'Avancement %', 'Dépôt à l\'administration', 'État de validation']
  const etudesRows = etudes.map((e) => [e.phase, e.avancementPct ?? '—', e.dateDepot, e.etatValidation])
  const etudesSheet = [['ÉTAT D\'AVANCEMENT DES ÉTUDES'], [], etudesHeader, ...etudesRows]
  XLSX.utils.book_append_sheet(wb, s(etudesSheet), 'Avancement études')

  // Feuille 5 : Réalisé — Semaine en cours
  const tachesRealiseSemaine = previsions.filter((p) => p.semaine === semaineCalendaire && p.annee === anneeCalendaire)
  const semaineSuivante = semaineCalendaire < 53 ? semaineCalendaire + 1 : 1
  const anneeSuivante = semaineCalendaire < 53 ? anneeCalendaire : anneeCalendaire + 1
  const tachesPrevuesSuivante = previsions.filter((p) => p.semaine === semaineSuivante && p.annee === anneeSuivante)
  const avancementsRealise = tachesRealiseSemaine.map((t) => t.avancementPct).filter((v): v is number => v != null)
  const globalPctExcel = avancementsRealise.length > 0 ? Math.round((avancementsRealise.reduce((a, b) => a + b, 0) / avancementsRealise.length) * 100) / 100 : null

  const realiseHeader = ['Tâche', 'Avancement (%)']
  const realiseRows = tachesRealiseSemaine.map((p) => [p.description ?? p.type ?? '', p.avancementPct ?? ''])
  const realiseSheet = [
    [`RÉALISÉ — SEMAINE ${semaineCalendaire} (${anneeCalendaire})`],
    ...(globalPctExcel != null ? [[], [`Avancement global semaine : ${globalPctExcel} %`]] : []),
    [],
    realiseHeader,
    ...realiseRows,
  ]
  XLSX.utils.book_append_sheet(wb, s(realiseSheet), 'Réalisé semaine')

  // Feuille 6 : Prévisions — Semaine suivante
  const prevSuivHeader = ['Tâche']
  const prevSuivRows = tachesPrevuesSuivante.map((p) => [p.description ?? p.type ?? ''])
  const prevSuivSheet = [
    [`PRÉVISIONS — SEMAINE ${semaineSuivante} (${anneeSuivante})`],
    [],
    prevSuivHeader,
    ...prevSuivRows,
  ]
  XLSX.utils.book_append_sheet(wb, s(prevSuivSheet), 'Prévisions semaine')

  // Feuille 7 : Points bloquants
  const pbHeader = ['Titre', 'Description', 'Priorité', 'Statut']
  const pbRows = pointsBloquants.map((pb) => [pb.titre, pb.description ?? '', pb.priorite, pb.statut])
  const pbSheet = [['POINTS BLOQUANTS'], [], pbHeader, ...pbRows]
  XLSX.utils.book_append_sheet(wb, s(pbSheet), 'Points bloquants')

  // Feuille 7 : Synthèse et indicateurs
  const synthèse = [
    ['SYNTHÈSE PROJET'],
    [],
    ['Type', getTypeProjetDisplay(getProjetTypes(projet), projet.typePersonnalise)],
    ['Sous-projets', projet.nombreSousProjets],
    ['Points bloquants ouverts', projet.nombrePointsBloquantsOuverts],
    ['Délai consommé', projet.delaiConsommePct != null ? `${projet.delaiConsommePct} %` : '—'],
    ['Source financement', projet.sourceFinancement?.replace(/_/g, ' ') ?? '—'],
    ['Partenaire principal', projet.partenairePrincipal ?? '—'],
    ['Localisation', [projet.province, projet.ville, projet.quartier].filter(Boolean).join(' · ') || '—'],
    [],
    ['Client', projet.client?.nom ?? '—'],
    ['Type client', projet.client?.type?.replace(/_/g, ' ') ?? '—'],
    [],
    ['Chef de projet', projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'],
    ['Email', projet.responsableProjet?.email ?? '—'],
    [],
    ['VUE STRATÉGIQUE — INDICATEURS'],
    [],
    ['Avancement physique', projet.avancementPhysiquePct ?? projet.avancementGlobal],
    ['Avancement financier (%)', rapport?.budget?.tauxConsommation ?? 0],
    ['Qualité (taux conformité %)', rapport?.qualite?.tauxConformite ?? 0],
    ['Incidents total', rapport?.securite?.incidentsTotal ?? 0],
    ['Risques critiques', rapport?.securite?.risquesCritiques ?? 0],
    ['Tâches en retard', rapport?.planning?.tachesEnRetard ?? 0],
  ]
  XLSX.utils.book_append_sheet(wb, s(synthèse), 'Synthèse')

  // Feuille 8 : Description, observations, propositions
  const desc = [
    ['DESCRIPTION, OBSERVATIONS ET PROPOSITIONS'],
    [],
    ['Description', projet.description || '—'],
    [],
    ['Observations', projet.observations || '—'],
    [],
    ['Propositions d\'amélioration', projet.propositionsAmelioration || '—'],
    [],
    ['Besoins matériels', projet.besoinsMateriel || '—'],
    [],
    ['Besoins humains', projet.besoinsHumain || '—'],
  ]
  XLSX.utils.book_append_sheet(wb, s(desc), 'Description et observations')

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
