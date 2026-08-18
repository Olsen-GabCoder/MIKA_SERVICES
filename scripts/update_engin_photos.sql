-- ================================================================
-- MIKA Services — Attribution des photos de profil aux engins
-- Chaque engin reçoit une photo correspondant à son type
-- Images : Wikimedia Commons (licence libre)
-- ================================================================

UPDATE engins SET photo = 'engins/pelleteuse.jpg' WHERE type = 'PELLETEUSE' AND photo IS NULL;
UPDATE engins SET photo = 'engins/bulldozer.jpg' WHERE type = 'BULLDOZER' AND photo IS NULL;
UPDATE engins SET photo = 'engins/niveleuse.jpg' WHERE type = 'NIVELEUSE' AND photo IS NULL;
UPDATE engins SET photo = 'engins/compacteur.jpg' WHERE type = 'COMPACTEUR' AND photo IS NULL;
UPDATE engins SET photo = 'engins/camion_benne.jpg' WHERE type = 'CAMION_BENNE' AND photo IS NULL;
UPDATE engins SET photo = 'engins/camion_citerne.jpg' WHERE type = 'CAMION_CITERNE' AND photo IS NULL;
UPDATE engins SET photo = 'engins/grue.jpg' WHERE type = 'GRUE' AND photo IS NULL;
UPDATE engins SET photo = 'engins/chargeuse.jpg' WHERE type = 'CHARGEUSE' AND photo IS NULL;
UPDATE engins SET photo = 'engins/retrochargeuse.jpg' WHERE type = 'RETROCHARGEUSE' AND photo IS NULL;
UPDATE engins SET photo = 'engins/betonniere.jpg' WHERE type = 'BETONNIERE' AND photo IS NULL;
UPDATE engins SET photo = 'engins/autre.jpg' WHERE type = 'AUTRE' AND photo IS NULL;
-- Types restants (pas d'engins en base pour le moment)
-- FINISSEUR, GROUPE_ELECTROGENE, POMPE, FOREUSE, CONCASSEUR → autre.jpg par défaut
UPDATE engins SET photo = 'engins/autre.jpg' WHERE type IN ('FINISSEUR','GROUPE_ELECTROGENE','POMPE','FOREUSE','CONCASSEUR') AND photo IS NULL;
