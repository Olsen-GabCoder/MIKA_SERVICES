-- =============================================================================
-- Participants réunion : user_id nullable + participants manuels + correction erreur 1062
-- =============================================================================

-- 1) user_id nullable
ALTER TABLE participants_reunion MODIFY COLUMN user_id BIGINT NULL;

-- 2) Colonnes manuelles (ignorer si "Duplicate column")
ALTER TABLE participants_reunion ADD COLUMN nom_manuel VARCHAR(120) NULL;
ALTER TABLE participants_reunion ADD COLUMN prenom_manuel VARCHAR(120) NULL;

-- 3) OBLIGATOIRE : supprimer l’index UNIQUE (reunion_id, user_id)
--    Sinon : erreur 1062 à la mise à jour (Hibernate ré-insère avant de retirer l’ancienne ligne)
--    Et : plusieurs participants manuels (user_id NULL) peuvent poser problème selon le moteur.
--
-- Vérifier le nom exact :
--   SHOW INDEX FROM participants_reunion;
--
ALTER TABLE participants_reunion DROP INDEX idx_part_reunion_user;
