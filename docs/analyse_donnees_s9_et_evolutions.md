# Analyse des données S9 (Réalisé Semaine 9) et évolutions Backend / Frontend

## 1. Structure des données fournies

### 1.1 Hiérarchie
- **Chef de Projet** (nom) → déjà porté par le projet : `responsableProjet` (User)
- **Marché** → projet : `numero_marche` / `code_projet` + `nom`
- **Axes / Voies / Zones** → regroupement des tâches (ex. "Axe 1 — Léon Mba", "Voie AMO", "Sortie Mayena")
- **Tâches** sous chaque axe, avec description, quantité éventuelle, et avancement

### 1.2 Champs par tâche (données réelles)
| Élément | Exemple | Actuel Backend (Prevision) |
|--------|---------|----------------------------|
| Regroupement | Axe 1 — Léon Mba, Voie de Contournement | ❌ absent |
| Description | Aménagement espace vert P19-P18 — 23 m² | `description` ✅ |
| Quantité + unité | 23 m², 130,51 ml, 600 Tonnes, (2) | ❌ absent (tout en description possible) |
| Avancement | 100%, **NR**, **48%**, **en cours** | `avancement_pct` (Int?) ✅ — pas de libellé "NR" / "en cours" |

### 1.3 Données au niveau projet / semaine
| Élément | Exemple | Actuel Backend |
|--------|---------|----------------|
| CA réalisé S9 | 36 000 000 XAF | ❌ (existe seulement par **mois** : `ca_previsionnel_realise`) |
| CA prévu S9 | 11 000 000 XAF | ❌ |
| Écart | +36 926 018 XAF | ❌ (par mois uniquement) |
| Avancement global S9 | 23% | ❌ (on a `avancement_global` sur le projet, pas par semaine) |

---

## 2. Écarts identifiés

### 2.1 Table `previsions` (tâches hebdo)
- **Section / Axe** : pas de champ pour grouper les tâches (Axe 1, Voie AMO, etc.).
- **Avancement non numérique** : "NR" (Non Renseigné) et "en cours" ne sont pas modélisés (actuellement seul un `avancement_pct` entier nullable existe).
- **Quantité** : optionnel, peut rester dans la description ou être extrait dans un champ dédié pour affichage (ex. "23 m²", "130,51 ml").

### 2.2 CA et avancement par semaine
- La table **`ca_previsionnel_realise`** est par **mois** (mois, annee), pas par semaine.
- Pas de stockage du **CA prévu / réalisé / écart** ni de l’**avancement global** pour une semaine donnée (ex. S9).

### 2.3 Affichage actuel (Point 4 – détail projet)
- Liste **plate** des tâches (semaine en cours + prévisions semaine suivante).
- Pas de regroupement par axe/voie.
- Pas d’affichage "NR" ou "en cours" quand il n’y a pas de pourcentage.
- Pas de bloc **CA semaine** (prévu / réalisé / écart) ni d’**avancement global S9** dans cette section.

---

## 3. Évolutions recommandées

### 3.1 Backend

#### A. Entité `Prevision`
- **section** (VARCHAR 200, nullable) : libellé du groupe (ex. "Axe 1 — Léon Mba", "Voie AMO").
- **libelle_avancement** (VARCHAR 50, nullable) : pour afficher "NR", "en cours" lorsque l’avancement n’est pas un pourcentage (ou en complément).
- **quantite_libelle** (VARCHAR 100, nullable) : chaîne libre pour "23 m²", "130,51 ml", "600 Tonnes", "(2)", etc.

#### B. Nouvelle entité `CASemaine` (table `ca_semaine`)
- **projet_id** (FK), **semaine** (Int), **annee** (Int).
- **ca_prevu** (BigDecimal, nullable), **ca_realise** (BigDecimal, nullable), **ecart** (BigDecimal, nullable).
- **avancement_global_semaine_pct** (BigDecimal, nullable) : ex. "Avancement global S9 : 23%".
- Contrainte d’unicité (projet_id, semaine, annee).

#### C. API / DTOs
- Création / mise à jour des prévisions avec `section`, `libelleAvancement`, `quantiteLibelle`.
- Endpoints ou champs pour lire/écrire le CA semaine (et avancement global S9) par projet.

### 3.2 Frontend

#### A. Point 4 – Réalisé Semaine en cours
- Grouper les tâches par **section** (si renseignée) : titre de section puis liste des tâches.
- Afficher **quantite_libelle** à côté de la description (ex. "— 23 m²").
- Pour l’avancement : si `avancementPct != null` → "X %" ; sinon si `libelleAvancement` → afficher "NR" ou "en cours" ; sinon "NR".
- Afficher un bloc **CA semaine** (CA prévu, CA réalisé, écart) et **avancement global S9** quand les données sont disponibles.

#### B. Prévisions semaine suivante
- Possibilité de grouper par section aussi si tu fournis des sections pour les prévisions.
- Pas de changement obligatoire si les prévisions restent sans section.

#### C. Exports (Word, PDF, Excel)
- Inclure section, quantite_libelle, libellé avancement (NR / en cours) et bloc CA semaine / avancement global S9 dans les exports détail projet.

---

## 4. Résumé des ajouts

| Où | Quoi |
|----|------|
| **Backend** | Colonnes `section`, `libelle_avancement`, `quantite_libelle` sur `previsions` ; table `ca_semaine` + entité + repo + service + API ; DTOs/PrevisionResponse mis à jour. |
| **Frontend** | Types Prevision + CASemaine ; détail projet Point 4 : regroupement par section, affichage quantité, NR/en cours, bloc CA semaine + avancement global S9 ; exports mis à jour. |

Une fois ces éléments en place, on pourra peupler la base avec tes données S9 (et les suivantes) sans perte d’information et avec un affichage aligné sur le document source.
