import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useConfirm } from '@/contexts/ConfirmContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PageContainer } from '@/components/layout/PageContainer'
import { Alert } from '@/components/ui/Alert'
import { createProjet, updateProjet, fetchProjetById, fetchClients, createClient, clearProjetDetail } from '@/store/slices/projetSlice'
import { userApi } from '@/api/userApi'
import { projetApi, pointBloquantApi } from '@/api/projetApi'
import type { User } from '@/types'
import type { ProjetCreateRequest, ProjetUpdateRequest, TypeProjet, StatutProjet, SourceFinancement, TypeClient, PhaseEtude, EtatValidationEtude, PointBloquant, Prevision, Priorite, StatutPointBloquant, TypePrevision, ModeSuiviMensuel } from '@/types/projet'
import { useFormatNumber } from '@/hooks/useFormatNumber'

/** Types de projet : chaque type est distinct (sans regroupement) + type personnalisé */
const TYPE_OPTIONS: { value: TypeProjet; label: string }[] = [
  { value: 'VOIRIE', label: 'Voirie' },
  { value: 'ROUTE', label: 'Route' },
  { value: 'CHAUSSEE', label: 'Chaussée' },
  { value: 'PONT', label: 'Pont' },
  { value: 'OUVRAGE_ART', label: 'Ouvrage d\'art' },
  { value: 'BATIMENT', label: 'Bâtiment' },
  { value: 'ASSAINISSEMENT', label: 'Assainissement' },
  { value: 'TERRASSEMENT', label: 'Terrassement' },
  { value: 'MIXTE', label: 'Mixte' },
  { value: 'GENIE_CIVIL', label: 'Génie Civil' },
  { value: 'REHABILITATION', label: 'Réhabilitation' },
  { value: 'AMENAGEMENT', label: 'Aménagement' },
  { value: 'AUTRE', label: 'Autre (personnalisé)' },
]

/** Options pour les points bloquants (titre prédéfini) */
const POINT_BLOQUANT_TITRE_OPTIONS: { value: string; label: string; group?: string }[] = [
  // Réseaux / Ouvrages
  { value: 'Conduite en fonte sur Axe 3', label: 'Conduite en fonte sur Axe 3', group: 'Réseaux / Ouvrages' },
  { value: 'Transformateur à déplacer sur l\'emprise Axe 4', label: 'Transformateur à déplacer sur l\'emprise Axe 4', group: 'Réseaux / Ouvrages' },
  { value: 'Besoin d\'une Niveleuse à temps plein', label: 'Besoin d\'une Niveleuse à temps plein', group: 'Réseaux / Ouvrages' },
  { value: 'Zones de déplacement de la Fibre optique au risque de la détériorer (urgent)', label: 'Zones de déplacement de la Fibre optique au risque de la détériorer (urgent)', group: 'Réseaux / Ouvrages' },
  { value: 'Suppression de la conduite en fonte de la SEEG de diamètre 100', label: 'Suppression de la conduite en fonte de la SEEG de diamètre 100', group: 'Réseaux / Ouvrages' },
  { value: 'Déplacement possible de la conduite de diamètre 800 située à 60 cm du pieu', label: 'Déplacement possible de la conduite de diamètre 800 située à 60 cm du pieu', group: 'Réseaux / Ouvrages' },
  { value: 'Déplacement possible HT 20000V — côté ASSOUME N.', label: 'Déplacement possible HT 20000V — côté ASSOUME N.', group: 'Réseaux / Ouvrages' },
  // Logistique / Matériel
  { value: 'Besoin matériel supplémentaire : pelle supplémentaire, tombereau', label: 'Besoin matériel supplémentaire : pelle supplémentaire, tombereau', group: 'Logistique' },
  { value: 'Faible approvisionnement en sable / risque d\'impact sur la production', label: 'Faible approvisionnement en sable / risque d\'impact sur la production', group: 'Logistique' },
  { value: 'Contrainte technique due au retard des études', label: 'Contrainte technique due au retard des études', group: 'Technique' },
  { value: 'Pas de conteneurs bureaux', label: 'Pas de conteneurs bureaux', group: 'Moyens généraux' },
  { value: 'Besoin en personnel', label: 'Besoin en personnel', group: 'Ressources humaines' },
  { value: 'Besoin en matériel', label: 'Besoin en matériel', group: 'Logistique' },
  { value: 'Attente rapport Topo/Labo pour contraintes Voie de contournement et AMO', label: 'Attente rapport Topo/Labo pour contraintes Voie de contournement et AMO', group: 'Études' },
  { value: 'Besoin de 02 presses à béton', label: 'Besoin de 02 presses à béton', group: 'Logistique' },
  { value: 'Remplacement compteur classique par un triphasé', label: 'Remplacement compteur classique par un triphasé', group: 'Technique' },
  { value: 'Groupe électrogène de relai pour éviter de pénaliser la préfabrication', label: 'Groupe électrogène de relai pour éviter de pénaliser la préfabrication', group: 'Technique' },
  { value: 'Bull permanent pour nettoyage de la zone de stockage', label: 'Bull permanent pour nettoyage de la zone de stockage', group: 'Logistique' },
  { value: '2ème HIAB pour la livraison des sites', label: '2ème HIAB pour la livraison des sites', group: 'Logistique' },
  { value: 'Renfort en camion benne', label: 'Renfort en camion benne', group: 'Logistique' },
  { value: 'Recrutement d\'un Conducteur de Travaux', label: 'Recrutement d\'un Conducteur de Travaux', group: 'Ressources humaines' },
  { value: 'Chef de Chantier Assainissement', label: 'Chef de Chantier Assainissement', group: 'Ressources humaines' },
  { value: 'Sortie Kalikak — attente campagne géotechnique', label: 'Sortie Kalikak — attente campagne géotechnique', group: 'Études' },
  { value: 'Voie AMO — Pelle, Niveleuse, Compacteur, 3 camions benne, 3 camions HIAB, 3 HTM', label: 'Voie AMO — Pelle, Niveleuse, Compacteur, 3 camions benne, 3 camions HIAB, 3 HTM', group: 'Logistique' },
  // Points critiques
  { value: 'Décompte N°3', label: 'Décompte N°3', group: 'Points critiques' },
  { value: 'Transmission des documents au MTPC pour validation du nouveau DQE', label: 'Transmission des documents au MTPC pour validation du nouveau DQE', group: 'Points critiques' },
  { value: 'Délai d\'exécution actualisé à communiquer en S2', label: 'Délai d\'exécution actualisé à communiquer en S2', group: 'Points critiques' },
  { value: 'État des besoins à transmettre le 12/01', label: 'État des besoins à transmettre le 12/01', group: 'Points critiques' },
  { value: 'Courrier au MTPC pour MAD homologue et MDC', label: 'Courrier au MTPC pour MAD homologue et MDC', group: 'Points critiques' },
  { value: 'Faire l\'état des lieux avec un huissier', label: 'Faire l\'état des lieux avec un huissier', group: 'Points critiques' },
  { value: 'Transmission du planning', label: 'Transmission du planning', group: 'Points critiques' },
  { value: 'Démarrage travaux Digue', label: 'Démarrage travaux Digue', group: 'Points critiques' },
  { value: 'Travaux de purge et installation de chantier', label: 'Travaux de purge et installation de chantier', group: 'Points critiques' },
  { value: '18 poutres de 17/90 soit 3/jours', label: '18 poutres de 17/90 soit 3/jours', group: 'Points critiques' },
  { value: '20 corniches de type A', label: '20 corniches de type A', group: 'Points critiques' },
  { value: '03 demi-chevêtres', label: '03 demi-chevêtres', group: 'Points critiques' },
  { value: '1 pieu 800 forés et coulés', label: '1 pieu 800 forés et coulés', group: 'Points critiques' },
  { value: '9 pieux de 1000 forés et coulés', label: '9 pieux de 1000 forés et coulés', group: 'Points critiques' },
  { value: '5 pieux de 800 recépés', label: '5 pieux de 800 recépés', group: 'Points critiques' },
  { value: 'Coulage BP de la culée C15, P13 et P14 (30 m³)', label: 'Coulage BP de la culée C15, P13 et P14 (30 m³)', group: 'Points critiques' },
  { value: 'Carottage des pieux C15-87 et C1-5', label: 'Carottage des pieux C15-87 et C1-5', group: 'Points critiques' },
  { value: 'Essai de convenance pour coulage des poteaux avec adjuvant OMEGA dosé à 1,8%', label: 'Essai de convenance pour coulage des poteaux avec adjuvant OMEGA dosé à 1,8%', group: 'Points critiques' },
  { value: 'Auscultation de 18 pieux minimum à partir du 12/02/2026', label: 'Auscultation de 18 pieux minimum à partir du 12/02/2026', group: 'Points critiques' },
  { value: 'MEO de la couche de latérite 150 à 300 ML/Semaine', label: 'MEO de la couche de latérite 150 à 300 ML/Semaine', group: 'Points critiques' },
  { value: 'Voie Gustave — fin travaux OH', label: 'Voie Gustave — fin travaux OH', group: 'Points critiques' },
  { value: 'Début travaux de terrassement (caniveaux — couches de GNT)', label: 'Début travaux de terrassement (caniveaux — couches de GNT)', group: 'Points critiques' },
  { value: 'Préparation de plateformes MAYENA', label: 'Préparation de plateformes MAYENA', group: 'Points critiques' },
  { value: 'Voie AMO — nettoyage des zones déblai/remblais', label: 'Voie AMO — nettoyage des zones déblai/remblais', group: 'Points critiques' },
  { value: 'Livraison Voie Gustave et AMO en Février 2026', label: 'Livraison Voie Gustave et AMO en Février 2026', group: 'Points critiques' },
  { value: 'Nettoyage de l\'emprise en cours (jonction Gustave et Saoti)', label: 'Nettoyage de l\'emprise en cours (jonction Gustave et Saoti)', group: 'Points critiques' },
  { value: 'Visite prévue sur site en S2 pour état des besoins', label: 'Visite prévue sur site en S2 pour état des besoins', group: 'Points critiques' },
  { value: 'Tri du personnel en cours en vue du recrutement', label: 'Tri du personnel en cours en vue du recrutement', group: 'Points critiques' },
  { value: 'Livrables attendus pour fin février 2026', label: 'Livrables attendus pour fin février 2026', group: 'Points critiques' },
  // Options existantes
  { value: 'Retard livraison matériel', label: 'Retard livraison matériel', group: 'Logistique' },
  { value: 'Manque d\'engins sur site', label: 'Manque d\'engins sur site', group: 'Logistique' },
  { value: 'Attente approbation plans', label: 'Attente approbation plans', group: 'Administratif' },
  { value: 'Délai déblocage financement', label: 'Délai déblocage financement', group: 'Administratif' },
  { value: 'Absence de visa MTPC', label: 'Absence de visa MTPC', group: 'Administratif' },
  { value: 'Conflit avec riverains', label: 'Conflit avec riverains', group: 'Social' },
  { value: 'Météo défavorable', label: 'Météo défavorable', group: 'Environnement' },
  { value: 'Sous-sol imprévu (roche, nappe)', label: 'Sous-sol imprévu (roche, nappe)', group: 'Technique' },
  { value: 'Réseaux existants non répertoriés', label: 'Réseaux existants non répertoriés', group: 'Technique' },
  { value: 'Retard sous-traitant', label: 'Retard sous-traitant', group: 'Partenaire' },
  { value: 'Pénurie main-d\'œuvre qualifiée', label: 'Pénurie main-d\'œuvre qualifiée', group: 'Ressources humaines' },
  { value: 'Panne engin critique', label: 'Panne engin critique', group: 'Technique' },
  { value: 'Rupture stock matériaux', label: 'Rupture stock matériaux', group: 'Logistique' },
  { value: 'Modification DCE par maître d\'ouvrage', label: 'Modification DCE par maître d\'ouvrage', group: 'Administratif' },
  { value: 'Attente décision géotechnique', label: 'Attente décision géotechnique', group: 'Technique' },
  { value: 'Défaut qualité fournisseur', label: 'Défaut qualité fournisseur', group: 'Qualité' },
  { value: 'Accident / incident sécurité', label: 'Accident / incident sécurité', group: 'Sécurité' },
  { value: 'Contrainte accès chantier', label: 'Contrainte accès chantier', group: 'Logistique' },
  { value: 'Désaccord quantitatif', label: 'Désaccord quantitatif', group: 'Administratif' },
  { value: 'Retard bureau de contrôle', label: 'Retard bureau de contrôle', group: 'Administratif' },
]

