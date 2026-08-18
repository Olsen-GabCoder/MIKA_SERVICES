-- Migration Phase 1 : Enrichissement module Engins & Matériel
-- A exécuter sur la base PostgreSQL de production AVANT le déploiement

-- 1. Nouvelles colonnes sur la table engins
ALTER TABLE engins ADD COLUMN IF NOT EXISTS etat VARCHAR(20);
ALTER TABLE engins ADD COLUMN IF NOT EXISTS mode_acquisition VARCHAR(30);
ALTER TABLE engins ADD COLUMN IF NOT EXISTS date_mise_en_service DATE;
ALTER TABLE engins ADD COLUMN IF NOT EXISTS carburant VARCHAR(20);
ALTER TABLE engins ADD COLUMN IF NOT EXISTS puissance VARCHAR(50);
ALTER TABLE engins ADD COLUMN IF NOT EXISTS poids VARCHAR(50);
ALTER TABLE engins ADD COLUMN IF NOT EXISTS capacite VARCHAR(50);
ALTER TABLE engins ADD COLUMN IF NOT EXISTS caracteristiques TEXT;
ALTER TABLE engins ADD COLUMN IF NOT EXISTS qr_code_token VARCHAR(64);
ALTER TABLE engins ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE engins ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE engins ADD COLUMN IF NOT EXISTS position_maj TIMESTAMP WITH TIME ZONE;
ALTER TABLE engins ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index sur type (nouveau)
CREATE INDEX IF NOT EXISTS idx_engin_type ON engins(type);

-- Unique constraint sur qr_code_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_engin_qr_token ON engins(qr_code_token) WHERE qr_code_token IS NOT NULL;

-- 2. Nouvelles colonnes sur operations_maintenance
ALTER TABLE operations_maintenance ADD COLUMN IF NOT EXISTS incident_source_id BIGINT;
ALTER TABLE operations_maintenance ADD COLUMN IF NOT EXISTS plan_maintenance_id BIGINT;

-- 3. Nouvelle table plans_maintenance
CREATE TABLE IF NOT EXISTS plans_maintenance (
    id BIGSERIAL PRIMARY KEY,
    engin_id BIGINT NOT NULL REFERENCES engins(id),
    titre VARCHAR(300) NOT NULL,
    description TEXT,
    type_operation VARCHAR(30) NOT NULL,
    intervalle_jours INTEGER,
    intervalle_heures INTEGER,
    intervalle_km INTEGER,
    seuil_alerte INTEGER NOT NULL DEFAULT 30,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    derniere_execution DATE,
    dernier_compteur INTEGER,
    prochaine_echeance DATE,
    prochain_compteur INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_plan_maint_engin ON plans_maintenance(engin_id);
CREATE INDEX IF NOT EXISTS idx_plan_maint_actif ON plans_maintenance(actif);

-- 4. Générer les qr_code_token pour les engins existants qui n'en ont pas
UPDATE engins SET qr_code_token = REPLACE(gen_random_uuid()::text, '-', '')
WHERE qr_code_token IS NULL;
