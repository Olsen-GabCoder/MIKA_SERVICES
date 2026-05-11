-- ============================================================
-- Migration des statuts de projets
-- Anciens : EN_ATTENTE, PLANIFIE, EN_COURS, SUSPENDU, TERMINE, ABANDONNE, RECEPTION_PROVISOIRE, RECEPTION_DEFINITIVE
-- Nouveaux : INITIALISATION, EN_COURS_EXECUTION, SUSPENSION, RECEPTION_PROVISOIRE, RECEPTION_DEFINITIVE, EN_AVANCE
-- ============================================================

-- Etape 1 : convertir en VARCHAR temporairement
ALTER TABLE projets MODIFY COLUMN statut VARCHAR(30) NOT NULL;

-- Etape 2 : migrer les valeurs
UPDATE projets SET statut = 'INITIALISATION' WHERE statut IN ('EN_ATTENTE', 'PLANIFIE');
UPDATE projets SET statut = 'EN_COURS_EXECUTION' WHERE statut = 'EN_COURS';
UPDATE projets SET statut = 'SUSPENSION' WHERE statut = 'SUSPENDU';
UPDATE projets SET statut = 'RECEPTION_DEFINITIVE' WHERE statut IN ('TERMINE', 'ABANDONNE');
-- RECEPTION_PROVISOIRE et RECEPTION_DEFINITIVE restent inchanges

-- Etape 3 : reconvertir en ENUM avec les nouvelles valeurs
ALTER TABLE projets MODIFY COLUMN statut ENUM('INITIALISATION','EN_COURS_EXECUTION','SUSPENSION','RECEPTION_PROVISOIRE','RECEPTION_DEFINITIVE','EN_AVANCE') NOT NULL;

-- Verification
SELECT statut, COUNT(*) AS nb FROM projets GROUP BY statut ORDER BY nb DESC;