const PRIORITE_OPTIONS: { value: Priorite; label: string }[] = [
  { value: 'BASSE', label: 'Basse' },
  { value: 'NORMALE', label: 'Normale' },
  { value: 'HAUTE', label: 'Haute' },
  { value: 'URGENTE', label: 'Urgente' },
  { value: 'CRITIQUE', label: 'Critique' },
]

const STATUT_POINT_BLOQUANT_OPTIONS: { value: StatutPointBloquant; label: string }[] = [
  { value: 'OUVERT', label: 'Ouvert' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'RESOLU', label: 'Résolu' },
  { value: 'FERME', label: 'Fermé' },
  { value: 'ESCALADE', label: 'Escalade' },
]

/** Slug pour clés i18n : normalise et remplace espaces/caractères spéciaux par _ */
function slugForI18n(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\u0153/g, 'oe') // œ → oe
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/°/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/** Groupes point bloquant : libellé FR → clé i18n */
const POINT_BLOQUANT_GROUP_KEYS: Record<string, string> = {
  'Réseaux / Ouvrages': 'reseaux_ouvrages',
  'Points critiques': 'points_critiques',
  'Logistique': 'logistique',
  'Technique': 'technique',
  'Moyens généraux': 'moyens_generaux',
  'Ressources humaines': 'ressources_humaines',
  'Études': 'etudes',
  'Administratif': 'administratif',
  'Social': 'social',
  'Environnement': 'environnement',
  'Partenaire': 'partenaire',
  'Qualité': 'qualite',
  'Sécurité': 'securite',
}

/** Options point bloquant : value (libellé FR) → clé i18n (certaines clés sont abrégées) */
const POINT_BLOQUANT_OPTION_KEYS: Record<string, string> = {
  'Conduite en fonte sur Axe 3': 'conduite_en_fonte_sur_axe_3',
  "Transformateur à déplacer sur l'emprise Axe 4": 'transformateur_a_deplacer_sur_emprise_axe_4',
  "Besoin d'une Niveleuse à temps plein": 'besoin_d_une_niveleuse_a_temps_plein',
  'Zones de déplacement de la Fibre optique au risque de la détériorer (urgent)': 'zones_de_deplacement_fibre_optique',
  'Suppression de la conduite en fonte de la SEEG de diamètre 100': 'suppression_conduite_fonte_seeg_100',
  'Déplacement possible de la conduite de diamètre 800 située à 60 cm du pieu': 'deplacement_conduite_800_60cm_pieu',
  'Déplacement possible HT 20000V — côté ASSOUME N.': 'deplacement_ht_20000v_assoume',
  'Besoin matériel supplémentaire : pelle supplémentaire, tombereau': 'besoin_materiel_pelle_tombereau',
  "Faible approvisionnement en sable / risque d'impact sur la production": 'faible_approvisionnement_sable',
  'Contrainte technique due au retard des études': 'contrainte_technique_retard_etudes',
  'Pas de conteneurs bureaux': 'pas_de_conteneurs_bureaux',
  'Besoin en personnel': 'besoin_en_personnel',
  'Besoin en matériel': 'besoin_en_materiel',
  'Attente rapport Topo/Labo pour contraintes Voie de contournement et AMO': 'attente_rapport_topo_labo',
  'Besoin de 02 presses à béton': 'besoin_02_presses_a_beton',
  'Remplacement compteur classique par un triphasé': 'remplacement_compteur_triphase',
  "Groupe électrogène de relai pour éviter de pénaliser la préfabrication": 'groupe_electrogene_relai_prefabrication',
  'Bull permanent pour nettoyage de la zone de stockage': 'bull_permanent_nettoyage_stockage',
  '2ème HIAB pour la livraison des sites': '2eme_hiab_livraison_sites',
  'Renfort en camion benne': 'renfort_camion_benne',
  "Recrutement d'un Conducteur de Travaux": 'recrutement_conducteur_travaux',
  'Chef de Chantier Assainissement': 'chef_chantier_assainissement',
  'Sortie Kalikak — attente campagne géotechnique': 'sortie_kalikak_campagne_geotechnique',
  'Voie AMO — Pelle, Niveleuse, Compacteur, 3 camions benne, 3 camions HIAB, 3 HTM': 'voie_amo_engins',
  'Décompte N°3': 'decompte_n_3',
  'Transmission des documents au MTPC pour validation du nouveau DQE': 'transmission_documents_mtpc_dqe',
  "Délai d'exécution actualisé à communiquer en S2": 'delai_execution_actualise_s2',
  "État des besoins à transmettre le 12/01": 'etat_besoins_12_01',
  'Courrier au MTPC pour MAD homologue et MDC': 'courrier_mtpc_mad_mdc',
  "Faire l'état des lieux avec un huissier": 'etat_des_lieux_huissier',
  'Transmission du planning': 'transmission_planning',
  'Démarrage travaux Digue': 'demarrage_travaux_digue',
  'Travaux de purge et installation de chantier': 'travaux_purge_installation_chantier',
  '18 poutres de 17/90 soit 3/jours': '18_poutres_17_90',
  '20 corniches de type A': '20_corniches_type_a',
  '03 demi-chevêtres': '03_demi_chevêtres',
  '1 pieu 800 forés et coulés': '1_pieu_800_fores_coules',
  '9 pieux de 1000 forés et coulés': '9_pieux_1000_fores_coules',
  '5 pieux de 800 recépés': '5_pieux_800_recepes',
  'Coulage BP de la culée C15, P13 et P14 (30 m³)': 'coulage_bp_culee_c15_30m3',
  'Carottage des pieux C15-87 et C1-5': 'carottage_pieux_c15_87_c1_5',
  'Essai de convenance pour coulage des poteaux avec adjuvant OMEGA dosé à 1,8%': 'essai_convenance_poteaux_omega',
  'Auscultation de 18 pieux minimum à partir du 12/02/2026': 'auscultation_18_pieux_12_02_2026',
  'MEO de la couche de latérite 150 à 300 ML/Semaine': 'meo_laterite_150_300_ml_semaine',
  'Voie Gustave — fin travaux OH': 'voie_gustave_fin_travaux_oh',
  'Début travaux de terrassement (caniveaux — couches de GNT)': 'debut_terrassement_caniveaux_gnt',
  'Préparation de plateformes MAYENA': 'preparation_plateformes_mayena',
  'Voie AMO — nettoyage des zones déblai/remblais': 'voie_amo_nettoyage_deblai_remblais',
  'Livraison Voie Gustave et AMO en Février 2026': 'livraison_voie_gustave_amo_fevrier_2026',
  "Nettoyage de l'emprise en cours (jonction Gustave et Saoti)": 'nettoyage_emprise_jonction_gustave_saoti',
  'Visite prévue sur site en S2 pour état des besoins': 'visite_site_s2_etat_besoins',
  'Tri du personnel en cours en vue du recrutement': 'tri_personnel_recrutement',
  'Livrables attendus pour fin février 2026': 'livrables_fin_fevrier_2026',
  'Retard livraison matériel': 'retard_livraison_materiel',
  "Manque d'engins sur site": 'manque_engins_site',
  'Attente approbation plans': 'attente_approbation_plans',
  'Délai déblocage financement': 'delai_deblocage_financement',
  'Absence de visa MTPC': 'absence_visa_mtpc',
  'Conflit avec riverains': 'conflit_riverains',
  'Météo défavorable': 'meteo_defavorable',
  'Sous-sol imprévu (roche, nappe)': 'sous_sol_imprevu',
  'Réseaux existants non répertoriés': 'reseaux_existants_non_repertories',
  'Retard sous-traitant': 'retard_sous_traitant',
  "Pénurie main-d'œuvre qualifiée": 'penurie_main_oeuvre_qualifiee',
  'Panne engin critique': 'panne_engin_critique',
  'Rupture stock matériaux': 'rupture_stock_materiaux',
  "Modification DCE par maître d'ouvrage": 'modification_dce_maitre_ouvrage',
  'Attente décision géotechnique': 'attente_decision_geotechnique',
  'Défaut qualité fournisseur': 'defaut_qualite_fournisseur',
  'Accident / incident sécurité': 'accident_incident_securite',
  'Contrainte accès chantier': 'contrainte_acces_chantier',
  'Désaccord quantitatif': 'desaccord_quantitatif',
  'Retard bureau de contrôle': 'retard_bureau_controle',
}

/** Groupes prévision : libellé FR → clé i18n */
const PREVISION_GROUP_KEYS: Record<string, string> = {
  'Travaux': 'travaux',
  'Études': 'etudes',
  'Qualité': 'qualite',
  'Pilotage': 'pilotage',
  'Administratif': 'administratif',
  'Logistique': 'logistique',
  'Sécurité': 'securite',
}

/** Groupes besoins matériel / humain */
const BESOINS_MATERIEL_GROUP_KEYS: Record<string, string> = { 'Engins': 'engins', 'Équipements': 'equipements', 'Combinaisons': 'combinaisons' }
const BESOINS_HUMAIN_GROUP_KEYS: Record<string, string> = { 'Rôles': 'roles', 'Combinaisons': 'combinaisons' }

/** Numéro de semaine ISO (1–53) pour une date. */
function getSemaineISO(date: Date): number {
  const d = new Date(date.getTime())
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 4)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.min(53, Math.ceil((((d.getTime() - jan1.getTime()) / 86400000) + 1) / 7))
}
/** Semaine courante (année + numéro ISO) pour préselection. */
function getSemaineCourante(): { annee: number; semaine: number } {
  const now = new Date()
  return { annee: now.getFullYear(), semaine: getSemaineISO(now) }
}

