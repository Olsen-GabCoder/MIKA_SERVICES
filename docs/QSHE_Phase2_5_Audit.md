# QSHE Module — Phase 2.5 : Audit critique de l'existant

**Projet** : MIKA Services
**Date** : 2026-04-21
**Objectif** : Audit honnete des modules Securite et Qualite existants + proposition de remise a plat de la sidebar QSHE

---

## Partie A — Audit du module Securite existant

### A.1 Inventaire precis

**Backend — 3 entities, 1 service, 1 controller, 3 repositories, 1 mapper, 5 enums**

| Entity | Champs | Relations |
|--------|--------|-----------|
| **Incident** | reference (INC-00001), titre, description, typeIncident, gravite, statut, dateIncident, heureIncident, lieu, nbBlesses, arretTravail, nbJoursArret, causeIdentifiee, mesuresImmediates, analyseCause | ManyToOne Projet, ManyToOne User (declarePar), OneToMany ActionPrevention |
| **Risque** | titre, description, niveau, probabilite (Int?), impact (Int?), zoneConcernee, mesuresPrevention, actif | ManyToOne Projet |
| **ActionPrevention** | titre, description, statut, dateEcheance, dateRealisation, commentaireVerification | ManyToOne Incident (optionnel), ManyToOne User (responsable) |

**Enums :**
- `TypeIncident` : ACCIDENT_TRAVAIL, PRESQU_ACCIDENT, INCIDENT_MATERIEL, INCIDENT_ENVIRONNEMENTAL, CHUTE, ELECTROCUTION, EFFONDREMENT, INCENDIE, AUTRE
- `GraviteIncident` : BENIN, LEGER, GRAVE, TRES_GRAVE, MORTEL
- `StatutIncident` : DECLARE, EN_INVESTIGATION, ANALYSE, ACTIONS_EN_COURS, CLOTURE
- `NiveauRisque` : FAIBLE, MOYEN, ELEVE, CRITIQUE
- `StatutActionPrevention` : PLANIFIEE, EN_COURS, REALISEE, VERIFIEE, ANNULEE

