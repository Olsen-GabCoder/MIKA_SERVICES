# Module Qualité — Source de vérité métier

> **Ce document est la seule source de vérité pour la conception du module Qualité.**
> Il reproduit fidèlement le contenu des documents transmis par le responsable qualité de MIKA Services.
> Aucune autre source ne doit être consultée (pas de normes ISO théoriques, pas de benchmarks concurrents, pas de recherche web).
> Toute décision d'implémentation doit pouvoir se justifier par un élément présent dans ce document.

---

## Document A — Synthèse Qualité mensuelle

**Code document** : `MS-Chantier-QUA-T3(4-05)`
**Version** : `Version 1`
**Date de création** : `08/01/2026`
**Date de dernière modification** : `08/01/2026`
**Période exemple dans le document scanné** : `Mois : Janvier 2026`
**Titre affiché en haut de page** : `SYNTHÈSE QUALITÉ`

Ce document est un **tableau de bord mensuel** imprimé en A3 paysage. Il agrège l'ensemble de l'activité qualité d'un chantier sur un mois donné. Chaque bloc de données est présenté sous forme d'un tableau à deux colonnes `Quantité` / `Statistique` et d'un graphique à barres associé.

### Structure du document A

Le document est organisé en **6 blocs de données** plus un bloc synthétique NC en haut à droite de la page 2.

#### Bloc 1 — TOPOGRAPHIE

Ce bloc est lui-même divisé en **deux sous-tableaux identiques dans leur structure** :

**Sous-tableau 1.1 — Réception Terrassement**

| Ligne | Colonne Quantité | Colonne Statistique |
|-------|------------------|---------------------|
| Nombre de demandes Établies | à saisir | à saisir |
| En attente de décision MdC/Homologue | à saisir | à saisir |
| Accordées sans réserve | à saisir | à saisir |
| Accordées avec réserve | à saisir | à saisir |
| Rejetées | à saisir | à saisir |

Graphique associé : barres verticales avec échelle 0% à 120%, axes X = les 5 statuts, axes Y = pourcentage.

**Sous-tableau 1.2 — Réception Génie Civil**

Exactement les mêmes 5 lignes que 1.1, avec son propre graphique.

#### Bloc 2 — GÉOTECHNIQUE / LABORATOIRE

Même structure que Bloc 1 : deux sous-tableaux **Réception Terrassement** et **Réception Génie Civil**, chacun avec les 5 mêmes lignes et son graphique.

#### Bloc 3 — OUVRAGE

Même structure que Bloc 1 : deux sous-tableaux **Réception Terrassement** et **Réception Génie Civil**, chacun avec les 5 mêmes lignes et son graphique.

#### Bloc 4 — Essai Laboratoire pour les bétons in situ

Tableau simple (pas de sous-structure Terrassement/Génie Civil) :

| Ligne | Colonne Quantité | Colonne Statistique |
|-------|------------------|---------------------|
| Nombre de camions malaxeurs / volume coulé | à saisir | à saisir |
| Nombre d'essais slump réalisés | à saisir | à saisir |
| Nombre de jours de coulage | à saisir | à saisir |
| Nombre de prélèvements effectués | à saisir | à saisir |

#### Bloc 5 — Levée Topo

Tableau simple :

| Ligne | Colonne Quantité | Colonne Statistique |
|-------|------------------|---------------------|
| Nombre de profils implantés | à saisir | à saisir |
| Nombre de profils réceptionnés | à saisir | à saisir |
| Nombre de contrôles réalisés | à saisir | à saisir |

#### Bloc 6 — Agrément produit, fournisseur, matériaux

