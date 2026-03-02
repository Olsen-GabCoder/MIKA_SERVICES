# Règles d’insertion et d’affichage des réalisations par semaine

Objectif : éviter les amalgames entre **semaine en cours** et **semaines passées**, et garder une lecture claire dans la page détail projet (partie 4 – Avancement des travaux).

---

## 1. Règle d’insertion en base

- **Chaque tâche (prévision/réalisation) est enregistrée dans la semaine réelle correspondante** du PV.
  - Ex. : bloc « Réalisé S8 » du PV → `semaine = 8`, `annee = 2026`.
  - Ex. : bloc « Réalisé S9 » du PV → `semaine = 9`, `annee = 2026`.
- On **ne met plus tout en semaine 9** pour « faire apparaître » les anciennes réalisations dans la semaine en cours : cela créait un amalgame (données S8 affichées comme si c’était S9).
- **NR (Non Renseigné)** → enregistré en base comme **0 %** (`avancement_pct = 0`).

Résultat : en base, les données sont **historiques et cohérentes** (S5, S6, S7, S8, S9, etc. selon le PV).

---

## 2. Affichage dans la page détail projet (partie 4)

### 2.1 Bloc principal : « Semaine en cours »

- **Titre** : « 4. Avancement des travaux — Semaine X (AAAA) en cours ».
- **Contenu** :
  - **Réalisé** : uniquement les tâches dont `semaine = semaine calendaire actuelle` et `annee = année actuelle`.
  - **Prévisions** : uniquement les tâches de la **semaine suivante** (pour anticiper).
- Ce bloc reste **toujours en haut** et ne mélange aucune autre semaine.

### 2.2 Bloc en bas : « Semaines passées » (dépliable)

- **Emplacement** : juste en dessous du bloc « Réalisé / Prévisions » de la section 4, avant les points bloquants.
- **Comportement** :
  - Par défaut : un lien ou bouton **« Voir les semaines passées »** (ou « Défiler les semaines passées »).
  - Au clic : affichage des **semaines passées** pour lesquelles le projet a au moins une prévision/réalisation.
  - Les semaines sont triées de la **plus récente à la plus ancienne** (ex. S8 2026, puis S7 2026, puis S6 2026…).
  - Chaque semaine est affichée dans un **sous-bloc repliable** (accordéon) avec le libellé « Semaine W (AAAA) » et la liste des tâches avec leur %.
- **Objectif** : consulter l’historique sans surcharger l’écran ; la semaine en cours reste le focus.

### 2.3 Synthèse

| Zone                | Données affichées                    | Position        |
|---------------------|--------------------------------------|-----------------|
| Semaine en cours    | Réalisé S actuelle + Prévisions S+1   | Toujours en haut |
| Semaines passées    | Réalisé (et éventuellement prévisions) par semaine passée | En bas, dépliable |

---

## 3. Conséquences pour les scripts SQL et le PV

- **Nouveaux imports** : utiliser la **vraie semaine** du PV (ex. LALALA « Réalisé S8 » → `semaine = 8`, `annee = 2026`).
- **Données déjà en S9** : pour les projets dont on a mis du « Réalisé S8 » (ou autre) en S9 pour l’affichage, on peut soit :
  - laisser en l’état (affichage actuel = tout en « Semaine en cours »), soit
  - migrer vers la semaine réelle (ex. S8) et s’appuyer sur le bloc « Semaines passées » pour les consulter.
- **Exports (PDF, Word, Excel)** : peuvent continuer à mettre en avant la semaine en cours ; l’historique détaillé reste disponible dans l’interface (semaines passées) et en base.

---

## 4. Fichiers concernés

- **Frontend** : `frontend_web/mika-services-frontend/src/features/projet/pages/ProjetDetailPage.tsx` (section 4 + bloc semaines passées dépliable).
- **Traductions** : `locales/fr/projet.json`, `locales/en/projet.json` (clés pour « Semaines passées », « Voir les semaines passées », etc.).
- **Docs** : `docs/correspondance_PV_BD_projets.md`, `docs/analyse_PV_S09_2026.md` (référence à cette règle si besoin).
