-- Barème matériau PRO : dépôt + séquence références MAT-YYYY-NNNNN (MySQL)
-- À exécuter manuellement si ddl-auto: validate (schéma non géré par Hibernate).

ALTER TABLE bareme_lignes_prix ADD COLUMN depot VARCHAR(20) NULL;

CREATE TABLE bareme_mat_ref_sequence (
  annee INT NOT NULL,
  dernier_numero INT NOT NULL DEFAULT 0,
  version BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (annee)
);
