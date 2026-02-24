/**
 * Génération du document Word (.docx) — MIKA Services
 * Document professionnel, complet et structuré. Contient l'intégralité des données
 * de la page détail projet : date d'export, semaine en cours, données stratégiques,
 * financières et opérationnelles, tableaux détaillés, indicateurs, hiérarchie claire.
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  convertInchesToTwip,
  ShadingType,
} from 'docx'
import type { ProjetDocumentPayload } from './types'
import { getAvancementEtudesWithLabels } from './types'
import { getTypeProjetDisplay, getProjetTypes } from '@/types/projet'

// ——— Constantes de mise en forme ———
const COULEUR_TITRE = '1E40AF'
const COULEUR_TEXTE = '111827'
const COULEUR_SECONDAIRE = '6B7280'
const FOND_ENTETE_TABLEAU = 'F3F4F6'
const FOND_ALERTE = 'FEF3C7'
const TAILLE_TITRE = 22
const TAILLE_SECTION = 14
const TAILLE_SOUS_SECTION = 12
const TAILLE_CORPS = 11
const TAILLE_PIED = 9

/** Date d'export formatée (jour de la semaine + date complète en français) */
function getDateExportComplete(): string {
  const d = new Date()
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`
}

/** Heure d'export (optionnel, pour traçabilité) */
function getHeureExport(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ——— Helpers cellules tableaux ———
function cellLabel(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: TAILLE_CORPS * 2, color: COULEUR_TEXTE })] })],
    width: { size: 28, type: WidthType.PERCENTAGE },
    shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
  })
}

function cellValue(text: string, bold = false): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold, size: TAILLE_CORPS * 2, color: COULEUR_TEXTE })] })],
    width: { size: 72, type: WidthType.PERCENTAGE },
  })
}

function cellHeader(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: TAILLE_CORPS * 2, color: 'FFFFFF' })] })],
    shading: { fill: COULEUR_TITRE, type: ShadingType.SOLID },
  })
}

function cellBody(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: TAILLE_CORPS * 2, color: COULEUR_TEXTE })] })],
  })
}

const BORDURES_TABLEAU = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
}

function paraVide(apres = 120): Paragraph {
  return new Paragraph({ text: '', spacing: { after: apres } })
}

function paraCorps(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold, size: TAILLE_CORPS * 2, color: COULEUR_TEXTE })],
    spacing: { after: 80 },
  })
}

export async function buildProjetWord(payload: ProjetDocumentPayload): Promise<Blob> {
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

  const contenu: (Paragraph | Table)[] = []

  // ==================== EN-TÊTE INSTITUTIONNEL ====================
  contenu.push(
    new Paragraph({
      children: [new TextRun({ text: 'MIKA SERVICES', bold: true, size: 28, color: COULEUR_TITRE })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Rapport de projet – Document officiel', size: TAILLE_SOUS_SECTION * 2, color: COULEUR_SECONDAIRE })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Date d\'export : ', bold: true, size: TAILLE_CORPS * 2 }),
        new TextRun({ text: `${dateExport} à ${heureExport}`, size: TAILLE_CORPS * 2, color: COULEUR_TEXTE }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Semaine en cours : ', bold: true, size: TAILLE_CORPS * 2 }),
        new TextRun({ text: `Semaine ${semaineCalendaire} (${anneeCalendaire})`, size: TAILLE_CORPS * 2, color: COULEUR_TEXTE }),
      ],
      spacing: { after: 320 },
    })
  )

  // ==================== IDENTIFICATION DU PROJET ====================
  contenu.push(
    new Paragraph({
      text: 'Identification du projet',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 160 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: projet.numeroMarche ? `${projet.numeroMarche} — ${projet.nom}` : projet.nom,
          bold: true,
          size: TAILLE_SECTION * 2,
          color: COULEUR_TITRE,
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: 'Numéro(s) de marché et intitulé(s) complet(s)',
      spacing: { after: 120 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDURES_TABLEAU,
      rows: [
        new TableRow({
          children: [
            cellLabel('Statut du projet'),
            cellValue(projet.statut.replace(/_/g, ' ')),
          ],
        }),
        new TableRow({
          children: [
            cellLabel('Type de projet'),
            cellValue(getTypeProjetDisplay(getProjetTypes(projet), projet.typePersonnalise)),
          ],
        }),
        new TableRow({
          children: [
            cellLabel('Chef de projet'),
            cellValue(projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'),
          ],
        }),
      ],
    }),
    paraVide(200)
  )

  // ==================== 1. INFORMATIONS CONTRACTUELLES ====================
  contenu.push(
    new Paragraph({
      text: '1. Informations contractuelles',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 160 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDURES_TABLEAU,
      rows: [
        new TableRow({ children: [cellLabel('Montant marché (HT)'), cellValue(formatMontant(projet.montantHT))] }),
        new TableRow({ children: [cellLabel('Montant TTC'), cellValue(formatMontant(projet.montantTTC))] }),
        new TableRow({ children: [cellLabel('Travaux supplémentaires (FCFA)'), cellValue(formatMontant(projet.montantInitial))] }),
        new TableRow({ children: [cellLabel('Avenant (FCFA)'), cellValue(formatMontant(projet.montantRevise))] }),
        new TableRow({ children: [cellLabel('Délai'), cellValue(delaiMois != null ? `${delaiMois} mois` : '—')] }),
        new TableRow({ children: [cellLabel('Date de début prévue'), cellValue(formatDate(projet.dateDebut))] }),
        new TableRow({ children: [cellLabel('Date de fin prévue'), cellValue(formatDate(projet.dateFin))] }),
        new TableRow({ children: [cellLabel('Date de début réelle'), cellValue(formatDate(projet.dateDebutReel))] }),
        new TableRow({ children: [cellLabel('Date de fin réelle'), cellValue(formatDate(projet.dateFinReelle))] }),
        new TableRow({ children: [cellLabel('Imputation budgétaire'), cellValue(projet.imputationBudgetaire ?? '—')] }),
        new TableRow({ children: [cellLabel('Source de financement'), cellValue(projet.sourceFinancement?.replace(/_/g, ' ') ?? '—')] }),
      ],
    }),
    paraVide(200)
  )

  // ==================== 2. TABLEAU DE SUIVI MENSUEL ====================
  contenu.push(
    new Paragraph({
      text: '2. Tableau de suivi mensuel',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 160 },
    })
  )
  if (lignesCA.length > 0) {
    contenu.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BORDURES_TABLEAU,
        rows: [
          new TableRow({
            children: [
              cellHeader('Mois'),
              cellHeader('CA prévisionnel'),
              cellHeader('CA réalisé'),
              cellHeader('Écart'),
              cellHeader('Avancement cumulé %'),
            ],
          }),
          ...lignesCA.map((ligne) =>
            new TableRow({
              children: [
                cellBody(ligne.label),
                cellBody(ligne.caPrevisionnel === 0 ? '—' : formatMontant(ligne.caPrevisionnel)),
                cellBody(ligne.caRealise === 0 ? '—' : formatMontant(ligne.caRealise)),
                cellBody(ligne.ecart === 0 ? '—' : formatMontant(ligne.ecart)),
                cellBody(ligne.avancementCumule === 0 ? '—' : `${ligne.avancementCumule} %`),
              ],
            })
          ),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Synthèse budgétaire : ', bold: true, size: TAILLE_CORPS * 2 }),
          new TextRun({
            text: `Budget total prévu ${formatMontant(budgetPrevu)} — Dépenses réalisées ${formatMontant(depensesTotales)} — Écart ${formatMontant(rapport?.budget?.ecart ?? depensesTotales - budgetPrevu)}.`,
            size: TAILLE_CORPS * 2,
            color: COULEUR_TEXTE,
          }),
        ],
        spacing: { before: 120, after: 200 },
      })
    )
  } else {
    contenu.push(
      paraCorps('Aucune donnée de suivi mensuel. Définir les dates de début et de fin du projet et renseigner le CA prévisionnel et réalisé via le module Budget.', true),
      paraVide(200)
    )
  }

  // ==================== 3. ÉTAT D'AVANCEMENT DES ÉTUDES ====================
  contenu.push(
    new Paragraph({
      text: '3. État d\'avancement des études',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 160 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDURES_TABLEAU,
      rows: [
        new TableRow({
          children: [
            cellHeader('Type'),
            cellHeader('Avancement %'),
            cellHeader('Dépôt à l\'administration'),
            cellHeader('État de validation'),
          ],
        }),
        ...etudes.map((e) =>
          new TableRow({
            children: [
              cellBody(e.phase),
              cellBody(e.avancementPct != null ? `${e.avancementPct} %` : '—'),
              cellBody(e.dateDepot),
              cellBody(e.etatValidation),
            ],
          })
        ),
      ],
    }),
    paraVide(200)
  )

  // ==================== 4. AVANCEMENT DES TRAVAUX / PRÉVISIONS ====================
  contenu.push(
    new Paragraph({
      text: '4. Avancement des travaux et prévisions',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Avancement global du projet : ${projet.avancementGlobal} %`, bold: true, size: TAILLE_CORPS * 2, color: COULEUR_TITRE })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: '4.1 Points bloquants',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 160, after: 120 },
    })
  )
  if (pointsBloquants.length > 0) {
    contenu.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BORDURES_TABLEAU,
        rows: [
          new TableRow({
            children: [cellHeader('Titre'), cellHeader('Description'), cellHeader('Priorité'), cellHeader('Statut')],
          }),
          ...pointsBloquants.map((pb) =>
            new TableRow({
              children: [
                cellBody(pb.titre),
                cellBody(pb.description ?? '—'),
                cellBody(pb.priorite),
                cellBody(pb.statut),
              ],
            })
          ),
        ],
      })
    )
  } else {
    contenu.push(paraCorps('Aucun point bloquant.'))
  }

  contenu.push(
    new Paragraph({
      text: `4.2 Prévisions — Semaine ${semaineCalendaire} (${anneeCalendaire}) en cours`,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 120 },
    })
  )
  if (previsions.length > 0) {
    contenu.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BORDURES_TABLEAU,
        rows: [
          new TableRow({
            children: [cellHeader('Période / Type'), cellHeader('Description'), cellHeader('Statut')],
          }),
          ...previsions.map((p) => {
            const periode = p.semaine != null && p.annee != null ? `Semaine ${p.semaine} (${p.annee})` : p.type.replace(/_/g, ' ')
            return new TableRow({
              children: [
                cellBody(periode),
                cellBody(p.description ?? '—'),
                cellBody(p.statut?.replace(/_/g, ' ') ?? '—'),
              ],
            })
          }),
        ],
      })
    )
  } else {
    contenu.push(paraCorps('Aucune prévision.'))
  }

  contenu.push(
    new Paragraph({ text: '4.3 Besoins matériels', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } }),
    paraCorps(projet.besoinsMateriel || '—'),
    new Paragraph({ text: '4.4 Besoins humains', heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 80 } }),
    paraCorps(projet.besoinsHumain || '—'),
    paraVide(200)
  )

  // ==================== 5. DESCRIPTION, OBSERVATIONS ET PROPOSITIONS ====================
  contenu.push(
    new Paragraph({
      text: '5. Description, observations et propositions d\'amélioration',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 160 },
    }),
    new Paragraph({ text: 'Description du projet', heading: HeadingLevel.HEADING_2, spacing: { after: 80 } }),
    new Paragraph({ text: projet.description || '—', spacing: { after: 200 } }),
    new Paragraph({ text: 'Observations', heading: HeadingLevel.HEADING_2, spacing: { after: 80 } }),
    new Paragraph({ text: projet.observations || '—', spacing: { after: 200 } }),
    new Paragraph({ text: 'Propositions d\'amélioration', heading: HeadingLevel.HEADING_2, spacing: { after: 80 } }),
    new Paragraph({ text: projet.propositionsAmelioration || '—', spacing: { after: 200 } }),
    paraVide(200)
  )

  // ==================== 6. ALERTES ET INDICATEURS ====================
  const hasAlertes = pointsBloquants.length > 0 || (rapport && (rapport.planning.tachesEnRetard > 0 || rapport.securite.risquesCritiques > 0))
  if (hasAlertes) {
    contenu.push(
      new Paragraph({
        text: '6. Alertes et indicateurs de vigilance',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 280, after: 160 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BORDURES_TABLEAU,
        rows: [
          ...(pointsBloquants.length > 0
            ? [new TableRow({ children: [cellLabel('Points bloquants'), cellValue(`${pointsBloquants.length} point(s) à traiter`, true)] })]
            : []),
          ...(rapport && rapport.planning.tachesEnRetard > 0
            ? [new TableRow({ children: [cellLabel('Tâches en retard'), cellValue(`${rapport.planning.tachesEnRetard} tâche(s)`, true)] })]
            : []),
          ...(rapport && rapport.securite.risquesCritiques > 0
            ? [new TableRow({ children: [cellLabel('Risques critiques'), cellValue(`${rapport.securite.risquesCritiques} risque(s)`, true)] })]
            : []),
        ],
      }),
      paraVide(200)
    )
  }

  // ==================== 7. SYNTHÈSE PROJET ====================
  const sectionSynthèseNum = hasAlertes ? 7 : 6
  contenu.push(
    new Paragraph({
      text: `${sectionSynthèseNum}. Synthèse projet`,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 160 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDURES_TABLEAU,
      rows: [
        new TableRow({ children: [cellLabel('Type de projet'), cellValue(getTypeProjetDisplay(getProjetTypes(projet), projet.typePersonnalise))] }),
        new TableRow({ children: [cellLabel('Nombre de sous-projets'), cellValue(String(projet.nombreSousProjets))] }),
        new TableRow({ children: [cellLabel('Points bloquants ouverts'), cellValue(String(projet.nombrePointsBloquantsOuverts))] }),
        new TableRow({ children: [cellLabel('Délai consommé'), cellValue(projet.delaiConsommePct != null ? `${projet.delaiConsommePct} %` : '—')] }),
        new TableRow({ children: [cellLabel('Avancement global'), cellValue(`${projet.avancementGlobal} %`)] }),
        new TableRow({ children: [cellLabel('Source de financement'), cellValue(projet.sourceFinancement?.replace(/_/g, ' ') ?? '—')] }),
        new TableRow({ children: [cellLabel('Partenaire principal'), cellValue(projet.partenairePrincipal ?? '—')] }),
        ...(projet.createdAt ? [new TableRow({ children: [cellLabel('Date de création'), cellValue(formatDate(projet.createdAt))] })] : []),
        ...(projet.updatedAt ? [new TableRow({ children: [cellLabel('Dernière mise à jour'), cellValue(formatDate(projet.updatedAt))] })] : []),
      ],
    }),
    paraVide(200)
  )

  // ==================== 8. DONNÉES STRATÉGIQUES ET INDICATEURS ====================
  const sectionIndicateursNum = sectionSynthèseNum + 1
  contenu.push(
    new Paragraph({
      text: `${sectionIndicateursNum}. Données stratégiques et indicateurs`,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 160 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDURES_TABLEAU,
      rows: [
        new TableRow({
          children: [
            cellHeader('Indicateur'),
            cellHeader('Valeur'),
          ],
        }),
        new TableRow({ children: [cellLabel('Avancement physique'), cellValue(`${projet.avancementPhysiquePct ?? projet.avancementGlobal} %`)] }),
        new TableRow({ children: [cellLabel('Avancement financier'), cellValue(`${rapport?.budget?.tauxConsommation ?? 0} %`)] }),
        new TableRow({ children: [cellLabel('Budget prévu / Dépenses réalisées'), cellValue(`${formatMontant(budgetPrevu)} / ${formatMontant(depensesTotales)}`)] }),
        new TableRow({ children: [cellLabel('Taux de conformité (qualité)'), cellValue(`${rapport?.qualite?.tauxConformite ?? 0} %`)] }),
        new TableRow({ children: [cellLabel('Non-conformités ouvertes'), cellValue(String(rapport?.qualite?.ncOuvertes ?? 0))] }),
        new TableRow({ children: [cellLabel('Incidents (sécurité)'), cellValue(String(rapport?.securite?.incidentsTotal ?? 0))] }),
        new TableRow({ children: [cellLabel('Risques critiques (sécurité)'), cellValue(String(rapport?.securite?.risquesCritiques ?? 0))] }),
        new TableRow({ children: [cellLabel('Tâches total (planning)'), cellValue(String(rapport?.planning?.tachesTotal ?? 0))] }),
        new TableRow({ children: [cellLabel('Tâches terminées'), cellValue(String(rapport?.planning?.tachesTerminees ?? 0))] }),
        new TableRow({ children: [cellLabel('Tâches en cours'), cellValue(String(rapport?.planning?.tachesEnCours ?? 0))] }),
        new TableRow({ children: [cellLabel('Tâches en retard'), cellValue(String(rapport?.planning?.tachesEnRetard ?? 0))] }),
        new TableRow({ children: [cellLabel('Taux d\'avancement planning'), cellValue(`${rapport?.planning?.tauxAvancement ?? 0} %`)] }),
      ],
    }),
    paraVide(200)
  )

  // ==================== 9. ACTEURS ET LOCALISATION ====================
  const sectionActeursNum = sectionIndicateursNum + 1
  contenu.push(
    new Paragraph({
      text: `${sectionActeursNum}. Acteurs et localisation`,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 160 },
    }),
    new Paragraph({ text: 'Client', heading: HeadingLevel.HEADING_2, spacing: { after: 80 } })
  )
  if (projet.client) {
    contenu.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BORDURES_TABLEAU,
        rows: [
          new TableRow({ children: [cellLabel('Raison sociale'), cellValue(projet.client.nom)] }),
          new TableRow({ children: [cellLabel('Type de client'), cellValue(projet.client.type.replace(/_/g, ' '))] }),
          ...(projet.client.contactPrincipal ? [new TableRow({ children: [cellLabel('Contact principal'), cellValue(projet.client.contactPrincipal)] })] : []),
          ...(projet.client.telephoneContact ? [new TableRow({ children: [cellLabel('Téléphone'), cellValue(projet.client.telephoneContact)] })] : []),
          ...(projet.client.email ? [new TableRow({ children: [cellLabel('E-mail'), cellValue(projet.client.email)] })] : []),
          ...(projet.client.adresse ? [new TableRow({ children: [cellLabel('Adresse'), cellValue(projet.client.adresse)] })] : []),
        ],
      })
    )
  } else {
    contenu.push(paraCorps('—'))
  }

  contenu.push(
    new Paragraph({ text: 'Chef de projet', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } })
  )
  if (projet.responsableProjet) {
    contenu.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BORDURES_TABLEAU,
        rows: [
          new TableRow({ children: [cellLabel('Nom'), cellValue(`${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}`)] }),
          new TableRow({ children: [cellLabel('E-mail'), cellValue(projet.responsableProjet.email)] }),
        ],
      })
    )
  } else {
    contenu.push(paraCorps('—'))
  }

  const localisation = [projet.province, projet.ville, projet.quartier].filter(Boolean).join(' · ') || '—'
  contenu.push(
    new Paragraph({ text: 'Localisation du projet', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } }),
    paraCorps(localisation),
    paraVide(280)
  )

  // ==================== PIED DE PAGE DOCUMENT ====================
  contenu.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Document généré le ${dateExport} à ${heureExport} — Semaine ${semaineCalendaire} (${anneeCalendaire})`,
          size: TAILLE_PIED * 2,
          color: COULEUR_SECONDAIRE,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Document confidentiel – MIKA Services – Usage interne et transmission officielle',
          size: TAILLE_PIED * 2,
          color: COULEUR_SECONDAIRE,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Référence : ${projet.numeroMarche ?? projet.id} — ${projet.nom}`,
          italics: true,
          size: TAILLE_PIED * 2,
          color: COULEUR_SECONDAIRE,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  )

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
            },
          },
        },
        children: contenu,
      },
    ],
  })

  return Packer.toBlob(doc)
}
