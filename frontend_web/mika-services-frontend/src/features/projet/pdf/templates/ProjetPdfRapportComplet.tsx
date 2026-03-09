import { Document, Page, View, Text } from '@react-pdf/renderer'
import { pdfStyles } from '../styles'
import type { ProjetPdfData } from '../types'

const PHASE_LABELS: Record<string, string> = {
  APS: 'APS',
  APD: 'APD',
  EXE: 'EXE',
  GEOTECHNIQUE: 'Géotechnique',
  HYDRAULIQUE: 'Hydrologique / Hydraulique',
  EIES: 'EIES / Notice EIES',
}

export function ProjetPdfRapportComplet({ data }: { data: ProjetPdfData }) {
  const { projet, rapport, lignesCA, pointsBloquants, previsions, semaineCalendaire, anneeCalendaire, formatMontant, formatDate } = data
  const s = pdfStyles
  const budgetPrevu = rapport?.budget?.budgetTotalPrevu ?? projet.montantHT ?? 0
  const depensesTotales = rapport?.budget?.depensesTotales ?? 0

  return (
    <Document>
      {/* Page 1 : En-tête + Cadre du marché + CA */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.headerTitle}>
            {projet.numeroMarche ? `Marché N°${projet.numeroMarche} — ` : ''}{projet.nom}
          </Text>
          <Text style={s.headerSubtitle}>Rapport détaillé — {projet.nom}</Text>
          <View style={s.headerMeta}>
            <Text style={s.badge}>{projet.statut.replace(/_/g, ' ')}</Text>
            <Text style={s.badge}>{(projet.type ?? '—').replace(/_/g, ' ')}</Text>
            <Text style={s.badge}>Chef de projet : {projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Cadre du marché</Text>
          <View style={s.row}><Text style={s.label}>Montant HT</Text><Text style={s.value}>{formatMontant(projet.montantHT)}</Text></View>
          <View style={s.row}><Text style={s.label}>Montant TTC</Text><Text style={s.value}>{formatMontant(projet.montantTTC)}</Text></View>
          <View style={s.row}><Text style={s.label}>Travaux supplémentaires (FCFA)</Text><Text style={s.value}>{formatMontant(projet.montantInitial)}</Text></View>
          <View style={s.row}><Text style={s.label}>Avenant (FCFA)</Text><Text style={s.value}>{formatMontant(projet.montantRevise)}</Text></View>
          <View style={s.row}><Text style={s.label}>Délai</Text><Text style={s.value}>{projet.delaiMois ? `${projet.delaiMois} mois` : '—'}</Text></View>
          <View style={s.row}><Text style={s.label}>Date début prévue</Text><Text style={s.value}>{formatDate(projet.dateDebut)}</Text></View>
          <View style={s.row}><Text style={s.label}>Date fin prévue</Text><Text style={s.value}>{formatDate(projet.dateFin)}</Text></View>
          <View style={s.row}><Text style={s.label}>Date début réelle</Text><Text style={s.value}>{formatDate(projet.dateDebutReel)}</Text></View>
          <View style={s.row}><Text style={s.label}>Date fin réelle</Text><Text style={s.value}>{formatDate(projet.dateFinReelle)}</Text></View>
          <View style={s.row}><Text style={s.label}>Source financement</Text><Text style={s.value}>{projet.sourceFinancement?.replace(/_/g, ' ') ?? '—'}</Text></View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Chiffre d'affaires</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableRowHeader]}>
              <Text style={s.tableCellFixed}>Mois</Text>
              <Text style={s.tableCellFixedRight}>CA prévisionnel</Text>
              <Text style={s.tableCellFixedRight}>CA réalisé</Text>
              <Text style={s.tableCellFixedRight}>Écart</Text>
              <Text style={s.tableCellFixedRight}>Avancement cumulé %</Text>
            </View>
            {lignesCA.map((ligne) => (
              <View key={ligne.label} style={s.tableRow}>
                <Text style={s.tableCellFixed}>{ligne.label}</Text>
                <Text style={s.tableCellFixedRight}>{formatMontant(ligne.caPrevisionnel)}</Text>
                <Text style={s.tableCellFixedRight}>{formatMontant(ligne.caRealise)}</Text>
                <Text style={s.tableCellFixedRight}>{formatMontant(ligne.ecart)}</Text>
                <Text style={s.tableCellFixedRight}>{ligne.avancementCumule != null ? `${ligne.avancementCumule} %` : '—'}</Text>
              </View>
            ))}
          </View>
          <Text style={s.paragraph}>
            Synthèse : Budget total prévu {formatMontant(budgetPrevu)} · Dépenses réalisées {formatMontant(depensesTotales)} · Écart {formatMontant(rapport?.budget?.ecart ?? depensesTotales - budgetPrevu)}
          </Text>
        </View>

        <Text style={s.footer}>
          Document généré le {formatDate(new Date().toISOString())} — Mika Services — Rapport détaillé {projet.nom} — Page 1
        </Text>
      </Page>

      {/* Page 2 : Études + Travaux / Prévisions + Description */}
      <Page size="A4" style={s.page}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>État d'avancement des études</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableRowHeader]}>
              <Text style={s.tableCell}>Phase</Text>
              <Text style={s.tableCellRight}>Avancement %</Text>
              <Text style={s.tableCell}>Dépôt</Text>
              <Text style={s.tableCell}>État validation</Text>
            </View>
            {(projet.avancementEtudes?.length ?? 0) > 0
              ? projet.avancementEtudes!.map((e) => (
                  <View key={e.id} style={s.tableRow}>
                    <Text style={s.tableCell}>{PHASE_LABELS[e.phase] ?? e.phase}</Text>
                    <Text style={s.tableCellRight}>{e.avancementPct != null ? `${e.avancementPct} %` : '—'}</Text>
                    <Text style={s.tableCell}>{formatDate(e.dateDepot)}</Text>
                    <Text style={s.tableCell}>{e.etatValidation ?? '—'}</Text>
                  </View>
                ))
              : (['APS', 'APD', 'EXE', 'GEOTECHNIQUE', 'HYDRAULIQUE', 'EIES'] as const).map((phase) => (
                  <View key={phase} style={s.tableRow}>
                    <Text style={s.tableCell}>{PHASE_LABELS[phase] ?? phase}</Text>
                    <Text style={s.tableCellRight}>—</Text>
                    <Text style={s.tableCell}>—</Text>
                    <Text style={s.tableCell}>—</Text>
                  </View>
                ))}
          </View>
        </View>

        {(() => {
          const tachesRealiseSemaine = previsions.filter((p) => p.semaine === semaineCalendaire && p.annee === anneeCalendaire)
          const semaineSuivante = semaineCalendaire < 53 ? semaineCalendaire + 1 : 1
          const anneeSuivante = semaineCalendaire < 53 ? anneeCalendaire : anneeCalendaire + 1
          const tachesPrevuesSuivante = previsions.filter((p) => p.semaine === semaineSuivante && p.annee === anneeSuivante)
          const avancementsR = tachesRealiseSemaine.map((t) => t.avancementPct).filter((v): v is number => v != null)
          const globalPct = avancementsR.length > 0 ? Math.round((avancementsR.reduce((a, b) => a + b, 0) / avancementsR.length) * 100) / 100 : null
          return (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Avancement des travaux — S{semaineCalendaire} ({anneeCalendaire})</Text>
              {globalPct != null && <Text style={s.paragraph}>Taux d'avancement : <Text style={{ fontWeight: 'bold' }}>{globalPct} %</Text></Text>}
              <Text style={[s.paragraph, { fontWeight: 'bold', marginTop: 6 }]}>Réalisé — S{semaineCalendaire}</Text>
              {tachesRealiseSemaine.length > 0 ? tachesRealiseSemaine.map((p) => (
                <View key={p.id} style={s.row}>
                  <Text style={s.value}>{p.description ?? p.type.replace(/_/g, ' ')}{p.avancementPct != null ? ` · ${p.avancementPct} %` : ''}</Text>
                </View>
              )) : <Text style={s.paragraph}>Aucune tâche enregistrée.</Text>}
              <Text style={[s.paragraph, { fontWeight: 'bold', marginTop: 6 }]}>Prévisions — S{semaineSuivante} ({anneeSuivante})</Text>
              {tachesPrevuesSuivante.length > 0 ? tachesPrevuesSuivante.map((p) => (
                <View key={p.id} style={s.row}>
                  <Text style={s.value}>{p.description ?? p.type.replace(/_/g, ' ')}</Text>
                </View>
              )) : <Text style={s.paragraph}>Aucune tâche planifiée.</Text>}
              {pointsBloquants.length > 0 && (
                <>
                  <Text style={[s.paragraph, { fontWeight: 'bold', marginTop: 6 }]}>Points bloquants</Text>
                  {pointsBloquants.map((pb) => (
                    <View key={pb.id} style={s.alert}>
                      <Text style={s.alertTitle}>{pb.titre}</Text>
                      {pb.description && <Text style={s.alertText}>{pb.description}</Text>}
                      <Text style={s.alertText}>Priorité : {pb.priorite} · Statut : {pb.statut} · Détecté le : {formatDate(pb.dateDetection)}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )
        })()}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Description, besoins et observations</Text>
          <Text style={s.paragraph}><Text style={s.labelInline}>Description : </Text>{projet.description || '—'}</Text>
          <Text style={s.paragraph}><Text style={s.labelInline}>Besoins matériels : </Text>{projet.besoinsMateriel || '—'}</Text>
          <Text style={s.paragraph}><Text style={s.labelInline}>Besoins humains : </Text>{projet.besoinsHumain || '—'}</Text>
          <Text style={s.paragraph}><Text style={s.labelInline}>Observations : </Text>{projet.observations || '—'}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Synthèse projet</Text>
          <View style={s.row}><Text style={s.label}>Type</Text><Text style={s.value}>{(projet.type ?? '—').replace(/_/g, ' ')}</Text></View>
          <View style={s.row}><Text style={s.label}>Sous-projets</Text><Text style={s.value}>{projet.nombreSousProjets}</Text></View>
          <View style={s.row}><Text style={s.label}>Points bloquants ouverts</Text><Text style={s.value}>{projet.nombrePointsBloquantsOuverts}</Text></View>
          <View style={s.row}><Text style={s.label}>Délai consommé</Text><Text style={s.value}>{projet.delaiConsommePct != null ? `${projet.delaiConsommePct} %` : '—'}</Text></View>
          <View style={s.row}><Text style={s.label}>Partenaire principal</Text><Text style={s.value}>{projet.partenairePrincipal ?? '—'}</Text></View>
          {projet.client && (
            <>
              <Text style={[s.paragraph, { fontWeight: 'bold', marginTop: 6 }]}>Client</Text>
              <Text style={s.paragraph}>{projet.client.nom} — {projet.client.type.replace(/_/g, ' ')}</Text>
            </>
          )}
          <Text style={s.paragraph}>Localisation : {[projet.province, projet.ville, projet.quartier].filter(Boolean).join(' · ') || '—'}</Text>
        </View>

        <Text style={s.footer}>
          Document généré le {formatDate(new Date().toISOString())} — Mika Services — Rapport détaillé {projet.nom} — Page 2
        </Text>
      </Page>
    </Document>
  )
}
