import { Document, Page, View, Text } from '@react-pdf/renderer'
import { pdfStyles } from '../styles'
import type { ProjetPdfData } from '../types'

export function ProjetPdfSynthese({ data }: { data: ProjetPdfData }) {
  const { projet, rapport, lignesCA, pointsBloquants, formatMontant, formatDate } = data
  const s = pdfStyles
  const budgetPrevu = rapport?.budget?.budgetTotalPrevu ?? projet.montantHT ?? 0
  const depensesTotales = rapport?.budget?.depensesTotales ?? 0
  const tauxConsommation = rapport?.budget?.tauxConsommation ?? (budgetPrevu > 0 ? (depensesTotales / budgetPrevu) * 100 : 0)
  const hasAlertes = pointsBloquants.length > 0 || (rapport && (rapport.planning.tachesEnRetard > 0 || rapport.securite.risquesCritiques > 0))

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.headerTitle}>
            {projet.numeroMarche ? `Marché N°${projet.numeroMarche} — ` : ''}{projet.nom}
          </Text>
          <Text style={s.headerSubtitle}>Synthèse exécutive — {projet.nom}</Text>
          <View style={s.headerMeta}>
            <Text style={s.badge}>{projet.statut.replace(/_/g, ' ')}</Text>
            <Text style={s.badge}>Chef de projet : {projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Indicateurs clés</Text>
          <View style={s.kpiRow}>
            <View style={s.kpiBox}>
              <Text style={s.kpiValue}>{projet.avancementGlobal} %</Text>
              <Text style={s.kpiLabel}>Avancement global</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiValue}>{formatMontant(budgetPrevu)}</Text>
              <Text style={s.kpiLabel}>Budget total prévu</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiValue}>{formatMontant(depensesTotales)}</Text>
              <Text style={s.kpiLabel}>Dépenses réalisées</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiValue}>{Math.round(tauxConsommation * 100) / 100} %</Text>
              <Text style={s.kpiLabel}>Taux de consommation</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Chiffre d'affaires — Synthèse</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableRowHeader]}>
              <Text style={s.tableCellFixed}>Mois</Text>
              <Text style={s.tableCellFixedRight}>CA prévisionnel</Text>
              <Text style={s.tableCellFixedRight}>CA réalisé</Text>
              <Text style={s.tableCellFixedRight}>Écart</Text>
              <Text style={s.tableCellFixedRight}>Cumul %</Text>
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
            Synthèse : Budget prévu {formatMontant(budgetPrevu)} · Dépenses {formatMontant(depensesTotales)} · Écart {formatMontant(rapport?.budget?.ecart ?? depensesTotales - budgetPrevu)}
          </Text>
        </View>

        {hasAlertes && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Alertes</Text>
            {pointsBloquants.length > 0 && (
              <View style={s.alert}>
                <Text style={s.alertTitle}>Points bloquants</Text>
                <Text style={s.alertText}>{pointsBloquants.length} point(s) à traiter</Text>
              </View>
            )}
            {rapport && rapport.planning.tachesEnRetard > 0 && (
              <View style={s.alert}>
                <Text style={s.alertTitle}>Retards</Text>
                <Text style={s.alertText}>{rapport.planning.tachesEnRetard} tâche(s) en retard</Text>
              </View>
            )}
            {rapport && rapport.securite.risquesCritiques > 0 && (
              <View style={s.alert}>
                <Text style={s.alertTitle}>Risques critiques</Text>
                <Text style={s.alertText}>{rapport.securite.risquesCritiques} risque(s) critique(s)</Text>
              </View>
            )}
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Cadre</Text>
          <View style={s.row}>
            <Text style={s.label}>Dates</Text>
            <Text style={s.value}>{formatDate(projet.dateDebut)} — {formatDate(projet.dateFin)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Client</Text>
            <Text style={s.value}>{projet.client?.nom ?? '—'}</Text>
          </View>
        </View>

        <Text style={s.footer}>
          Document généré le {formatDate(new Date().toISOString())} — Mika Services — Synthèse exécutive {projet.nom}
        </Text>
      </Page>
    </Document>
  )
}
