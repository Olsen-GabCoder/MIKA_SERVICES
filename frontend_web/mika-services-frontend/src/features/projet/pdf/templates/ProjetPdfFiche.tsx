import { Document, Page, View, Text } from '@react-pdf/renderer'
import { pdfStyles } from '../styles'
import type { ProjetPdfData } from '../types'

export function ProjetPdfFiche({ data }: { data: ProjetPdfData }) {
  const { projet, formatMontant, formatDate } = data
  const s = pdfStyles
  const titre = projet.numeroMarche ? 'Marche N°' + projet.numeroMarche + ' - ' + projet.nom : projet.nom

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.headerTitle}>{titre}</Text>
          <Text style={s.headerSubtitle}>Fiche projet - {projet.nom}</Text>
          <View style={s.headerMeta}>
            <Text style={s.badge}>{projet.statut.replace(/_/g, ' ')}</Text>
            <Text style={s.badge}>{(projet.type ?? 'AUTRE').replace(/_/g, ' ')}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Identification</Text>
          <View style={s.row}><Text style={s.label}>Intitulé du projet</Text><Text style={s.value}>{projet.nom}</Text></View>
          <View style={s.row}><Text style={s.label}>Montant HT</Text><Text style={s.value}>{formatMontant(projet.montantHT)}</Text></View>
          <View style={s.row}><Text style={s.label}>Montant TTC</Text><Text style={s.value}>{formatMontant(projet.montantTTC)}</Text></View>
          <View style={s.row}><Text style={s.label}>Delai</Text><Text style={s.value}>{projet.delaiMois ? projet.delaiMois + ' mois' : '-'}</Text></View>
          <View style={s.row}><Text style={s.label}>Date debut</Text><Text style={s.value}>{formatDate(projet.dateDebut)}</Text></View>
          <View style={s.row}><Text style={s.label}>Date fin</Text><Text style={s.value}>{formatDate(projet.dateFin)}</Text></View>
          <View style={s.row}><Text style={s.label}>Avancement</Text><Text style={s.value}>{projet.avancementGlobal} %</Text></View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Responsable</Text>
          {projet.responsableProjet ? (
            <Text style={s.paragraph}>{projet.responsableProjet.prenom} {projet.responsableProjet.nom} - {projet.responsableProjet.email}</Text>
          ) : (
            <Text style={s.paragraph}>-</Text>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Client</Text>
          {projet.client ? (
            <>
              <Text style={s.paragraph}>{projet.client.nom}</Text>
              <Text style={s.paragraph}>{projet.client.type.replace(/_/g, ' ')}</Text>
              {projet.client.contactPrincipal && <Text style={s.paragraph}>Contact: {projet.client.contactPrincipal}</Text>}
            </>
          ) : (
            <Text style={s.paragraph}>-</Text>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Localisation</Text>
          <Text style={s.paragraph}>{[projet.province, projet.ville, projet.quartier].filter(Boolean).join(' / ') || '-'}</Text>
        </View>

        <Text style={s.footer}>Document genere le {formatDate(new Date().toISOString())} - Mika Services - Fiche projet {projet.nom}</Text>
      </Page>
    </Document>
  )
}
