# Sémantique des indicateurs d'avancement projet

Ce document clarifie l'usage des champs **avancement global**, **avancement physique** et **avancement financier** dans MIKA Services, afin d'éviter les confusions entre liste, fiche projet et détail.

---

## Les trois indicateurs

| Indicateur | Champ API | Signification | Où il est renseigné |
|------------|-----------|--------------|---------------------|
| **Avancement physique** | `avancementGlobal` + `avancementPhysiquePct` (synchronisés) | Progression réelle des travaux sur le terrain (indicateur principal). | Fiche projet (édition) — un seul champ « Avancement physique (%) ». |
| **Avancement financier** | `avancementFinancierPct` | Part du budget consommée (exécution budgétaire). Peut être calculé côté reporting (dépenses / budget) ou saisi manuellement. | Fiche projet (édition) — champ « Avancement financier (%) ». |
| **Délai consommé** | `delaiConsommePct` | Part du délai prévu déjà écoulée. | Fiche projet (édition) — champ « Délai consommé (%) ». |

---

## Règle de synchronisation (avancement physique)

- En base, le projet possède **deux** champs pour l’avancement « physique » : `avancement_global` et `avancement_physique_pct`.
- Dans l’application, ils sont **traités comme un seul indicateur** :
  - **Formulaire d’édition** : un seul champ « Avancement physique (%) » met à jour les deux champs avec la même valeur.
  - **À la sauvegarde** : la valeur saisie est envoyée pour `avancementGlobal` et `avancementPhysiquePct`.
  - **À l’affichage** (liste, détail, exports, visualisations) : on utilise `avancementPhysiquePct ?? avancementGlobal` pour rester cohérent même avec d’anciennes données.

Résultat : la **liste des projets** (colonne « Avancement physique (%) »), le **détail** (bloc « Avancement physique ») et la **fiche d’édition** affichent et modifient le même indicateur, sans désynchronisation.

---

## Où chaque indicateur est affiché

- **Liste des projets** : colonne « Avancement physique (%) » → `avancementGlobal` (synchronisé avec physique).
- **Détail projet (synthèse)** : bloc « Avancement physique » → `avancementPhysiquePct ?? avancementGlobal`.
- **Formulaire d’édition** : un champ « Avancement physique (%) », deux champs séparés « Avancement financier (%) » et « Délai consommé (%) ».
- **Exports (PDF, Word, Excel)** : « Avancement global » / « Avancement physique » utilisent la même valeur synchronisée ; « Avancement financier » reste distinct.

---

## Précision des pourcentages (au moins 2 décimales)

- **Saisie** : tous les champs de pourcentage (avancement physique, financier, délai consommé, avancement études, réunions hebdo) utilisent `step={0.01}` (ou `step="0.01"`) pour autoriser au minimum deux décimales.
- **Base de données** : les colonnes concernées ont `precision = 5, scale = 2` (avancement_global, avancement_physique_pct, avancement_financier_pct, delai_consomme_pct, avancement_cumule, avancement_pct, etc.) — la précision est conservée à l’enregistrement.
- **Calculs** : avancement cumulé (suivi mensuel) et moyennes (liste) sont calculés avec 2 décimales (`* 10000 / 100` ou `* 100 / 100`).
- **Affichage** : les pourcentages sont affichés avec 2 décimales (helper `formatPct` dans les visualisations, pas d’arrondi à 1 décimale) pour refléter la valeur saisie sans troncature implicite.

---

## Historique de la correction (février 2025)

- **Problème** : la liste affichait `avancementGlobal` sous le libellé « Avancement physique », tandis que le formulaire proposait deux champs distincts (« Avancement global » et « Avancement physique »), ce qui provoquait des incohérences.
- **Solution** : un seul champ « Avancement physique » dans le formulaire, synchronisation systématique avec `avancementGlobal` et `avancementPhysiquePct`, et libellés harmonisés (liste, détail, formulaire).
- **Précision** : autorisation d’au moins 2 décimales pour tous les pourcentages (saisie, stockage, affichage), sans arrondi à 1 décimale.