Tableau simple avec 6 lignes (workflow d'agrément distinct du workflow de réception) :

| Ligne | Colonne Quantité | Colonne Statistique |
|-------|------------------|---------------------|
| Nombre d'agréments prévus dans le marché | à saisir | à saisir |
| Nombre d'agréments établis | à saisir | à saisir |
| En attente de décision MdC/Homologue | à saisir | à saisir |
| Nombre d'agréments accordés sans réserve | à saisir | à saisir |
| Nombre d'agréments accordés avec réserve | à saisir | à saisir |
| Nombre de demandes d'agréments rejetées | à saisir | à saisir |

#### Bloc 7 — Synthèse NC (encart haut-droite page 2)

Petit tableau à 3 lignes :

| Ligne | Colonne Quantité | Colonne Statistique |
|-------|------------------|---------------------|
| NC enregistrées | à saisir | à saisir |
| NC traitées | à saisir | à saisir |
| Coûts NC | à saisir | à saisir |

### Ce que révèle le document A sur le métier

- Les **réceptions de travaux** sont le cœur du module. Trois natures (Topographie / Géotechnique / Ouvrage) × deux sous-types (Terrassement / Génie Civil) = 6 sous-flux de réception.
- Le **workflow de réception** a 5 statuts identiques partout : Établie, En attente MdC/Homologue, Accordée sans réserve, Accordée avec réserve, Rejetée.
- Le **workflow d'agrément marché** est distinct du workflow de réception : il a 6 statuts (Prévu au marché, Établi, En attente MdC, Accordé sans réserve, Accordé avec réserve, Rejeté).
- L'entreprise suit des **données opérationnelles de laboratoire béton** très spécifiques (camions, slump, coulage, prélèvements).
- L'entreprise distingue **"profils implantés"** (action de pose) vs **"profils réceptionnés"** (validation) en topographie.
- Les **NC** sont résumées en agrégat dans ce dashboard, mais leur gestion détaillée se fait via le Document B.
- Chaque graphique présente les 5 (ou 6) statuts comme axes X, avec pourcentage en Y — c'est une **répartition** des demandes par statut, pas une évolution temporelle.
- La colonne "Statistique" à côté de "Quantité" dans chaque tableau est probablement un **pourcentage calculé** (part de la ligne par rapport au total du tableau).

### Acronyme / glossaire du document A

| Sigle | Signification |
|-------|---------------|
| MdC | Maître d'œuvre |
| Homologue | Représentant de la maîtrise d'œuvre désigné pour valider (équivalent ou délégataire du MdC) |
| NC | Non-Conformité |

---

## Document B — Fiche de Non-Conformité / Réclamation Client / Plainte des Parties Intéressées

**Code document** : `MS-QUA-F2-V1`
**Version** : `Version 1`
**Date de création** : `04/02/2026`

Ce document est le **formulaire opérationnel unitaire** rempli pour chaque événement qualité. Il circule physiquement entre plusieurs acteurs sur plusieurs jours, chaque acteur signant sa section.

### En-tête du formulaire

Titre principal : **FICHE DE NON CONFORMITÉ (NC) / RÉCLAMATION CLIENT (RC) / PLAINTE DES PARTIES INTERESSEES (PPI)**

**Trois cases à cocher en haut (type d'événement — une seule case active à la fois)** :
- NC
- RC
- PPI

**Trois cases à cocher en dessous (catégories transversales — cochables indépendamment, multi-sélection possible)** :
- Qualité
- Sécurité
- Environnement

**Trois cases à cocher pour l'origine de l'événement (une seule active à la fois)** :
- NC/RC **Travaux**
- NC **Réception produits / Prestations Achetées**
- NC/RC **Étude**

### Section 1 — Description de la NC ou Réclamation Client

**Acteur responsable (mention imprimée dans la marge de gauche)** :
> Personne ayant détecté la non-conformité ou ayant reçu la réclamation client

**Bloc d'identification du chantier / contrat (champs imprimés pré-remplis dans le formulaire)** :

| Champ | Type | Exemple rempli dans le document |
|-------|------|----------------------------------|
| N° Chantier | Texte | DONGUILA |
| Ouvrage concerné | Texte | MAISON TEMOIN N°1 |
| Contrôle exigé / CCTP (Oui/Non) | Booléen | OUI |
| N° du B.C. ou Contrat | Texte | BC2510S11010167 |
| Si travaux de Sous-traitance (bloc apparaît conditionnellement) | — | — |
| Nom fournisseur / Sous-traitant | Texte | EBTP |
| Nom sous-traitant | Texte | EBTP |
| N° de B.L. et date de livraison | Texte + date | 14/12/2025 |
| N° du Contrat / BC | Texte | (rempli) |

**Bloc de catégorisation secondaire** :
- NC/RC Travaux (champ titre de section)
- NC Réception produits / Prestations Achetées (champ titre de section)
- NC/RC Étude (champ titre de section avec zone annotée "Type NC" manuscrite sur le document scanné)

**Zone de description libre** intitulée : `1/ DESCRIPTION DE LA NON CONFORMITE OU RECLAMATION CLIENT`

Exemple rempli dans le document :
> Le 14 Mars 2026 à 10h30 le Service Qualité a effectué un contrôle pour s'assurer du respect des règles d'exécutions de la maison témoins. Lors de la visite nous avons relevé les écarts suivants :
> 1 / Présence d'une fissure sur le mur en béton côté mer
> 2 / Le muret qui se trouve à l'intérieur de la cuisine pour lavoir est tordu selon le niveau maçon
> 3 / L'eau rentre dans la maison par l'ouverture murale côté douche

**Champ "Pièces jointes"** : `Photos d'illustration en annexe`

**Zone de visa (colonne de droite)** :
- Date, Nom et visa
- Exemple rempli : `Paul Eric NDIMBI` — `14/03/2026`

### Section 2 — Proposition de traitement

**Acteur responsable** :
> Personne devant proposer un traitement

**Choix exclusif — case à cocher** :
- **Correction** (case cochée dans l'exemple rempli)
- **Dérogation**

**Tableau d'actions (plusieurs lignes possibles)** :

| Colonne | Description |
|---------|-------------|
| Action(s) pour traiter la NC ou RC | Description textuelle de l'action |
| Responsable | Personne chargée de l'action |
| Délai prévu | Date butoir |

Exemple rempli (3 actions) :

| Action | Responsable | Délai |
|--------|-------------|-------|
| Réparer la fissure sur le mur en béton | (non rempli) | (non rempli) |
| Construire le regard côté douche et vérifier si les tuyaux enterrés ne sont pas obstrués | (non rempli) | (non rempli) |
| Démolir le muret intérieur de la cuisine en cours de construction et le refaire | (non rempli) | (non rempli) |

**Zone de visa (colonne de droite)** :
- Date, Nom et visa
- Exemple rempli : `Kao MBAZONGA` — `16/03/2026`

### Section 3 — (section manquante / non numérotée dans le formulaire)

Le formulaire scanné saute directement de la section 2 à la section 4. La section 3 semble soit réservée soit fusionnée dans la proposition de traitement. À conserver comme placeholder dans le modèle de données (section_3 nullable) pour préserver la fidélité au document.

### Section 4 — Vérification du traitement

**Acteur responsable (mention imprimée dans la marge de gauche)** :
> Responsable Qualité / CTX

**Contenu** :
- Zone de texte libre pour la vérification
- Champ "Pièces jointes"
- Zone de visa : Date, Nom et visa

Dans l'exemple rempli, cette section n'est **pas encore signée** (la NC est encore dans son workflow).

### Section 5 — Levée de la NC / RC ou PPI

**Acteur responsable (mention imprimée dans la marge de gauche)** :
> Resp. Qualité

**Contenu** :
- Nom
- Visa
- Date

Dans l'exemple rempli, cette section n'est **pas encore signée**.

### Section 6 — Analyse des causes

**Acteur responsable (mention imprimée dans la marge de gauche)** :
> DT + RQ + CT + CC

Il s'agit d'une **validation collégiale** à 4 rôles :
- **DT** : Directeur Technique
- **RQ** : Responsable Qualité
- **CT** : Contrôleur Technique
- **CC** : (à confirmer avec le responsable qualité — probablement Chef de Chantier ou Coordinateur Contrôle)

**Contenu** :
- Zone de texte libre pour l'analyse des causes racines
- **Case à cocher cruciale** : `Nécessité d'ouvrir une Action corrective ou préventive sur le champ : Oui / Non`

Exemple rempli :
> Lors du lancement de la construction de la maison témoins il n'y avait pas de contrôleur qualité. Le contrôle s'est fait tardivement après recrutement d'un assistant qualité et la maison témoins était déjà sur les finissions.

Case cochée dans l'exemple : `Oui` (nécessité d'ouvrir une action corrective/préventive).

**Zone de visa** :
- Date, Nom et visa
- Exemple rempli : `Kao MBAZONGA` — `18/03/2026`

### Section 7 — Enregistrement

**Acteur responsable (mention imprimée dans la marge de gauche)** :
> R.Q. (Responsable Qualité)

**Contenu** :
- Date
- Nom
- Visa

Étape administrative de clôture finale — archivage définitif de la fiche.

### Annexe photos (page 4 du document)

Le document scanné comporte une page d'annexe avec 3 photos légendées :
1. **Présence de fissure mur en béton côté mer** (photo de la fissure)
2. **Entrée d'eau côté douche après la pluie du 14 Mars 2026 et les planches descentes jusqu'au sous bassement** (photo de la zone inondée)
3. **Muret intérieur cuisine tordu** (photo avec niveau posé sur le muret montrant le défaut de verticalité)

Cette annexe confirme que chaque événement peut comporter **plusieurs pièces jointes photos avec légende textuelle**, numérotées ou non.

### Synthèse du workflow de la fiche NC/RC/PPI

Le cycle de vie complet de l'événement suit **7 étapes séquentielles** avec **6 acteurs visant** (section 3 manquante) :

| Section | Acteur | Rôle dans le workflow |
|---------|--------|----------------------|
| 1 | Détecteur de la NC ou réceptionneur de la réclamation | Description de l'écart constaté |
| 2 | Proposeur de traitement | Choix Correction/Dérogation + actions planifiées |
| 3 | — | (section réservée, à modéliser en nullable) |
| 4 | Responsable Qualité / CTX | Vérification que le traitement a bien été exécuté |
| 5 | Responsable Qualité | Levée formelle de la NC |
| 6 | DT + RQ + CT + CC (validation collégiale 4 acteurs) | Analyse des causes + décision CAPA |
| 7 | Responsable Qualité | Enregistrement administratif final |

### Ce que révèle le document B sur le métier

- Une fiche NC **n'est pas binaire** (ouverte/fermée) — elle traverse 7 états métier distincts avec leurs propres signataires.
- La **distinction Correction vs Dérogation** est explicite et exclusive — c'est une décision métier majeure avec implications légales différentes (la dérogation accepte la NC en l'état).
- La **validation en section 6 est collégiale** — aucun acteur seul ne peut valider l'analyse des causes.
- La **décision CAPA en section 6** est explicite (case Oui/Non) — elle doit déclencher une création automatique de CAPA si "Oui".
- Chaque section a **son propre acteur, sa propre date, son propre visa, ses propres pièces jointes** — le modèle doit refléter cette granularité.
- Un événement peut être simultanément **Qualité ET Sécurité ET Environnement** — les 3 catégories sont indépendantes.
- La **sous-traitance** est un bloc spécifique du formulaire avec ses propres champs (nom, BC, BL, date livraison).
- La **photo avec légende** est un élément documentaire central — pas un accessoire.

### Acronymes / glossaire du document B

| Sigle | Signification |
|-------|---------------|
| NC | Non-Conformité |
| RC | Réclamation Client |
| PPI | Plainte des Parties Intéressées |
| CCTP | Cahier des Clauses Techniques Particulières |
| BC | Bon de Commande |
| BL | Bordereau de Livraison |
| MdC | Maître d'œuvre |
| CTX | Contrôle Technique eXterne (probablement — à confirmer avec le responsable) |
| DT | Directeur Technique |
| RQ | Responsable Qualité |
| CT | Contrôleur Technique |
| CC | Chef de Chantier (à confirmer — autre hypothèse : Coordinateur Contrôle) |

---

## Éléments métier transversaux identifiés

### Référentiel des acteurs du module Qualité

À partir des deux documents, les acteurs impliqués dans le workflow qualité de l'entreprise sont :

| Acteur | Présence dans Document A | Présence dans Document B |
|--------|--------------------------|--------------------------|
| Service Qualité (détecteur) | — | Oui (section 1) |
| Proposeur de traitement | — | Oui (section 2) |
| Responsable Qualité (RQ) | — | Oui (sections 4, 5, 6, 7) |
| CTX (Contrôle Technique Externe) | — | Oui (section 4) |
| Directeur Technique (DT) | — | Oui (section 6) |
| Contrôleur Technique (CT) | — | Oui (section 6) |
| CC (Chef de Chantier / Coordinateur Contrôle) | — | Oui (section 6) |
| MdC / Homologue (Maître d'œuvre) | Oui (décision réceptions et agréments) | — |
| Fournisseur / Sous-traitant | — | Oui (section 1, bloc sous-traitance) |

### Entités métier externes référencées

| Entité | Documents où elle apparaît | Usage |
|--------|----------------------------|-------|
| Projet / Chantier | A et B | Rattachement de toutes les données |
| Sous-projet / Ouvrage | A (réceptions) et B (ouvrage concerné) | Granularité fine |
| Fournisseur | A (agréments) et B (sous-traitance) | Lien avec module Fournisseur existant |
| Marché / Contrat / BC | A (agréments prévus au marché) et B (N° BC) | Rattachement contractuel |
| CCTP | B (contrôle exigé CCTP Oui/Non) | Exigence contractuelle |
| Action corrective/préventive (CAPA) | B (section 6) | Création automatique si décision Oui |

### Templates versionnés (gestion documentaire)

Les deux documents portent un **code document + version** explicite :
- Document A : `MS-Chantier-QUA-T3(4-05)` version 1
- Document B : `MS-QUA-F2-V1` version 1

Cela indique que l'entreprise gère ses formulaires qualité comme **un référentiel documentaire versionné**. Un module "Documents qualité" doit permettre de tracer la version en vigueur de chaque formulaire utilisé.

---

## Liste des entités métier à modéliser (issues des deux documents)

À titre d'inventaire, sans préjuger de la conception technique finale :

1. **DemandeReception** — workflow 5 statuts, 3 natures (Topographie / Géotechnique / Ouvrage), 2 sous-types (Terrassement / Génie Civil)
2. **EssaiLaboratoireBeton** — compteurs camions, slump, coulage, prélèvements
3. **LeveeTopographique** — compteurs profils implantés, réceptionnés, contrôles
4. **AgrementMarche** — workflow 6 statuts, objet (produit / fournisseur / matériau)
5. **EvenementQualite** (NC / RC / PPI) — workflow 7 sections
6. **VisaSectionEvenement** — signature d'une section par un acteur
7. **ActionTraitement** — ligne d'action dans la section 2 du workflow NC
8. **PieceJointeEvenement** — photo avec légende rattachée à une section
9. **TemplateDocumentQualite** — référentiel versionné des formulaires
10. **SyntheseMensuelleQualite** — agrégat calculé (pas forcément stocké)

---

## Éléments à clarifier avec le responsable qualité (hors périmètre v1)

Ces questions ne bloquent pas le démarrage de l'implémentation mais devront être posées ultérieurement :

1. Confirmation de la signification exacte des sigles CC et CTX dans le contexte MIKA Services
2. Correspondance entre les rôles métier (DT, RQ, CT, CC) et les rôles applicatifs existants dans la plateforme
3. Contenu exact de la section 3 manquante du formulaire NC
4. Règle de calcul exacte de la colonne "Statistique" dans le Document A (pourcentage par rapport au total du tableau, ou autre formule)
5. Règles de transition entre statuts : peut-on passer d'En_Attente_MdC directement à Rejetée sans passer par Établie, etc.
6. Durée standard d'instruction attendue d'une demande de réception (pour les alertes de retard éventuelles)
7. Type exact des pièces jointes autorisées (PDF, JPG, Word, autres)
8. Workflow d'export PDF : déclencheur (à la clôture, à la demande, automatique mensuel) et destinataires (interne, MOA, homologue)

---

**Fin du document source.** Toute question métier non répondue ici doit être remontée au responsable qualité avant implémentation.
