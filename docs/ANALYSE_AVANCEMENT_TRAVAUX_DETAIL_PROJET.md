# Analyse détaillée — Avancement des travaux (fiche projet)

## 1. Contexte et emplacement

La section **« 4. Avancement des travaux »** est affichée sur la **page détail d’un projet** (`ProjetDetailPage.tsx`), après les blocs :
- 1. Informations contractuelles  
- 2. Tableau de suivi mensuel (CA prévisionnel / réalisé / écart / avancement cumulé)  
- 3. État d’avancement des études  

Elle est en **lecture seule** sur cette page : la saisie des prévisions et des % se fait dans l’**édition du projet** (`ProjetFormPage`), onglet / zone « Prévisions » (par semaine/année).

---

## 2. Données utilisées

### 2.1 Source : entité `Prevision` (backend)

- **Table** : `previsions`  
- **Champs utilisés** :  
  - `projet_id`, `semaine` (1–53, ISO), `annee`  
  - `description` (texte libre ou dérivé du type)  
  - `type` (HEBDOMADAIRE, MENSUELLE, TRIMESTRIELLE, PRODUCTION, etc.)  
  - `avancement_pct` (entier 0–100, nullable)  
  - `date_debut`, `date_fin` (optionnels)

Les prévisions sont chargées une fois par projet via `projetApi.getPrevisions(projet.id)` et stockées dans l’état `previsions` de la page.

### 2.2 Référence temporelle : semaine calendaire courante

- **Fonction** : `getSemaineCalendaireActuelle()` → `{ week, year }` (semaine ISO 8601, 1–53).  
- **Réalisé** = prévisions dont `(semaine, annee)` = semaine **en cours**.  
- **Prévisions** = prévisions dont `(semaine, annee)` = semaine **suivante** (ou reportées, voir ci‑dessous).

### 2.3 Autres données affichées dans la section

- **Points bloquants** : `pointBloquantApi.findByProjet(projet.id)` → liste (titre, description, priorite, statut).  
- **Besoins matériels / humains** : champs `projet.besoinsMateriel` et `projet.besoinsHumain` (texte, souvent listes à puces séparées par `•`).

---

## 3. Structure de la section (UI)

La section est rendue dans une **carte** (classe `CARD` : fond blanc/gris-800, bordure, ombre). Pas de composant `<Card>` réutilisable ; même pattern que les autres blocs de la fiche (sections 1, 2, 3, 5).

### 3.1 En-tête

- Titre : **« 4. Avancement des travaux »** + libellé de la semaine en cours (ex. « Semaine 10 (2026) en cours »).  
- Badge **avancement global de la semaine** : moyenne des `avancementPct` des tâches « réalisé – semaine en cours », arrondie à 2 décimales. Affiché seulement si au moins une tâche a un `avancementPct` renseigné.  
- Couleur du badge : `bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300`.

### 3.2 Grille 2 colonnes (lg)

**Colonne gauche — Réalisé — Semaine en cours**

- Sous-titre : « Réalisé — Semaine en cours ».  
- Liste des prévisions filtrées `semaine === semaineCalendaire && annee === anneeCalendaire`.  
- Pour chaque tâche :  
  - Libellé : `p.description || p.type.replace(/_/g, ' ')`  
  - Barre de progression (largeur 16, hauteur 2) :  
    - Vert si `avancementPct >= 100`  
    - Orange (primary) si `>= 50`  
    - Ambre si `< 50`  
  - Pourcentage affiché à droite (ex. « 75 % »).  
- Si aucune tâche : message « Aucune tâche enregistrée pour la semaine en cours. »

**Colonne droite — Prévisions — Semaine suivante**

- Sous-titre : « Prévisions — Semaine suivante » + numéro de semaine suivante (ex. « Semaine 11 (2026) »).  
- **Reportées** : prévisions des semaines **passées** dont `avancementPct == null || avancementPct < 100`. Elles sont fusionnées avec les prévisions explicites de la semaine suivante.  
- Note si au moins une reportée : « Les tâches non achevées sont automatiquement reportées. » (style amber).  
- Chaque ligne :  
  - Fond bleu léger pour les prévisions « normales » de la semaine suivante.  
  - Fond amber pour les tâches **reportées** + petit texte « Reportée depuis S{{week}} ({{year}}) ».  
  - Même barre de progression + % que côté réalisé (largeur 14).  
- Si aucune prévision : « Aucune tâche planifiée pour la semaine prochaine. »

### 3.3 Bloc commun sous la grille (border-t)

**Points bloquants**

