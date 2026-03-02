-- Projet manquant du PV : 02 – Voie Express Owendo (Carrefour Pompier/Carrefour Razel)
-- Montant indiqué dans le PV : 1.680.672.269 XAF HT

SET NAMES utf8mb4;

INSERT INTO projets (
    code_projet,
    numero_marche,
    nom,
    type,
    statut,
    actif,
    created_at,
    updated_at
) VALUES (
    '02/MTPC/SG/2026',
    '02/MTPC/SG/2026',
    'Travaux d''aménagement de la Voie Express Owendo : Carrefour Pompier/Carrefour Razel',
    'VOIRIE',
    'EN_ATTENTE',
    1,
    NOW(),
    NOW()
);

-- Prévision S9 pour affichage en partie 4 (semaine en cours)
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at)
VALUES (LAST_INSERT_ID(), 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW());