**Frontend — SecuritePage.tsx :**
- Selecteur de projet (dropdown)
- 4 KPI cards (total incidents, incidents graves, risques critiques, jours d'arret)
- 2 onglets : Incidents | Risques
- Liste d'incidents avec badges statut/gravite/type, dropdown de changement de statut, bouton supprimer
- Liste de risques avec badge niveau, zone, actif/inactif, bouton supprimer
- 2 modales de creation (incident : titre/type/gravite/date/lieu/description ; risque : titre/niveau/zone/description)

**Sidebar** : `sidebar.securite` → "Securite & Prevention" avec ShieldIcon, route `/securite`

**i18n** : `fr/securite.json` + `en/securite.json` complets (pageTitle, statuts, gravites, types, niveaux, labels de formulaire)

---

### A.2 Analyse qualite du modele de donnees

#### Entity Incident — Analyse champ par champ

**Ce qui est present et correct :**
- `reference` (unique, auto-generee) — bon
- `titre`, `description` — bon
- `typeIncident` avec AT et presqu'accident — bon
- `gravite` avec echelle 5 niveaux incluant MORTEL — bon
- `statut` avec workflow 5 etapes — acceptable
- `dateIncident`, `heureIncident` — bon
- `lieu` (String libre) — fonctionnel mais pas structure
- `declarePar` (User) — bon
- `nbBlesses`, `arretTravail`, `nbJoursArret` — bon pour le calcul TF/TG
- `causeIdentifiee`, `mesuresImmediates`, `analyseCause` — champs texte libre

**Ce qui manque pour la conformite CNSS gabonaise (declaration 48h) :**

| Champ manquant | Obligatoire CNSS | Impact |
|----------------|-----------------|--------|
| Identite complete de la victime (matricule, poste, age, anciennete, type contrat) | Oui | Critique — sans ca, le formulaire CNSS ne peut pas etre pre-rempli |
| Partie du corps atteinte (body map) | Oui | Critique — exige par le CMI |
| Nature de la lesion (fracture, brulure, laceration...) | Oui | Critique |
| Activite en cours au moment de l'AT | Oui | Critique |
| Temoins (noms, depositions) | Oui | Critique |
| Entreprise du travailleur (titulaire vs sous-traitant) | Oui | Critique pour les chantiers multi-entreprises |
| Date/heure de declaration (pas que de l'incident) | Oui | Critique — pour verifier le delai 48h |
| Equipements/outils impliques | Non mais utile | Moyen |
| Certificat medical (CMI) attache | Oui | Critique — document obligatoire |
| Statut declaration CNSS (declaree/en attente/hors delai) | Non natif | Critique pour le suivi |
| Photos/pieces jointes | Non CNSS mais ISO 45001 | Eleve |

**Verdict : le modele Incident capture ~40% des donnees exigees pour une declaration AT au Gabon.** Les champs les plus critiques (identite victime, partie du corps, nature de la lesion, temoins, activite en cours, sous-traitant) sont absents.

**Peut-on reconstituer un arbre des causes ?** Non. Les champs `causeIdentifiee` et `analyseCause` sont des textes libres, pas une structure de donnees permettant de construire un arbre (noeuds, relations causales, categories). On ne peut pas non plus faire de 5 Pourquoi structure (il faudrait 5 champs "pourquoi" en cascade) ni d'Ishikawa (il faudrait 6 categories avec des listes de causes par categorie).

**Peut-on distinguer AT / presqu'accident / incident environnemental ?** Oui, via `TypeIncident`. Mais le modele est le meme pour tous ces types, alors que leurs donnees a capturer sont fondamentalement differentes :
- Un AT exige des infos sur la victime, la lesion, l'arret de travail
- Un presqu'accident n'a pas de victime mais devrait capturer les conditions qui auraient pu mener a un accident
- Un incident environnemental devrait capturer le type de pollution, le milieu affecte, les quantites deverses

Utiliser la meme entity pour les trois est une simplification qui empeche une saisie adaptee par type.

#### Entity Risque — Analyse

**Ce qui est present :**
- `titre`, `description`, `niveau` (4 niveaux) — bon
- `probabilite`, `impact` (Int?, echelle non specifiee) — problematique
- `zoneConcernee`, `mesuresPrevention` (texte libre) — basique
- `actif` (boolean) — bon

**Problemes :**

1. **La matrice probabilite x impact n'est pas modelisee correctement.** `probabilite` et `impact` sont des `Int?` optionnels sans echelle definie. Il n'y a pas de calcul automatique du `niveau` a partir de `probabilite x impact`. Le `niveau` est saisi manuellement, ce qui cree un risque d'incoherence (quelqu'un pourrait mettre probabilite=1, impact=1, niveau=CRITIQUE).

2. **Pas de risque residuel.** ISO 45001 et INRS exigent d'evaluer le risque brut (avant mesures), les mesures de controle, puis le risque residuel (apres mesures). Le modele actuel n'a qu'un seul niveau, sans distinction brut/residuel.

3. **Pas de hierarchie des mesures de controle.** `mesuresPrevention` est un champ texte libre. Il devrait etre structure selon la hierarchie : elimination → substitution → controles techniques → controles administratifs → EPI.

4. **Pas de lien risque ↔ incident.** Un risque qui se materialise devrait pouvoir etre relie a l'incident resultant. Actuellement, Risque et Incident sont lies au Projet mais pas entre eux.

5. **Pas d'unite de travail.** Le DUERP/EvRP exige une organisation par unite de travail (metier/activite). Le modele a une `zoneConcernee` (texte libre) mais pas une reference structuree a un metier, une phase de chantier, ou un sous-projet.

**Verdict : le modele Risque est un formulaire de saisie basique, pas un outil d'evaluation des risques professionnels.** Il ne supporte ni le DUERP, ni la methodologie INRS, ni ISO 45001 clause 6.1.2.

#### Entity ActionPrevention — Analyse

**Ce qui est present :**
- `titre`, `description`, `statut` (5 etats), `dateEcheance`, `dateRealisation`, `commentaireVerification` — basique
- Lien optionnel a un Incident — bon (permet des actions standalone)
- Responsable (User) — bon

**Problemes :**

1. **Pas de distinction correction / action corrective / action preventive.** En ISO 45001/9001, ce sont trois choses differentes :
   - **Correction** : action immediate pour eliminer la non-conformite (ex: remettre le garde-corps)
   - **Action corrective** : action pour eliminer la cause racine (ex: former les monteurs d'echafaudage)
   - **Action preventive** : action pour empecher l'occurrence dans d'autres contextes (ex: modifier la procedure pour tous les chantiers)
   Le modele actuel melange les trois sous le terme "prevention" — ce qui est conceptuellement faux. Une action post-incident n'est pas de la "prevention" mais de la "correction" ou de l'"action corrective".

2. **Pas de suivi d'efficacite.** Le statut `VERIFIEE` existe mais il n'y a pas de champ pour documenter si l'action a ete efficace (l'incident ne s'est-il pas reproduit ? le risque a-t-il diminue ?). ISO 45001 10.2 exige une verification d'efficacite.

3. **Pas de priorite.** Toutes les actions ont le meme poids. Il manque un champ priorite (urgente, haute, normale, basse).

4. **Pas de lien avec les risques.** Une action devrait pouvoir etre generee depuis un risque (mesure de reduction), pas seulement depuis un incident.

**Verdict : ActionPrevention est mal nommee et conceptuellement incomplete.** C'est un tracker de taches basique, pas un module CAPA conforme ISO.

#### Relations entre entities

```
Projet ←── Incident (FK projet_id)
              └── ActionPrevention (FK incident_id, optionnel)
Projet ←── Risque (FK projet_id)
```

**Probleme : Risque et Incident ne sont pas lies.** Un risque qui se materialise en incident ne peut pas etre trace. L'ActionPrevention n'est pas liee au Risque non plus. Il est impossible de mesurer l'impact des actions de prevention sur le niveau de risque.

---

### A.3 Analyse du naming "Prevention"

**Sidebar** : "Securite & Prevention"
**Page title** : "Securite & Prevention"
**Subtitle** : "Incidents, risques et actions de prevention"

**Ce qui est reellement dans la section :**
- Gestion des incidents (declaration, investigation, cloture) — c'est de la **reaction**, pas de la prevention
- Gestion des risques (identification, evaluation) — c'est de l'**evaluation de risques**, un volet de la prevention mais pas "la prevention" en soi
- Actions de prevention — ce sont en realite des **actions correctives post-incident**, nommees "prevention" par abus de langage

**Verdict : le terme "Prevention" est trompeur.** Il suggere une section proactive (formation, sensibilisation, audits preventifs, plans de prevention) alors qu'elle contient principalement des outils reactifs (incidents) et un registre de risques basique. Un utilisateur ISO 45001 qui cherche les "Plans de prevention" ou les "Causeries securite" ne les trouvera pas ici.

Le terme correct serait "Securite au travail" ou simplement "Securite" (SST).

---

### A.4 Analyse UX

**Desktop vs mobile :** la page est un ecran CRUD classique desktop. Les modales, les dropdowns, et les tableaux sont utilisables sur desktop mais pas optimises pour le mobile :
- Pas de layout responsive specifique pour les KPI cards sur petit ecran (grid-cols-2 md:grid-cols-4 est un debut)
- Les modales utilisent `max-w-lg mx-4` — correct sur mobile mais les formulaires avec grid-cols-2 se tassent
- Pas de vue "carte" mobile pour les listes (juste des `div` empilees)
- Pas de gestes mobiles (swipe, pull-to-refresh)
- Le selecteur de projet est un `<select>` natif — correct sur mobile mais pas optimal pour beaucoup de projets

**Saisie rapide :** le formulaire de declaration d'incident demande 6 champs dont 3 obligatoires (titre, type, date). C'est trop pour une saisie terrain rapide. L'objectif Phase 1 est 3-4 taps max.

**Escalade :** aucun mecanisme d'escalade. La creation d'un incident ne declenche aucune notification, aucun email, aucune alerte a la chaine hierarchique. Le service `SecuriteService.createIncident()` fait un simple `save()` sans appeler `NotificationService`.

**Photos :** pas de capture photo dans le formulaire d'incident. Le champ n'existe ni dans l'entity ni dans le formulaire.

**Verdict UX : ecran CRUD fonctionnel mais loin des attentes Phase 1** (mobile-first, saisie 3-4 taps, escalade automatique, photo, offline).

---

### A.5 Verdict par composant

| Composant | Verdict | Justification |
|-----------|---------|---------------|
| **Entity Incident** | **Refondre** | Ne couvre que ~40% des donnees CNSS. Pas de structure pour investigation (arbre des causes). Pas de distinction de saisie par type d'evenement. Pas de photos. Pas de temoins. |
| **Entity Risque** | **Refondre** | Matrice prob x impact non modelisee correctement. Pas de risque residuel. Pas de lien avec incidents. Pas d'unite de travail. Non conforme DUERP/ISO 45001. |
| **Entity ActionPrevention** | **Refondre** | Mal nommee (ce n'est pas de la prevention). Pas de distinction CAPA. Pas de suivi d'efficacite. Pas de priorite. Pas de lien avec Risque. |
| **Enums TypeIncident** | **Garder avec ajustements** | Les types de base sont bons (AT, presqu'accident, environnemental). Ajouter : MALADIE_PROFESSIONNELLE, ATTEINTE_SANTE (stress thermique, paludisme). Supprimer les doublons type/cause : CHUTE, ELECTROCUTION, EFFONDREMENT, INCENDIE sont des **causes**, pas des **types** d'incident — ils devraient etre dans un champ `cause` separe. |
| **Enums GraviteIncident** | **Garder tel quel** | L'echelle 5 niveaux incluant MORTEL est standard. |
| **Enums StatutIncident** | **Garder avec ajustements** | Ajouter un statut pour la declaration CNSS. |
| **Enums NiveauRisque** | **Garder tel quel** | Standard 4 niveaux. |
| **Enums StatutActionPrevention** | **Garder tel quel** | Correct. |
| **SecuriteController** | **Garder** | REST CRUD classique, conforme aux conventions du projet. Les routes changeront avec le renommage du module. |
| **SecuriteService** | **Garder avec ajustements** | Ajouter notifications, enrichir la logique metier. |
| **SecuritePage.tsx** | **Refondre** | Ne sera pas la bonne UX pour le QSHE cible (besoin de sous-pages, mobile-first, photos, checklists). Le pattern KPI cards + liste est reutilisable comme base. |
| **i18n securite.json** | **Garder avec ajustements** | Les traductions de base sont bonnes, les cles de namespace changeront avec la restructuration. |

---

## Partie B — Audit du module Qualite existant

### B.1 Inventaire precis

**Backend — 2 entities, 1 service, 1 controller, 2 repositories, 1 mapper, 4 enums**

| Entity | Champs | Relations |
|--------|--------|-----------|
| **ControleQualite** | reference (CQ-TYPE-0001), titre, description, typeControle, statut, inspecteur, datePlanifiee, dateRealisation, zoneControlee, criteresVerification, observations, noteGlobale (0-100) | ManyToOne Projet, ManyToOne User (inspecteur), OneToMany NonConformite |
| **NonConformite** | reference (NC-00001), titre, description, gravite, statut, responsableTraitement, causeIdentifiee, actionCorrective, dateDetection, dateEcheanceCorrection, dateCloture, preuveCorrection | ManyToOne ControleQualite, ManyToOne User (responsableTraitement) |

**Frontend — QualitePage.tsx :** selecteur projet, KPI cards (total controles, taux conformite, non conformes, NC ouvertes), repartition NC par gravite, alerte NC en retard, filtres par statut, liste paginee des controles, modale creation, badges colores.

**Sidebar** : `sidebar.qualite` → "Qualite & Conformite" avec QualiteIcon (checkmark circle), route `/qualite`

---

### B.2 Analyse qualite du modele de donnees

#### Entity ControleQualite — Analyse

**Les 8 types de controle :**

| Type | Pertinence BTP | Couverture |
|------|---------------|-----------|
| RECEPTION_MATERIAUX | Oui, essentiel | Correct |
| EN_COURS_EXECUTION | Oui, essentiel | Correct |
| OUVRAGE_TERMINE | Oui, essentiel | Correct |
| SECURITE | **Doublon conceptuel** | Ce type cree un chevauchement avec le module Securite. Un "controle securite" releve du module Securite (inspections), pas de la Qualite. |
| ENVIRONNEMENTAL | **Doublon conceptuel** | Idem — un controle environnemental releve du pilier Environnement, pas de la Qualite. |
| DOCUMENTAIRE | Oui, pertinent | Correct (audit de documentation) |
| AUDIT_INTERNE | Oui, ISO 9001/45001/14001 | Correct mais devrait etre transversal QSHE, pas uniquement "qualite" |
| AUDIT_EXTERNE | Oui | Idem — transversal |

**Probleme majeur : les types SECURITE et ENVIRONNEMENTAL dans le module Qualite creent des doublons conceptuels.** Un responsable QSHE ne sait pas s'il doit creer un controle securite ici (Qualite) ou une inspection dans le module Securite. Les audits internes/externes devraient etre transversaux a QSHE, pas limites au pilier Qualite.

**Le modele ne permet pas de lier un controle a :**
- Un lot/ouvrage specifique (seulement une `zoneControlee` texte libre)
- Une phase de chantier
- Un sous-projet
- Un plan/dessin (localisation sur plan)
- Un fournisseur/sous-traitant (pour les controles reception)

**Pas de checklist configurable.** Le champ `criteresVerification` est un texte libre, pas une liste de points de controle avec resultats individuels (conforme/non conforme par item). Un vrai controle qualite BTP a 10-50 points de verification, chacun avec son resultat. Le modele actuel ne permet pas ca.

**`noteGlobale` (Int, 0-100) :** utile mais deconnectee des items de controle individuels. Sans checklist, cette note est subjective.

#### Entity NonConformite — Analyse

**Ce qui fonctionne :**
- Workflow OUVERTE → EN_TRAITEMENT → ACTION_CORRECTIVE → VERIFIEE → CLOTUREE — bon, conforme aux bonnes pratiques
- Lien avec ControleQualite — correct, on sait quel controle a detecte la NC
- `responsableTraitement`, `dateEcheanceCorrection`, `dateCloture` — bon
- `causeIdentifiee`, `actionCorrective`, `preuveCorrection` — basique mais present

**Ce qui manque :**

| Element manquant | Importance |
|-----------------|-----------|
| Decision de traitement (reparer / rebuter / accepter en l'etat / deroger) | Critique — exige par ISO 9001 8.7 |
| Cout de la reprise | Important pour le reporting (cout de la non-qualite) |
| Photos avant/apres | Important pour la preuve |
| Localisation sur plan (coordonnees, etage, zone) | Important pour les reserves/punchlist |
| Lien avec sous-traitant responsable | Important pour l'evaluation des sous-traitants |
| Action preventive (distincte de l'action corrective) | Exige par ISO 9001 10.2 |
| Classification du defaut (execution, materiaux, conception) | Important pour l'analyse Pareto |
| Gravite BLOQUANTE existe dans l'enum mais pas de mecanisme de blocage | Le terme existe mais ne declenche rien de special |

**Reserves / Punchlist :** pas de concept de reserve dans le modele. Les reserves de reception sont un processus distinct des NC en cours d'execution. Il faudrait un sous-type ou un flag pour distinguer les NC d'execution des reserves de reception.

**Verdict : le modele NonConformite est fonctionnel pour un usage basique mais incomplet pour un usage conforme ISO 9001.** La decision de traitement (8.7) et l'action preventive (10.2) sont des exigences normatives manquantes.

---

### B.3 Analyse du naming "Conformite"

**Sidebar** : "Qualite & Conformite"
**Page title** : "Qualite & Conformite"
**Subtitle** : "Controles qualite et suivi des non-conformites"

**Ce qui est reellement dans la section :**
- Gestion des controles qualite (planification, realisation, notation) — c'est du **controle qualite**, pas de la "conformite"
- Gestion des non-conformites (detection, traitement, cloture) — c'est de la **gestion des NC**, un sous-processus de la qualite

**Analyse :** "Conformite" dans le contexte QSHE designe habituellement la **conformite reglementaire** — le suivi des exigences legales applicables, la veille reglementaire, les audits de conformite legale. C'est ce qu'exige ISO 45001 clause 6.1.3 et ISO 14001 clause 6.1.3.

Or la section actuelle ne contient aucune fonctionnalite de conformite reglementaire. Elle contient des controles qualite (inspection) et des NC. Le terme "Conformite" est donc **trompeur** — il suggere un module de veille reglementaire qui n'existe pas.

Le terme correct serait simplement "Qualite" ou "Controle qualite".

---

### B.4 Analyse UX

Memes constats que le module Securite :
- Ecran CRUD desktop classique
- Pas d'optimisation mobile-first
- Pas de capture photo
- Pas de checklist interactive (le coeur d'un controle qualite)
- Pas de localisation sur plan
- La creation d'une NC ne declenche aucune notification

La liste des controles est paginee (contrairement aux incidents qui ne le sont pas cote UI) — c'est un bon point.

L'alerte NC en retard (banniere rouge, max 5) est un bon pattern UX reutilisable.

---

### B.5 Verdict par composant

| Composant | Verdict | Justification |
|-----------|---------|---------------|
| **Entity ControleQualite** | **Garder avec ajustements majeurs** | Le modele de base est correct (reference, type, statut, inspecteur, date, note). Mais il faut : ajouter le lien SousProjet, retirer les types SECURITE/ENVIRONNEMENTAL (doublons), ajouter un systeme de checklist (OneToMany ItemControle). |
| **Entity NonConformite** | **Garder avec ajustements** | Le workflow est bon. Ajouter : decision de traitement (enum), cout de reprise, photos, lien sous-traitant, type de defaut. |
| **Enums TypeControle** | **Refondre** | Retirer SECURITE et ENVIRONNEMENTAL (doublons). Restructurer les types restants pour le BTP (AUTOCONTROLE, CONTROLE_EXTERIEUR, ESSAI_LABORATOIRE a ajouter). |
| **Enums StatutControleQualite** | **Garder avec ajustements** | CONFORME/NON_CONFORME sont des resultats, pas des statuts. Separer statut (PLANIFIE/EN_COURS/REALISE/ANNULE) et resultat (CONFORME/NON_CONFORME/AVEC_RESERVES). |
| **Enums GraviteNonConformite** | **Garder tel quel** | Les 4 niveaux (MINEURE, MAJEURE, CRITIQUE, BLOQUANTE) sont standards. |
| **Enums StatutNonConformite** | **Garder tel quel** | Le workflow 5 etats est bon et conforme aux pratiques CAPA. |
| **QualiteController** | **Garder** | REST CRUD standard, conventions respectees. |
| **QualiteService** | **Garder avec ajustements** | Enrichir avec notifications, calcul auto des statistiques. |
| **QualitePage.tsx** | **Refondre** | Meme raison que SecuritePage — besoin de checklists interactives, photos, localisation sur plan. Le pattern KPI + filtres + liste paginee est reutilisable. |
| **i18n qualite.json** | **Garder avec ajustements** | Renommer "Conformite" en "Qualite", ajuster les cles. |

---

## Partie C — Orphelins et doublons

### C.1 Fonctionnalites QSHE hors modules Securite/Qualite

| Localisation | Element | Nature | Statut |
|-------------|---------|--------|--------|
| `modules/chantier/entity/ZoneChantier.kt` | Champ `niveauDanger: NiveauDanger` | Niveau de danger par zone de chantier | **Actif, coherent** — pas un doublon, c'est un attribut de zone qui complemente le module Risque |
| `common/enums/NiveauDanger.kt` | FAIBLE, MOYEN, ELEVE, TRES_ELEVE | 4 niveaux de danger | **Doublon potentiel** avec `NiveauRisque` (FAIBLE, MOYEN, ELEVE, CRITIQUE). Deux enums pour le meme concept avec des valeurs legerement differentes (TRES_ELEVE vs CRITIQUE). A unifier. |
| `modules/chantier/entity/MembreEquipe.kt` | `RoleDansEquipe` avec RESPONSABLE_SECURITE, RESPONSABLE_QUALITE, RESPONSABLE_ENVIRONNEMENT | Roles QSHE dans les equipes | **Actif, important** — point d'ancrage pour les responsabilites QSHE |
| `modules/reporting/` | `SecuriteStats`, `QualiteStats` dans ReportingResponses + methodes `getProjetSecuriteStats()`, `getGlobalQualiteStats()` | Agregation de KPIs securite/qualite pour le dashboard global | **Actif, coherent** — consomme les repositories securite/qualite |
| `modules/communication/` | `TypeNotification.INCIDENT`, `TypeNotification.NON_CONFORMITE` | Types de notification declares | **Declares mais non utilises** — les services securite/qualite ne creent aucune notification. C'est du code mort infrastructure. |
| `config/database/SeedDataInitializer.kt` | Fonctions `initIncidents()`, `initRisques()`, `initControlesQualite()` | Donnees de test | **Actif** — seed data de dev uniquement |

### C.2 Doublons identifies

| Doublon | Localisation 1 | Localisation 2 | Resolution recommandee |
|---------|---------------|----------------|----------------------|
| **NiveauDanger vs NiveauRisque** | `NiveauDanger` (FAIBLE, MOYEN, ELEVE, TRES_ELEVE) | `NiveauRisque` (FAIBLE, MOYEN, ELEVE, CRITIQUE) | Unifier en un seul enum `NiveauRisque` avec 4 ou 5 niveaux. Migrer ZoneChantier vers cet enum. |
| **TypeControle.SECURITE vs module Securite** | `TypeControle.SECURITE` (qualite) | Module securite entier (inspections = incidents + risques) | Retirer `SECURITE` de TypeControle. Les inspections securite relevent du pilier Securite, pas Qualite. |
| **TypeControle.ENVIRONNEMENTAL vs futur module Environnement** | `TypeControle.ENVIRONNEMENTAL` (qualite) | Module environnement a creer | Retirer `ENVIRONNEMENTAL` de TypeControle. Les controles environnementaux relevent du pilier Environnement. |

### C.3 Code mort

| Element | Localisation | Nature |
|---------|-------------|--------|
| `TypeNotification.INCIDENT` | Enum defini mais `SecuriteService.createIncident()` n'appelle jamais `NotificationService` | Infrastructure preparee mais non cablée |
| `TypeNotification.NON_CONFORMITE` | Enum defini mais `QualiteService.createNonConformite()` n'appelle jamais `NotificationService` | Idem |

---

## Partie D — Proposition de sidebar QSHE restructuree

### D.1 Structure cible

La sidebar actuelle a 2 entrees plates :
```
Qualite & Conformite    (QualiteIcon)
Securite & Prevention   (ShieldIcon)
```

Structure cible proposee — **un groupe QSHE avec sous-navigation** :

```
QSHE                              (icone QSHE composite)
├── Tableau de bord QSHE          (vue d'ensemble, KPIs transversaux TF/TG/NC)
├── Securite                      (pilier S)
│   ├── Incidents & AT            (declaration, investigation, suivi)
│   ├── Inspections securite      (checklists terrain)
│   ├── Permis de travail         (feu, espace confine, hauteur, fouille)
│   └── Causeries securite        (toolbox talks + presence)
├── Qualite                       (pilier Q)
│   ├── Controles qualite         (PIE/ITP, inspections, audits)
│   ├── Non-conformites           (NC + reserves/punchlist)
│   └── Audits                    (internes + externes, ISO)
├── Sante au travail              (pilier H)
│   ├── Suivi medical             (aptitudes, visites medicales)
│   ├── Formations & habilitations (CACES, electrique, hauteur, SST)
│   └── EPI                       (dotation, stock, expiration)
├── Environnement                 (pilier E)
│   ├── Suivi environnemental     (mesures, dechets, PGES)
│   ├── Produits chimiques (FDS)  (inventaire, fiches de securite)
│   └── Incidents environnementaux (deversements, pollutions)
├── Risques                       (transversal Q+S+H+E)
│   └── Evaluation des risques    (DUERP, matrices, risques par activite)
└── Actions correctives (CAPA)    (transversal Q+S+H+E)
    └── Suivi des actions         (correctives, preventives, verification)
```

### D.2 Mapping existant → structure cible

| Element existant | Atterrit dans | Transformation |
|-----------------|--------------|----------------|
| Entity `Incident` | Securite > Incidents & AT | Enrichir le modele (champs CNSS, temoins, photos, investigation structuree). Separer les `INCIDENT_ENVIRONNEMENTAL` vers Environnement > Incidents environnementaux. |
| Entity `Risque` | Risques > Evaluation des risques | Refondre le modele (matrice correcte, brut/residuel, unite de travail, lien incidents). |
| Entity `ActionPrevention` | Actions correctives (CAPA) | Renommer, ajouter distinction correction/corrective/preventive, priorite, suivi d'efficacite. Rendre transversal (lie a incidents ET NC ET risques ET inspections). |
| Entity `ControleQualite` | Qualite > Controles qualite | Retirer types SECURITE/ENVIRONNEMENTAL. Ajouter checklists configurables. Lier a SousProjet. |
| Entity `NonConformite` | Qualite > Non-conformites | Ajouter decision de traitement, cout de reprise, photos, lien sous-traitant. |
| Enum `TypeIncident` | Securite > Incidents | Nettoyer : retirer les causes (CHUTE, ELECTROCUTION...) du type, les mettre dans un champ `cause` dedie. |
| Enum `TypeControle` | Qualite > Controles | Retirer SECURITE et ENVIRONNEMENTAL. Ajouter AUTOCONTROLE, CONTROLE_EXTERIEUR, ESSAI_LABORATOIRE. |
| `SecuriteSummary` (KPIs) | Tableau de bord QSHE | Enrichir avec TF, TG, heures travaillees, compteur sans AT. |
| `QualiteSummary` (KPIs) | Tableau de bord QSHE | Fusionner dans le dashboard transversal. |
| `NiveauDanger` (ZoneChantier) | Risques | Unifier avec `NiveauRisque`. |
| `TypeNotification.INCIDENT` | Securite > Incidents | Cabler reellement dans le service (notification a la creation). |
| `TypeNotification.NON_CONFORMITE` | Qualite > NC | Idem. |
| Roles `RESPONSABLE_SECURITE/QUALITE/ENVIRONNEMENT` (MembreEquipe) | Transversal | Garder tels quels, les utiliser pour le routage des notifications et l'assignation automatique. |

### D.3 Ce qui disparait

| Element | Raison | Redistribution |
|---------|--------|---------------|
| **Label "Prevention"** | Trompeur. Le contenu n'est pas preventif. | Le contenu (actions post-incident) va dans CAPA. La prevention reelle (causeries, inspections, formations) aura ses propres sous-modules. |
| **Label "Conformite"** | Trompeur. Aucune fonctionnalite de conformite reglementaire. | Le contenu (controles + NC) reste dans "Qualite". La vraie conformite reglementaire (veille legale, registre de conformite) pourra etre ajoutee ulterieurement. |
| **TypeControle.SECURITE** | Doublon avec le module Securite | Les inspections securite auront leur propre sous-module dans le pilier Securite. |
| **TypeControle.ENVIRONNEMENTAL** | Doublon avec le futur pilier Environnement | Les controles environnementaux auront leur propre sous-module dans le pilier Environnement. |
| **NiveauDanger (enum separe)** | Doublon de NiveauRisque | Unifie dans NiveauRisque. |

### D.4 Migration douce

**Hypothese :** les modules Securite et Qualite sont en production ou en pre-production avec des donnees reelles potentielles.

**Strategie de migration :**

1. **Routes URL** : rediriger `/securite` → `/qshe/securite/incidents` et `/qualite` → `/qshe/qualite/controles` via React Router redirect. L'ancienne URL continue de fonctionner.

2. **Endpoints API** : garder les anciens endpoints (`/securite/incidents`, `/qualite/controles`) operationnels en parallele des nouveaux (`/qshe/securite/incidents`, `/qshe/qualite/controles`). Deprecier les anciens apres migration complete. Ou plus simple : ne pas changer les endpoints backend et ne modifier que la structure frontend/sidebar.

3. **Tables DB** : aucune migration de table necessaire si on enrichit les entities existantes (ajout de colonnes). Les nouvelles entities (Causerie, PermisTravel, EPI, etc.) creent de nouvelles tables.

4. **Renommage sidebar** : changement de libelles i18n uniquement. "Securite & Prevention" → "Securite" dans le groupe QSHE. "Qualite & Conformite" → "Qualite" dans le groupe QSHE.

5. **Enum cleanup** : retirer `TypeControle.SECURITE` et `TypeControle.ENVIRONNEMENTAL` en base. Si des `ControleQualite` existent avec ces types, les migrer vers le module correspondant (migration SQL one-shot).

**Risque de migration :** faible si on procede par enrichissement progressif plutot que par remplacement brutal.

---

## Partie E — Bilan final

### E.1 Strategie emergente pour la Phase 3

**Mix : enrichir les fondations existantes + construire les nouveaux modules.**

L'existant n'est pas "conceptuellement faux" — il est **conceptuellement incomplet et mal nomme**. Les entities Incident, ControleQualite, et NonConformite sont des fondations utilisables. Elles suivent les bonnes conventions du projet (BaseEntity, CRUD standard, i18n, Redux). Le probleme est qu'elles sont :
- Insuffisamment detaillees (champs manquants)
- Mal nommees (Prevention, Conformite)
- Deconnectees entre elles (pas de CAPA transversal)
- Sans les processus metier critiques (investigation, checklists, permis, etc.)

**Approche recommandee :**

1. **Phase 3a — Restructuration** : reorganiser la sidebar, renommer, nettoyer les enums, unifier NiveauDanger/NiveauRisque, cabler les notifications. Pas de nouveau module — juste la mise en ordre de l'existant.

2. **Phase 3b — Enrichissement** : ajouter les champs manquants aux entities existantes (Incident : champs CNSS, photos, temoins ; NonConformite : decision de traitement, photos ; Risque : brut/residuel). Construire le module CAPA transversal.

3. **Phase 3c+ — Nouveaux modules** : construire sequentiellement les sous-modules manquants (inspections avec checklists, permis de travail, causeries, EPI, habilitations, FDS, environnement, KPIs avances, reporting).

### E.2 Cout estime du refactoring

**Petit a moyen** en proportion du chantier QSHE complet.

- Le renommage (sidebar, i18n, routes) est trivial
- Le nettoyage des enums (TypeControle, TypeIncident, NiveauDanger) est petit
- L'enrichissement des entities existantes (ajout de colonnes) est moyen
- La construction des 10 nouveaux sous-modules est le gros du chantier (80%+ de l'effort)
- Le refactoring de l'existant represente environ **15-20% de l'effort total** du chantier QSHE

### E.3 Risques metier si on garde l'existant tel quel

1. **Non-conformite ISO** : un auditeur ISO 45001 ou 9001 qui ouvre le module verra que le registre d'incidents ne capture pas les donnees exigees par la norme. L'absence de CAPA structure, de suivi d'efficacite, et de risque residuel sont des non-conformites majeures.

2. **Non-conformite legale gabonaise** : l'impossibilite de pre-remplir un formulaire CNSS depuis le registre d'incidents rend le module inutilisable pour la declaration legale obligatoire. Les utilisateurs continueront a utiliser le papier en parallele.

3. **Confusion utilisateur** : "Prevention" et "Conformite" induiront des utilisateurs en erreur sur le contenu des sections. Les types de controle SECURITE et ENVIRONNEMENTAL dans le module Qualite creent une ambiguite sur ou saisir quoi.

4. **Dashboards incoherents** : les KPIs securite et qualite sont calcules separement sans possibilite de vue transversale QSHE. Le TF et le TG ne peuvent pas etre calcules (pas d'heures travaillees).

5. **Perte de credibilite** : un directeur QSHE forme ISO qui voit le module actuel le jugera comme un jouet, pas comme un outil professionnel. L'enrichissement est necessaire pour la credibilite du produit.

### E.4 Trois questions ouvertes pour arbitrage

**Question 1 — Granularite de la sidebar QSHE**

La structure cible proposee en D.1 a 4 piliers + 2 transversaux = 14 sous-pages. C'est beaucoup pour la sidebar. Deux options :

- **(a) Sidebar complete** : afficher les 4 piliers et tous les sous-modules des le debut, meme si certains sont "coming soon". Avantage : l'utilisateur voit la vision complete. Inconvenient : beaucoup d'entrees vides au debut.
- **(b) Sidebar progressive** : afficher uniquement les sous-modules implementes, ajouter les autres au fur et a mesure. Avantage : pas de pages vides. Inconvenient : la structure evolue constamment.

Laquelle preferes-tu ?

**Question 2 — Entities existantes : enrichir ou recreer ?**

L'entity `Incident` actuelle a 15 champs. La cible en a ~35-40. Deux approches :

- **(a) Enrichir** : ajouter les colonnes manquantes a la table `incidents` existante. Avantage : pas de migration de donnees. Inconvenient : l'entity devient massive.
- **(b) Recreer** : creer une nouvelle entity `EvenementQSHE` (ou `IncidentSST`) avec le bon modele, migrer les donnees existantes, deprecier l'ancienne. Avantage : modele propre. Inconvenient : migration SQL.

Pour Risque et ActionPrevention, la meme question se pose.

**Question 3 — CAPA : module autonome ou integre ?**

Le workflow CAPA (actions correctives/preventives) est transversal — il est genere depuis les incidents, les NC, les inspections, les risques, les audits. Deux options :

- **(a) Module CAPA autonome** : une entity `ActionCorrective` unique, liee par FK polymorphe a sa source (incident_id, nc_id, inspection_id, etc.). Page CAPA dediee avec vue transversale de toutes les actions.
- **(b) CAPA integre dans chaque module** : chaque module a ses propres actions (comme `ActionPrevention` actuelle dans le module Securite). Pas de vue transversale.

Mon avis : **(a) module CAPA autonome** est le bon choix. C'est le "liant" qui donne sa coherence au QSHE. ISO exige une gestion integree des actions correctives. Mais c'est un choix structurant qui affecte toute l'architecture.

---

*Audit compile le 2026-04-21. Aucune modification de code effectuee. Phase 3 a suivre apres validation et arbitrage des 3 questions.*