- Titre en petit uppercase.  
- Liste à puces : titre du point + description si présente + « (priorite, statut) » en plus petit.  
- Si vide : « Aucun point bloquant. »

**Besoins matériels / Besoins humains**

- Deux sous-blocs côte à côte.  
- `besoinsMateriel` et `besoinsHumain` sont découpés par `•` et affichés en listes à puces.  
- Si vide : « — ».

---

## 4. Logique métier résumée

| Élément | Règle |
|--------|--------|
| Semaine en cours | `getSemaineCalendaireActuelle()` (ISO, basée sur la date du navigateur). |
| Réalisé | `previsions` avec `semaine === semaineCalendaire` et `annee === anneeCalendaire`. |
| Prévisions semaine suivante | `semaineProchaine = semaineCalendaire < 53 ? semaineCalendaire + 1 : 1`, `anneeProchaine` avec passage d’année si semaine 53. |
| Reportées | Prévisions avec `(annee < anneeCalendaire) || (annee === anneeCalendaire && semaine < semaineCalendaire)` et `avancementPct == null || avancementPct < 100`. |
| Global % | Moyenne des `avancementPct` des tâches « réalisé » (uniquement celles avec % non null). |

---

## 5. Design et accessibilité

- **Carte** : mêmes constantes `CARD`, `CARD_HEADER`, `CARD_BODY` que les autres sections (cohérent avec le reste de la fiche).  
- **Mode sombre** : présent sur la plupart des textes et fonds (gray-50/700, gray-100/600, primary, amber, blue).  
- **Manques possibles** :  
  - Quelques titres ou textes secondaires en `text-gray-500` sans variante `dark:text-gray-400` (ex. titres « Points bloquants », « Besoins matériels », « Besoins humains », message « Aucun point bloquant »).  
  - Les listes besoins matériel/humain utilisent `text-gray-700` avec dark, mais le tiret « — » quand vide est en `text-gray-500` sans dark.

---

## 6. Lien avec la saisie (édition projet)

- **Ajout / modification des prévisions** : dans `ProjetFormPage`, zone « Prévisions » avec sélecteur **année + semaine**, ajout de tâches (description ou type prédéfini), et saisie de **avancement %** par ligne.  
- Les mêmes `previsions` sont utilisées pour l’export PDF/Excel du projet (section « Avancement des travaux » du rapport).

---

## 7. i18n

- Toutes les chaînes de la section passent par `t('detail.xxx')` (namespace `projet`) :  
  - `section4`, `section4GlobalProgress`, `section4Realise`, `section4Previsions`, `section4NoRealise`, `section4NoPrevisions`, `section4Reportee`, `section4CarryOverNote`, `weekInProgress`, `weekLabel`, `pointsBloquants`, `noPointsBloquants`, `besoinsMateriel`, `besoinsHumain`.  
- Clés **section4PastWeeks*** présentes en FR/EN mais **non utilisées** dans `ProjetDetailPage` : la fiche détail n’affiche pas un bloc « Semaines passées » repliable. Ces clés servent peut‑être à l’historique ou à une évolution future.

---

## 8. Synthèse et pistes d’amélioration

**Points forts**

- Données claires : une seule source (`previsions` + points bloquants + champs projet).  
- Semaine courante / suivante / reportées bien définies.  
- Visuels cohérents (barres de progression, couleurs par statut, report en amber).  
- Intégration export PDF/Excel.

**Pistes d’amélioration**

1. **Mode sombre** : ajouter `dark:text-gray-400` (ou équivalent) sur les titres et textes secondaires restants (points bloquants, besoins, messages vides).  
2. **Semaines passées** : si besoin, réutiliser les clés `section4PastWeeks*` pour un bloc repliable « Semaines passées » (liste des semaines avec tâches + %), en filtrant `previsions` sur `(annee, semaine) < (anneeCalendaire, semaineCalendaire)`.  
3. **Composant réutilisable** : extraire la carte « Avancement des travaux » en composant (ex. `ProjetAvancementTravauxSection`) avec props `previsions`, `pointsBloquants`, `projet`, `semaineCalendaire`, `anneeCalendaire` pour alléger `ProjetDetailPage` et faciliter les tests.  
4. **Lien réunion hebdo** : les PV de réunion hebdo contiennent des « points projet » avec `resumeTravauxPrevisions` et % ; une évolution pourrait être d’afficher un lien vers le dernier PV ou de pré-remplir les résumés à partir des prévisions de la semaine (comme évoqué dans l’analyse du module Réunion hebdo).

Cette analyse couvre en détail la partie **avancement des travaux** de la fiche projet : données, structure, logique, design et i18n.
