# Migration Phase 3 — Unification Projet / Chantier

## Modifications déjà appliquées (code)

### Backend — Entités
- **Projet** : champs ajoutés (adresse, latitude, longitude, superficie, conditionAcces, zoneClimatique, distanceDepotKm, nombreOuvriersPrevu, horaireTravail).
- **Document, Depense, Tache, ControleQualite, Incident, Risque** : référence `chantier` supprimée ; seul `projet` est conservé.
- **AffectationChantier** : table `affectations_projet`, champ `projet` (Projet) à la place de `chantier`.
- **AffectationEnginChantier** : table `affectations_engin_projet`, champ `projet`.
- **AffectationMateriauChantier** : table `affectations_materiau_projet`, champ `projet`.
- **ZoneChantier** : table `zones_projet`, champ `projet`.
- **InstallationChantier** : table `installations_projet`, champ `projet`.

### À faire côté backend (avant compilation complète)
- Supprimer l’entité `Chantier` et le module chantier (ChantierRepository, ChantierService, ChantierController, DTOs, Mapper).
- Document : supprimer paramètre `chantierId`, `findByChantier`, `findByChantierId` ; retirer chantierId/chantierNom des DTOs.
- Reporting : retirer ChantierStats / ChantierRepository ; adapter indicateurs par projet.
- Sécurité : retirer chantierId des requests (Incident, Risque), retirer ChantierRepository, adapter mappers/DTOs.
- Qualité : retirer chantierId du request, `findControlesByChantier` (utiliser findControlesByProjet), retirer ChantierRepository.
- Équipe : AffectationChantierRepository → findByProjetId ; EquipeService utiliser projet.
- Materiel : adapter affectations engin/materiau pour projet.
- DataInitializer : ne plus créer de chantiers.

### Base de données (si données existantes)
En environnement avec données, exécuter une migration avant de supprimer les anciennes tables/colonnes. Exemple (à adapter selon SGBD) :

```sql
-- Exemple : migration affectations_chantier → affectations_projet
-- 1. Créer nouvelle table
CREATE TABLE affectations_projet (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  projet_id BIGINT NOT NULL,
  equipe_id BIGINT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE,
  statut VARCHAR(20),
  observations TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (projet_id) REFERENCES projets(id),
  FOREIGN KEY (equipe_id) REFERENCES equipes(id)
);
-- 2. Migrer les données (projet_id = projet du chantier)
INSERT INTO affectations_projet (id, projet_id, equipe_id, date_debut, date_fin, statut, observations, created_at, updated_at)
SELECT a.id, sp.projet_id, a.equipe_id, a.date_debut, a.date_fin, a.statut, a.observations, a.created_at, a.updated_at
FROM affectations_chantier a
JOIN chantiers c ON c.id = a.chantier_id
JOIN sous_projets sp ON sp.id = c.sous_projet_id;
-- 3. Supprimer ancienne table (après vérification)
-- DROP TABLE affectations_chantier;
```

Pour **documents**, **depenses**, **taches** : la colonne `chantier_id` peut être supprimée (ALTER TABLE ... DROP COLUMN chantier_id) après sauvegarde si besoin.

### Frontend
- Supprimer les pages Chantier (liste, détail, formulaire), routes `/chantiers*`, entrée menu « Chantiers ».
- Supprimer ou adapter chantierApi, chantierSlice, types chantier.
- Remplacer toute utilisation de chantierId par projetId (documents, budget, planning, qualité, sécurité, reporting, équipes, materiel).