const PREVISION_DESCRIPTION_OPTIONS: { value: string; label: string; group?: string }[] = [
  { value: 'Terrassement général', label: 'Terrassement général', group: 'Travaux' },
  { value: 'Décapage', label: 'Décapage', group: 'Travaux' },
  { value: 'Remblai / compactage', label: 'Remblai / compactage', group: 'Travaux' },
  { value: 'Coulage fondations', label: 'Coulage fondations', group: 'Travaux' },
  { value: 'Coulage béton (dalle, poteaux)', label: 'Coulage béton (dalle, poteaux)', group: 'Travaux' },
  { value: 'Pose enrobé', label: 'Pose enrobé', group: 'Travaux' },
  { value: 'Pose bordures / caniveaux', label: 'Pose bordures / caniveaux', group: 'Travaux' },
  { value: 'Travaux d\'assainissement (réseaux)', label: 'Travaux d\'assainissement (réseaux)', group: 'Travaux' },
  { value: 'Ouvrage d\'art (dalle, culée)', label: 'Ouvrage d\'art (dalle, culée)', group: 'Travaux' },
  { value: 'Gros œuvre bâtiment', label: 'Gros œuvre bâtiment', group: 'Travaux' },
  { value: 'Topographie / piquetage', label: 'Topographie / piquetage', group: 'Études' },
  { value: 'Sondage / géotechnique', label: 'Sondage / géotechnique', group: 'Études' },
  { value: 'Contrôle qualité (laboratoire)', label: 'Contrôle qualité (laboratoire)', group: 'Qualité' },
  { value: 'Réunion de chantier', label: 'Réunion de chantier', group: 'Pilotage' },
  { value: 'Décompte / situation', label: 'Décompte / situation', group: 'Administratif' },
  { value: 'Transmission documents MTPC', label: 'Transmission documents MTPC', group: 'Administratif' },
  { value: 'Réception livraison matériaux', label: 'Réception livraison matériaux', group: 'Logistique' },
  { value: 'Mise en place matériel / engins', label: 'Mise en place matériel / engins', group: 'Logistique' },
  { value: 'Coordination sous-traitants', label: 'Coordination sous-traitants', group: 'Pilotage' },
  { value: 'Visite bureau de contrôle', label: 'Visite bureau de contrôle', group: 'Qualité' },
  { value: 'Formation sécurité équipe', label: 'Formation sécurité équipe', group: 'Sécurité' },
]

const TYPE_PREVISION_OPTIONS: { value: TypePrevision; label: string }[] = [
  { value: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
  { value: 'MENSUELLE', label: 'Mensuelle' },
  { value: 'TRIMESTRIELLE', label: 'Trimestrielle' },
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'APPROVISIONNEMENT', label: 'Approvisionnement' },
  { value: 'RESSOURCES_HUMAINES', label: 'Ressources humaines' },
  { value: 'MATERIEL', label: 'Matériel' },
]


const STATUT_OPTIONS: { value: StatutProjet; label: string }[] = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'PLANIFIE', label: 'Planifié' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'SUSPENDU', label: 'Suspendu' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'RECEPTION_PROVISOIRE', label: 'Réception provisoire' },
  { value: 'RECEPTION_DEFINITIVE', label: 'Réception définitive' },
]

const SOURCE_OPTIONS: { value: SourceFinancement; label: string }[] = [
  { value: 'ETAT_GABONAIS', label: 'État Gabonais' },
  { value: 'BGFIBANK', label: 'BGFI Bank' },
  { value: 'BAD', label: 'BAD' },
  { value: 'BM', label: 'Banque Mondiale' },
  { value: 'AFD', label: 'AFD' },
  { value: 'PARTENARIAT_PUBLIC_PRIVE', label: 'PPP' },
  { value: 'FONDS_PROPRES', label: 'Fonds propres' },
  { value: 'MIXTE', label: 'Mixte' },
]

const TYPE_CLIENT_OPTIONS: { value: TypeClient; label: string }[] = [
  { value: 'ETAT_GABON', label: 'État Gabon' },
  { value: 'MINISTERE', label: 'Ministère' },
  { value: 'COLLECTIVITE', label: 'Collectivité' },
  { value: 'ENTREPRISE_PUBLIQUE', label: 'Entreprise publique' },
  { value: 'ENTREPRISE_PRIVEE', label: 'Entreprise privée' },
  { value: 'PARTICULIER', label: 'Particulier' },
]

const PHASES_ETUDE: PhaseEtude[] = ['APS', 'APD', 'EXE', 'GEOTECHNIQUE', 'HYDRAULIQUE', 'EIES', 'PAES']
/** Valeurs possibles pour l'état de validation (liste déroulante) */
const ETATS_VALIDATION_ETUDE: EtatValidationEtude[] = ['NON_DEPOSE', 'EN_ATTENTE', 'EN_COURS', 'VALIDE', 'REFUSE']

/** Calcule la date de fin contractuelle à partir de la date de début et du délai en mois (imposé par le client). */
function computeDateFinFromDebutEtDelai(dateDebut: string, delaiMois: number | undefined): string {
  if (!dateDebut || !delaiMois || delaiMois < 1) return ''
  const d = new Date(dateDebut + 'T12:00:00')
  d.setMonth(d.getMonth() + delaiMois)
  return d.toISOString().slice(0, 10)
}

/** Erreurs de cohérence des dates (clé = nom du champ). t = useTranslation('projet').t */
function validateDateCoherence(
  data: { dateDebut?: string; dateFin?: string; dateDebutReel?: string; dateFinReelle?: string },
  t: (key: string) => string
): { dateDebut?: string; dateFin?: string; dateDebutReel?: string; dateFinReelle?: string } {
  const err: { dateDebut?: string; dateFin?: string; dateDebutReel?: string; dateFinReelle?: string } = {}
  const dD = data.dateDebut ? new Date(data.dateDebut).getTime() : 0
  const dF = data.dateFin ? new Date(data.dateFin).getTime() : 0
  const dDR = data.dateDebutReel ? new Date(data.dateDebutReel).getTime() : 0
  const dFR = data.dateFinReelle ? new Date(data.dateFinReelle).getTime() : 0

  if (data.dateDebut && data.dateFin && dF < dD) err.dateFin = t('validation.dateFinBeforeDebut')
  if (data.dateDebutReel && data.dateDebut && dDR < dD) err.dateDebutReel = t('validation.dateDebutReelBeforeDebut')
  if (data.dateDebutReel && data.dateFin && dDR > dF) err.dateDebutReel = err.dateDebutReel || t('validation.dateDebutReelAfterFin')
  if (data.dateFinReelle && data.dateDebut && dFR < dD) err.dateFinReelle = t('validation.dateFinReelleBeforeDebut')
  if (data.dateFinReelle && data.dateDebutReel && dFR < dDR) err.dateFinReelle = err.dateFinReelle || t('validation.dateFinReelleBeforeDebutReel')
  return err
}

/** Message unique pour blocage de soumission (premier message d’erreur de dates) */
function getDateCoherenceSubmitError(dateErrors: { dateDebut?: string; dateFin?: string; dateDebutReel?: string; dateFinReelle?: string }): string | null {
  const first = dateErrors.dateFin ?? dateErrors.dateDebutReel ?? dateErrors.dateFinReelle ?? dateErrors.dateDebut
  return first ?? null
}

/** Séparateur pour stocker plusieurs besoins dans un seul champ texte */
const BESOINS_SEP = ' • '

/** Besoins matériels prédéfinis (engins, équipements, combinaisons) */
const BESOINS_MATERIEL_OPTIONS: { value: string; label: string; group?: string }[] = [
  { value: 'Niveleuse (1 unité)', label: 'Niveleuse (1 unité)', group: 'Engins' },
  { value: 'Compacteur (1 unité)', label: 'Compacteur (1 unité)', group: 'Engins' },
  { value: 'Pelle hydraulique (1 unité)', label: 'Pelle hydraulique (1 unité)', group: 'Engins' },
  { value: 'Bulldozer (1 unité)', label: 'Bulldozer (1 unité)', group: 'Engins' },
  { value: 'Camion benne (2 unités)', label: 'Camion benne (2 unités)', group: 'Engins' },
  { value: 'Dumper (1 unité)', label: 'Dumper (1 unité)', group: 'Engins' },
  { value: 'Chargeur (1 unité)', label: 'Chargeur (1 unité)', group: 'Engins' },
  { value: 'Rouleau compresseur (1 unité)', label: 'Rouleau compresseur (1 unité)', group: 'Engins' },
  { value: 'Presse à béton (1 unité)', label: 'Presse à béton (1 unité)', group: 'Équipements' },
  { value: 'Bétonnière (1 unité)', label: 'Bétonnière (1 unité)', group: 'Équipements' },
  { value: 'Groupe électrogène (1 unité)', label: 'Groupe électrogène (1 unité)', group: 'Équipements' },
  { value: 'Pompe à béton (1 unité)', label: 'Pompe à béton (1 unité)', group: 'Équipements' },
  { value: 'Niveleuse + compacteur', label: 'Niveleuse + compacteur', group: 'Combinaisons' },
  { value: 'Niveleuse + 2 camions benne', label: 'Niveleuse + 2 camions benne', group: 'Combinaisons' },
  { value: 'Pelle + 2 dumpers', label: 'Pelle + 2 dumpers', group: 'Combinaisons' },
  { value: '2 presses à béton + bétonnière', label: '2 presses à béton + bétonnière', group: 'Combinaisons' },
  { value: 'Camion-citerne (eau)', label: 'Camion-citerne (eau)', group: 'Engins' },
  { value: 'Grue à tour (1 unité)', label: 'Grue à tour (1 unité)', group: 'Équipements' },
]

/** Besoins humains prédéfinis (rôles, combinaisons) */
const BESOINS_HUMAIN_OPTIONS: { value: string; label: string; group?: string }[] = [
  { value: 'Chef de chantier (1)', label: 'Chef de chantier (1)', group: 'Rôles' },
  { value: 'Conducteur de travaux (1)', label: 'Conducteur de travaux (1)', group: 'Rôles' },
  { value: 'Conducteur engins (2)', label: 'Conducteur engins (2)', group: 'Rôles' },
  { value: 'Ouvrier qualifié (2)', label: 'Ouvrier qualifié (2)', group: 'Rôles' },
  { value: 'Stagiaire génie civil (1)', label: 'Stagiaire génie civil (1)', group: 'Rôles' },
  { value: 'Topographe (1)', label: 'Topographe (1)', group: 'Rôles' },
  { value: 'Géomètre (1)', label: 'Géomètre (1)', group: 'Rôles' },
  { value: 'Soudeur (1)', label: 'Soudeur (1)', group: 'Rôles' },
  { value: 'Grutier (1)', label: 'Grutier (1)', group: 'Rôles' },
  { value: 'Agent de sécurité (1)', label: 'Agent de sécurité (1)', group: 'Rôles' },
  { value: '1 chef de chantier + 2 conducteurs engins', label: '1 chef de chantier + 2 conducteurs engins', group: 'Combinaisons' },
  { value: '1 conducteur de travaux + 2 ouvriers', label: '1 conducteur de travaux + 2 ouvriers', group: 'Combinaisons' },
  { value: '1 topographe + 1 géomètre', label: '1 topographe + 1 géomètre', group: 'Combinaisons' },
  { value: '2 conducteurs engins + 1 grutier', label: '2 conducteurs engins + 1 grutier', group: 'Combinaisons' },
]

