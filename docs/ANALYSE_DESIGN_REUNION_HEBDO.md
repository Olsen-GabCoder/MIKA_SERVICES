# Analyse design — Module Réunion hebdomadaire

## 1. Design system du projet (référence)

### 1.1 Couleurs (Tailwind + thème)
- **Primary** : `#FF6B35` (primary), `#D94E1F` (primary-dark), `#FF8C61` (primary-light)
- **Neutres** : dark `#2B2D42`, medium `#8D99AE`, light `#EDF2F4`
- **Variables CSS** (index.css) : `--mika-bg-content`, `--mika-bg-card`, `--mika-border-card`, `--mika-text-primary` ; mode sombre via `html[data-theme="dark"]`
- **Statuts** : success, warning, danger, info ; badges type `bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200`

### 1.2 Typographie
- Titres : `text-h1` (32px) à `text-h4` (20px), `font-bold`
- Corps : `text-body` (16px), `text-small` (14px), `text-tiny` (12px)
- Labels formulaires : `text-small font-medium text-dark dark:text-gray-200` (Input) ou `text-sm font-medium text-gray-700 dark:text-gray-300`

### 1.3 Composants partagés
- **PageContainer** : `size="narrow"|"default"|"wide"|"full"` — listes/tableaux en `wide`
- **Button** : `variant="primary"|"secondary"|"success"|"danger"|"outline"`, `size="sm"|"md"|"lg"` — primary = `bg-primary hover:bg-primary-dark text-white`
- **Card** : `title`, `subtitle`, `headerActions` ; conteneur `mika-theme-card rounded-lg border shadow-sm` ; contenu `px-lg py-md`
- **Input** : `label`, `error` ; champ `border rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100`
- **Alert** : `type="success"|"error"|"warning"|"info"`, `title?`, `children`, `onClose?`

### 1.4 Patterns de pages
- **Liste** : `PageContainer size="wide"` → bloc titre (h1 `text-2xl font-bold text-gray-900 dark:text-gray-100`) + sous-titre count + bouton principal (primary) → tableau dans conteneur `bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600` ; thead `bg-gray-50 dark:bg-gray-700` ; pagination `bg-gray-50 dark:bg-gray-700/50 border-t`
- **Formulaire** : `PageContainer` (default ou narrow) → titre h1 → formulaire `space-y-6` ; labels cohérents ; boutons Enregistrer (primary) / Annuler (outline ou gris)
- **Détail / PV** : sections dans cartes ou bloc unique avec `divide-y` ; boutons d’action avec variantes primary / outline / lien

### 1.5 Accessibilité et thème
- Mode sombre : classes `dark:` systématiques sur textes, fonds, bordures
- Contraste élevé : `data-high-contrast-cards`, `data-high-contrast-text` (index.css)
- Densité : `data-density` + `--mika-density-scale`
- Cartes : classe utilitaire `mika-theme-card` pour fond et bordure via variables

---

## 2. État du module Réunion hebdo avant alignement

### 2.1 Liste (ReunionHebdoListPage)
- **Déjà alignée** : PageContainer size="wide", structure titre + count + bouton primary, tableau avec thead/tbody, couleurs dark, pagination avec styles dark, badges statut (BROUILLON / VALIDE), useConfirm pour suppression.
- **Écarts mineurs** : aucun ; la liste respecte le design des autres listes (Equipe, Projet en plus riche).

### 2.2 Formulaire (ReunionHebdoFormPage)
- **PageContainer** : OK (default).
- **Titre** : OK (text-2xl font-bold + dark).
- **Erreur** : bloc manuel `bg-red-50 dark:bg-red-900/30...` au lieu du composant **Alert** type="error".
- **Champs** : labels OK ; **inputs en brut** (pas de composant **Input**) — styles cohérents mais duplication.
- **Boutons** : **boutons natifs** avec classes manuelles au lieu du composant **Button** (primary, outline, lien).
- **Structure** : pas de **Card** englobante ; les autres formulaires (User, Profil) utilisent parfois Card pour grouper ; ici formulaire simple, Card optionnelle.

### 2.3 Page PV (ReunionHebdoPVPage)
- **PageContainer size="wide"** : OK.
- **Conteneur principal** : une seule grande div `bg-white dark:bg-gray-800 rounded-xl shadow-sm border...` avec `divide-y` — pas de **Card** par section (En-tête, Participants, Points par projet, Divers).
- **Boutons** : "Modifier la réunion", "Retour à la liste", "Éditer", "Ajouter un projet", etc. en **boutons natifs** (classes gris / primary) au lieu de **Button** variant primary/outline.
- **Formulaire d’édition point projet** : champs en brut ; pas de **Input** ; boutons Enregistrer / Annuler / Supprimer en brut.

---

## 3. Alignement effectué (reproduction du design)

- **ReunionHebdoFormPage** : utilisation de **Alert** pour l’erreur ; **Button** pour Soumettre (primary), Annuler (outline), Voir le PV (outline/lien) ; **Input** pour les champs `input` (date, lieu, heure début/fin) ; optionnel **Card** pour regrouper le formulaire si souhaité.
- **ReunionHebdoPVPage** : **Card** pour chaque section (En-tête, Participants, Points par projet, Divers) avec `title` ; **Button** pour toutes les actions (Modifier réunion, Retour liste, Ajouter projet, Éditer, Enregistrer, Annuler, Supprimer du PV) ; formulaire d’édition point projet avec **Input** + **Button**.
- **ReunionHebdoListPage** : inchangée (déjà conforme).

Résultat : la section Réunion hebdomadaire **reproduit le même design** que le reste du projet (couleurs, composants, patterns liste/formulaire/détail, mode sombre, accessibilité).
