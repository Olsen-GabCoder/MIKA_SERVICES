# Module Qualité V2 — Compréhension du fichier source

> Phase 1 — Document de validation avant toute conception ou implémentation

---

## 1. Les 6 domaines de la Synthèse mensuelle (Document A)

| # | Domaine | Structure |
|---|---------|-----------|
| 1 | Topographie | 2 sous-tableaux (Réception Terrassement + Réception Génie Civil), 5 lignes chacun |
| 2 | Géotechnique / Laboratoire | 2 sous-tableaux (Terrassement + Génie Civil), 5 lignes chacun |
| 3 | Ouvrage | 2 sous-tableaux (Terrassement + Génie Civil), 5 lignes chacun |
| 4 | Essai Laboratoire béton in situ | Tableau simple, 4 lignes (camions/volume, slump, jours coulage, prélèvements) |
| 5 | Levée Topo | Tableau simple, 3 lignes (profils implantés, réceptionnés, contrôles) |
| 6 | Agrément produit/fournisseur/matériaux | Tableau simple, 6 lignes (workflow distinct) |

Plus un **encart NC** (3 lignes : enregistrées, traitées, coûts) en haut-droite page 2.

**Workflow de réception (blocs 1-3)** : 5 statuts identiques — Établie → En attente MdC/Homologue → Accordée sans réserve / Accordée avec réserve / Rejetée.

**Workflow d'agrément (bloc 6)** : 6 statuts — Prévus au marché, Établis, En attente MdC, Accordés sans réserve, Accordés avec réserve, Rejetés.

La colonne "Statistique" est vraisemblablement un pourcentage calculé (part de chaque ligne / total).

---

## 2. Les 7 sections du workflow NC/RC/PPI (Document B)

| Section | Intitulé | Acteur | Contenu clé |
|---------|----------|--------|-------------|
| 1 | Description de la NC ou RC | Détecteur | Identification chantier, ouvrage, sous-traitance, description libre, PJ photos |
| 2 | Proposition de traitement | Proposeur de traitement | Choix exclusif Correction/Dérogation + tableau d'actions (action, responsable, délai) |
| 3 | (manquante/réservée) | — | À modéliser nullable pour fidélité au formulaire papier |
| 4 | Vérification du traitement | RQ / CTX | Texte libre de vérification + PJ + visa |
| 5 | Levée de la NC/RC/PPI | RQ | Nom + visa + date = levée formelle |
| 6 | Analyse des causes | DT + RQ + CT + CC (collégiale) | Texte libre causes racines + case Oui/Non CAPA |
| 7 | Enregistrement | RQ | Visa final = archivage définitif |

Chaque section porte **sa propre date, son propre signataire, ses propres PJ**.

---

## 3. Types et catégories

**3 types d'événement** (exclusifs — un seul à la fois) :
- **NC** — Non-Conformité
- **RC** — Réclamation Client
- **PPI** — Plainte des Parties Intéressées

**3 catégories transversales** (indépendantes — multi-sélection possible) :
- **Qualité**
- **Sécurité**
- **Environnement**

**3 origines** (exclusives — une seule à la fois) :
- NC/RC Travaux
- NC Réception produits / Prestations Achetées
- NC/RC Étude

---

## 4. Acteurs identifiés

| Sigle | Rôle | Intervient dans |
|-------|------|-----------------|
| DT | Directeur Technique | Section 6 (analyse causes, validation collégiale) |
| RQ | Responsable Qualité | Sections 4, 5, 6, 7 |
| CT | Contrôleur Technique | Section 6 (validation collégiale) |
| CC | Chef de Chantier (à confirmer) | Section 6 (validation collégiale) |
| CTX | Contrôle Technique Externe (à confirmer) | Section 4 (vérification traitement) |
| MdC | Maître d'oeuvre | Document A (décisions réceptions et agréments) |
| Homologue | Délégataire MdC | Document A (décisions réceptions et agréments) |

---

## 5. Questions ouvertes (avant implémentation)

1. **CC** = Chef de Chantier ou Coordinateur Contrôle ?
2. **CTX** = Contrôle Technique Externe ?
3. **Section 3** manquante du formulaire : contenu prévu, ou section supprimée volontairement ?
4. **Colonne Statistique** du Document A : pourcentage par rapport au total du tableau ?
5. **Transitions de statut** réceptions : peut-on passer directement d'un statut à un autre non-adjacent ?
6. **Correspondance rôles** métier (DT/RQ/CT/CC) ↔ rôles applicatifs existants (SUPER_ADMIN, ADMIN, CHEF_PROJET, CHEF_CHANTIER) ?
7. **Type de PJ autorisées** : photos uniquement, ou PDF/Word/autres ?
8. **Synthèse mensuelle** : agrégat calculé dynamiquement, ou saisie manuelle de certains champs ?

---

## 6. Sidebar cible confirmée

7 entrées sous le groupe **Qualité** :
1. Synthèse mensuelle
2. Réceptions travaux
3. Essais laboratoire béton
4. Levée topographique
5. Agréments marché
6. NC / RC / PPI
7. Documents qualité
