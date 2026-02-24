/**
 * Document PDF — MIKA Services
 * Aligné sur le template Word : structure complète, date d'export, semaine en cours,
 * toutes les sections (contractuelles, suivi, études, travaux, indicateurs, acteurs).
 */
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { StyleSheet } from '@react-pdf/renderer'
import type { ProjetDocumentPayload } from './types'
import { getAvancementEtudesWithLabels } from './types'
import { getTypeProjetDisplay, getProjetTypes } from '@/types/projet'

function getDateExportComplete(): string {
  const d = new Date()
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`
}

function getHeureExport(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const colors = {
  primary: '#1e40af',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  white: '#ffffff',
}

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: colors.text },
  // En-tête institutionnel
  brand: { fontSize: 18, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: 4 },
  brandSub: { fontSize: 9, color: colors.textMuted, textAlign: 'center', marginBottom: 24 },
  dateLine: { fontSize: 9, color: colors.text, marginBottom: 4 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: colors.primary, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle2: { fontSize: 10, fontWeight: 'bold', color: colors.text, marginTop: 8, marginBottom: 4 },
  table: { width: '100%', marginBottom: 8 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingVertical: 4, paddingHorizontal: 4 },
  tableRowHeader: { backgroundColor: colors.primary, flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 4 },
  tableCell: { flex: 1, fontSize: 9 },
  tableCellRight: { flex: 1, fontSize: 9, textAlign: 'right' },
  tableCellLabel: { width: '28%', fontSize: 9, color: colors.textMuted },
  tableCellValue: { flex: 1, fontSize: 9, fontWeight: 'bold' },
  tableHeaderText: { flex: 1, fontSize: 9, fontWeight: 'bold', color: colors.white },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 130, fontSize: 9, color: colors.textMuted },
  value: { flex: 1, fontSize: 9, fontWeight: 'bold' },
  paragraph: { fontSize: 9, color: colors.text, marginBottom: 4, lineHeight: 1.35 },
  alert: { padding: 6, marginBottom: 4, backgroundColor: '#FEF3C7', borderRadius: 2, borderLeftWidth: 3, borderLeftColor: '#D97706' },
  alertTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  alertText: { fontSize: 8, color: colors.textMuted },
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, fontSize: 7, color: colors.textMuted, textAlign: 'center' },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  kpiBox: { width: '30%', minWidth: 80, padding: 6, backgroundColor: colors.background, borderRadius: 2 },
  kpiValue: { fontSize: 11, fontWeight: 'bold', color: colors.primary },
  kpiLabel: { fontSize: 8, color: colors.textMuted, marginTop: 2 },
  // Colonnes fixes pour tableaux larges
  colMois: { width: 70, fontSize: 8 },
  colNum: { width: 55, fontSize: 8, textAlign: 'right' },
  colNumHeader: { width: 55, fontSize: 8, textAlign: 'right', fontWeight: 'bold', color: colors.white },
})

export function ProjetDocumentPdf({ payload }: { payload: ProjetDocumentPayload }) {
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
  const dateExport = getDateExportComplete()
  const heureExport = getHeureExport()
  const hasAlertes = pointsBloquants.length > 0 || (rapport && (rapport.planning.tachesEnRetard > 0 || rapport.securite.risquesCritiques > 0))

  return (
    <Document>
      {/* ========== PAGE 1 ========== */}
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>MIKA SERVICES</Text>
        <Text style={s.brandSub}>Rapport de projet – Document officiel</Text>
        <Text style={s.dateLine}>Date d'export : {dateExport} à {heureExport}</Text>
        <Text style={s.dateLine}>Semaine en cours : Semaine {semaineCalendaire} ({anneeCalendaire})</Text>
        <View style={{ marginBottom: 16 }} />

        {/* Identification du projet */}
        <Text style={s.sectionTitle}>Identification du projet</Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: colors.primary, marginBottom: 6 }]}>
          {projet.numeroMarche ? `${projet.numeroMarche} — ` : ''}{projet.nom}
        </Text>
        <Text style={[s.paragraph, { fontSize: 8, marginBottom: 10 }]}>Numéro(s) de marché et intitulé(s) complet(s)</Text>
        <View style={s.table}>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Statut du projet</Text><Text style={s.tableCellValue}>{projet.statut.replace(/_/g, ' ')}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Type de projet</Text><Text style={s.tableCellValue}>{getTypeProjetDisplay(getProjetTypes(projet), projet.typePersonnalise)}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Chef de projet</Text><Text style={s.tableCellValue}>{projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'}</Text></View>
        </View>

        {/* 1. Informations contractuelles */}
        <Text style={s.sectionTitle}>1. Informations contractuelles</Text>
        <View style={s.table}>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Montant marché (HT)</Text><Text style={s.tableCellValue}>{formatMontant(projet.montantHT)}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Montant TTC</Text><Text style={s.tableCellValue}>{formatMontant(projet.montantTTC)}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Travaux supplémentaires (FCFA)</Text><Text style={s.tableCellValue}>{formatMontant(projet.montantInitial)}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Avenant (FCFA)</Text><Text style={s.tableCellValue}>{formatMontant(projet.montantRevise)}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Délai</Text><Text style={s.tableCellValue}>{delaiMois != null ? `${delaiMois} mois` : '—'}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Date de début prévue</Text><Text style={s.tableCellValue}>{formatDate(projet.dateDebut)}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Date de fin prévue</Text><Text style={s.tableCellValue}>{formatDate(projet.dateFin)}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Date de début réelle</Text><Text style={s.tableCellValue}>{formatDate(projet.dateDebutReel)}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Date de fin réelle</Text><Text style={s.tableCellValue}>{formatDate(projet.dateFinReelle)}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Imputation budgétaire</Text><Text style={s.tableCellValue}>{projet.imputationBudgetaire ?? '—'}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Source de financement</Text><Text style={s.tableCellValue}>{projet.sourceFinancement?.replace(/_/g, ' ') ?? '—'}</Text></View>
        </View>

        {/* 2. Tableau de suivi mensuel */}
        <Text style={s.sectionTitle}>2. Tableau de suivi mensuel</Text>
        {lignesCA.length > 0 ? (
          <>
            <View style={s.table}>
              <View style={s.tableRowHeader}>
                <Text style={[s.colMois, { color: colors.white, fontWeight: 'bold' }]}>Mois</Text>
                <Text style={s.colNumHeader}>CA prév.</Text>
                <Text style={s.colNumHeader}>CA réalisé</Text>
                <Text style={s.colNumHeader}>Écart</Text>
                <Text style={s.colNumHeader}>Avanc. %</Text>
              </View>
              {lignesCA.map((ligne) => (
                <View key={ligne.label} style={s.tableRow}>
                  <Text style={s.colMois}>{ligne.label}</Text>
                  <Text style={s.colNum}>{ligne.caPrevisionnel === 0 ? '—' : formatMontant(ligne.caPrevisionnel)}</Text>
                  <Text style={s.colNum}>{ligne.caRealise === 0 ? '—' : formatMontant(ligne.caRealise)}</Text>
                  <Text style={s.colNum}>{ligne.ecart === 0 ? '—' : formatMontant(ligne.ecart)}</Text>
                  <Text style={s.colNum}>{ligne.avancementCumule === 0 ? '—' : `${ligne.avancementCumule} %`}</Text>
                </View>
              ))}
            </View>
            <Text style={s.paragraph}>
              Synthèse budgétaire : Budget total prévu {formatMontant(budgetPrevu)} — Dépenses réalisées {formatMontant(depensesTotales)} — Écart {formatMontant(rapport?.budget?.ecart ?? depensesTotales - budgetPrevu)}.
            </Text>
          </>
        ) : (
          <Text style={s.paragraph}>Aucune donnée de suivi mensuel. Définir les dates de début et de fin du projet et renseigner le CA via le module Budget.</Text>
        )}

        {/* 3. État d'avancement des études */}
        <Text style={s.sectionTitle}>3. État d'avancement des études</Text>
        <View style={s.table}>
          <View style={s.tableRowHeader}>
            <Text style={s.tableHeaderText}>Type</Text>
            <Text style={[s.tableHeaderText, { textAlign: 'right' }]}>Avanc. %</Text>
            <Text style={s.tableHeaderText}>Dépôt</Text>
            <Text style={s.tableHeaderText}>État validation</Text>
          </View>
          {etudes.map((e, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={s.tableCell}>{e.phase}</Text>
              <Text style={s.tableCellRight}>{e.avancementPct != null ? `${e.avancementPct} %` : '—'}</Text>
              <Text style={s.tableCell}>{e.dateDepot}</Text>
              <Text style={s.tableCell}>{e.etatValidation}</Text>
            </View>
          ))}
        </View>

        <Text style={s.footer}>
          {dateExport} à {heureExport} — Semaine {semaineCalendaire} ({anneeCalendaire}) — MIKA Services — {projet.nom} — Page 1
        </Text>
      </Page>

      {/* ========== PAGE 2 ========== */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>4. Avancement des travaux et prévisions</Text>
        <Text style={[s.paragraph, { fontWeight: 'bold', color: colors.primary }]}>Avancement global du projet : {projet.avancementGlobal} %</Text>

        <Text style={s.sectionTitle2}>4.1 Points bloquants</Text>
        {pointsBloquants.length > 0 ? (
          <View style={s.table}>
            <View style={s.tableRowHeader}>
              <Text style={[s.tableHeaderText, { width: '25%' }]}>Titre</Text>
              <Text style={[s.tableHeaderText, { flex: 1 }]}>Description</Text>
              <Text style={[s.tableHeaderText, { width: 60 }]}>Priorité</Text>
              <Text style={[s.tableHeaderText, { width: 55 }]}>Statut</Text>
            </View>
            {pointsBloquants.map((pb) => (
              <View key={pb.id} style={s.tableRow}>
                <Text style={[s.tableCell, { width: '25%' }]}>{pb.titre}</Text>
                <Text style={[s.tableCell, { flex: 1 }]}>{pb.description ?? '—'}</Text>
                <Text style={[s.tableCell, { width: 60 }]}>{pb.priorite}</Text>
                <Text style={[s.tableCell, { width: 55 }]}>{pb.statut}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.paragraph}>Aucun point bloquant.</Text>
        )}

        <Text style={s.sectionTitle2}>4.2 Prévisions — Semaine {semaineCalendaire} ({anneeCalendaire}) en cours</Text>
        {previsions.length > 0 ? (
          <View style={s.table}>
            <View style={s.tableRowHeader}>
              <Text style={[s.tableHeaderText, { width: '30%' }]}>Période / Type</Text>
              <Text style={[s.tableHeaderText, { flex: 1 }]}>Description</Text>
              <Text style={[s.tableHeaderText, { width: 70 }]}>Statut</Text>
            </View>
            {previsions.map((p) => (
              <View key={p.id} style={s.tableRow}>
                <Text style={[s.tableCell, { width: '30%' }]}>
                  {p.semaine != null && p.annee != null ? `Semaine ${p.semaine} (${p.annee})` : p.type.replace(/_/g, ' ')}
                </Text>
                <Text style={[s.tableCell, { flex: 1 }]}>{p.description ?? '—'}</Text>
                <Text style={[s.tableCell, { width: 70 }]}>{p.statut?.replace(/_/g, ' ') ?? '—'}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.paragraph}>Aucune prévision.</Text>
        )}

        <Text style={s.sectionTitle2}>4.3 Besoins matériels</Text>
        <Text style={s.paragraph}>{projet.besoinsMateriel || '—'}</Text>
        <Text style={s.sectionTitle2}>4.4 Besoins humains</Text>
        <Text style={s.paragraph}>{projet.besoinsHumain || '—'}</Text>

        {/* 5. Description, observations, propositions */}
        <Text style={s.sectionTitle}>5. Description, observations et propositions d'amélioration</Text>
        <Text style={s.sectionTitle2}>Description du projet</Text>
        <Text style={s.paragraph}>{projet.description || '—'}</Text>
        <Text style={s.sectionTitle2}>Observations</Text>
        <Text style={s.paragraph}>{projet.observations || '—'}</Text>
        <Text style={s.sectionTitle2}>Propositions d'amélioration</Text>
        <Text style={s.paragraph}>{projet.propositionsAmelioration || '—'}</Text>

        {hasAlertes && (
          <>
            <Text style={s.sectionTitle}>6. Alertes et indicateurs de vigilance</Text>
            <View style={s.table}>
              {pointsBloquants.length > 0 && (
                <View style={s.tableRow}><Text style={s.tableCellLabel}>Points bloquants</Text><Text style={s.tableCellValue}>{pointsBloquants.length} point(s) à traiter</Text></View>
              )}
              {rapport && rapport.planning.tachesEnRetard > 0 && (
                <View style={s.tableRow}><Text style={s.tableCellLabel}>Tâches en retard</Text><Text style={s.tableCellValue}>{rapport.planning.tachesEnRetard} tâche(s)</Text></View>
              )}
              {rapport && rapport.securite.risquesCritiques > 0 && (
                <View style={s.tableRow}><Text style={s.tableCellLabel}>Risques critiques</Text><Text style={s.tableCellValue}>{rapport.securite.risquesCritiques} risque(s)</Text></View>
              )}
            </View>
          </>
        )}

        <Text style={s.footer}>
          Document confidentiel – MIKA Services – {projet.nom} — Page 2
        </Text>
      </Page>

      {/* ========== PAGE 3 : Synthèse, indicateurs, acteurs ========== */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>7. Synthèse projet</Text>
        <View style={s.table}>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Type de projet</Text><Text style={s.tableCellValue}>{getTypeProjetDisplay(getProjetTypes(projet), projet.typePersonnalise)}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Nombre de sous-projets</Text><Text style={s.tableCellValue}>{projet.nombreSousProjets}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Points bloquants ouverts</Text><Text style={s.tableCellValue}>{projet.nombrePointsBloquantsOuverts}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Délai consommé</Text><Text style={s.tableCellValue}>{projet.delaiConsommePct != null ? `${projet.delaiConsommePct} %` : '—'}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Avancement global</Text><Text style={s.tableCellValue}>{projet.avancementGlobal} %</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Source de financement</Text><Text style={s.tableCellValue}>{projet.sourceFinancement?.replace(/_/g, ' ') ?? '—'}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Partenaire principal</Text><Text style={s.tableCellValue}>{projet.partenairePrincipal ?? '—'}</Text></View>
          {projet.createdAt && <View style={s.tableRow}><Text style={s.tableCellLabel}>Date de création</Text><Text style={s.tableCellValue}>{formatDate(projet.createdAt)}</Text></View>}
          {projet.updatedAt && <View style={s.tableRow}><Text style={s.tableCellLabel}>Dernière mise à jour</Text><Text style={s.tableCellValue}>{formatDate(projet.updatedAt)}</Text></View>}
        </View>

        <Text style={s.sectionTitle}>8. Données stratégiques et indicateurs</Text>
        <View style={s.table}>
          <View style={s.tableRowHeader}>
            <Text style={s.tableHeaderText}>Indicateur</Text>
            <Text style={[s.tableHeaderText, { textAlign: 'right' }]}>Valeur</Text>
          </View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Avancement physique</Text><Text style={s.tableCellValue}>{projet.avancementPhysiquePct ?? projet.avancementGlobal} %</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Avancement financier</Text><Text style={s.tableCellValue}>{rapport?.budget?.tauxConsommation ?? 0} %</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Budget prévu / Dépenses réalisées</Text><Text style={s.tableCellValue}>{formatMontant(budgetPrevu)} / {formatMontant(depensesTotales)}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Taux de conformité (qualité)</Text><Text style={s.tableCellValue}>{rapport?.qualite?.tauxConformite ?? 0} %</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Non-conformités ouvertes</Text><Text style={s.tableCellValue}>{rapport?.qualite?.ncOuvertes ?? 0}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Incidents (sécurité)</Text><Text style={s.tableCellValue}>{rapport?.securite?.incidentsTotal ?? 0}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Risques critiques (sécurité)</Text><Text style={s.tableCellValue}>{rapport?.securite?.risquesCritiques ?? 0}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Tâches total (planning)</Text><Text style={s.tableCellValue}>{rapport?.planning?.tachesTotal ?? 0}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Tâches terminées / en cours / en retard</Text><Text style={s.tableCellValue}>{rapport?.planning?.tachesTerminees ?? 0} / {rapport?.planning?.tachesEnCours ?? 0} / {rapport?.planning?.tachesEnRetard ?? 0}</Text></View>
          <View style={s.tableRow}><Text style={s.tableCellLabel}>Taux d'avancement planning</Text><Text style={s.tableCellValue}>{rapport?.planning?.tauxAvancement ?? 0} %</Text></View>
        </View>

        <Text style={s.sectionTitle}>9. Acteurs et localisation</Text>
        <Text style={s.sectionTitle2}>Client</Text>
        {projet.client ? (
          <View style={s.table}>
            <View style={s.tableRow}><Text style={s.tableCellLabel}>Raison sociale</Text><Text style={s.tableCellValue}>{projet.client.nom}</Text></View>
            <View style={s.tableRow}><Text style={s.tableCellLabel}>Type de client</Text><Text style={s.tableCellValue}>{projet.client.type.replace(/_/g, ' ')}</Text></View>
            {projet.client.contactPrincipal && <View style={s.tableRow}><Text style={s.tableCellLabel}>Contact principal</Text><Text style={s.tableCellValue}>{projet.client.contactPrincipal}</Text></View>}
            {projet.client.telephoneContact && <View style={s.tableRow}><Text style={s.tableCellLabel}>Téléphone</Text><Text style={s.tableCellValue}>{projet.client.telephoneContact}</Text></View>}
            {projet.client.email && <View style={s.tableRow}><Text style={s.tableCellLabel}>E-mail</Text><Text style={s.tableCellValue}>{projet.client.email}</Text></View>}
            {projet.client.adresse && <View style={s.tableRow}><Text style={s.tableCellLabel}>Adresse</Text><Text style={s.tableCellValue}>{projet.client.adresse}</Text></View>}
          </View>
        ) : (
          <Text style={s.paragraph}>—</Text>
        )}

        <Text style={s.sectionTitle2}>Chef de projet</Text>
        {projet.responsableProjet ? (
          <View style={s.table}>
            <View style={s.tableRow}><Text style={s.tableCellLabel}>Nom</Text><Text style={s.tableCellValue}>{projet.responsableProjet.prenom} {projet.responsableProjet.nom}</Text></View>
            <View style={s.tableRow}><Text style={s.tableCellLabel}>E-mail</Text><Text style={s.tableCellValue}>{projet.responsableProjet.email}</Text></View>
          </View>
        ) : (
          <Text style={s.paragraph}>—</Text>
        )}

        <Text style={s.sectionTitle2}>Localisation du projet</Text>
        <Text style={s.paragraph}>{[projet.province, projet.ville, projet.quartier].filter(Boolean).join(' · ') || '—'}</Text>

        <View style={{ marginTop: 24 }} />
        <Text style={[s.paragraph, { textAlign: 'center', fontSize: 8, color: colors.textMuted }]}>
          Document généré le {dateExport} à {heureExport} — Semaine {semaineCalendaire} ({anneeCalendaire})
        </Text>
        <Text style={[s.paragraph, { textAlign: 'center', fontSize: 8, color: colors.textMuted }]}>
          Document confidentiel – MIKA Services – Usage interne et transmission officielle
        </Text>
        <Text style={[s.paragraph, { textAlign: 'center', fontSize: 8, color: colors.textMuted, fontStyle: 'italic' }]}>
          Référence : {projet.numeroMarche ?? String(projet.id)} — {projet.nom}
        </Text>

        <Text style={s.footer}>
          {dateExport} à {heureExport} — MIKA Services — {projet.nom} — Page 3
        </Text>
      </Page>
    </Document>
  )
}
