# QSHE Module — Phase 1 : Rapport de Recherche Externe

**Projet** : MIKA Services
**Date** : 2026-04-21
**Objectif** : Recherche approfondie sur l'etat de l'art d'un module QSHE pour plateforme de gestion BTP, contextualise pour le Gabon et l'Afrique centrale.

---

## Table des matieres

1. [Axe 1 — Standards et normes applicables](#axe-1--standards-et-normes-applicables)
2. [Axe 2 — Fonctionnalites QSHE du marche](#axe-2--fonctionnalites-qshe-du-marche)
3. [Axe 3 — Processus metier a digitaliser](#axe-3--processus-metier-a-digitaliser)
4. [Axe 4 — Tendances innovantes](#axe-4--tendances-innovantes)
5. [Axe 5 — UX de reference](#axe-5--ux-de-reference)
6. [Observations transverses](#observations-transverses)

---

## Axe 1 — Standards et normes applicables

### 1.1 Normes ISO — Le socle international

#### ISO 45001:2018 — Sante et securite au travail (SST)

Remplace l'OHSAS 18001 (retire en mars 2021). Structure Annex SL integrable avec ISO 9001 et 14001.

**Clauses cles et implications pour un systeme digital :**

| Clause | Exigence | Ce que le systeme doit tracker |
|--------|----------|-------------------------------|
| 4 — Contexte | Comprendre les enjeux internes/externes, besoins des travailleurs | Registre des parties interessees |
| 5 — Leadership | Direction engagee, politique SST, roles definis | Politique SST documentee, organigramme securite |
| 6 — Planification | Identifier dangers, evaluer risques, exigences legales, objectifs | Registre des dangers, matrices de risques, registre de veille reglementaire |
| 7 — Support | Ressources, competences, sensibilisation, communication | Registre de formation, plan de communication SST |
| 8 — Realisation | Maitrise operationnelle, gestion du changement, sous-traitants, urgences | Permis de travail, plan d'urgence, evaluation sous-traitants |
| 9 — Evaluation | Surveillance, mesure, audit interne, revue de direction | KPIs (TF, TG), programme d'audit, PV de revue de direction |
| 10 — Amelioration | Incidents, non-conformites, actions correctives | CAPA, registre d'incidents, amelioration continue |

**KPIs exiges par ISO 45001 :**
- LTIFR (Lost Time Injury Frequency Rate) / TF
- TRIFR (Total Recordable Injury Frequency Rate)
- Taux de gravite
- Taux de declaration des presqu'accidents
- Taux de completion des formations
- Taux de cloture des NC d'audit
- Jours sans accident avec arret

#### ISO 14001:2015 — Management environnemental

**Exigences specifiques au BTP :**
- Identification des aspects environnementaux significatifs (emissions, dechets, rejets, bruit, poussiere, perturbation du sol, impact biodiversite)
- Registre de conformite reglementaire environnementale
- Objectifs environnementaux mesurables (reduction dechets, consommation eau, emissions CO2)
- Procedures operationnelles : gestion des dechets, prevention des deversements, controle des poussieres, gestion de l'eau, matieres dangereuses
- Plan d'urgence environnemental (reponse aux deversements, incendies, inondations)

**Documentation a digitaliser :**
- Registre des aspects/impacts environnementaux
- Plan et suivi de gestion des dechets (quantites, types, filieres)
- Suivi qualite eau, air, bruit
- Inventaire substances chimiques + FDS
- Rapports d'incidents environnementaux
- Registre des objectifs et cibles environnementales
- Suivi biodiversite (particulierement critique au Gabon)

#### ISO 9001:2015 — Management de la qualite

**Exigences cles pour le BTP :**
- Plans d'Inspection et d'Essai (PIE/ITP) avec points d'arret/temoin
- Gestion des non-conformites (NCR) avec workflow
- Tracabilite des materiaux (certificats d'essai, lots de beton)
- Evaluation et suivi des sous-traitants/fournisseurs
- Maitrise documentaire (gestion des revisions plans, specs, modes operatoires)
- Registres d'etalonnage des equipements d'essai

#### Integration SMI (Systeme de Management Integre)

Les trois normes partagent la structure Annex SL, permettant un SMI unique :
- Politique QSHE integree
- Programme d'audit unifie couvrant Q, S, H, E
- Module CAPA commun
- Registre des risques avec categories Q, S, H, E
- Tableau de bord integre avec KPIs transversaux
- Revue de direction unique couvrant les trois referentiels

Reference : PAS 99:2012 (BSI) fournit un cadre pour l'integration de multiples systemes de management.

---

### 1.2 Reglementation gabonaise

#### Code du Travail (Loi n° 3/94 du 21 novembre 1994, revise)

**Obligations de l'employeur (Titre VI — Hygiene et Securite) :**

| Article | Obligation | Implication digitale |
|---------|------------|---------------------|
| 196+ | Assurer la securite et proteger la sante physique et mentale des travailleurs | Politique SST, registres de suivi |
| 197 | Evaluer les risques, mettre en oeuvre des mesures preventives | Module EvRP / DUER |
| 198 | Lieux de travail propres, ventiles, eclaires, maintenus | Checklists d'inspection |
| 199 | Fournir les EPI gratuits et adaptes | Module gestion EPI |
| 200 | Formation securite obligatoire a l'embauche et au changement de poste | Suivi formations |
| 201 | CHS (Comite d'Hygiene et de Securite) obligatoire a partir de 50 travailleurs | PV de reunions CHS, suivi actions |
| 202-205 | Service de medecine du travail obligatoire | Suivi aptitudes medicales |
| **206** | **Declaration de tout AT a l'Inspection du Travail sous 48h** | **Workflow de declaration avec timer** |
| 207 | Registre des AT obligatoire sur site | Registre digital |
| 208 | AT grave/mortel : notification immediate, possible arret de chantier | Alerte immediate chaine hierarchique |
| 209-210 | Declaration des maladies professionnelles | Suivi maladies professionnelles |
| 211 | L'inspecteur peut ordonner l'arret immediat en cas de danger imminent | Registre des visites de l'Inspection |

**Sanctions** : amendes, poursuites penales, fermeture de chantier.

#### Code de l'Environnement (Loi n° 16/93, mise a jour par Loi n° 007/2014)

- **Principes fondamentaux** (Art. 2) : prevention, precaution, pollueur-payeur, participation du public
- **EIES obligatoire** (Art. 67-73) pour tout projet a impact environnemental significatif — systematique en BTP
- **Autorisation environnementale** (Art. 74) : arrete ministeriel obligatoire avant demarrage
- **Gestion des dechets** (Art. 75-80) : dechets de construction, matieres dangereuses, dechets industriels
- **Pollution des eaux** (Art. 82) et **qualite de l'air/bruit** (Art. 85-90)

**Autorites reglementaires :**
- **DGE** (Direction Generale de l'Environnement) : revue des EIES, delivrance des autorisations, audits
- **ANPN** (Agence Nationale des Parcs Nationaux) : pour projets pres des 13 parcs nationaux (11% du territoire)
- **Conseil National Climat** : conformite changement climatique pour grands projets

#### CNSS — Caisse Nationale de Securite Sociale

- Immatriculation obligatoire de tous les travailleurs
- **Declaration AT a la CNSS sous 48h** (parallele a la declaration a l'Inspection du Travail)
- Table de ~98 categories de maladies professionnelles (systeme d'origine francaise)
- Cotisations "risques professionnels" : **3-5% de la masse salariale** pour le BTP (classement haut risque)

**Documents pour conformite CNSS :**
- Formulaires d'immatriculation travailleurs
- Declarations trimestrielles de salaires (DTS)
- Formulaire de declaration d'AT
- Certificats medicaux (CMI, prolongation, guerison/consolidation)

#### EIES, PAES, PGES — Le triptyque environnemental

**EIES (Etude d'Impact Environnemental et Social) :**
Processus en 9 etapes : tri preliminaire → cadrage (TdR approuves par DGE) → etat initial → evaluation des impacts → mesures d'attenuation → consultation publique obligatoire → soumission du rapport → revue DGE → autorisation environnementale.

Contenu du rapport EIES : resume non-technique, description du projet, cadre legal, etat initial environnemental et social, identification et evaluation des impacts, mesures d'attenuation, PGES, plan de suivi, arrangements institutionnels, plan d'engagement des parties prenantes, budget.

**PAES (Plan d'Action Environnemental et Social) :**
Souvent exige pour projets finances par des institutions internationales (Banque Mondiale, BAD, SFI). Contient : impacts cles, actions correctives/d'attenuation prioritaires, responsables, chronogramme, budget, indicateurs de suivi, exigences de reporting.

**PGES (Plan de Gestion Environnementale et Sociale) :**
Document operationnel derive de l'EIES, cle pendant la phase construction :
- Mesures d'attenuation specifiques par impact
- Programme de suivi : parametres, frequence, methodes, seuils
- Arrangements institutionnels : responsabilites entrepreneur vs client vs tiers
- Formation et renforcement des capacites
- Mecanisme de gestion des plaintes communautaires
- Reporting : mensuel, trimestriel, annuel
- Budget detaille

**Implications pour le systeme digital :**
- Suivi des actions PGES avec statuts, echeances, responsables
- Saisie et analyse des tendances des donnees de suivi environnemental
- Registre des plaintes avec suivi des reponses
- Journal de l'engagement communautaire
- Reporting incidents environnementaux
- Tableaux de bord de conformite PGES
- Alertes automatiques pour actions en retard

#### Permis de construire et autorisations

- **Permis de construire** : delivre par la mairie
- **Autorisation environnementale** : Ministere de l'Environnement via DGE
- **Autorisation d'ouverture de chantier** : notification a l'Inspection du Travail
- **Declaration prealable de chantier** : pour travaux dangereux ou effectifs importants
- **Permis d'exploitation de carriere** et **autorisation de defrichement** (Code forestier, Loi n° 16/01) selon les cas

---

### 1.3 Contexte regional — Afrique centrale

#### CEMAC

La CEMAC (Gabon, Cameroun, Congo, Tchad, RCA, Guinee equatoriale) n'a **pas de reglementation SST unifiee**. Chaque Etat membre a son propre Code du travail. Le Reglement n° 17/99 etablit des principes de coordination en matiere de securite sociale transfrontaliere.

**Normes de construction** : pas de standard CEMAC. Les pays suivent generalement les normes francaises (NF, Eurocodes, DTU) heritees de l'ere coloniale, avec parfois des normes internationales (BS, ASTM) selon le client ou le bailleur.

#### OHADA

L'OHADA harmonise le droit des affaires dans 17 Etats africains dont tous les membres CEMAC.

Pertinence pour le QSHE :
- **Acte Uniforme sur le Droit Commercial General** : contrats avec clauses de securite
- **Acte Uniforme sur les Societes Commerciales** : responsabilite du conseil d'administration pour la performance securite
- **Acte Uniforme sur le Droit du Travail (en cours)** : harmonisation en preparation, incluant des dispositions SST — pas encore en vigueur mais a surveiller
- Les entreprises operant dans plusieurs pays CEMAC doivent respecter l'OHADA pour les contrats mais la SST reste regie par le droit national

#### Standards IFC (SFI) — 8 Normes de Performance

Appliquees aux projets finances par la SFI ou suivant les Principes de l'Equateur. Nombreux grands projets BTP au Gabon (petrole, mines, infrastructures) y sont soumis.

| Norme | Objet | Pertinence BTP Gabon |
|-------|-------|---------------------|
| PS1 | Evaluation et gestion des risques E&S | Systeme de gestion E&S, engagement parties prenantes |
| **PS2** | **Conditions de travail** | **SST : identifier dangers, evaluer risques, former, documenter, mecanisme de plainte des travailleurs** |
| PS3 | Efficacite des ressources et prevention de la pollution | Emissions GES, eau, dechets |
| PS4 | Sante, securite et surete des communautes | Securite des infrastructures, urgences |
| PS5 | Acquisition de terres et reinstallation involontaire | Grands projets necessitant des acquisitions foncieres |
| **PS6** | **Conservation de la biodiversite** | **Critique au Gabon — foret tropicale, ecosystemes marins** |
| PS7 | Peuples autochtones | CLIP pour communautes Pygmees |
| PS8 | Patrimoine culturel | Procedures de decouverte fortuite en construction |

**Implications systeme :**
- Suivi de l'engagement des parties prenantes
- Mecanisme de gestion des plaintes (communaute et travailleurs)
- Tableaux de bord de suivi E&S
- Classification des incidents selon les categories de severite IFC
- Suivi de la performance ESHS des sous-traitants
- Generation de rapports periodiques

#### Cadre Environnemental et Social de la Banque Mondiale (CES)

10 Normes Environnementales et Sociales (NES), miroir des normes IFC avec des ajouts :
- **NES10** : Plan d'Engagement des Parties Prenantes (PEP) formel
- **NES7** : terminologie elargie pour les peuples autochtones en Afrique subsaharienne
- PCEP (Plan de Cadrage Environnemental et Social) : accord juridique contraignant
- Systeme de classification et reporting des incidents (ESIRT) specifique

---

### 1.4 Cadres securite specifiques au BTP

#### PPSPS (Plan Particulier de Securite et de Protection de la Sante)

Document d'origine francaise, largement utilise en Afrique francophone. Chaque entreprise sur un chantier doit en preparer un.

**Contenu :** identification entreprise, description du chantier, analyse des risques par phase de travaux, mesures preventives, methodes de travail, equipements et EPI, organisation des secours, procedures en cas d'AT, substances dangereuses, mesures de co-activite, formation, plan d'urgence, organigramme.

**Probleme actuel** : documents Word de 30-80 pages, crees en copiant-collant une version precedente, rarement mis a jour pendant le projet, jamais lus par les ouvriers.

#### PGC (Plan General de Coordination)

Prepare par le Coordonnateur SPS, s'applique a tout le chantier et tous les intervenants. Couvre : organisation generale, gestion de la co-activite, installations communes, regles de securite generales, plan de circulation, plan de levage, travail en hauteur, travaux dangereux, plan d'urgence, programme d'inspections.

**Niveaux :** PGC Simplifie (petits projets) et PGC Detaille (projets complexes multi-entreprises).

#### DUERP (Document Unique d'Evaluation des Risques Professionnels)

Obligation d'origine francaise, adoptee comme bonne pratique en Afrique francophone BTP :
- Inventaire systematique de tous les risques par unite de travail
- Evaluation par matrice severite x probabilite
- Hierarchie des mesures de controle
- Plan d'action priorise avec echeances et responsables
- Mise a jour annuelle minimum ou apres tout changement significatif

#### Coordination SPS

Trois categories selon la taille/complexite du projet :
- **Categorie 1** : grands projets (>10 000 hommes-jours ou >5 entreprises + >10 000 HJ) — coordination complete, PGC detaille, DIUO, CISSCT
- **Categorie 2** : projets moyens — PGC simplifie
- **Categorie 3** : petits projets (<500 HJ) — exigences simplifiees

Documents cles : PGC, PPSPS, DIUO (Dossier d'Interventions Ulterieures sur l'Ouvrage), Registre-journal de coordination, CISSCT (comite inter-entreprises de securite).

---

### 1.5 Sources — Axe 1

- ISO 45001:2018, ISO 14001:2015, ISO 9001:2015 (normes publiees par l'ISO)
- Loi n° 3/94 du 21/11/1994 — Code du Travail gabonais
- Loi n° 16/93 du 26/08/1993, mise a jour par Loi n° 007/2014 — Code de l'Environnement du Gabon
- Decret n° 0539/PR/MEFEPEPN du 15/07/2005 — EIES au Gabon
- IFC Performance Standards on Environmental and Social Sustainability (2012)
- World Bank Environmental and Social Framework (2018)
- OHADA — Actes Uniformes (ohada.org)
- Directive 92/57/CEE — Chantiers temporaires ou mobiles
- Loi n° 93-1418 du 31/12/1993 (France) — Coordination SPS
- PAS 99:2012 (BSI)
- CNSS Gabon — Regime des risques professionnels (cnss.ga)
- Code Forestier du Gabon — Loi n° 16/01 du 31/12/2001

---

## Axe 2 — Fonctionnalites QSHE du marche

### 2.1 Analyse des plateformes majeures

#### Procore (procore.com) — Leader mondial, all-in-one construction

- **QSHE** : incidents (presqu'accidents, blessures, dommages materiels), observations securite, plans de securite pre-tache (PTP), checklists d'inspection configurables, punchlist, suivi de conformite OSHA, gestion des certifications
- **Differenciateurs** : plateforme tout-en-un (gestion de projet + finances + securite + qualite), marketplace de 500+ integrations, analytics cross-projets, API ouverte
- **Tarif** : $10K-$50K+/an, modele par projet ou illimite
- **Cible** : moyennes a grandes entreprises, principalement Amerique du Nord
- **Mobile** : iOS/Android complet, mode offline, capture photo/video
- **IA** : prediction des risques, categorisation automatique des observations

#### PlanRadar (planradar.com) — Champion europeen du defaut/snag

- **QSHE** : gestion des defauts/snags avec localisation sur plans, inspections HSE, checklists configurables, punch list, rapports PDF auto-generes avec photos
- **Differenciateurs** : interface intuitive "pin-on-plan", 15+ langues, onboarding ultra-rapide, fort en post-construction/facility management
- **Tarif** : freemium, $29-$59/utilisateur/mois
- **Cible** : PME a mid-market, fort en Europe (DACH, UK, Moyen-Orient)
- **Mobile** : excellent iOS/Android, offline, fonctionnalites AR
- **IA** : categorisation assistee des defauts, generation automatique de rapports

#### Fieldwire (fieldwire.com) — Rachat par Hilti

- **QSHE** : taches sur blueprints, checklists configurables, punch lists, formulaires securite quotidiens, documentation toolbox talks
- **Differenciateurs** : meilleure gestion de plans/blueprints du marche, UX focalisee terrain, synergie materiel Hilti
- **Tarif** : gratuit (3 projets), $39-$59/utilisateur/mois
- **Mobile** : design mobile-first, blueprints offline, markup photo

#### SafetyCulture / iAuditor (safetyculture.com) — Leader inspections mobiles

- **QSHE** : inspections/audits digitaux (coeur de metier), 100 000+ templates publics, gestion des actions correctives, reporting incidents, formation mobile (acquisition EdApp), capteurs IoT temperature/humidite
- **Differenciateurs** : plus grande bibliotheque de templates du marche, formation integree, integration capteurs IoT, utilise par 75 000+ organisations cross-secteurs
- **Tarif** : gratuit (1 utilisateur), $24/utilisateur/mois premium
- **Mobile** : meilleure experience mobile du marche, offline, annotation photo, notes vocales
- **IA** : insights automatiques des inspections (problemes recurrents), recommandations intelligentes, analytics predictives

#### Kizeo Forms (kizeo.com) — Le no-code francophone

- **QSHE** : formulaires digitaux 100% configurables pour tout cas d'usage QSHE, capture photo/GPS/signature/QR/NFC, workflows automatises, rapports PDF auto-generes
- **Differenciateurs** : non specifique construction mais ultra-flexible, constructeur no-code, **entreprise francaise forte en Afrique francophone**, tres abordable
- **Tarif** : EUR 12-24/utilisateur/mois
- **Cible** : PME cross-secteur, fort en France et Afrique francophone
- **Mobile** : excellent iOS/Android, **fonctionne 100% offline**, synchronisation a la reconnexion

#### Dalux (dalux.com) — Le champion BIM-natif

- **QSHE** : QA/QC et inspections securite directement liees aux modeles BIM 3D, localisation des problemes sur modele
- **Differenciateurs** : seule plateforme veritablement BIM-native pour QSHE, viewer BIM gratuit
- **Tarif** : modulaire, tarification entreprise
- **Cible** : marches matures BIM (Scandinavie, Europe)

#### EcoOnline (ecoonline.com) — Specialiste securite chimique

- **QSHE** : gestion des FDS (coeur de metier), incidents, evaluations de risques, audits, formation, gestion environnementale, conformite reglementaire europeenne
- **Differenciateurs** : leader en gestion securite chimique/FDS, expertise reglementaire europeenne profonde
- **Tarif** : EUR 5K-50K+/an, entreprise
- **IA** : parsing IA des FDS, verification automatique de conformite reglementaire

#### Quentic (quentic.com) — Wolters Kluwer (HSE + ESG)

- **QSHE** : incidents, evaluations de risques, EPI, suivi medical, audit, CAPA, gestion documentaire, emissions/dechets/energie, reporting ESG/durabilite, conformite reglementaire
- **Differenciateurs** : acquisition par Wolters Kluwer (contenu reglementaire/juridique integre), modulaire, fort en durabilite/ESG
- **Tarif** : EUR 10K-100K+/an, entreprise
- **IA** : evaluation de risques assistee, reporting durabilite automatise

#### Finalcad (finalcad.com) — IA pour la construction

- **QSHE** : punch lists, QC checklists, inspections securite, suivi de progres, handover digital
- **Differenciateurs** : **IA de detection de defauts par image (le plus avance du marche)**, utilise par Bouygues et Vinci, reference de templates construction
- **Tarif** : EUR 30-80/utilisateur/mois
- **Mobile** : excellent, offline, photo-first, capacites AR
- **IA** : detection de defauts par photo, analytics qualite predictives, NLP pour categorisation

#### Novade (novade.net) — Permis de travail digitaux

- **QSHE** : permis de travail digitaux (coeur de metier), inspections, incidents, toolbox talks, QA/QC, gestion des effectifs (biometrique)
- **Differenciateurs** : meilleur systeme de permis de travail digital, gestion biometrique des effectifs (unique), multi-langues asiatiques
- **Tarif** : entreprise, sur devis
- **IA** : verification automatique de conformite, detection EPI par computer vision

#### Autres plateformes notables

| Plateforme | Specialite |
|------------|-----------|
| **Archireport** | Comptes-rendus de chantier pour architectes/MOE francais. Simple, iPad-first, EUR 29-49/mois |
| **BulldozAIR** | Plateforme francaise pour chefs de chantier, photo-centrique, forte en francophonie |
| **BatiChiffrage** | Base de donnees de prix BTP — pas de module QSHE, complementaire |
| **Assignar** | Gestion des effectifs + securite (Australie) |
| **HammerTech** | Securite construction : orientation, permis, incidents (USA) |
| **InEight** | Gestion de projet construction entreprise avec modules Q&S |

---

### 2.2 Fonctionnalites recurrentes (table stakes)

Presentes dans **toutes** les plateformes majeures :

| Fonctionnalite | Prevalence |
|----------------|-----------|
| Checklists d'inspection digitales configurables | Universelle |
| Documentation photo avec annotation | Universelle |
| Suivi des defauts/problemes avec assignation | Universelle |
| Application mobile iOS/Android | Universelle |
| Generation de rapports PDF | Universelle |
| Tableau de bord / analytics | Universelle |
| Gestion des roles utilisateurs | Universelle |
| Modele SaaS cloud | Universel |
| Capacite offline mobile | Quasi-universelle |
| Suivi des actions correctives | Quasi-universelle |

---

### 2.3 Fonctionnalites differenciantes (1-2 plateformes seulement)

| Fonctionnalite | Plateforme(s) |
|----------------|--------------|
| QSHE liee au BIM 3D | Dalux, Finalcad |
| Detection de defauts par IA/photo | Finalcad, SafetyCulture |
| Formation/e-learning integre | SafetyCulture (EdApp) |
| Integration capteurs IoT | SafetyCulture |
| Gestion securite chimique/FDS | EcoOnline |
| Reporting ESG/durabilite | Quentic |
| Gestion biometrique des effectifs | Novade |
| Permis de travail digitaux complets | Novade, HammerTech |
| Computer vision detection EPI | Novade, startups |
| Base de contenu reglementaire | Quentic (Wolters Kluwer) |
| Constructeur de formulaires no-code | Kizeo Forms |

---

### 2.4 Benchmark tarifaire

| Plateforme | Modele | Fourchette |
|------------|--------|-----------|
| Procore | Par projet / illimite | $10K-$50K+/an |
| PlanRadar | Par utilisateur/mois | $29-$59/mois |
| Fieldwire | Par utilisateur/mois + gratuit | Gratuit-$59/mois |
| SafetyCulture | Par utilisateur/mois + gratuit | Gratuit-$24/mois |
| Kizeo Forms | Par utilisateur/mois | EUR 12-24/mois |
| Archireport | Par utilisateur/mois | EUR 29-49/mois |
| BulldozAIR | Par utilisateur/mois | EUR 50-100/mois |
| Finalcad | Par utilisateur/mois | EUR 30-80/mois |
| EcoOnline | Entreprise annuel | EUR 5K-50K+/an |
| Quentic | Entreprise modulaire | EUR 10K-100K+/an |
| Novade | Entreprise | Sur devis |

---

### 2.5 Gaps identifies dans le marche

1. **Aucune plateforme QSHE majeure n'est construite pour le contexte reglementaire africain/gabonais** — droit du travail, reglementation environnementale, CNSS, CEMAC/OHADA absents
2. **Offline pour connexion prolongee** — les modes offline existants gerent des deconnexions temporaires, pas des jours sans internet
3. **Accessibilite travailleurs faiblement lettres** — les plateformes actuelles presupposent un confort technologique minimum
4. **Integration projet + QSHE pour PME africaines** — les solutions entreprise sont trop cheres et complexes, les solutions simples manquent de profondeur QSHE
5. **Suivi environnemental tropical** — aucune plateforme n'adresse les specificites de la construction en zone equatoriale (biodiversite, foret tropicale, climat)
6. **IA reglementaire locale** — aucune plateforme n'offre d'assistance IA pour naviguer les reglementations gabonaises/CEMAC
7. **Integration systemes locaux** — mobile money, formats de reporting gouvernementaux, systemes d'assurance locaux
8. **Formation contextualisee** — contenus de formation concus pour les marches occidentaux, pas pour les pratiques, materiaux et risques africains

---

### 2.6 Sources — Axe 2

- Documentation officielle et sites web de chaque plateforme citee
- G2, Capterra, GetApp — comparatifs et avis utilisateurs
- Construction Dive — couverture technologie construction (2023-2025)
- ENR (Engineering News-Record) — classements et analyses du marche

---

## Axe 3 — Processus metier a digitaliser

### 3.1 Registre des accidents et quasi-accidents (AT/QA)

#### Donnees a capturer par evenement

**Identite :** nom complet, matricule, poste, employeur (titulaire ou sous-traitant), age, anciennete, type de contrat, nom du superviseur present.

**Temporel :** date et heure exacte, poste (jour/nuit), heures travaillees avant l'AT, date de declaration.

**Localisation :** nom du site, zone/secteur precis (ex: "coffrage niveau 3"), coordonnees GPS pour sites lineaires.

**Evenement :** nature (chute de hauteur, ecrasement, electrocution, exposition chimique, coup de chaleur...), description detaillee, activite en cours, equipements/outils impliques, materiaux impliques.

**Severite :**
- AT avec arret (au moins 1 jour d'arret apres le jour de l'accident)
- AT sans arret (soins medicaux sans arret)
- Presqu'accident (pas de blessure mais potentiel)
- Accident mortel
- Maladie professionnelle
- Partie du corps atteinte (diagramme corporel), nature de la lesion, jours d'arret, taux d'IPP si applicable

**Temoins :** noms et depositions.

**Actions immediates :** premiers soins, evacuation (vers quel hopital), mise en securite du site.

#### Processus de declaration au Gabon

1. Declaration a la CNSS sous 48h (formulaire papier aujourd'hui)
2. Notification a l'Inspection du Travail sous 48h (immediate pour AT mortel)
3. Certificat Medical Initial (CMI) du medecin traitant
4. Certificats de prolongation si besoin
5. Certificat de guerison ou consolidation
6. Registre des AT maintenu sur site

**Problemes actuels du papier :** formulaires illegibles, delai 48h souvent depasse sur sites recules, copies perdues, pas de suivi des certificats medicaux, pas de lien avec les actions correctives, statistiques compilees manuellement.

#### Investigation — 3 methodes a supporter

1. **Arbre des causes (INRS)** : methode francaise remontant depuis l'evenement vers tous les facteurs contributifs (individu, tache, materiel, environnement, organisation). Necessite un constructeur visuel d'arbre.

2. **5 Pourquoi** : methode simple en cascade. Necessite un formulaire guide avec 5 champs "Pourquoi?" successifs.

3. **Ishikawa (6M)** : organisation des causes en 6 categories (Milieu, Materiel, Main d'oeuvre, Methode, Matiere, Mesure). Necessite un constructeur de diagramme en arete de poisson interactif.

**Sortie d'investigation :** causes racines identifiees, actions correctives assignees (qui, quoi, quand), actions preventives, lecons apprises, verification de cloture.

#### Declaration anonyme des presqu'accidents

Pas d'obligation legale au Gabon mais exigee par les standards internationaux (ISO 45001, IFC) et par les grands clients (Total, Comilog, Olam). La pyramide de Heinrich (1 mort : 29 blessures graves : 600 presqu'accidents) justifie l'importance du signalement proactif. Le frein principal : peur de represailles. Un systeme digital doit offrir un canal de signalement anonyme, offline, avec minimum d'effort.

---

### 3.2 Causeries securite (toolbox meetings)

#### Fonctionnement

Reunions courtes (10-15 min) en debut de poste, animees par le HSE ou le chef d'equipe.

**Frequence :** quotidien (briefing 5-10 min), hebdomadaire (session approfondie 15-30 min), ad hoc (apres incident, nouvelle activite).

**Sujets types pour le BTP en Afrique centrale :**
- Travail en hauteur / prevention des chutes
- Securite echafaudages
- Fouilles et tranchees
- Securite electrique
- Manutention manuelle / ergonomie
- Port et inspection des EPI
- **Stress thermique et hydratation** (critique en climat equatorial gabonais)
- **Prevention du paludisme** (preoccupation sanitaire majeure au Gabon)
- **Prevention morsures de serpents/insectes** (zones forestieres)
- Grue et operations de levage
- Espaces confines
- Prevention incendie
- **Securite routiere** (pistes forestieres)
- Maladies infectieuses
- Alcool et drogues
- Rangement (5S chantier)
- Procedures d'urgence et evacuation

#### Exigences de suivi

Nom complet et matricule de chaque participant, entreprise, date/heure/duree, lieu, sujet, nom du presentateur, signature ou empreinte digitale (contrainte alphabetisation). Les grands clients exigent souvent la preuve que 100% des travailleurs ont assiste a au moins une causerie par semaine.

#### Fonctionnalites digitales cles

- Bibliotheque de sujets pre-construits avec contenu, images, messages cles en francais
- Planification/calendrier des causeries avec assignation de sujets
- Presence digitale : scan QR, badge NFC, ou tablette avec empreinte
- Photo du groupe comme preuve
- Quiz rapide (3-5 questions) pour verifier la comprehension
- Dashboard de taux de participation par semaine/mois/sous-traitant
- **Mode offline obligatoire** pour sites recules
- Rapports mensuels auto-generes

---

### 3.3 Inspections securite et audits internes

#### Types d'inspections

| Type | Frequence | Executant | Duree | Focus |
|------|-----------|-----------|-------|-------|
| Quotidienne | Chaque matin | Chef d'equipe/contrematre | 10-15 min | Dangers immediats, rangement, EPI |
| Hebdomadaire | 1x/semaine | Responsable HSE site | 1-3h | Tour complet du chantier |
| Mensuelle formelle | 1x/mois | Manager HSE + directeur de site | 2-4h | Checklists detaillees, rapport formel |
| VIC | A l'arrivee d'un sous-traitant | Titulaire + sous-traitant | 1-2h | Risques de co-activite |
| Inopinee | Aleatoire | HSE central, client, Inspection du Travail | Variable | Conformite reelle |

#### Contenu type des checklists d'inspection BTP

**Organisation du site :** cloture/controle d'acces, signalisation, points de rassemblement, postes de premiers secours, extincteurs, numeros d'urgence affiches.

**Travail en hauteur :** echafaudages (montage, inspection, etiquetage vert/rouge), garde-corps, tremies protegees, echelles, points d'ancrage.

**Fouilles :** blindage/talutage pour tranchees >1,3m, echelles d'acces tous les 7,5m, deblais a 1m minimum du bord, barrieres.

**Electricite :** armoires verrouillees/etiquetees avec differentiel, cables intacts, mise a la terre, outils en bon etat.

**Equipements :** grues (certificat, abaque de charge, stabilisateurs), vehicules (check pre-utilisation, alarme recul, ceintures), outils portatifs (protections en place).

**EPI :** conformite au port pour chaque tache, etat des EPI.

**Proprete :** zones de travail rangees, dechets tries, stockage stable, voies d'acces degagees.

**Environnement :** retention pour carburants/huiles, poubelles etiquetees, mesures anti-poussiere/bruit, controle de l'erosion.

#### Workflow NC/CAPA

1. Detection → 2. Classification (critique/significative/mineure/observation) → 3. Assignation (responsable + echeance) → 4. Action corrective + preuve photo → 5. Verification sur site → 6. Cloture → 7. Action preventive si systemique

---

### 3.4 Plans de prevention et analyses de risques

#### EvRP / DUER — Evaluation des Risques Professionnels

Methodologie :
1. Identifier tous les dangers par unite de travail (metier/activite)
2. Evaluer chaque risque : **probabilite** (1-5) x **gravite** (1-5), modulee par la frequence d'exposition
3. Calculer le niveau de risque → matrice de criticite :
   - 1-4 : acceptable (vert)
   - 5-9 : modere (jaune)
   - 10-15 : eleve (orange) — plan d'action requis
   - 16-25 : critique (rouge) — travail interdit tant que le risque n'est pas reduit
4. Definir les mesures de controle : elimination → substitution → controles techniques → controles administratifs → EPI

#### Analyse des Risques de la Tache (ART / JHA)

Avant chaque tache dangereuse : decomposition en etapes → dangers par etape → mesures de controle par etape → approbation (ouvrier + superviseur + HSE).

---

### 3.5 Gestion des EPI

#### Types d'EPI en BTP

| Categorie | Equipement | Norme |
|-----------|-----------|-------|
| Tete | Casque de chantier | EN 397 |
| Yeux | Lunettes de protection, visiere | EN 166 |
| Oreilles | Bouchons, casque anti-bruit | EN 352 |
| Respiratoire | Masques FFP2/FFP3, demi-masques | EN 149 |
| Mains | Gants mecaniques, chimiques, thermiques | EN 388, EN 374 |
| Pieds | Chaussures de securite S3 | EN ISO 20345 |
| Corps | Gilet haute visibilite | EN ISO 20471 |
| Antichute | Harnais, longe, enrouleur | EN 361, EN 355, EN 360 |

#### Donnees a tracker par EPI

Type, marque/modele/reference, norme de certification, date de fabrication, **date de premiere utilisation** (le compte a rebours demarre ici), date d'expiration (casques 3-5 ans, harnais 1-2 ans apres premiere utilisation), prochaine date d'inspection (harnais : annuelle par personne competente), affecte a qui, etat (neuf/en service/endommage/retire), motif de retrait.

**Specificite tropicale :** la chaleur et l'humidite equatoriales accelerent la degradation des EPI (UV sur casques, moisissure sur harnais). Les cycles de vie doivent etre raccourcis par rapport aux preconisations europeennes.

#### Fonctionnalites digitales

- Gestion de stock (niveaux, commandes, alertes stock minimum)
- Profil EPI par travailleur (tout ce qui lui a ete delivre, tailles, dates)
- Alertes expiration automatiques (30j, 7j avant)
- Planification des inspections periodiques
- QR code par EPI : scanner pour voir historique, etat, expiration
- Verification de conformite EPI avant acces au chantier
- Suivi des couts par travailleur/site/sous-traitant

---

### 3.6 Suivi des habilitations et formations

#### Certifications cles en BTP

| Certification | Objet | Validite |
|---------------|-------|----------|
| CACES R482 | Engins de chantier (11 categories A-K) | 5 ans (10 ans cat. A, B1) |
| CACES R486 | Nacelles (PEMP) — cat. A, B, C | 5 ans |
| CACES R487 | Grues a tour | 5 ans |
| CACES R489 | Chariots automoteurs (forklifts) | 5 ans |
| CACES R490 | Grues de chargement | 5 ans |
| Habilitations electriques | B0, B1, B1V, B2, BR, BC, BE, H0-H2 | 3 ans |
| Travail en hauteur | Harnais, echafaudages, protection antichute | 2-3 ans |
| SST | Sauveteur Secouriste du Travail | 24 mois (MAC SST) |
| FIMO/FCO | Conducteurs professionnels | FCO tous les 5 ans |
| ADR | Transport matieres dangereuses | Variable |
| N1/N2 | Risques chimiques | Variable |
| ATEX | Atmospheres explosives | Variable |

**Au Gabon** : les CACES ne sont pas formellement reglementes par le droit gabonais mais exiges par les clients internationaux. Des equivalences locales existent.

#### Fonctionnalites digitales

- **Matrice de formation** : grille travailleurs x certifications requises, code couleur (vert/jaune/rouge)
- Alertes automatiques a 90, 60, 30 jours avant expiration (travailleur + superviseur + RH)
- Plan de formation : programmer et suivre les sessions planifiees
- Dashboard de conformite (% travailleurs avec toutes les certifications valides pour leur poste)
- **Blocage** : empecher l'affectation d'un travailleur a une tache necessitant une certification qu'il n'a pas
- Stockage des scans de certificats, recuperables lors d'un controle
- Suivi sous-traitants

---

### 3.7 Fiches de Donnees de Securite (FDS)

#### Produits chimiques courants en BTP au Gabon

Ciment (chrome VI), produits de cure beton, peintures/vernis/solvants (toluene, xylene), colles/mastics (epoxy, polyurethane), diesel/essence/lubrifiants, fluides hydrauliques, produits de soudage, produits d'etancheite (bitume), produits de traitement du bois, produits de nettoyage (acides), explosifs (carrieres).

#### 16 sections d'une FDS (norme GHS)

Identification, dangers, composition, premiers secours, lutte incendie, mesures en cas de rejet, manipulation/stockage, controles d'exposition/protection individuelle, proprietes physico-chimiques, stabilite/reactivite, toxicologie, ecologie, elimination, transport, reglementation, autres.

#### Fonctionnalites digitales

- Base de donnees FDS searchable
- QR code sur chaque contenant : scanner pour acceder a la FDS et aux procedures d'urgence
- Alerte d'obsolescence (FDS a mettre a jour tous les 3 ans)
- Registre des produits chimiques par site
- **Matrice de compatibilite** : alerte quand des produits incompatibles sont stockes ensemble
- Lien vers EPI requis, formations, evaluations de risques

---

### 3.8 Gestion des non-conformites qualite (NC)

#### Types de NC en BTP

**Execution :** beton hors spec (resistance), ferraillage mal positionne (enrobage, diametre, espacement), cotes hors tolerances, mauvais materiaux, defauts d'etancheite, defauts d'alignement/niveau, defauts de finition.

**Approvisionnement :** materiaux non conformes aux specs, endommages a la livraison, certificats d'essai manquants, fournisseurs non agrees.

**Documentation :** modes operatoires manquants/incomplets, plans non a jour sur site, registres d'inspection incomplets.

#### Workflow NC

1. Detection → 2. Enregistrement (n° unique, date, localisation, description + photos, reference a l'exigence non respectee, classification critique/majeure/mineure) → 3. Analyse (5 Pourquoi, Ishikawa) → 4. Decision de traitement (reprendre / reparer / accepter en l'etat / demolir-rebuter) → 5. Action corrective → 6. Verification → 7. Action preventive → 8. Cloture avec preuves

#### Reserves / Punchlist

A la reception des travaux, liste formelle de defauts a corriger avant acceptation finale. Chaque reserve : localisee sur un plan, assignee a un sous-traitant, echeance, statut (ouverte → en cours → corrigee → verifiee → cloturee). La levee des reserves doit etre documentee pour le PV de reception.

---

### 3.9 Suivi environnemental

#### Contexte gabonais specifique

- 13 parcs nationaux (11% du territoire)
- 88% de couverture forestiere — un des pays les plus boises d'Afrique
- Membre du Partenariat pour les Forets du Bassin du Congo
- EIES obligatoire pour tout projet BTP significatif
- Suivi de la mise en oeuvre du PGES exige et controle

#### Gestion des dechets

**Types :** inertes (beton, gravats, terre), non dangereux (bois, metaux, plastiques, emballages), dangereux (huiles usagees, pots de peinture, solvants, batteries, sols contamines).

**Suivi :** type et classification, quantite, lieu de stockage sur site, filiere d'elimination (recyclage, decharge, incineration, traitement specialise), transporteur (nom, agrement), installation de destination, **BSD (Bordereau de Suivi des Dechets)** pour les dechets dangereux — tracabilite du berceau a la tombe.

**Defi gabonais :** infrastructure de recyclage tres limitee, peu d'installations de traitement agreees, deversement illegal frequent (surtout huiles usagees).

#### Emissions, rejets, pollution

Parametres a surveiller : poussieres (terrassements, demolition), gaz d'echappement (groupes electrogenes, engins), COV (peintures, solvants), eaux de ruissellement chargees en sediments, eaux de lavage beton, fuites de carburant/huile, bruit (battage de pieux, demolition).

#### Suivi de la biodiversite (specifique Gabon)

- Inventaires faune/flore de reference pre-construction
- Suivi des especes protegees (gorilles, elephants, pangolins)
- Suivi de la deforestation (hectares defriche, reboisement compensatoire)
- Preservation des corridors ecologiques
- Impact marin/cotier pour projets portuaires (Libreville, Port-Gentil)
- Reporting communautaire des preoccupations environnementales

#### Suivi PGES

Liste complete des engagements PGES, responsable par engagement, statut (non demarre / en cours / acheve), preuves (photos, documents, mesures), calendrier de suivi, reporting a la DGEPN.

---

### 3.10 Indicateurs QSHE (KPIs)

#### Securite

| KPI | Formule | Benchmark BTP |
|-----|---------|---------------|
| **TF (Taux de Frequence)** | (Nb AT avec arret x 1 000 000) / heures travaillees | < 10 bon, < 5 excellent (Gabon typique : 15-30) |
| **TG (Taux de Gravite)** | (Nb jours d'arret x 1 000) / heures travaillees | < 0,5 bon |
| TFg (global) | (Total AT x 1 000 000) / heures travaillees | — |
| IF (Indice de Frequence) | (Nb AT avec arret x 1 000) / nb travailleurs | Utile quand donnees heures non fiables |
| Heures sans AT avec arret | Compteur continu, remis a zero a chaque LTI | Affiche sur le panneau de chantier |

#### Qualite

- Taux de cloture des NC dans les delais
- Taux de recurrence des NC
- Taux de qualite premiere (inspections passees du premier coup)
- Taux de levee des reserves dans les delais
- Cout de la reprise (% de la valeur du projet)

#### Sante

- Taux de maladies professionnelles
- Conformite aptitudes medicales (% travailleurs avec certificats valides)
- **Taux d'incidence du paludisme** (specifique Gabon — cas pour 1 000 travailleurs)
- Taux de maladies liees a la chaleur

#### Environnement

- Taux de recyclage des dechets
- Nombre d'incidents environnementaux (deversements, rejets non autorises)
- Taux de conformite PGES
- Consommation d'eau (m³ par m² construit)
- Consommation de carburant / emissions CO2

#### Processus (indicateurs avances)

- Taux de completion des inspections planifiees
- Taux de conformite des formations
- Taux de participation aux causeries
- Taux de conformite EPI
- Taux de conformite des permis de travail
- Taux de cloture des CAPA dans les delais

---

### 3.11 Permis de travail

#### Types et contenu

**Permis feu :** soudure, meulage, decoupage. Verifications : combustibles retires/proteges dans un rayon de 10m, extincteur present, surveillance feu designee (pendant + 1-2h apres), test gaz si proximite de substances inflammables. Validite : un poste max (8-12h), renouvellement quotidien.

**Espace confine :** citernes, regards, silos, fouilles profondes, tunnels. Verifications : tests atmospheriques (O2 19,5-23,5%, LIE <10%, gaz toxiques H2S/CO), surveillance continue, ventilation forcee, plan de sauvetage + equipe en attente, communication entrant-veilleur, isolation des energies (LOTO).

**Travail en hauteur :** au-dessus de 2m sans protection collective. Verifications : systeme antichute defini, formation valide, harnais inspecte, points d'ancrage evalues, conditions meteo acceptables, plan de sauvetage (<15 min).

**Fouille :** tout terrassement/tranchee. Verifications : reperage des reseaux (DICT), plan de blindage/talutage, gestion circulation, plan de pompage, points d'acces/sortie.

**Travail electrique / Consignation-Deconsignation :** 5 etapes — separation, condamnation (cadenas personnel), identification, VAT (Verification d'Absence de Tension), MALT-CC (mise a la terre et en court-circuit si HT). Roles : charge de consignation (BC/HC), charge de travaux (B2/H2), charge d'intervention (BR).

**LOTO (Lock-Out / Tag-Out) :** s'applique a toutes les energies (electrique, hydraulique, pneumatique, mecanique, thermique, chimique, gravitationnelle). Chaque travailleur pose son propre cadenas.

#### Elements communs a tous les permis

Numero unique, date/heure d'emission/validite, localisation precise, description des travaux, dangers identifies, mesures de controle (checklist), signatures (demandeur + autorisateur + proprietaire de zone si applicable), resultats de tests gaz, cloture formelle.

#### Fonctionnalites digitales cles

- Workflow de demande/approbation
- Signatures digitales avec horodatage
- Checklists obligatoires (impossible de sauter une verification)
- Timer de validite avec alerte d'expiration et invalidation automatique
- **Detection de conflit** : alerte si permis qui se chevauchent dans la meme zone
- Tableau de bord en temps reel des permis actifs
- Saisie des tests atmospheriques directement dans le permis
- Suivi LOTO (qui a pose quels cadenas, sur quels points d'isolation)
- Archive (5 ans minimum pour conformite reglementaire)

---

### 3.12 Reporting et tableaux de bord QSHE

#### Rapport mensuel QSHE type

**Section securite :** synthese des AT/incidents, TF/TG + tendances, heures travaillees, compteur heures sans LTI, presqu'accidents declares, inspections realisees vs planifiees, top 5 NC, causeries tenues + taux participation, formations realisees, permis de travail delivres.

**Section qualite :** NC emises et cloturees, tendances NC (Pareto), statut reserves, resultats inspections qualite, evenements cles (echecs d'essai beton, rejets materiaux).

**Section sante :** statut surveillance medicale, evenements sante au travail, **cas de paludisme**, campagnes de sante.

**Section environnement :** incidents environnementaux, quantites dechets par type, resultats suivi environnemental, conformite PGES, resultats audits environnementaux.

**Plan d'action :** statut de toutes les CAPA ouvertes, actions en retard en surbrillance.

#### Reporting reglementaire

Pour les autorites gabonaises : declaration annuelle CNSS, rapports Inspection du Travail, rapports suivi environnemental a la DGEPN, rapports PGES (souvent trimestriels pour grands projets), rapports ANPN si proximite parc national.

#### Reporting client

Les grands clients au Gabon (Total Energies, COMILOG/Eramet, Olam, SEEG, bailleurs internationaux AFD/BM/BAD) exigent : statistiques HSE mensuelles dans leur format specifique, notification d'incident sous 24h, revues QSHE trimestrielles, preuves de conformite formations/certifications, donnees suivi environnemental, souvent **leurs propres templates et definitions de KPIs**.

---

### 3.13 Modele de donnees implicite

| Entite | Relations cles |
|--------|---------------|
| Site/Projet | A plusieurs : inspections, AT, permis, travailleurs |
| Travailleur | A : affectations EPI, certifications, historique AT, presence causeries |
| Entreprise (titulaire/sous-traitant) | A plusieurs : travailleurs, NC, resultats d'inspection |
| Accident/Incident | Lie a : travailleur, site, investigation, actions correctives |
| Inspection | A : items de checklist, constats/NC, photos |
| Non-Conformite | A : workflow CAPA, liee a inspections ou audits |
| Permis de Travail | Lie a : zone du site, travailleurs, periode de validite |
| Formation/Certification | Liee a : travailleur, dates de validite |
| EPI | Lie a : travailleur, calendrier d'inspection, expiration |
| Produit Chimique | A : document FDS, lieu de stockage, infos risque |
| Evaluation de Risques | Liee a : site/activite, scores matrice, mesures de controle |
| Dechets | A : type, quantite, BSD, transporteur, destination |
| Mesure Environnementale | A : parametre, valeur, limite, localisation, date |
| Causerie | A : sujet, date, presentateur, liste de presence |
| Engagement PGES | A : description, responsable, statut, preuves |
| KPI | Calcule a partir de : heures travaillees, AT, inspections, NC, formations |

---

### 3.14 Sources — Axe 3

- Code du Travail gabonais (Loi n° 3/94)
- Reglementation CNSS Gabon — regime des risques professionnels
- INRS (Institut National de Recherche et de Securite, France) — methodes d'investigation AT
- Norme GHS/CLP pour les FDS
- Pratiques de l'industrie BTP en Afrique francophone (Total, COMILOG, Vinci, Bouygues)
- Documentation IFC/Banque Mondiale sur la gestion SST des chantiers

---

## Axe 4 — Tendances innovantes

### 4.1 Intelligence artificielle en QSHE

#### Analyse NLP des rapports d'incidents

Le NLP permet d'analyser des milliers de rapports d'incidents pour identifier des patterns recurrents que l'analyse humaine manque par volume. Les systemes classifient automatiquement les rapports par severite et categorie, et detectent des tendances temporelles (ex: recrudescence de mentions de "fatigue" sur un projet specifique).

**Acteurs cles :**
- **Newmetrix (Oracle Construction Intelligence Cloud)** : acquis par Oracle en 2022, analyse photos et rapports texte pour generer un "Risk Score" de 0-100 par projet
- **Smartvid.io** (integre a Newmetrix) : moteur IA "Vinnie" analysant des milliers de photos de chantier pour detecter la conformite EPI et les dangers

Sources : Oracle press release "Oracle Acquires Newmetrix" (2022), ENR "AI in Construction Safety" (2023-2024), Construction Dive (2023)

#### Computer vision pour detection EPI

Application IA la plus mature en securite BTP. Cameras fixes ou embarquees (drones) alimentent des modeles CV (YOLOv5/v8, EfficientDet) detectant les travailleurs sans casque, gilet, lunettes, harnais. Precision de 90-95%+ en conditions controlees, degradee en faible eclairage ou occlusion.

**Edge computing** : traitement video sur le device pour reduire les besoins en bande passante — critique pour les chantiers africains.

**Acteurs :**
- **Versatile (CraneView)** : capteurs IA montes sur grues, surveillance des operations de levage et zones de proximite
- **Buildots** : cameras 360° montees sur casques, comparaison IA vs modele BIM
- **Viact.ai** : video analytics IA specifique securite construction (Hong Kong)

Reference : Fang et al. (2018), "Detecting non-hardhat-use by a deep learning method," Automation in Construction

#### Analytics predictives pour prevention des accidents

Au lieu d'attendre les indicateurs retardes (taux de blessures), les systemes predictifs analysent les indicateurs avances — taux de completion des inspections, frequence des presqu'accidents, conformite formation, meteo, complexite du projet, historique securite des sous-traitants — pour predire le risque.

Suffolk Construction a utilise Newmetrix/Smartvid.io pour le scoring predictif, avec une reduction de 20-30% des incidents enregistrables.

#### Analyse de cause racine assistee par IA

Systemes appliquant semi-automatiquement les methodes d'arbre des causes, Ishikawa, 5 Pourquoi en suggerant des causes potentielles a partir d'incidents similaires passes. Avec les LLM (GPT-4, Claude), les plateformes experimentent l'investigation conversationnelle : l'investigateur decrit l'evenement en langage naturel, l'IA suggere les facteurs contributifs et redige le rapport.

---

### 4.2 Technologies mobiles et terrain

#### Offline-first — la priorite absolue pour le Gabon

Les meilleures applications (SafetyCulture, Fieldwire, PlanRadar, Kizeo) stockent les donnees localement et synchronisent a la reconnexion. Les approches techniques :
- **Service Workers + IndexedDB** pour les PWA
- **PouchDB/CouchDB** pour synchronisation bidirectionnelle
- **Realm (MongoDB)** utilise par SafetyCulture
- **WatermelonDB** pour React Native
- **SQLite + couche de synchronisation custom**

Resolution de conflits : last-write-wins (simple mais perte de donnees possible), merge (complexe mais conserve tout), resolution utilisateur (pour conflits critiques).

Indicateurs UX indispensables : statut connectivite, nombre d'elements en attente de sync, horodatage derniere sync, indicateur de progression de sync.

#### QR codes et NFC

- QR sur equipements (echafaudages, extincteurs, harnais) : scanner pour voir l'historique d'inspection, logger une nouvelle inspection, signaler un defaut
- QR par emplacement : declenche la checklist specifique au lieu
- NFC dans les EPI : suivi d'inventaire automatise, dates d'expiration, journalisation delivrance/retour, authentification travailleur

#### Geolocalisation

- Cartographie thermique des incidents (heat maps de zones dangereuses)
- **Geofencing** : alertes quand un travailleur entre dans une zone restreinte (rayon de grue, fouille, zone electrique)
- Comptage/localisation en cas d'urgence (mustering)
- Suivi de flotte d'engins

#### Voix-a-texte

Saisie mains libres pour ouvriers portant des gants ou en position difficile. Google Speech-to-Text et Apple supportent bien le francais. Defi : bruit de fond des chantiers (engins, generateurs). Solutions de preprocessing anti-bruit disponibles.

#### Wearables

- **Casques intelligents** (Guardhat, WakeCap, Cosmo Connected) : tracking localisation, detection de chute, surveillance stress thermique, communication
- **Capteurs de proximite** (Triax Spot-r) : detection proximite engins lourds, zones restreintes
- **Detection de fatigue** (SmartCap, Caterpillar) : capteurs EEG mesurant la vigilance
- **Suivi biometrique** : frequence cardiaque, temperature corporelle, capteurs de mouvement pour detecter le stress thermique — critique en climat equatorial gabonais
- **Exosquelettes** (Ekso Bionics, Hilti EXO-O1) : reduction des TMS, adoption precoce mais croissante

---

### 4.3 Signatures digitales et conformite

- **Signatures electroniques** : valeur legale sous eIDAS (EU/France) et dans l'espace OHADA (couvre le Gabon). Utilisables pour permis de travail, presence aux causeries, approbations de documents.
- Plateformes : DocuSign, **Yousign (francais)**, fonctions integrees dans Procore/SafetyCulture/PlanRadar
- **Certificats de conformite digitaux** : suivi automatique des dates d'expiration, blocage des travailleurs avec certifications expirees
- **Blockchain pour pistes d'audit** : adoption reelle minimale malgre le battage mediatique. Le hachage cryptographique de logs en append-only offre une assurance equivalente avec beaucoup moins de complexite. Non recommande pour le contexte MIKA.
- **Protection des donnees** : Gabon a sa propre loi de protection des donnees (Loi n°002/2011). Les donnees de sante des travailleurs (certificats medicaux, tests, AT) ont une protection renforcee.

---

### 4.4 IoT et capteurs

| Domaine | Capteurs | Acteurs | Pertinence Gabon |
|---------|---------|---------|-----------------|
| Bruit | Sonometres connectes (seuil 85 dB) | Casella/Acoem, Cirrus | Moyenne |
| Poussieres | PM2.5/PM10, silice | Aeroqual, TSI | Moyenne |
| Gaz | H2S, CO, O2, LIE | MSA ALTAIR io4, Honeywell | Elevee (espaces confines) |
| **Chaleur** | **WBGT (temperature + humidite)** | **QUESTemp, TSI** | **Critique (climat equatorial)** |

**LoRaWAN** pour sites recules : reseau longue portee / basse consommation, une seule passerelle couvre plusieurs km. Particulierement pertinent pour les chantiers en zone forestiere gabonaise sans couverture cellulaire.

---

### 4.5 BIM et QSHE

- Planification securite 4D (securite liee au planning : visualisation des risques par phase)
- Identification automatique de dangers dans les modeles BIM (bords non proteges, espaces insuffisants)
- AR sur site (Trimble XR10 / HoloLens) pour visualiser les infos securite sur le modele
- Issues qualite/securite liees a des elements BIM specifiques (Dalux, PlanRadar, Autodesk Construction Cloud)

**Pertinence Gabon :** limitee a court terme — adoption BIM encore faible en Afrique centrale, mais pertinent pour les grands projets internationaux.

---

### 4.6 Pratiques emergentes

#### Gamification de la securite

Points et leaderboards pour signalements de presqu'accidents, completion de formations, observations positives. Recherche : augmentation de 30-50% du taux de signalement en phase initiale d'adoption. **Attention** : la gamification peut deriver si elle incentive la quantite au detriment de la qualite, ou si elle cree une pression a ne pas declarer les incidents.

#### Behavioral Based Safety (BBS)

Observations structurees des comportements des travailleurs (sur vs a-risque), aggregees pour identifier les patterns comportementaux systemiques. Outils digitaux : SafeStart, DuPont/dss+, BST. Accent moderne sur le renforcement positif (reconnaitre les comportements surs).

#### Modeles de maturite de la culture securite

- **Courbe de Bradley (DuPont)** : de "Reactif" a "Interdependant"
- **Echelle de Hudson** : 5 niveaux de "Pathologique" a "Generatif"
- Outils d'evaluation digitaux avec benchmarking

#### Just Culture

Culture ou les erreurs honnetes ne sont pas punies, mais les violations deliberees le sont. Impact : augmentation de 3-5x des taux de declaration d'incidents. Support digital : reporting anonyme, separation identite/rapport pendant l'investigation, suivi des actions correctives systemiques plutot que du blame individuel.

#### Indicateurs avances vs retardes

L'industrie BTP (leaders comme Skanska, Vinci, Bouygues, Turner) opère un virage des indicateurs retardes (TF, TG — mesurent l'echec) vers les indicateurs avances (taux de presqu'accidents, completion inspections, conformite formations, observation positive/negative, conformite permis, conformite EPI). Un module QSHE moderne doit mettre les indicateurs avances en avant.

---

### 4.7 Sources — Axe 4

- Oracle "Oracle Acquires Newmetrix" (2022)
- ENR "AI in Construction Safety" (2023-2024)
- Construction Dive "How AI is reshaping jobsite safety" (2023)
- Fang et al. (2018), "Detecting non-hardhat-use by a deep learning method," Automation in Construction
- Safety+Health Magazine (National Safety Council)
- Lingard et al. (2019), recherche sur gamification en securite construction
- ISO 45001:2018, ILO-OSH 2001
- Automation in Construction (Elsevier) — journal de reference technologie construction

---

## Axe 5 — UX de reference

### 5.1 Design mobile-first pour les travailleurs de terrain

#### Zone du pouce et operation a une main

Recherche de Steven Hoober (2013, UXmatters) : sur les grands telephones (5,5"+), ~50% de l'ecran est atteignable confortablement avec un pouce. Actions critiques en bas-centre et bas-gauche (pour droitiers). Navigation principale en barre inferieure (pattern Material Design / iOS). Bouton "Signaler un danger" = FAB (Floating Action Button) persistant en bas a droite. Selection de severite = boutons larges colores (rouge/orange/jaune/vert), pas de dropdown. Gestes : swipe pour approuver/rejeter, pull-to-refresh.

**Application QSHE :** pour les ouvriers avec gants, cibles tactiles minimum **56x56 dp** (au-dessus des 48dp du Material Design 3), espacement minimum 12-16dp.

#### Offline-first — architecture non-negociable

Indispensable pour les chantiers gabonais (sites forestiers, corridors de pipeline, pistes minieres). L'app doit fonctionner **des jours** sans internet, pas des minutes.

Indicateurs UX obligatoires : badge de statut connectivite, compteur d'elements en attente de sync, horodatage derniere sync, progress bar de sync.

Priorite de sync a la reconnexion :
1. Rapports d'incident critiques
2. Inspections et observations completees
3. Photos et pieces jointes (compressees, sync opportuniste)

#### Optimisation bande passante faible

- Compression images avant upload (JPEG qualite 60-70%, redimensionnement max 1920px)
- Chargement progressif (miniatures d'abord, pleine resolution a la demande)
- Pagination, selection de champs, delta sync (seulement les changements)
- CDN avec PoPs en Afrique (Cloudflare : Lagos, Johannesburg — plus proches du Gabon)
- **Conscience du budget data** : afficher les estimations de consommation data, permettre le controle (ex: "synchroniser les photos uniquement en WiFi")

#### Formulaires de capture rapide

Minimiser la saisie : boutons single-select (pas de dropdown) pour les options courantes, chips multi-select, sliders pour severite/probabilite, toggles pour oui/non, options pre-remplies selon le contexte (localisation/projet).

**Defaults intelligents :** pre-remplir GPS, date/heure, role de l'utilisateur, projet assigne, reponses precedentes (inspections recurrentes).

**Divulgation progressive :** montrer uniquement les champs essentiels d'abord, puis developper pour les details. Un signalement de presqu'accident = minimum 3-4 taps (categorie, severite, photo, soumettre).

---

### 5.2 Design de tableaux de bord pour le management

#### Hierarchie d'information

Les KPIs les plus critiques sont les plus grands et proeminents. Sparklines pour les tendances sans necesiter un graphique separe. Indicateurs RAG (Rouge/Ambre/Vert) pour le statut d'un coup d'oeil. Comparaison contextuelle : valeur actuelle vs cible vs periode precedente vs benchmark sectoriel.

Reference : Stephen Few, "Information Dashboard Design" (2nd edition)

#### Navigation drill-down

Principe de Shneiderman (1996) : "Overview first, zoom and filter, then details on demand." Portfolio → Projet → Zone → Incident individuel. Clic sur n'importe quel KPI pour voir sa decomposition. Cross-filtering entre widgets du dashboard.

#### Codage couleur

- Critique/Extreme : rouge (#D32F2F) + icone crane
- Eleve : orange (#F57C00) + icone exclamation
- Modere : jaune/ambre (#FFC107) + icone avertissement
- Faible : vert (#388E3C) + icone info
- **Jamais se fier a la couleur seule** : toujours associer icone + label texte + pattern/texture

#### Vues cartographiques

Heat maps d'incidents geotagues, overlay sur plans de site (souvent plus utile que les cartes GPS pour un chantier specifique), mapping par etage pour les batiments, **cartes offline** (Mapbox GL JS supporte le cache offline).

#### Visualisations de tendances

Courbes temporelles (moyennes mobiles mensuelles), cartes de controle SPC (limites haute/basse pour distinguer variation normale vs anormale), Pareto des causes, diagrammes Sankey (type de danger → type d'incident → type de blessure → partie du corps), sunburst/treemap pour decomposition hierarchique.

---

### 5.3 UX des formulaires et checklists

#### Templates d'inspection

Bibliotheque pre-construite par exigence reglementaire (Code du travail gabonais, ISO), type d'inspection (echafaudage, fouille, electrique, incendie, proprete), type d'equipement (grue, chariot, pompe a beton).

**Constructeur de templates** drag-and-drop avec : types de questions (oui/non, choix multiple, numerique, texte, photo, signature, date, code-barres), sections et groupement, scoring/ponderation, champs obligatoires vs optionnels, texte d'instruction et images de reference, **versionnement des templates**.

#### Logique conditionnelle

Skip logic (si reponse a Q1 = "Non", passer Q2-Q5), show/hide, champs calcules (score de risque auto), branchement, regles de validation (nombre de travailleurs exposes ne peut etre negatif, date d'incident ne peut etre dans le futur).

#### Capture photo inline

Camera lancee directement dans le formulaire, photos obligatoires pour certaines conditions (toute NC doit avoir une photo), annotation (fleches, cercles, labels, couleurs), appariement avant/apres pour les CAPA, **metadonnees automatiques** (GPS, timestamp, identite de l'inspecteur).

#### Scoring

Ponderation differenciee par item, scores par section et score global, seuils de reussite/echec (tout item critique en echec = echec global), tendance des scores dans le temps par actif/lieu/sous-traitant, benchmarking entre projets.

---

### 5.4 Systeme de notifications et alertes

#### Escalade temporelle

| Delai | Niveau |
|-------|--------|
| 0-24h | Superviseur direct |
| 24-48h | Responsable HSE site |
| 48-72h | Directeur de projet |
| 72h+ | Directeur HSE regional/pays |

Escalade par severite : incidents critiques → notification immediate direction senior.

#### Push notifications pour evenements critiques

Incidents graves (deces, hospitalisation), deversements environnementaux, arrets de chantier reglementaires, alertes meteo extremes, depassements de seuils capteurs.

#### **SMS fallback — critique pour le Gabon**

Quand le push ne peut pas etre delivre (pas d'internet), fallback SMS pour communications critiques. Signalement basique par SMS structure possible. **USSD** pour telephones basiques (menus pour signaler un incident, confirmer presence a une causerie). Fournisseurs : **Africa's Talking** (Kenya, fort en Afrique), Twilio, Vonage.

**WhatsApp Business API** : penetration de WhatsApp extremement elevee en Afrique francophone. Utilisation pour notifications et signalement basique via Twilio, MessageBird/Bird, 360dialog.

#### Emails digest

Briefing securite quotidien (synthese de la veille, KPIs cles) chaque matin. Rapport management hebdomadaire. Resume executif mensuel (exportable PDF). Contenu personnalise par role et projet.

---

### 5.5 Accessibilite

#### Multilinguisme

Francais (langue officielle, business et administration au Gabon), conscience des langues locales (Fang, Myene, Punu, Nzebi). Architecture i18n : toutes les chaines externalisees dans des fichiers de traduction (comme MIKA le fait deja avec les JSON de locales). Support formats date/heure, nombres, devises.

#### UX pour faible alphabetisation — critique

- **Interfaces pilotees par icones** : casque = securite, camera = photo, coche = inspection, triangle d'avertissement = danger, plus = nouveau rapport, pin = localisation
- **Codage couleur comme communication** : rouge/ambre/vert coherent dans toute l'app
- **Checklists visuelles** : photos de la situation correcte vs incorrecte plutot que des descriptions textuelles
- **Instructions audio** : guidage audio pour formulaires complexes
- **Signalement pictographique** : catalogues visuels de types de dangers (objet tombant, glissade, electrique, chimique...) representes par des pictogrammes clairs
- **Tutoriels video** : 30-60 secondes par fonction, en langues locales

#### Palettes accessibles (daltonisme)

~8% des hommes ont une deficience de la vision des couleurs. Sur un effectif de chantier, plusieurs travailleurs sont statistiquement concernes. Utiliser la palette color-blind safe IBM ou Wong (Nature Methods, 2011). Toujours doubler couleur + icone + label + pattern. Eviter la juxtaposition rouge/vert pur; preferer rouge/bleu ou orange/bleu. Tester avec Stark (Figma) ou Color Oracle.

**Matrice de risques 5x5 accessible :**
- Extreme : rouge fonce + pattern diagonale + icone crane
- Eleve : orange + pattern points + icone exclamation
- Modere : jaune/ambre + pattern lignes horizontales + icone avertissement
- Faible : bleu-vert + sans pattern + icone info
- Negligeable : bleu clair + sans pattern + icone coche

---

### 5.6 Sources — Axe 5

- Steven Hoober (2013), "How Do Users Really Hold Mobile Devices?", UXmatters
- Scott Hurff, thumb zone research
- Stephen Few (2013), "Information Dashboard Design," 2nd edition
- Ben Shneiderman (1996), Visual Information Seeking Mantra
- Material Design 3 Guidelines (Google) — tailles de cibles tactiles
- Human Interface Guidelines (Apple)
- WCAG 2.1 (W3C) — regles d'accessibilite
- Wong, B. (2011), "Points of view: Color blindness," Nature Methods
- Nielsen Norman Group — recherche UX mobile
- ColorBrewer 2.0 — palettes cartographiques

---

## Observations transverses

### Constats recurrents les plus forts

1. **L'offline-first est le facteur differentiant #1 pour le contexte gabonais.** Toutes les plateformes majeures proposent un mode offline, mais aucune n'est concue pour des jours de deconnexion. C'est le besoin #1 non adresse du marche pour l'Afrique.

2. **Le mobile-first n'est pas optionnel — c'est le point d'entree.** Sur les chantiers gabonais, le smartphone (souvent basique, Android) est le seul device disponible. La tablette est un luxe, le desktop n'existe pas sur le terrain. L'experience desktop doit etre secondaire.

3. **Le processus de declaration AT sous 48h a la CNSS et a l'Inspection du Travail est le flux legal le plus critique.** Aucune plateforme du marche ne le supporte nativement. C'est un quick win majeur de conformite pour MIKA.

4. **La trifecta ISO 45001 + 14001 + 9001 (SMI) est le cadre structurant.** La quasi-totalite des exigences fonctionnelles derivent de ces trois normes. Les normes IFC/Banque Mondiale ajoutent des couches pour les grands projets internationaux.

5. **Les indicateurs avances (leading) sont le futur du QSHE.** L'industrie migre massivement du TF/TG (on mesure l'echec apres coup) vers le taux de signalement des presqu'accidents, la completion des inspections, la conformite des formations. Un module moderne doit mettre ces indicateurs avances au premier plan.

6. **La gestion des permis de travail est digitalement sous-servie.** Seules 2 plateformes (Novade, HammerTech) en font un coeur de metier. C'est un processus quotidien a fort enjeu securite, actuellement 100% papier au Gabon.

### Gaps evidents (opportunites pour MIKA)

1. **Zero conformite reglementaire gabonaise/CEMAC dans les plateformes existantes** — formulaires CNSS, calendriers Inspection du Travail, formats de reporting DGEPN, terminologie juridique gabonaise.

2. **Zero gestion du paludisme/maladies tropicales** dans les modules sante des plateformes occidentales. C'est un enjeu majeur de sante au travail en zone equatoriale.

3. **Zero suivi de la biodiversite tropicale** dans les modules environnementaux. Gabon avec ses 88% de couverture forestiere et ses 13 parcs nationaux a des exigences uniques.

4. **Pas de fallback SMS/USSD/WhatsApp** pour les travailleurs sans smartphone ou sans internet — indispensable en Afrique.

5. **Pas de gestion du stress thermique** comme processus de premier plan. En climat equatorial (Libreville : 27°C moyen, humidite 80%+), c'est un danger quotidien, pas une exception.

6. **Pas de contenu de formation contextualise** pour les pratiques BTP africaines, les materiaux locaux, les risques specifiques (serpents, insectes, pistes forestieres).

### Patterns d'architecture identifies

- **Structure modulaire** : toutes les plateformes entreprise (Quentic, EcoOnline) sont modulaires — l'utilisateur active les modules qu'il veut. Modele a suivre.
- **Template marketplace** : SafetyCulture demontre la puissance d'une bibliotheque de templates partageables. Un module QSHE gabonais devrait embarquer des templates pre-construits pour chaque type d'inspection specifique au BTP local.
- **CAPA comme liant transversal** : le workflow d'actions correctives/preventives est le fil rouge qui traverse tous les sous-modules (incidents, inspections, audits, NC). C'est un composant commun a factoriser.
- **L'IA comme couche d'intelligence au-dessus des donnees** : l'integration Claude/Anthropic existante dans MIKA est un atout majeur. L'IA peut analyser les rapports d'incidents (NLP), predire les risques, assister l'investigation des causes racines, generer des rapports — c'est un differenciateur reel face aux plateformes sans IA.

### Points de vigilance

- **La complexite est l'ennemi de l'adoption.** Les plateformes trop riches (Procore, Quentic) ont des courbes d'apprentissage raides. Pour le contexte gabonais, l'UX doit etre radicalement simple pour les travailleurs de terrain, avec la complexite reservee aux managers et HSE.
- **Le cout est un frein majeur en Afrique.** Les solutions entreprise (EUR 10K-100K+/an) sont hors de portee des PME gabonaises. Le modele freemium/low-cost (EUR 10-25/utilisateur/mois) de SafetyCulture/Kizeo est le bon repere.
- **La gamification est a double tranchant.** Elle peut augmenter les signalements de 30-50% mais aussi creer des effets pervers (signalements bidons pour scorer, pression a ne pas declarer les vrais incidents). A utiliser avec prudence et design rigoureux.
- **Les wearables et IoT sont prematures pour le marche gabonais** a court terme (cout, infrastructure, maintenance). A integrer dans la vision long terme mais pas en P0/P1.

---

*Rapport compile le 2026-04-21. Aucune recommandation d'implementation a ce stade — rapport de matiere brute pour informer les phases 2 et 3.*