function parseBesoinsList(str: string | undefined): string[] {
  if (!str || !str.trim()) return []
  return str.split(BESOINS_SEP).map((s) => s.trim()).filter(Boolean)
}

function getMoisEntreDates(dateDebut?: string, dateFin?: string, monthsShort?: string[]): { label: string; mois: number; annee: number }[] {
  if (!dateDebut || !dateFin) return []
  const start = new Date(dateDebut)
  const end = new Date(dateFin)
  if (end < start) return []
  const labels = monthsShort ?? ['Janv', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
  const mois: { label: string; mois: number; annee: number }[] = []
  let cur = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cur <= endMonth) {
    mois.push({
      label: `${labels[cur.getMonth()]}-${cur.getFullYear()}`,
      mois: cur.getMonth() + 1,
      annee: cur.getFullYear(),
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return mois
}

export interface SuiviMensuelRow {
  label: string
  mois: number
  annee: number
  caPrevisionnel: number
  caRealise: number
}

export const ProjetFormPage = () => {
  const { t } = useTranslation('projet')
  const { formatNumber } = useFormatNumber()
  const monthsShort = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => t(`detail.monthsShort_${i}`)), [t])
  const confirm = useConfirm()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.auth.user)
  const { projetDetail, clients, loading } = useAppSelector((state) => state.projet)
  const [error, setError] = useState<string | null>(null)
  const [dateErrors, setDateErrors] = useState<{ dateDebut?: string; dateFin?: string; dateDebutReel?: string; dateFinReelle?: string }>({})
  const [users, setUsers] = useState<User[]>([])

  const isAdmin = currentUser?.roles?.some((r) => r.code === 'ADMIN' || r.code === 'SUPER_ADMIN') ?? false
  const isChefDeProjet = !isEdit || Boolean(projetDetail?.responsableProjet && currentUser?.id === projetDetail.responsableProjet.id)
  const readOnly = isEdit && !isChefDeProjet && !isAdmin

  const [form, setForm] = useState<ProjetCreateRequest>({
    nom: '',
    types: ['VOIRIE'],
    statut: 'EN_ATTENTE',
    description: '',
    numeroMarche: '',
    modeSuiviMensuel: 'AUTO',
  })
  const [sansNumeroMarche, setSansNumeroMarche] = useState(false)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [newClient, setNewClient] = useState({ nom: '', type: 'ENTREPRISE_PRIVEE' as TypeClient })
  const [suiviMensuelRows, setSuiviMensuelRows] = useState<SuiviMensuelRow[]>([])
  const [savedSuiviMensuel, setSavedSuiviMensuel] = useState<{ mois: number; annee: number; caPrevisionnel: number; caRealise: number }[]>([])
  const prevSuiviModeRef = useRef<ModeSuiviMensuel>('AUTO')
  const [manualSuiviNewMonth, setManualSuiviNewMonth] = useState<number>(new Date().getMonth() + 1)
  const [manualSuiviNewYear, setManualSuiviNewYear] = useState<number>(new Date().getFullYear())
  const [manualSuiviError, setManualSuiviError] = useState<string | null>(null)
  const [avancementEtudesRows, setAvancementEtudesRows] = useState<{ phase: PhaseEtude; avancementPct?: number; dateDepot?: string; etatValidation?: string }[]>([])
  const [pointsBloquants, setPointsBloquants] = useState<PointBloquant[]>([])
  const [addingPointBloquant, setAddingPointBloquant] = useState(false)
  const [previsions, setPrevisions] = useState<Prevision[]>([])
  const { annee: defaultAnnee, semaine: defaultSemaine } = getSemaineCourante()
  const [selectedAnneePrevision, setSelectedAnneePrevision] = useState(defaultAnnee)
  const [selectedSemainePrevision, setSelectedSemainePrevision] = useState(defaultSemaine)

  useEffect(() => {
    dispatch(fetchClients({ page: 0, size: 500 }))
    userApi.getAll({ page: 0, size: 500 }).then((res) => setUsers(res.content)).catch(() => setUsers([]))
    if (isEdit) dispatch(fetchProjetById(Number(id)))
    return () => { dispatch(clearProjetDetail()) }
  }, [dispatch, id, isEdit])

  useEffect(() => {
    if (isEdit && projetDetail) {
      const dateDebut = projetDetail.dateDebut || ''
      const dateFin = projetDetail.dateFin || ''
      let delaiMois = projetDetail.delaiMois || undefined
      if (delaiMois == null && dateDebut && dateFin) {
        delaiMois = Math.max(1, Math.round((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
      }
      const initial = {
        nom: projetDetail.nom,
        types: ((projetDetail.types && projetDetail.types.length > 0) ? projetDetail.types : (projetDetail.type ? [projetDetail.type] : ['VOIRIE'])) as TypeProjet[],
        typePersonnalise: projetDetail.typePersonnalise || '',
        statut: projetDetail.statut,
        description: projetDetail.description || '',
        numeroMarche: projetDetail.numeroMarche || '',
        clientId: projetDetail.client?.id,
        sourceFinancement: projetDetail.sourceFinancement || undefined,
        imputationBudgetaire: projetDetail.imputationBudgetaire || '',
        montantHT: projetDetail.montantHT || undefined,
        montantTTC: projetDetail.montantTTC || undefined,
        montantInitial: projetDetail.montantInitial || undefined,
        montantRevise: projetDetail.montantRevise || undefined,
        delaiMois,
        modeSuiviMensuel: (projetDetail.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO',
        dateDebut,
        dateFin,
        dateDebutReel: projetDetail.dateDebutReel || '',
        dateFinReelle: projetDetail.dateFinReelle || '',
        // Valeur unique d'avancement physique : priorité à avancementPhysiquePct, sinon avancementGlobal (synchronisés à la sauvegarde)
        avancementGlobal: projetDetail.avancementPhysiquePct ?? projetDetail.avancementGlobal ?? undefined,
        avancementPhysiquePct: projetDetail.avancementPhysiquePct ?? projetDetail.avancementGlobal ?? undefined,
        avancementFinancierPct: projetDetail.avancementFinancierPct ?? undefined,
        delaiConsommePct: projetDetail.delaiConsommePct ?? undefined,
        besoinsMateriel: projetDetail.besoinsMateriel || '',
        besoinsHumain: projetDetail.besoinsHumain || '',
        observations: projetDetail.observations || '',
        partenairePrincipal: projetDetail.partenairePrincipal || '',
        responsableProjetId: projetDetail.responsableProjet?.id,
        propositionsAmelioration: projetDetail.propositionsAmelioration || '',
      }
      setForm(initial)
      setDateErrors(validateDateCoherence(initial, t))
      setSansNumeroMarche(!(projetDetail.numeroMarche?.trim()))
    }
  }, [isEdit, projetDetail, t])

  // Charger suivi mensuel sauvegardé (une fois en édition)
  useEffect(() => {
    if (!isEdit || !id) return
    projetApi.getSuiviMensuel(Number(id)).then((list) => {
      setSavedSuiviMensuel(list.map((r) => ({
        mois: r.mois,
        annee: r.annee,
        caPrevisionnel: typeof r.caPrevisionnel === 'number' ? r.caPrevisionnel : Number(r.caPrevisionnel) || 0,
        caRealise: typeof r.caRealise === 'number' ? r.caRealise : Number(r.caRealise) || 0,
      })))
    }).catch(() => {})
  }, [isEdit, id])

  // Charger points bloquants et prévisions en édition
  useEffect(() => {
    if (!isEdit || !id) return
    const pid = Number(id)
    pointBloquantApi.findByProjet(pid, 0, 100).then((res) => setPointsBloquants(res.content ?? [])).catch(() => setPointsBloquants([]))
    projetApi.getPrevisions(pid).then(setPrevisions).catch(() => setPrevisions([]))
  }, [isEdit, id])

  // Charger avancement des études en édition
  useEffect(() => {
    if (!isEdit || !id) return
    projetApi.getAvancementEtudes(Number(id)).then((list) => {
      if (list.length > 0) {
        setAvancementEtudesRows(PHASES_ETUDE.map((phase) => {
          const existing = list.find((e) => e.phase === phase)
          return existing
            ? { phase, avancementPct: existing.avancementPct, dateDepot: existing.dateDepot, etatValidation: existing.etatValidation }
            : { phase }
        }))
      } else {
        setAvancementEtudesRows(PHASES_ETUDE.map((phase) => ({ phase })))
      }
    }).catch(() => setAvancementEtudesRows(PHASES_ETUDE.map((phase) => ({ phase }))))
  }, [isEdit, id])

  // Construire les lignes du suivi mensuel :
  // - AUTO (logique existante) : mois entre dates contractuelles, fusion avec sauvegardé/édition
  // - MANUEL : liste libre (initialisée depuis le backend, puis éditable sans recalcul)
  useEffect(() => {
    const mode = (form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO'
    const prevMode = prevSuiviModeRef.current

    if (mode === 'MANUEL') {
      // En mode manuel, on initialise la liste depuis le backend à l'entrée dans le mode.
      // Ensuite, la liste est gérée manuellement (ajout/suppression) sans recalcul automatique.
      if (isEdit) {
        const enteringManual = prevMode !== 'MANUEL'
        if (enteringManual) {
          const rows = savedSuiviMensuel
            .slice()
            .sort((a, b) => (a.annee - b.annee) || (a.mois - b.mois))
            .map((r) => ({
              label: `${monthsShort[(r.mois ?? 1) - 1] ?? ''}-${r.annee}`,
              mois: r.mois,
              annee: r.annee,
              caPrevisionnel: r.caPrevisionnel,
              caRealise: r.caRealise,
            }))
          setSuiviMensuelRows(rows)
        } else if (savedSuiviMensuel.length > 0) {
          // 1er chargement : si aucune ligne encore affichée, initialiser depuis le backend.
          setSuiviMensuelRows((prev) => {
            if (prev.length > 0) return prev
            return savedSuiviMensuel
              .slice()
              .sort((a, b) => (a.annee - b.annee) || (a.mois - b.mois))
              .map((r) => ({
                label: `${monthsShort[(r.mois ?? 1) - 1] ?? ''}-${r.annee}`,
                mois: r.mois,
                annee: r.annee,
                caPrevisionnel: r.caPrevisionnel,
                caRealise: r.caRealise,
              }))
          })
        }
      }
      prevSuiviModeRef.current = mode
      return
    }

    // AUTO : en édition uniquement (comportement existant)
    if (!isEdit) {
      prevSuiviModeRef.current = mode
      return
    }
    const months = getMoisEntreDates(form.dateDebut, form.dateFin, monthsShort)
    if (months.length === 0) {
      setSuiviMensuelRows([])
      prevSuiviModeRef.current = mode
      return
    }
    const bySaved: Record<string, { caPrevisionnel: number; caRealise: number }> = {}
    savedSuiviMensuel.forEach((r) => { bySaved[`${r.mois}-${r.annee}`] = { caPrevisionnel: r.caPrevisionnel, caRealise: r.caRealise } })
    setSuiviMensuelRows((prev) => {
      const byPrev: Record<string, SuiviMensuelRow> = {}
      prev.forEach((r) => { byPrev[`${r.mois}-${r.annee}`] = r })
      return months.map((m) => {
        const existing = byPrev[`${m.mois}-${m.annee}`]
        const saved = bySaved[`${m.mois}-${m.annee}`]
        if (existing && (existing.caPrevisionnel !== 0 || existing.caRealise !== 0)) return { ...existing, label: m.label }
        if (saved) return { ...m, caPrevisionnel: saved.caPrevisionnel, caRealise: saved.caRealise }
        return existing ? { ...existing, label: m.label } : { ...m, caPrevisionnel: 0, caRealise: 0 }
      })
    })
    prevSuiviModeRef.current = mode
  }, [isEdit, form.modeSuiviMensuel, form.dateDebut, form.dateFin, savedSuiviMensuel, monthsShort])

  // Mettre à jour les libellés des mois quand la langue change, sans toucher aux valeurs.
  useEffect(() => {
    setSuiviMensuelRows((prev) => {
      let changed = false
      const next = prev.map((r) => {
        const label = `${monthsShort[(r.mois ?? 1) - 1] ?? ''}-${r.annee}`
        if (label !== r.label) changed = true
        return { ...r, label }
      })
      return changed ? next : prev
    })
  }, [monthsShort])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'dateDebut') {
        next.dateFin = next.dateDebut && next.delaiMois != null && next.delaiMois >= 1
          ? computeDateFinFromDebutEtDelai(next.dateDebut, next.delaiMois)
          : ''
      }
      if (['dateDebut', 'dateFin', 'dateDebutReel', 'dateFinReelle'].includes(name)) {
        setDateErrors(validateDateCoherence(next, t))
      }
      return next
    })
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const num = value ? Number(value) : undefined
    setForm((prev) => {
      const next = { ...prev, [name]: num }
      // Date de fin = date de début + délai contractuel (mois)
      if (name === 'delaiMois') {
        next.dateFin = next.dateDebut && num != null && num >= 1
          ? computeDateFinFromDebutEtDelai(next.dateDebut, num)
          : ''
      }
      // Montant TTC = Montant HT × 1,19 (TVA 18% + CSS 1%)
      if (name === 'montantHT' && num != null) {
        next.montantTTC = Math.round(num * 1.19)
      }
      // Avancement physique = indicateur unique : garder avancementGlobal et avancementPhysiquePct synchronisés
      if (name === 'avancementGlobal' && num != null) {
        next.avancementPhysiquePct = num
      }
      return next
    })
  }

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === '__new__') {
      setClientModalOpen(true)
    } else {
      setForm((prev) => ({ ...prev, clientId: value ? Number(value) : undefined }))
    }
  }

  const handleCreateClient = async () => {
    if (!newClient.nom.trim()) return
    setError(null)
    try {
      const code = `CLI-${Date.now()}`
      const created = await dispatch(createClient({ code, nom: newClient.nom.trim(), type: newClient.type })).unwrap()
      dispatch(fetchClients({ size: 500 }))
      setForm((prev) => ({ ...prev, clientId: created.id }))
      setNewClient({ nom: '', type: 'ENTREPRISE_PRIVEE' })
      setClientModalOpen(false)
    } catch (err: any) {
      setError(err.message || t('form.errorClientCreate'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const errs = validateDateCoherence(form, t)
    setDateErrors(errs)
    if (Object.keys(errs).length > 0) {
      setError(getDateCoherenceSubmitError(errs) ?? t('form.errorDates'))
      return
    }
    if (form.types.length === 0) {
      setError(t('form.errorTypeRequired'))
      return
    }
    if (form.types.includes('AUTRE') && !(form.typePersonnalise ?? '').trim()) {
      setError(t('form.errorTypeOther'))
      return
    }
    if (!sansNumeroMarche && !(form.numeroMarche ?? '').trim()) {
      setError(t('form.errorNumeroMarche'))
      return
    }
    try {
      const payload = { ...form }
      payload.numeroMarche = sansNumeroMarche ? undefined : (form.numeroMarche?.trim() || undefined)
      if (form.montantHT != null && payload.montantTTC == null) {
        payload.montantTTC = Math.round(form.montantHT * 1.19)
      }
      if (!isEdit) {
        delete (payload as Record<string, unknown>).dateDebutReel
        delete (payload as Record<string, unknown>).dateFinReelle
      }
      // Garder avancement physique et global synchronisés (indicateur unique)
      if (payload.avancementGlobal != null) {
        payload.avancementPhysiquePct = payload.avancementGlobal
      }
      if (isEdit) {
        const updateData: ProjetUpdateRequest = payload
        await dispatch(updateProjet({ id: Number(id), data: updateData })).unwrap()
        await projetApi.saveAvancementEtudes(Number(id), avancementEtudesRows.map((r) => ({
          phase: r.phase,
          avancementPct: r.avancementPct,
          dateDepot: r.dateDepot || undefined,
          etatValidation: r.etatValidation || undefined,
        })))
        const mode = (payload.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO'
        if (mode === 'MANUEL') {
          await projetApi.replaceSuiviMensuel(Number(id), suiviMensuelRows.map((r) => ({
            mois: r.mois,
            annee: r.annee,
            caPrevisionnel: r.caPrevisionnel || undefined,
            caRealise: r.caRealise || undefined,
          })))
        } else if (suiviMensuelRows.length > 0) {
          await projetApi.saveSuiviMensuel(Number(id), suiviMensuelRows.map((r) => ({
            mois: r.mois,
            annee: r.annee,
            caPrevisionnel: r.caPrevisionnel || undefined,
            caRealise: r.caRealise || undefined,
          })))
        }
      } else {
        const created = await dispatch(createProjet(payload)).unwrap()
        const mode = (payload.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO'
        if (mode === 'MANUEL') {
          await projetApi.replaceSuiviMensuel(created.id, suiviMensuelRows.map((r) => ({
            mois: r.mois,
            annee: r.annee,
            caPrevisionnel: r.caPrevisionnel || undefined,
            caRealise: r.caRealise || undefined,
          })))
        }
      }
      setDateErrors({})
      navigate(isEdit ? `/projets/${id}` : '/projets')
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message
      setError(apiMessage || err.message || t('form.errorSave'))
    }
  }

  return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
      <button onClick={() => navigate(isEdit ? `/projets/${id}` : '/projets')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 flex items-center gap-1">
        ← {t('form.back')} {isEdit ? t('form.backToDetail') : t('form.backToList')}
      </button>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{isEdit ? (readOnly ? t('form.readOnlyTitle') : t('form.editTitle')) : t('form.newTitle')}</h1>
      {readOnly && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-lg mb-4 text-sm">
          {t('form.readOnlyNotice')}
        </div>
      )}

      {error && (
        <Alert type="error" title={t('form.errorTitle')} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mika-theme-card rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('form.generalInfo')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.numeroMarche')}</label>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sansNumeroMarche}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setSansNumeroMarche(checked)
                      if (checked) setForm((prev) => ({ ...prev, numeroMarche: '' }))
                    }}
                    disabled={readOnly}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{t('form.sansNumero')}</span>
                </label>
                {!sansNumeroMarche && (
                  <input
                    type="text"
                    name="numeroMarche"
                    value={form.numeroMarche || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    placeholder="N°148/MTP/SG/2024"
                    required
                  />
                )}
                {sansNumeroMarche && (
                  <p className="text-xs text-gray-500">{t('form.sansNumeroHint')}</p>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.intitule')}</label>
              <input type="text" name="nom" value={form.nom} onChange={handleChange} required disabled={readOnly}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100" placeholder={t('form.intitulePlaceholder')} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('form.typesLabel')}</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('form.typesHint')}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
                {TYPE_OPTIONS.map((o) => (
                  <label key={o.value} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.types.includes(o.value)}
                      onChange={() => {
                        if (readOnly) return
                        setForm((prev) => {
                          const next = prev.types.includes(o.value)
                            ? prev.types.filter((t) => t !== o.value)
                            : [...prev.types, o.value]
                          return { ...prev, types: next }
                        })
                      }}
                      disabled={readOnly}
                      className="rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t(`enums.type.${o.value}`)}</span>
                  </label>
                ))}
              </div>
            </div>
            {form.types.includes('AUTRE') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.typePersonnalise')}</label>
                <input
                  type="text"
                  name="typePersonnalise"
                  value={form.typePersonnalise ?? ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  maxLength={150}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder={t('form.typePersonnalisePlaceholder')}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('form.typePersonnaliseHint')}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.statut')}</label>
              <select name="statut" value={form.statut || 'EN_ATTENTE'} onChange={handleChange} disabled={readOnly} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100">
                {STATUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(`enums.statut.${o.value}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.client')}</label>
              <select
                name="clientId"
                value={form.clientId ?? ''}
                onChange={handleClientSelect}
                disabled={readOnly}
                required
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 dark:disabled:bg-gray-600 cursor-pointer dark:text-gray-100"
              >
                <option value="">{t('form.selectClient')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom} — {t(`enums.typeClient.${c.type}`)}</option>
                ))}
                {!readOnly && (
                  <option value="__new__">{t('form.addClient')}</option>
                )}
              </select>
              {clients.length === 0 && !loading && (
                <p className="text-xs text-amber-600 mt-1">{t('form.loadingClients')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.manager')}</label>
              <select name="responsableProjetId" value={form.responsableProjetId ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, responsableProjetId: e.target.value ? Number(e.target.value) : undefined }))} disabled={readOnly} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100">
                <option value="">{t('form.selectManager')}</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.sourceFinancement')}</label>
              <select name="sourceFinancement" value={form.sourceFinancement || ''} onChange={handleChange} disabled={readOnly} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100">
                <option value="">{t('form.select')}</option>
                {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(`enums.sourceFinancement.${o.value}`)}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.description')}</label>
              <textarea name="description" value={form.description || ''} onChange={handleChange} rows={3} disabled={readOnly}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100" />
            </div>
            {isEdit && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.propositionsAmelioration')}</label>
                <textarea name="propositionsAmelioration" value={form.propositionsAmelioration ?? ''} onChange={handleChange} rows={2} disabled={readOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100" placeholder={t('form.propositionsPlaceholder')} />
              </div>
            )}
          </div>
        </div>

        {/* Financier */}
        <div className="mika-theme-card rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('form.financialInfo')}</h2>

          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 space-y-3">
            <p className="font-medium text-gray-900 dark:text-gray-100">{t('form.financialGuideTitle')}</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>{t('form.tvaFormula')}</li>
              <li>{t('form.cssFormula')}</li>
              <li>{t('form.ttcFormula')}</li>
              <li>{t('form.htFromTtc')}</li>
            </ul>
            <p className="text-gray-600 pt-1">{t('form.ttcCalculatedAuto')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.montantHT')}</label>
              <input type="number" name="montantHT" value={form.montantHT || ''} onChange={handleNumberChange} disabled={readOnly}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100" placeholder={t('form.placeholderMontantHT')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.montantTTC')}</label>
              <input type="number" name="montantTTC" value={form.montantTTC ?? (form.montantHT != null ? Math.round(form.montantHT * 1.19) : '')} readOnly
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed" title={t('form.calculatedTitle')} />
              <p className="mt-1 text-xs text-gray-500">{t('form.calculatedAuto')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.travauxSupplementaires')}</label>
              <input type="number" name="montantInitial" value={form.montantInitial || ''} onChange={handleNumberChange} disabled={readOnly}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                placeholder={form.montantHT != null ? t('form.max15pctHT', { val: formatNumber(Math.round(form.montantHT * 0.15)) }) : t('form.max15pctHTShort')} />
              {form.montantHT != null && (
                <p className="mt-1 text-xs text-gray-500">{t('form.seuil15', { val: formatNumber(Math.round(form.montantHT * 0.15)) })}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.avenant')}</label>
              <input type="number" name="montantRevise" value={form.montantRevise || ''} onChange={handleNumberChange} disabled={readOnly}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                placeholder={form.montantHT != null ? t('form.between15and30', { min: formatNumber(Math.round(form.montantHT * 0.15)), max: formatNumber(Math.round(form.montantHT * 0.30)) }) : t('form.between15and30Short')} />
              {form.montantHT != null && (
                <p className="mt-1 text-xs text-gray-500">{t('form.plageAvenant', { min: formatNumber(Math.round(form.montantHT * 0.15)), max: formatNumber(Math.round(form.montantHT * 0.30)) })}</p>
              )}
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.imputationBudgetaire')}</label>
              <input type="text" name="imputationBudgetaire" value={form.imputationBudgetaire || ''} onChange={handleChange} disabled={readOnly}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100" placeholder={t('form.imputationPlaceholder')} />
            </div>
          </div>
        </div>

        {/* Délais */}
        <div className="mika-theme-card rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('form.deadlines')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {t('form.deadlinesHint')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.dateDebutContractuelle')}</label>
              <input
                type="date"
                name="dateDebut"
                value={form.dateDebut || ''}
                onChange={handleChange}
                disabled={readOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${dateErrors.dateDebut ? 'border-red-500' : ''}`}
              />
              {dateErrors.dateDebut && <p className="mt-1 text-xs text-red-600">{dateErrors.dateDebut}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.delaiMois')}</label>
              <input
                type="number"
                name="delaiMois"
                min={1}
                value={form.delaiMois ?? ''}
                onChange={handleNumberChange}
                disabled={readOnly}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="Ex. 12"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('form.imposedByClient')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.dateFinContractuelle')}</label>
              <input
                type="date"
                name="dateFin"
                value={form.dateFin || ''}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                title={t('form.dateFinTitle')}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('form.calculatedAutoShort')}</p>
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('form.suiviMensuelModeLabel')}
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="modeSuiviMensuel"
                    value="AUTO"
                    checked={((form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO') === 'AUTO'}
                    onChange={() => {
                      setManualSuiviError(null)
                      setForm((prev) => ({ ...prev, modeSuiviMensuel: 'AUTO' }))
                    }}
                    disabled={readOnly}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('form.suiviMensuelModeAuto')}</span>
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="modeSuiviMensuel"
                    value="MANUEL"
                    checked={((form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO') === 'MANUEL'}
                    onChange={() => {
                      setManualSuiviError(null)
                      setForm((prev) => ({ ...prev, modeSuiviMensuel: 'MANUEL' }))
                    }}
                    disabled={readOnly}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{t('form.suiviMensuelModeManual')}</span>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {((form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO') === 'MANUEL'
                  ? t('form.suiviMensuelModeManualHint')
                  : t('form.suiviMensuelModeAutoHint')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.dateDebutReelle')}</label>
              <input
                type="date"
                name="dateDebutReel"
                value={form.dateDebutReel || ''}
                onChange={handleChange}
                disabled={readOnly || !isEdit}
                min={form.dateDebut || undefined}
                max={form.dateFin || undefined}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 ${dateErrors.dateDebutReel ? 'border-red-500' : ''}`}
                title={!isEdit ? t('form.modifiableAfterCreate') : undefined}
              />
              {!isEdit && <p className="mt-1 text-xs text-gray-500">{t('form.modifiableAfterCreate')}</p>}
              {dateErrors.dateDebutReel && <p className="mt-1 text-xs text-red-600">{dateErrors.dateDebutReel}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.dateFinReelle')}</label>
              <input
                type="date"
                name="dateFinReelle"
                value={form.dateFinReelle || ''}
                onChange={handleChange}
                disabled={readOnly || !isEdit}
                min={form.dateDebutReel || form.dateDebut || undefined}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 ${dateErrors.dateFinReelle ? 'border-red-500' : ''}`}
                title={!isEdit ? t('form.modifiableAfterCreate') : undefined}
              />
              {!isEdit && <p className="mt-1 text-xs text-gray-500">{t('form.modifiableAfterCreate')}</p>}
              {dateErrors.dateFinReelle && <p className="mt-1 text-xs text-red-600">{dateErrors.dateFinReelle}</p>}
            </div>
          </div>
        </div>

        {/* Tableau de suivi mensuel */}
        {(!readOnly && (
          (((form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO') === 'MANUEL')
          || (isEdit && ((form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO') === 'AUTO' && form.dateDebut && form.dateFin && suiviMensuelRows.length > 0)
        )) && (
          <div className="mika-theme-card rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-2">{t('form.suiviMensuelTitle')}</h2>
            <p className="text-sm text-gray-500 mb-4">
              {((form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO') === 'MANUEL'
                ? t('form.suiviMensuelManualHint')
                : t('form.suiviMensuelHint')}
            </p>

            {((form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO') === 'MANUEL' && (
              <div className="mb-4 space-y-2">
                {manualSuiviError && (
                  <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                    {manualSuiviError}
                  </div>
                )}
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="w-full md:w-56">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.mois')}</label>
                    <select
                      value={manualSuiviNewMonth}
                      onChange={(e) => setManualSuiviNewMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>
                          {monthsShort[m - 1] ?? m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-40">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.annee')}</label>
                    <input
                      type="number"
                      value={manualSuiviNewYear}
                      onChange={(e) => setManualSuiviNewYear(e.target.value ? Number(e.target.value) : new Date().getFullYear())}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setManualSuiviError(null)
                      const mois = manualSuiviNewMonth
                      const annee = manualSuiviNewYear
                      if (!annee || Number.isNaN(annee) || annee < 1900 || annee > 2100) {
                        setManualSuiviError(t('form.suiviMensuelManualYearError'))
                        return
                      }
                      const key = `${mois}-${annee}`
                      if (suiviMensuelRows.some((r) => `${r.mois}-${r.annee}` === key)) {
                        setManualSuiviError(t('form.suiviMensuelManualDuplicate'))
                        return
                      }
                      const label = `${monthsShort[mois - 1] ?? ''}-${annee}`
                      setSuiviMensuelRows((prev) =>
                        [...prev, { label, mois, annee, caPrevisionnel: 0, caRealise: 0 }].sort((a, b) => (a.annee - b.annee) || (a.mois - b.mois))
                      )
                    }}
                    className="md:mb-0 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition"
                  >
                    {t('form.suiviMensuelManualAdd')}
                  </button>
                </div>
              </div>
            )}

            {((form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO') === 'MANUEL' && suiviMensuelRows.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('form.suiviMensuelManualEmpty')}</p>
            ) : null}

            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full text-sm border-collapse table-fixed">
                <colgroup>
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '22%' }} />
                  {((form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO') === 'MANUEL' && (
                    <col style={{ width: '12%' }} />
                  )}
                </colgroup>
                <thead>
                  <tr>
                    <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">{t('form.mois')}</th>
                    <th className="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">{t('form.caPrevisionnel')}</th>
                    <th className="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">{t('form.caRealise')}</th>
                    {((form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO') === 'MANUEL' && (
                      <th className="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        {t('form.actions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {suiviMensuelRows.map((row, idx) => (
                    <tr key={`${row.mois}-${row.annee}`} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/60">
                      <td className="py-2.5 px-3 border-b border-gray-100 dark:border-gray-600 font-medium text-gray-900 dark:text-gray-100">{row.label}</td>
                      <td className="py-2 px-3 border-b border-gray-100 text-right">
                        <input
                          type="number"
                          min={0}
                          value={row.caPrevisionnel || ''}
                          onChange={(e) => {
                            const v = e.target.value ? Number(e.target.value) : 0
                            setSuiviMensuelRows((prev) => prev.map((r, i) => (i === idx ? { ...r, caPrevisionnel: v } : r)))
                          }}
                          className="w-full text-right px-2 py-1.5 border rounded focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-2 px-3 border-b border-gray-100 text-right">
                        <input
                          type="number"
                          min={0}
                          value={row.caRealise || ''}
                          onChange={(e) => {
                            const v = e.target.value ? Number(e.target.value) : 0
                            setSuiviMensuelRows((prev) => prev.map((r, i) => (i === idx ? { ...r, caRealise: v } : r)))
                          }}
                          className="w-full text-right px-2 py-1.5 border rounded focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      {((form.modeSuiviMensuel as ModeSuiviMensuel | undefined) ?? 'AUTO') === 'MANUEL' && (
                        <td className="py-2 px-3 border-b border-gray-100 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setManualSuiviError(null)
                              setSuiviMensuelRows((prev) => prev.filter((_, i) => i !== idx))
                            }}
                            className="text-red-600 hover:text-red-800 font-semibold"
                            aria-label={t('form.deleteLabel')}
                          >
                            {t('form.deleteLabel')}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* État d'avancement des études — en édition uniquement */}
        {isEdit && !readOnly && avancementEtudesRows.length > 0 && (
          <div className="mika-theme-card rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-2">{t('form.avancementEtudesTitle')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('form.avancementEtudesHint')}</p>
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full text-sm border-collapse table-fixed">
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '46%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">{t('form.phase')}</th>
                    <th className="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">{t('form.avancementPct')}</th>
                    <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">{t('form.depot')}</th>
                    <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">{t('form.etatValidation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {avancementEtudesRows.map((row, idx) => (
                    <tr key={row.phase} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/60">
                      <td className="py-2.5 px-3 border-b border-gray-100 dark:border-gray-600 font-medium text-gray-900 dark:text-gray-100">{t(`enums.phaseEtude.${row.phase}`) ?? row.phase}</td>
                      <td className="py-2 px-3 border-b border-gray-100">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={row.avancementPct ?? ''}
                          onChange={(e) => {
                            const v = e.target.value ? Number(e.target.value) : undefined
                            setAvancementEtudesRows((prev) => prev.map((r, i) => (i === idx ? { ...r, avancementPct: v } : r)))
                          }}
                          className="w-full text-right px-2 py-1.5 border rounded focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-2 px-3 border-b border-gray-100">
                        <input
                          type="date"
                          value={row.dateDepot ?? ''}
                          onChange={(e) => setAvancementEtudesRows((prev) => prev.map((r, i) => (i === idx ? { ...r, dateDepot: e.target.value || undefined } : r)))}
                          className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-2 px-3 border-b border-gray-100 dark:border-gray-600">
                        <select
                          value={row.etatValidation ?? ''}
                          onChange={(e) => setAvancementEtudesRows((prev) => prev.map((r, i) => (i === idx ? { ...r, etatValidation: (e.target.value || undefined) as EtatValidationEtude | undefined } : r)))}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        >
                          <option value="">{t('form.etatValidationNonRenseigne')}</option>
                          {ETATS_VALIDATION_ETUDE.map((ev) => (
                            <option key={ev} value={ev}>{t(`enums.etatValidationEtude.${ev}`)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Points bloquants — en édition uniquement, menus déroulants + ajout personnalisé */}
        {isEdit && !readOnly && id && (
          <div className="mika-theme-card rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-2">{t('form.pointsBloquantsTitle')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('form.pointsBloquantsHint')}</p>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-0 sm:min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('form.titre')}</label>
                  <select
                    id="pb-titre-select"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-sm dark:text-gray-100"
                  >
                    <option value="">{t('form.choisirType')}</option>
                    {['Réseaux / Ouvrages', 'Points critiques', 'Logistique', 'Technique', 'Moyens généraux', 'Ressources humaines', 'Études', 'Administratif', 'Social', 'Environnement', 'Partenaire', 'Qualité', 'Sécurité'].map((g) => {
                      const groupKey = POINT_BLOQUANT_GROUP_KEYS[g] ?? g
                      const groupLabel = t(`form.pointBloquant.groups.${groupKey}`) || g
                      return (
                        <optgroup key={g} label={groupLabel}>
                          {POINT_BLOQUANT_TITRE_OPTIONS.filter((o) => o.group === g).map((o) => {
                            const optKey = POINT_BLOQUANT_OPTION_KEYS[o.value] ?? slugForI18n(o.value)
                            const optLabel = t(`form.pointBloquant.options.${optKey}`) || o.label
                            return <option key={o.value} value={o.value}>{optLabel}</option>
                          })}
                        </optgroup>
                      )
                    })}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('form.priorite')}</label>
                  <select id="pb-priorite" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-sm dark:text-gray-100">
                    {PRIORITE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(`enums.priorite.${o.value}`)}</option>)}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('form.statut')}</label>
                  <select id="pb-statut" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-sm dark:text-gray-100">
                    {STATUT_POINT_BLOQUANT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(`enums.statutPointBloquant.${o.value}`)}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const sel = document.getElementById('pb-titre-select') as HTMLSelectElement
                    const titre = (document.getElementById('pb-titre-custom') as HTMLInputElement)?.value?.trim() || sel?.value
                    if (!titre) return
                    const priorite = (document.getElementById('pb-priorite') as HTMLSelectElement)?.value as Priorite
                    if (addingPointBloquant) return
                    setAddingPointBloquant(true)
                    try {
                      const created = await pointBloquantApi.create({
                        projetId: Number(id),
                        titre,
                        priorite,
                        dateDetection: new Date().toISOString().slice(0, 10),
                      })
                      setPointsBloquants((prev) => [...prev, created])
                      if (sel) sel.value = ''
                      const custom = document.getElementById('pb-titre-custom') as HTMLInputElement
                      if (custom) custom.value = ''
                    } catch (e) {
                      setError((e as Error).message)
                    } finally {
                      setAddingPointBloquant(false)
                    }
                  }}
                  id="pb-add-btn"
                  disabled={addingPointBloquant}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addingPointBloquant ? t('form.ajoutEnCours') : t('form.ajouter')}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  id="pb-titre-custom"
                  type="text"
                  placeholder={t('form.titrePersonnalise')}
                  className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !addingPointBloquant) document.getElementById('pb-add-btn')?.click() }}
                />
              </div>
              <ul className="space-y-2">
                {pointsBloquants.map((pb) => (
                  <li key={pb.id} className="flex flex-wrap items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-900 dark:text-gray-100 flex-1 min-w-0">
                      {((): string => {
                        const raw = pb.titre
                        const keyPrefix = 'form.pointBloquant.options.'
                        if (raw.startsWith(keyPrefix)) {
                          const suffix = raw.slice(keyPrefix.length)
                          const translated = t(`form.pointBloquant.options.${suffix}`)
                          if (translated !== `form.pointBloquant.options.${suffix}`) return translated
                          return suffix.replace(/_/g, ' ')
                        }
                        const optKey = POINT_BLOQUANT_OPTION_KEYS[raw] ?? slugForI18n(raw)
                        const translated = t(`form.pointBloquant.options.${optKey}`)
                        if (translated !== `form.pointBloquant.options.${optKey}`) return translated
                        return raw
                      })()}
                    </span>
                    <select
                      value={pb.priorite}
                      onChange={async (e) => {
                        try {
                          const updated = await pointBloquantApi.update(pb.id, { priorite: e.target.value as Priorite })
                          setPointsBloquants((prev) => prev.map((x) => (x.id === pb.id ? updated : x)))
                        } catch (err) { setError((err as Error).message) }
                      }}
                      className="px-2 py-1 border rounded text-sm w-28"
                    >
                      {PRIORITE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(`enums.priorite.${o.value}`)}</option>)}
                    </select>
                    <select
                      value={pb.statut}
                      onChange={async (e) => {
                        try {
                          const updated = await pointBloquantApi.update(pb.id, { statut: e.target.value as StatutPointBloquant })
                          setPointsBloquants((prev) => prev.map((x) => (x.id === pb.id ? updated : x)))
                        } catch (err) { setError((err as Error).message) }
                      }}
                      className="px-2 py-1 border rounded text-sm w-28"
                    >
                      {STATUT_POINT_BLOQUANT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(`enums.statutPointBloquant.${o.value}`)}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!(await confirm({ messageKey: 'confirm.deletePointBloquant' }))) return
                        try {
                          await pointBloquantApi.delete(pb.id)
                          setPointsBloquants((prev) => prev.filter((x) => x.id !== pb.id))
                        } catch (err) { setError((err as Error).message) }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                      aria-label={t('form.deleteLabel')}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              {pointsBloquants.length === 0 && <p className="text-sm text-gray-500">{t('form.aucunPointBloquant')}</p>}
            </div>
          </div>
        )}

        {/* Prévisions (tâches planifiées) — toute semaine, passée, en cours ou future */}
        {isEdit && !readOnly && id && (() => {
          const addPrevision = async (semaine: number, annee: number, description: string, type: TypePrevision = 'HEBDOMADAIRE') => {
            try {
              const created = await projetApi.createPrevision(Number(id), { semaine, annee, description, type })
              setPrevisions((prev) => [...prev, created])
            } catch (err) { setError((err as Error).message) }
          }
          const updatePrevision = async (p: Prevision, updates: Partial<Prevision>) => {
            try {
              const filtered = Object.fromEntries(
                Object.entries(updates).filter(([_, v]) => v !== null && v !== undefined)
              ) as { semaine?: number; annee?: number; description?: string; type?: string; dateDebut?: string; dateFin?: string; avancementPct?: number }
              const updated = await projetApi.updatePrevision(Number(id), p.id, filtered)
              setPrevisions((prev) => prev.map((x) => (x.id === p.id ? updated : x)))
            } catch (err) { setError((err as Error).message) }
          }
          const deletePrevision = async (p: Prevision) => {
            try {
              await projetApi.deletePrevision(Number(id), p.id)
              setPrevisions((prev) => prev.filter((x) => x.id !== p.id))
            } catch (err) { setError((err as Error).message) }
          }
          const previsionsByWeek = previsions.reduce<Record<string, Prevision[]>>((acc, p) => {
            const key = `${p.annee ?? 0}-${p.semaine ?? 0}`
            if (!acc[key]) acc[key] = []
            acc[key].push(p)
            return acc
          }, {})
          const weekKeys = Object.keys(previsionsByWeek).sort((a, b) => {
            const [yA, wA] = a.split('-').map(Number)
            const [yB, wB] = b.split('-').map(Number)
            return yA !== yB ? yA - yB : wA - wB
          })
          const prevSelectId = 'prev-desc-any-week'
          return (
            <div className="mika-theme-card rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-2">{t('form.previsionsTitle')}</h2>
              <p className="text-sm text-gray-500 mb-4">{t('form.previsionsHint')}</p>
              <div className="flex flex-wrap items-end gap-4 mb-4">
                <div>
                  <label htmlFor="prev-annee" className="block text-xs font-medium text-gray-500 mb-1">{t('form.annee')}</label>
                  <select
                    id="prev-annee"
                    value={selectedAnneePrevision}
                    onChange={(e) => setSelectedAnneePrevision(Number(e.target.value))}
                    className="px-3 py-2 border rounded-lg text-sm w-24"
                  >
                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="prev-semaine" className="block text-xs font-medium text-gray-500 mb-1">{t('form.semaine')}</label>
                  <select
                    id="prev-semaine"
                    value={selectedSemainePrevision}
                    onChange={(e) => setSelectedSemainePrevision(Number(e.target.value))}
                    className="px-3 py-2 border rounded-lg text-sm w-20"
                  >
                    {Array.from({ length: 53 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>S{w}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-0 sm:min-w-[200px]">
                  <label htmlFor={prevSelectId} className="block text-xs font-medium text-gray-500 mb-1">{t('form.tacheARealiser')}</label>
                  <div className="flex gap-2">
                    <select id={prevSelectId} className="flex-1 px-3 py-2 border rounded-lg text-sm">
                      <option value="">{t('form.choisirTache')}</option>
                      {['Travaux', 'Études', 'Qualité', 'Pilotage', 'Administratif', 'Logistique', 'Sécurité'].map((g) => {
                        const groupKey = PREVISION_GROUP_KEYS[g] ?? g
                        const groupLabel = t(`form.prevision.groups.${groupKey}`) || g
                        return (
                          <optgroup key={g} label={groupLabel}>
                            {PREVISION_DESCRIPTION_OPTIONS.filter((o) => o.group === g).map((o) => {
                              const optKey = slugForI18n(o.value)
                              const optLabel = t(`form.prevision.options.${optKey}`) || o.label
                              return <option key={o.value} value={o.value}>{optLabel}</option>
                            })}
                          </optgroup>
                        )
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const sel = document.getElementById(prevSelectId) as HTMLSelectElement
                        const v = sel?.value
                        if (!v) return
                        addPrevision(selectedSemainePrevision, selectedAnneePrevision, v)
                        if (sel) sel.value = ''
                      }}
                      className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark shrink-0"
                    >
                      {t('form.ajouterPour', { semaine: selectedSemainePrevision, annee: selectedAnneePrevision })}
                    </button>
                  </div>
                </div>
              </div>
              {weekKeys.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('form.previsionsParSemaine')}</h3>
                  {weekKeys.map((key) => {
                    const [annee, semaine] = key.split('-').map(Number)
                    const list = previsionsByWeek[key]
                    return (
                      <div key={key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('form.weekLabelShort', { semaine, annee })}</h4>
                        <ul className="space-y-1.5">
                          {list.map((p) => (
                            <li key={p.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-gray-100 dark:border-gray-600 last:border-0">
                              <span className="flex-1 min-w-0">
                              {((): string => {
                                const raw = p.description || p.type
                                if (!raw) return ''
                                const isTypePrevision = (TYPE_PREVISION_OPTIONS as { value: string }[]).some((o) => o.value === raw)
                                if (isTypePrevision) return t(`enums.typePrevision.${raw}`) || raw
                                // Si la valeur stockée est déjà une clé i18n (ex. form.prevision.options.xxx), utiliser le suffixe pour éviter le double préfixe
                                const keyPrefix = 'form.prevision.options.'
                                if (raw.startsWith(keyPrefix)) {
                                  const suffix = raw.slice(keyPrefix.length)
                                  const translated = t(`form.prevision.options.${suffix}`)
                                  if (translated !== `form.prevision.options.${suffix}`) return translated
                                  return suffix.replace(/_/g, ' ')
                                }
                                const optKey = slugForI18n(raw)
                                const translated = t(`form.prevision.options.${optKey}`)
                                if (translated !== `form.prevision.options.${optKey}`) return translated
                                return raw
                              })()}
                            </span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                value={p.avancementPct ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value === '' ? undefined : Math.min(100, Math.max(0, Number(e.target.value)))
                                  updatePrevision(p, { avancementPct: v } as Partial<Prevision>)
                                }}
                                placeholder={t('form.avancementPctPlaceholder')}
                                className="w-16 px-1.5 py-0.5 border rounded text-xs text-center"
                                title={t('form.avancementPct')}
                              />
                              <button type="button" onClick={() => deletePrevision(p)} className="text-red-600 hover:text-red-800" aria-label={t('form.deleteLabel')}>×</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t('form.noPrevisionYet')}</p>
              )}
            </div>
          )
        })()}

        {/* Suivi d'avancement (PV) — en édition uniquement */}
        {isEdit && (
          <div className="mika-theme-card rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-2">{t('form.suiviAvancementPvTitle')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('form.suiviAvancementPvHint')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.avancementPhysiquePct')}</label>
                <input type="number" name="avancementGlobal" min={0} max={100} step={0.01} value={form.avancementGlobal ?? ''} onChange={handleNumberChange} disabled={readOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100" title={t('form.indicateurPrincipal')} />
                <p className="mt-1 text-xs text-gray-500">{t('form.indicateurPrincipal')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.avancementFinancierPct')}</label>
                <input type="number" name="avancementFinancierPct" min={0} max={100} step={0.01} value={form.avancementFinancierPct ?? ''} onChange={handleNumberChange} disabled={readOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100" title={t('form.executionBudgetaire')} />
                <p className="mt-1 text-xs text-gray-500">{t('form.executionBudgetaire')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.delaiConsommePct')}</label>
                <input type="number" name="delaiConsommePct" min={0} max={100} step={0.01} value={form.delaiConsommePct ?? ''} onChange={handleNumberChange} disabled={readOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100" title={t('form.partDelai')} />
                <p className="mt-1 text-xs text-gray-500">{t('form.partDelai')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Besoins et observations (PV) — en édition uniquement */}
        {isEdit && (
          <div className="mika-theme-card rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-2">{t('form.besoinsObservations')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('form.besoinsObservationsHint')}</p>
            <div className="space-y-6">
              {/* Besoins matériels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('detail.besoinsMateriel')}</label>
                <select
                  value=""
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) return
                    const list = parseBesoinsList(form.besoinsMateriel)
                    if (!list.includes(v)) setForm((prev) => ({ ...prev, besoinsMateriel: list.length ? list.concat(v).join(BESOINS_SEP) : v }))
                    e.target.value = ''
                  }}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">{t('form.choisirBesoinMateriel')}</option>
                  {['Engins', 'Équipements', 'Combinaisons'].map((group) => {
                    const groupKey = BESOINS_MATERIEL_GROUP_KEYS[group] ?? group
                    const groupLabel = t(`form.besoinsMateriel.groups.${groupKey}`) || group
                    return (
                      <optgroup key={group} label={groupLabel}>
                        {BESOINS_MATERIEL_OPTIONS.filter((o) => o.group === group).map((o) => {
                          const optKey = slugForI18n(o.value)
                          const optLabel = t(`form.besoinsMateriel.options.${optKey}`) || o.label
                          return <option key={o.value} value={o.value}>{optLabel}</option>
                        })}
                      </optgroup>
                    )
                  })}
                </select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {parseBesoinsList(form.besoinsMateriel).map((item) => {
                    const optKey = slugForI18n(item)
                    const translated = t(`form.besoinsMateriel.options.${optKey}`)
                    const label = translated !== `form.besoinsMateriel.options.${optKey}` ? translated : item
                    return (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      {label}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, besoinsMateriel: parseBesoinsList(prev.besoinsMateriel).filter((x) => x !== item).join(BESOINS_SEP) }))}
                          className="text-gray-500 hover:text-red-600"
                          aria-label={t('form.retirer')}
                        >
                          ×
                        </button>
                      )}
                    </span>
                    )
                  })}
                </div>
                {!readOnly && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder={t('form.ajouterBesoinNonListe')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return
                        e.preventDefault()
                        const input = e.currentTarget
                        const v = input.value.trim()
                        if (!v) return
                        const list = parseBesoinsList(form.besoinsMateriel)
                        if (!list.includes(v)) setForm((prev) => ({ ...prev, besoinsMateriel: list.length ? list.concat(v).join(BESOINS_SEP) : v }))
                        input.value = ''
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                        const v = input?.value?.trim()
                        if (!v) return
                        const list = parseBesoinsList(form.besoinsMateriel)
                        if (!list.includes(v)) setForm((prev) => ({ ...prev, besoinsMateriel: list.length ? list.concat(v).join(BESOINS_SEP) : v }))
                        if (input) input.value = ''
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark whitespace-nowrap"
                    >
                      {t('form.ajouter')}
                    </button>
                  </div>
                )}
              </div>

              {/* Besoins humains */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('detail.besoinsHumain')}</label>
                <select
                  value=""
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) return
                    const list = parseBesoinsList(form.besoinsHumain)
                    if (!list.includes(v)) setForm((prev) => ({ ...prev, besoinsHumain: list.length ? list.concat(v).join(BESOINS_SEP) : v }))
                    e.target.value = ''
                  }}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">{t('form.choisirBesoinHumain')}</option>
                  {['Rôles', 'Combinaisons'].map((group) => {
                    const groupKey = BESOINS_HUMAIN_GROUP_KEYS[group] ?? group
                    const groupLabel = t(`form.besoinsHumain.groups.${groupKey}`) || group
                    return (
                      <optgroup key={group} label={groupLabel}>
                        {BESOINS_HUMAIN_OPTIONS.filter((o) => o.group === group).map((o) => {
                          const optKey = slugForI18n(o.value)
                          const optLabel = t(`form.besoinsHumain.options.${optKey}`) || o.label
                          return <option key={o.value} value={o.value}>{optLabel}</option>
                        })}
                      </optgroup>
                    )
                  })}
                </select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {parseBesoinsList(form.besoinsHumain).map((item) => {
                    const optKey = slugForI18n(item)
                    const translated = t(`form.besoinsHumain.options.${optKey}`)
                    const label = translated !== `form.besoinsHumain.options.${optKey}` ? translated : item
                    return (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-blue-50 text-blue-800"
                    >
                      {label}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, besoinsHumain: parseBesoinsList(prev.besoinsHumain).filter((x) => x !== item).join(BESOINS_SEP) }))}
                          className="text-blue-600 hover:text-red-600"
                          aria-label={t('form.retirer')}
                        >
                          ×
                        </button>
                      )}
                    </span>
                    )
                  })}
                </div>
                {!readOnly && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder={t('form.ajouterBesoinNonListe')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return
                        e.preventDefault()
                        const input = e.currentTarget
                        const v = input.value.trim()
                        if (!v) return
                        const list = parseBesoinsList(form.besoinsHumain)
                        if (!list.includes(v)) setForm((prev) => ({ ...prev, besoinsHumain: list.length ? list.concat(v).join(BESOINS_SEP) : v }))
                        input.value = ''
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                        const v = input?.value?.trim()
                        if (!v) return
                        const list = parseBesoinsList(form.besoinsHumain)
                        if (!list.includes(v)) setForm((prev) => ({ ...prev, besoinsHumain: list.length ? list.concat(v).join(BESOINS_SEP) : v }))
                        if (input) input.value = ''
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark whitespace-nowrap"
                    >
                      {t('form.ajouter')}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.observations')}</label>
                <textarea name="observations" value={form.observations ?? ''} onChange={handleChange} rows={2} disabled={readOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-gray-100" placeholder={t('form.observationsPlaceholder')} />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(isEdit ? `/projets/${id}` : '/projets')} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            {readOnly ? t('form.backToDetailButton') : t('form.cancel')}
          </button>
          {!readOnly && (
            <button type="submit" disabled={loading} className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium disabled:opacity-50">
              {loading ? t('form.saving') : isEdit ? t('form.update') : t('form.createProject')}
            </button>
          )}
        </div>
      </form>

      {/* Modal création client — nom et type uniquement, comme source de financement */}
      {clientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setClientModalOpen(false)}>
          <div className="mika-theme-card rounded-xl shadow-xl dark:shadow-none max-w-md w-full mx-4 p-6 border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('form.newClientTitle')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.clientNameLabel')}</label>
                <input type="text" value={newClient.nom} onChange={(e) => setNewClient((p) => ({ ...p, nom: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary" placeholder={t('form.clientNamePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.clientTypeLabel')}</label>
                <select value={newClient.type} onChange={(e) => setNewClient((p) => ({ ...p, type: e.target.value as TypeClient }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                  {TYPE_CLIENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(`enums.typeClient.${o.value}`)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setClientModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                {t('form.cancel')}
              </button>
              <button type="button" onClick={handleCreateClient} disabled={!newClient.nom.trim() || loading}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium disabled:opacity-50">
                {t('form.createAndSelect')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
