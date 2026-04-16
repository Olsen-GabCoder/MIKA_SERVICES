-- ================================================================
-- MIKA Services — Initialisation Parc Matériel — Chantiers LBV
-- Source : docs/materiel_chantiers_LBV.md — mise à jour 26 mars 2026
-- Généré  : 31 mars 2026
-- ================================================================
-- MODE D'EMPLOI
--   1. Exécuter dans une transaction (BEGIN / COMMIT) pour pouvoir
--      faire un ROLLBACK si nécessaire.
--   2. Les INSERT IGNORE ignorent silencieusement les doublons sur
--      la clé unique (code pour engins, code_projet pour projets).
--      Le script est donc rejouable sans risque.
--   3. Si des projets (chantiers) existent déjà dans la base :
--      commenter ou supprimer l'ÉTAPE 1 et adapter les code_projet
--      dans les subqueries de l'ÉTAPE 3.
--   4. Adapter le champ `type` des projets (ÉTAPE 1) selon votre
--      nomenclature réelle. Valeurs TypeProjet disponibles :
--        VOIRIE, ROUTE, CHAUSSEE, PONT, OUVRAGE_ART, BATIMENT,
--        ASSAINISSEMENT, TERRASSEMENT, MIXTE, GENIE_CIVIL,
--        REHABILITATION, AMENAGEMENT, AUTRE
--   5. date_debut des affectations = '2026-01-01' par défaut.
--      À ajuster selon la date réelle de démarrage de chaque chantier.
-- ================================================================
-- ⚠️  ANOMALIES DÉTECTÉES DANS LA SOURCE (signalées inline + ANNEXE)
-- ================================================================

SET NAMES utf8mb4;

-- ================================================================
-- ÉTAPE 1 — CHANTIERS (table : projets)
-- ================================================================

INSERT IGNORE INTO projets
  (code_projet, nom, type, statut, actif, avancement_global,
   province, ville, latitude, longitude,
   created_at, updated_at)
VALUES
  -- ── Chantiers Libreville / Estuaire ──────────────────────────
  ('PROJ-JRB-2026', 'JARDIN BOTANIQUE',  'AMENAGEMENT', 'EN_COURS', 1, 0.00, 'Estuaire', 'Libreville',  0.4162,   9.4395, NOW(), NOW()),
  ('PROJ-BDM-2026', 'BORD DE MER',       'AMENAGEMENT', 'EN_COURS', 1, 0.00, 'Estuaire', 'Libreville',  0.3861,   9.4538, NOW(), NOW()),
  ('PROJ-AKI-2026', 'AKIMIDJONGONI',     'VOIRIE',      'EN_COURS', 1, 0.00, 'Estuaire', 'Libreville',  0.3754,   9.4621, NOW(), NOW()),
  ('PROJ-BEL-2026', 'BEL AIR',           'VOIRIE',      'EN_COURS', 1, 0.00, 'Estuaire', 'Libreville',  0.4251,   9.4289, NOW(), NOW()),
  ('PROJ-V5E-2026', 'VOIRIE DU 5e',      'VOIRIE',      'EN_COURS', 1, 0.00, 'Estuaire', 'Libreville',  0.4310,   9.4501, NOW(), NOW()),
  ('PROJ-CMP-2026', '1ER CAMPEMENT',     'AMENAGEMENT', 'EN_COURS', 1, 0.00, 'Estuaire', 'Libreville',  0.3500,   9.4600, NOW(), NOW()),
  ('PROJ-CHB-2026', 'CHARBONNAGE',       'GENIE_CIVIL', 'EN_COURS', 1, 0.00, 'Estuaire', 'Libreville',  0.2810,   9.5240, NOW(), NOW()),
  -- ── Chantiers péri-urbains ───────────────────────────────────
  ('PROJ-NKL-2026', 'NKOLTANG',          'VOIRIE',      'EN_COURS', 1, 0.00, 'Estuaire', 'Nkoltang',    0.2851,   9.4423, NOW(), NOW()),
  ('PROJ-BLW-2026', 'BERGE DE LA LOWE',  'AMENAGEMENT', 'EN_COURS', 1, 0.00, 'Estuaire', 'Owendo',      0.2924,   9.5187, NOW(), NOW()),
  ('PROJ-DNG-2026', 'DONGUILA',          'VOIRIE',      'EN_COURS', 1, 0.00, 'Estuaire', 'Donguila',    0.1847,   9.5781, NOW(), NOW()),
  -- ── Chantiers provinciaux ────────────────────────────────────
  ('PROJ-KNG-2026', 'VOIRIES DE KANGO',  'VOIRIE',      'EN_COURS', 1, 0.00, 'Estuaire', 'Kango',       0.1750,  10.0720, NOW(), NOW()),
  ('PROJ-LAM-2026', 'LAMBARÉNÉ',         'VOIRIE',      'EN_COURS', 1, 0.00, 'Moyen-Ogooué', 'Lambaréné', -0.6875, 10.2405, NOW(), NOW()),
  ('PROJ-LEB-2026', 'LEBAMBA',           'VOIRIE',      'EN_COURS', 1, 0.00, 'Ngounié',  'Lebamba',     -2.2000,  11.4500, NOW(), NOW());

-- ================================================================
-- ÉTAPE 2 — ENGINS (table : engins)
-- ================================================================
-- Colonnes : code, nom, type, marque, modele, immatriculation,
--            numero_serie, statut, proprietaire, est_location,
--            actif, created_at, updated_at
-- TypeEngin  : PELLETEUSE, BULLDOZER, NIVELEUSE, COMPACTEUR,
--              CAMION_BENNE, CAMION_CITERNE, GRUE, CHARGEUSE,
--              RETROCHARGEUSE, BETONNIERE, FINISSEUR,
--              GROUPE_ELECTROGENE, POMPE, FOREUSE, CONCASSEUR, AUTRE
-- StatutEngin: EN_SERVICE (tous — déjà déployés sur chantier)
-- est_location: 1 = location, 0 = propriété MIKA Services
-- ================================================================

INSERT IGNORE INTO engins
  (code, nom, type, marque, modele, immatriculation, numero_serie,
   statut, proprietaire, est_location, actif, created_at, updated_at)
VALUES

-- ── LEBAMBA (3 engins) ─────────────────────────────────────────
-- ⚠️ Aucun détail dans la source. Récap confirme : 0 MIKA / tout location.
  ('LEB-BUL-01', 'Bull',               'BULLDOZER',   NULL, NULL, NULL, NULL, 'EN_SERVICE', NULL,           1, 1, NOW(), NOW()),
  ('LEB-CB-01',  'Camion Benne',       'CAMION_BENNE', NULL, NULL, NULL, NULL, 'EN_SERVICE', NULL,           1, 1, NOW(), NOW()),
  ('LEB-PC-01',  'Pelle Hydraulique',  'PELLETEUSE',   NULL, NULL, NULL, NULL, 'EN_SERVICE', NULL,           1, 1, NOW(), NOW()),

-- ── LAMBARÉNÉ (7 engins) ───────────────────────────────────────
  ('CB0123',     'Camion Benne SHACMAN 380',             'CAMION_BENNE',   'SHACMAN',    '380',       NULL,        NULL,           'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('TR0027',     'Tractopelle SDLG B877F',               'RETROCHARGEUSE', 'SDLG',       'B877F',     NULL,        'FCS0621466',   'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('LAM-BUL-01', 'Bull CAT (location)',                  'BULLDOZER',      'CAT',        NULL,        NULL,        NULL,           'EN_SERVICE', NULL,            1, 1, NOW(), NOW()),
  ('LAM-CO-01',  'Compacteur PDM CAT BW211 D40 (loc.)', 'COMPACTEUR',     'CAT',        'BW211 D40', NULL,        NULL,           'EN_SERVICE', NULL,            1, 1, NOW(), NOW()),
  ('LAM-PIH-01', 'Pille Hydraulique CAT',               'AUTRE',          'CAT',        NULL,        NULL,        NULL,           'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('LAM-PC-01',  'Pelle Hydraulique CAT (location)',     'PELLETEUSE',     'CAT',        NULL,        NULL,        NULL,           'EN_SERVICE', NULL,            1, 1, NOW(), NOW()),
  ('LAM-PC-02',  'Pelle Hydraulique CAT (location)',     'PELLETEUSE',     'CAT',        NULL,        NULL,        NULL,           'EN_SERVICE', NULL,            1, 1, NOW(), NOW()),
  -- ⚠️ Source indique 2 lignes PELLE HYDRAULIQUE ; récap annonce 0 MIKA / 1 location.
  --    Les deux sont insérées comme location ; à vérifier sur le terrain.

-- ── VOIRIES DE KANGO (22 engins) ───────────────────────────────
  ('AB0004',     'Auto Bétonnière MERLO OBM4F',          'BETONNIERE',     'MERLO',      'OBM4F',       NULL,        'ZF1DBM083D5000931',   'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('B7026',      'Bull KOMATSU D85ESS-2A',               'BULLDOZER',      'KOMATSU',    'D85ESS-2A',   NULL,        '7429',                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CB0114',     'Camion Benne DONG FENG DFL3258A11',    'CAMION_BENNE',   'DONG FENG',  'DFL3258A11',  'JW 609 AA', NULL,                  'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CB0117',     'Camion Benne DONG FENG DFL3258A11',    'CAMION_BENNE',   'DONG FENG',  'DFL3258A11',  'JW 607 AA', NULL,                  'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CB0119',     'Camion Benne DONG FENG DFL3258A11',    'CAMION_BENNE',   'DONG FENG',  'DFL3258A11',  'JW 608 AA', NULL,                  'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  -- ⚠️ N° Parc source : CB119 → corrigé en CB0119 (cohérence série CB01XX)
  ('CB0125',     'Camion Benne SHACMAN 380',             'CAMION_BENNE',   'SHACMAN',    '380',         'LV 313 AA', NULL,                  'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CB0126',     'Camion Benne SHACMAN 380',             'CAMION_BENNE',   'SHACMAN',    '380',         'LV 314 AA', NULL,                  'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('KNG-CCE-01', 'Camion Citerne à Eau HOWO CNHTC',     'CAMION_CITERNE', 'HOWO',       'CNHTC',       'AE 289 AA', NULL,                  'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('KNG-HIB-01', 'Camion HIAB MERCEDES (location)',      'AUTRE',          'MERCEDES',   NULL,          NULL,        NULL,                  'EN_SERVICE', NULL,            1, 1, NOW(), NOW()),
  ('CH2004',     'Chargeur CAT 966F',                    'CHARGEUSE',      'CAT',        '966F',        NULL,        '9YJ00508',            'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('KNG-ELE-01', 'Chariot Élévateur MANITOU (location)', 'AUTRE',         'MANITOU',    NULL,          NULL,        NULL,                  'EN_SERVICE', NULL,            1, 1, NOW(), NOW()),
  ('CO0023',     'Compacteur RL BOMAG BW 120',           'COMPACTEUR',     'BOMAG',      'BW 120',      NULL,        '101880212408',        'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CO0006',     'Compacteur RL CAT CS-583',             'COMPACTEUR',     'CAT',        'CS-583',      NULL,        '7NN00391',            'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CO0025',     'Compacteur RL XCMG XS185JIV',          'COMPACTEUR',    'XCMG',       'XS185JIV',    NULL,        'XUG01853KPJE03966',   'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('GO0001',     'Niveleuse KOMATSU GD 661A',            'NIVELEUSE',      'KOMATSU',    'GD 661A',     NULL,        '11359',               'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('GO0009',     'Niveleuse CATERPILLAR 140G',           'NIVELEUSE',      'CATERPILLAR','140G',         NULL,        '13W694',              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC1001',     'Pelle Hydraulique CAT 320 DL',         'PELLETEUSE',     'CAT',        '320 DL',      NULL,        'KGF04037',            'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2028',     'Pelle Hydraulique KOMATSU PC210CL-10MO','PELLETEUSE',    'KOMATSU',    'PC210CL-10MO',NULL,        'N735271',             'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2023',     'Pelle Hydraulique KOMATSU PC210CL-10MO','PELLETEUSE',    'KOMATSU',    'PC210CL-10MO',NULL,        '734250',              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2032',     'Pelle Hydraulique KOMATSU PC210CL-10MO','PELLETEUSE',    'KOMATSU',    'PC210CL-10MO',NULL,        'N735688',             'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('TR0019',     'Tractopelle JCB 3DX',                  'RETROCHARGEUSE', 'JCB',       '3DX',         NULL,        'HAR3DXSUCH1608872',   'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('TR0025',     'Tractopelle SDLG BF877F',              'RETROCHARGEUSE', 'SDLG',       'BF877F',      NULL,        'VLGB577FAR0621190',   'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),

-- ── NKOLTANG (22 engins) ───────────────────────────────────────
  ('AB0003',     'Auto Bétonnière CARMIX 25FX',           'BETONNIERE',     'CARMIX',    '25FX',        NULL,        'H13575',     'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('NKL-BUL-01', 'Bull KOMATSU D85ESS',                  'BULLDOZER',      'KOMATSU',   'D85ESS',      NULL,        NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('NKL-BUL-02', 'Bull KOMATSU D85ESS',                  'BULLDOZER',      'KOMATSU',   'D85ESS',      NULL,        NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CB0116',     'Camion Benne DONG FENG',                'CAMION_BENNE',   'DONG FENG', NULL,          'JW 605 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CB0122',     'Camion Benne SHACMAN 380',              'CAMION_BENNE',   'SHACMAN',   '380',         'LV 310 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CB0124',     'Camion Benne SHACMAN 380',              'CAMION_BENNE',   'SHACMAN',   '380',         'LV 312 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CCE015',     'Camion Citerne à Eau FOTON',            'CAMION_CITERNE', 'FOTON',     NULL,          'BV 621 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CO0031',     'Compacteur RL XCMG XS18',               'COMPACTEUR',    'XCMG',       'XS18',        NULL,        NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  -- ⚠️ N° Parc CO0031 aussi attribué au BOMAG BW90 SL5 (1ER CAMPEMENT) → code alternatif CMP-CO-01 utilisé là-bas
  ('CO0021',     'Compacteur RL BOMAG BW213 D40',         'COMPACTEUR',     'BOMAG',     'BW213 D40',   NULL,        '101582441593','EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('GO0024',     'Niveleuse SDLG BF9190',                 'NIVELEUSE',      'SDLG',      'BF9190',      NULL,        '919FVRO601484','EN_SERVICE','MIKA Services', 0, 1, NOW(), NOW()),
  ('NKL-PC-01',  'Pelle Hydraulique CAT 330 DL',          'PELLETEUSE',    'CAT',        '330 DL',      NULL,        NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('NKL-PC-02',  'Pelle Hydraulique CAT 330 DL',          'PELLETEUSE',    'CAT',        '330 DL',      NULL,        NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('NKL-CB-01',  'Camion Benne DONG FENG',                'CAMION_BENNE',   'DONG FENG', NULL,          'JC 628 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('NKL-CB-02',  'Camion Benne DONG FENG',                'CAMION_BENNE',   'DONG FENG', NULL,          'MC 569 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('NKL-CB-03',  'Camion Benne SINOTRUK',                 'CAMION_BENNE',   'SINOTRUK',  NULL,          'GS 767 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('NKL-CB-04',  'Camion Benne SHACMAN',                  'CAMION_BENNE',   'SHACMAN',   NULL,          'PP 292 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('NKL-CB-05',  'Camion Benne SINOTRUK HOWO',            'CAMION_BENNE',   'SINOTRUK',  'HOWO',        'GA 498 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('NKL-CB-06',  'Camion Benne MERCEDES',                 'CAMION_BENNE',   'MERCEDES',  NULL,          'AE 417 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2027',     'Pelle Hydraulique KOMATSU PC210CL-10MO','PELLETEUSE',     'KOMATSU',   'PC210CL-10MO',NULL,        'N734867',    'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC3022',     'Pelle Hydraulique KOMATSU PC300-8MO',   'PELLETEUSE',     'KOMATSU',   'PC300-8MO',   NULL,        'N330368',    'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC3021',     'Pelle Hydraulique KOMATSU PC300-8MO',   'PELLETEUSE',     'KOMATSU',   'PC300-8MO',   NULL,        '83335',      'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('TR0020',     'Tractopelle JCB 3DX',                   'RETROCHARGEUSE', 'JCB',       '3DX',         NULL,        '303374',     'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('TR0021',     'Tractopelle SDLG F8777',                'RETROCHARGEUSE', 'SDLG',      'F8777',       NULL,        '877FC50621115','EN_SERVICE','MIKA Services', 0, 1, NOW(), NOW()),

-- ── 1ER CAMPEMENT (2 engins) ───────────────────────────────────
  ('CMP-CO-01',  'Compacteur RL BOMAG BW90 SL5',         'COMPACTEUR',     'BOMAG',     'BW90 SL5',    NULL,        NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  -- ⚠️ N° Parc source CO0031 déjà pris (NKOLTANG) → code alternatif CMP-CO-01
  ('CMP-TR-01',  'Tractopelle CAT',                       'RETROCHARGEUSE', 'CAT',       NULL,          NULL,        NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),

-- ── JARDIN BOTANIQUE (46 engins) ───────────────────────────────
  ('JRB-BUL-01', 'Bull SEM 822D',                        'BULLDOZER',      'SEM',       '822D',        NULL,        NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('B7021',      'Bull KOMATSU D85EX 15',                'BULLDOZER',      'KOMATSU',   'D85EX 15',    NULL,        '10980',             'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('B7028',      'Bull KOMATSU D85ESS',                  'BULLDOZER',      'KOMATSU',   'D85ESS',      NULL,        '7427',              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-01',  'Camion Benne SINOTRUK HOWO',           'CAMION_BENNE',   'SINOTRUK',  'HOWO',        'BU 411 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-02',  'Camion Benne SINOTRUK HOWO',           'CAMION_BENNE',   'SINOTRUK',  'HOWO',        'HN 369 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-03',  'Camion Benne MERCEDES ALTROS',         'CAMION_BENNE',   'MERCEDES',  'ALTROS',      'HY 501 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-04',  'Camion Benne SINOTRUK HOWO',           'CAMION_BENNE',   'SINOTRUK',  'HOWO',        'PN 868 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-05',  'Camion Benne SINOTRUK HOWO',           'CAMION_BENNE',   'SINOTRUK',  'HOWO',        'DB 621 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-06',  'Camion Benne DONG FENG',               'CAMION_BENNE',   'DONG FENG', NULL,          'LD 964 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-07',  'Camion Benne SINOTRUK HOWO',           'CAMION_BENNE',   'SINOTRUK',  'HOWO',        'DW 817 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-08',  'Camion Benne SINOTRUK HOWO',           'CAMION_BENNE',   'SINOTRUK',  'HOWO',        'DW 811 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-09',  'Camion Benne VOLVO',                   'CAMION_BENNE',   'VOLVO',     NULL,          'EB 591 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-10',  'Camion Benne VOLVO',                   'CAMION_BENNE',   'VOLVO',     NULL,          'CY 105 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-11',  'Camion Benne SINOTRUK HOWO',           'CAMION_BENNE',   'SINOTRUK',  'HOWO',        'FN 877 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-12',  'Camion Benne MERCEDES ACTROS',         'CAMION_BENNE',   'MERCEDES',  'ACTROS',      'EK 988 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-13',  'Camion Benne KERMAX',                  'CAMION_BENNE',   'KERMAX',    NULL,          'BH 750 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-14',  'Camion Benne SINOTRUK HOHAN',          'CAMION_BENNE',   'SINOTRUK',  'HOHAN',       'KQ 829 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CB-15',  'Camion Benne MERCEDES (location)',     'CAMION_BENNE',   'MERCEDES',  NULL,          'PN 037 AA', NULL,                'EN_SERVICE', NULL,            1, 1, NOW(), NOW()),
  ('JRB-HIB-01', 'Camion HIAB MAN (location)',           'AUTRE',          'MAN',       NULL,          'BG 364 AA', NULL,                'EN_SERVICE', NULL,            1, 1, NOW(), NOW()),
  ('JRB-HIB-02', 'Camion HIAB MERCEDES (location)',      'AUTRE',          'MERCEDES',  NULL,          'EB 729 AA', NULL,                'EN_SERVICE', NULL,            1, 1, NOW(), NOW()),
  ('CG0001',     'Camion HIAB SHACMAN (location)',       'AUTRE',          'SHACMAN',   NULL,          'MD 152 AA', NULL,                'EN_SERVICE', NULL,            1, 1, NOW(), NOW()),
  ('CP0001',     'Camion Pompe SHACMAN',                 'AUTRE',          'SHACMAN',   NULL,          'LP 629 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CT0001',     'Camion Toupie MAN TGS',                'BETONNIERE',     'MAN',       'TGS',         'LT 306 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CCE0017',    'Camion Arroseur SHACMAN',              'CAMION_CITERNE', 'SHACMAN',   NULL,          'MB 076 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CH2023',     'Chargeur JCB 455ZX',                  'CHARGEUSE',      'JCB',       '455ZX',       NULL,        'PUN455ZXVM2897182', 'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CH2024',     'Chargeur XCMG',                        'CHARGEUSE',      'XCMG',      NULL,          NULL,        NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('GO0025',     'Niveleuse SDLG G919F',                 'NIVELEUSE',      'SDLG',      'G919F',       NULL,        '601430',            'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('TE0006',     'Chariot Élévateur BOBCAT PF4',         'AUTRE',          'BOBCAT',    'PF4',         NULL,        'B1CT18053',         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CO-01',  'Compacteur RL BOMAG BW 211 D40',      'COMPACTEUR',     'BOMAG',     'BW 211 D40',  NULL,        NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CO-02',  'Compacteur RL CAT',                   'COMPACTEUR',     'CAT',       NULL,          NULL,        NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-CO-03',  'Compacteur PDM BOMAG BW 211 D40',     'COMPACTEUR',     'BOMAG',     'BW 211 D40',  NULL,        NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('GR0001',     'Grue XCMG DY100K50',                  'GRUE',           'XCMG',      'DY100K50',    'LX 513 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('GR0002',     'Grue XCMG QY100K5C',                  'GRUE',           'XCMG',      'QY100K5C',    'LX 514 AA', NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-GO-01',  'Niveleuse SEM 919',                   'NIVELEUSE',      'SEM',       '919',         NULL,        NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-PC-01',  'Pelle Hydraulique VOLVO EC220',        'PELLETEUSE',     'VOLVO',     'EC220',       NULL,        NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-PC-02',  'Pelle Hydraulique VOLVO EC210DL',      'PELLETEUSE',     'VOLVO',     'EC210DL',     NULL,        NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-PC-03',  'Pelle Hydraulique CAT 323',            'PELLETEUSE',     'CAT',       '323',         NULL,        NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2030',     'Pelle Hydraulique KOMATSU PC210',      'PELLETEUSE',     'KOMATSU',   'PC210',       NULL,        'N735483',           'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2031',     'Pelle Hydraulique KOMATSU PC210',      'PELLETEUSE',     'KOMATSU',   'PC210',       NULL,        'N735639',           'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2025',     'Pelle Hydraulique VOLVO EC210DL',      'PELLETEUSE',     'VOLVO',     'EC210DL',     NULL,        '14707932',          'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2024',     'Pelle Hydraulique VOLVO EC210DL',      'PELLETEUSE',     'VOLVO',     'EC210DL',     NULL,        '283905',            'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2035',     'Pelle Hydraulique KOMATSU PC210 LC',   'PELLETEUSE',     'KOMATSU',   'PC210 LC',    NULL,        'N736104',           'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2036',     'Pelle Hydraulique KOMATSU PC210 LC',   'PELLETEUSE',     'KOMATSU',   'PC210 LC',    NULL,        'N735545',           'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('JRB-PC-04',  'Pelle Hydraulique CAT 320 DL',         'PELLETEUSE',     'CAT',       '320 DL',      NULL,        NULL,                'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('TR0023',     'Tractopelle SDLG B877F',               'RETROCHARGEUSE', 'SDLG',      'B877F',       NULL,        'VLGB77FAR0621187',  'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  -- ⚠️ N° Parc source : TR023 → corrigé en TR0023 (cohérence série TR0XXX)
  ('TR0024',     'Tractopelle SDLG B877F',               'RETROCHARGEUSE', 'SDLG',      'B877F',       NULL,        'VLGB77HR06211189',  'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  -- ⚠️ N° Parc source : TR024 → corrigé en TR0024

-- ── BORD DE MER (4 engins — tout location) ─────────────────────
  ('BDM-CH-01',  'Chargeur XCMG (location)',              'CHARGEUSE',     'XCMG',      NULL,     NULL, NULL, 'EN_SERVICE', NULL, 1, 1, NOW(), NOW()),
  ('BDM-CH-02',  'Chargeur XCMG (location)',              'CHARGEUSE',     'XCMG',      NULL,     NULL, NULL, 'EN_SERVICE', NULL, 1, 1, NOW(), NOW()),
  ('BDM-PC-01',  'Pelle Hydraulique CAT 323DS (loc.)',    'PELLETEUSE',    'CAT',       '323DS',  NULL, NULL, 'EN_SERVICE', NULL, 1, 1, NOW(), NOW()),
  ('BDM-PC-02',  'Pelle Hydraulique CAT 322 EL (loc.)',   'PELLETEUSE',    'CAT',       '322 EL', NULL, NULL, 'EN_SERVICE', NULL, 1, 1, NOW(), NOW()),

-- ── AKIMIDJONGONI (15 engins) ──────────────────────────────────
  ('AKI-BUL-01', 'Bull CAT D7G (location)',               'BULLDOZER',      'CAT',      'D7G',   NULL,        NULL,              'EN_SERVICE', NULL,            1, 1, NOW(), NOW()),
  ('AKI-HIB-01', 'Camion HIAB MERCEDES',                  'AUTRE',          'MERCEDES', NULL,    'CS 261 AA', NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('AKI-CB-01',  'Camion Benne SINOTRUK',                 'CAMION_BENNE',   'SINOTRUK', NULL,    'KR 511 AA', NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('AKI-CB-02',  'Camion Benne SINOTRUK',                 'CAMION_BENNE',   'SINOTRUK', NULL,    'LJ 390 AA', NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('AKI-CB-03',  'Camion Benne SINOTRUK',                 'CAMION_BENNE',   'SINOTRUK', NULL,    'KD 226 AA', NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('AKI-CB-04',  'Camion Benne SINOTRUK',                 'CAMION_BENNE',   'SINOTRUK', NULL,    'JZ 932 AA', NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('AKI-CB-05',  'Camion Benne SINOTRUK',                 'CAMION_BENNE',   'SINOTRUK', NULL,    'KK 044 AA', NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  -- ⚠️ Immat KK 044 AA aussi dans VOIRIE DU 5e → probable doublon de saisie. Vérifier sur le terrain.
  ('AKI-CB-06',  'Camion Benne SINOTRUK',                 'CAMION_BENNE',   'SINOTRUK', NULL,    'KX 782 AA', NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CO0027',     'Compacteur RL BOMAG BW218',             'COMPACTEUR',     'BOMAG',    'BW218', NULL,        '8448117',         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('GO0023',     'Niveleuse SDLG G9190F',                 'NIVELEUSE',      'SDLG',     'G9190F',NULL,        'VLGG919FAP0G01369','EN_SERVICE','MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2026',     'Pelle Hydraulique KOMATSU PC210LC-10MO','PELLETEUSE',     'KOMATSU',  'PC210LC-10MO',NULL,  'N734866',         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2029',     'Pelle Hydraulique KOMATSU PC210LC-10MO','PELLETEUSE',     'KOMATSU',  'PC210LC-10MO',NULL,  'N735272',         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC3015',     'Pelle Hydraulique JCB 33830',           'PELLETEUSE',     'JCB',      '33830', NULL,        '33830',           'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('TR0026',     'Tractopelle SDLG BF877F',               'RETROCHARGEUSE', 'SDLG',     'BF877F',NULL,        '877FTR0621188',   'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('TR0022',     'Tractopelle SDLG BF877F',               'RETROCHARGEUSE', 'SDLG',     'BF877F',NULL,        '877FTR0621116',   'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),

-- ── BEL AIR (3 engins) ─────────────────────────────────────────
  ('CO0030',    'Compacteur RL BOMAG BW 90 SL-5',         'COMPACTEUR',     'BOMAG',    'BW 90 SL-5',NULL,   '003C18347410000153','EN_SERVICE','MIKA Services', 0, 1, NOW(), NOW()),
  ('TR0028',    'Tractopelle SDLG B877F',                  'RETROCHARGEUSE', 'SDLG',    'B877F',     NULL,   'VLGB877FVS0621467','EN_SERVICE','MIKA Services', 0, 1, NOW(), NOW()),
  ('BEL-PC-01', 'Pelle Hydraulique CAT 320D',              'PELLETEUSE',     'CAT',     '320D',      NULL,   NULL,               'EN_SERVICE','MIKA Services', 0, 1, NOW(), NOW()),

-- ── VOIRIE DU 5e (6 engins) ────────────────────────────────────
  ('V5E-PC-01', 'Pelle Hydraulique CAT 320 DL',            'PELLETEUSE',    'CAT',      '320 DL',   NULL,    NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('V5E-CB-01', 'Camion Benne SINOTRUK HOWO',              'CAMION_BENNE',  'SINOTRUK', 'HOWO',     'KK 044 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  -- ⚠️ Immat KK 044 AA aussi dans AKIMIDJONGONI → probable doublon. Vérifier sur le terrain.
  ('V5E-CO-01', 'Compacteur BOMAG BW211',                  'COMPACTEUR',    'BOMAG',    'BW211',    NULL,    NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('GO0028',    'Niveleuse SDLG G9190F',                   'NIVELEUSE',     'SDLG',     'G9190F',   NULL,    'VLGG919FVR0601517','EN_SERVICE','MIKA Services', 0, 1, NOW(), NOW()),
  ('V5E-CB-02', 'Camion Benne SINOTRUK HOWO',              'CAMION_BENNE',  'SINOTRUK', 'HOWO',     'HD 229 AA', NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('V5E-TR-01', 'Tractopelle JCB XC3 428 E',               'RETROCHARGEUSE','JCB',      'XC3 428 E',NULL,   NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),

-- ── BERGE DE LA LOWE (12 engins) ───────────────────────────────
  ('B7027',     'Bull KOMATSU D85ESS-2A',                  'BULLDOZER',      'KOMATSU',  'D85ESS-2A',NULL,  '7478',            'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('BLW-CB-01', 'Camion Benne HOWO',                       'CAMION_BENNE',   'HOWO',     NULL,       'HX 217 AA',NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('BLW-CB-02', 'Camion Benne SHACMAN',                    'CAMION_BENNE',   'SHACMAN',  NULL,       'JX 049 AA',NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CO0008',    'Compacteur Tamping CAT 815F',              'COMPACTEUR',     'CAT',      '815F',     NULL,  '1GN00600',        'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  -- ⚠️ Ligne "TAMPING CAT | GN009727 | 1GN00600 | CO0008" = doublon du précédent → ignorée
  ('CO0028',    'Compacteur RL BOMAG BW 218 D-5SL',        'COMPACTEUR',     'BOMAG',    'BW 218 D-5SL',NULL,'961584481116',   'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('DO0014',    'Dumper VOLVO A30E',                        'AUTRE',          'VOLVO',    'A30E',     NULL,  'VCEOA30EA00072382','EN_SERVICE','MIKA Services', 0, 1, NOW(), NOW()),
  ('DO3500',    'Dumper KOMATSU',                           'AUTRE',          'KOMATSU',  NULL,       NULL,  '735639',          'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('GO0027',    'Niveleuse SDLG G9190F',                   'NIVELEUSE',      'SDLG',     'G9190F',   NULL,  'VLGG919FCR0601516','EN_SERVICE','MIKA Services', 0, 1, NOW(), NOW()),
  ('PC02033',   'Pelle Hydraulique VOLVO EC2200FL2',        'PELLETEUSE',     'VOLVO',    'EC2200FL2',NULL,  'VCE0C6NFC00130016','EN_SERVICE','MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2034',    'Pelle Hydraulique VOLVO EC2200FL3',        'PELLETEUSE',     'VOLVO',    'EC2200FL3',NULL,  'VCE0C6NFV00130017','EN_SERVICE','MIKA Services', 0, 1, NOW(), NOW()),
  ('BLW-PC-01', 'Pelle Hydraulique CAT',                   'PELLETEUSE',     'CAT',      NULL,       NULL,  NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('B7025',     'Bull KOMATSU D85ESS',                     'BULLDOZER',      'KOMATSU',  'D85ESS',   NULL,  '5134',            'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),

-- ── DONGUILA (7 engins) ────────────────────────────────────────
  ('CB0121',    'Camion Benne DONG FENG F380',              'CAMION_BENNE',   'DONG FENG','F380',     'KS 056 AA',NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CB0120',    'Camion Benne DONG FENG F381',              'CAMION_BENNE',   'DONG FENG','F381',     'KS 055 AA',NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  -- ⚠️ N° Parc source : CB01120 (typo) → corrigé en CB0120
  ('CB0115',    'Camion Benne DONG FENG F382',              'CAMION_BENNE',   'DONG FENG','F382',     'JW 604 AA',NULL,         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CO0007',    'Compacteur PDM BOMAG BW211',               'COMPACTEUR',     'BOMAG',    'BW211',    NULL,  '10158241979',     'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('CO0026',    'Compacteur RL XCMG XS18',                  'COMPACTEUR',    'XCMG',     'XS18',     NULL,  'CRJE00684',       'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('PC2022',    'Pelle Hydraulique KOMATSU PC210LC-10MO',   'PELLETEUSE',    'KOMATSU',  'PC210LC-10MO',NULL,'N734255',         'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW()),
  ('DNG-PC-01', 'Pelle Hydraulique BRH CAT',                'PELLETEUSE',    'CAT',      NULL,       NULL,  NULL,              'EN_SERVICE', 'MIKA Services', 0, 1, NOW(), NOW());

-- ================================================================
-- ÉTAPE 3 — AFFECTATIONS ENGIN ↔ CHANTIER
--           (table : affectations_engin_projet)
-- ================================================================
-- StatutAffectation : PLANIFIEE, EN_COURS, TERMINEE, ANNULEE, SUSPENDUE
-- date_debut : '2026-01-01' par défaut → à ajuster selon la réalité.
-- ================================================================

-- LEBAMBA
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-LEB-2026'
AND e.code IN ('LEB-BUL-01','LEB-CB-01','LEB-PC-01');

-- LAMBARÉNÉ
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-LAM-2026'
AND e.code IN ('CB0123','TR0027','LAM-BUL-01','LAM-CO-01','LAM-PIH-01','LAM-PC-01','LAM-PC-02');

-- VOIRIES DE KANGO
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-KNG-2026'
AND e.code IN (
  'AB0004','B7026','CB0114','CB0117','CB0119','CB0125','CB0126',
  'KNG-CCE-01','KNG-HIB-01','CH2004','KNG-ELE-01',
  'CO0023','CO0006','CO0025',
  'GO0001','GO0009',
  'PC1001','PC2028','PC2023','PC2032',
  'TR0019','TR0025'
);

-- NKOLTANG
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-NKL-2026'
AND e.code IN (
  'AB0003','NKL-BUL-01','NKL-BUL-02',
  'CB0116','CB0122','CB0124',
  'NKL-CB-01','NKL-CB-02','NKL-CB-03','NKL-CB-04','NKL-CB-05','NKL-CB-06',
  'CCE015','CO0031','CO0021','GO0024',
  'NKL-PC-01','NKL-PC-02',
  'PC2027','PC3022','PC3021',
  'TR0020','TR0021'
);

-- 1ER CAMPEMENT
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-CMP-2026'
AND e.code IN ('CMP-CO-01','CMP-TR-01');

-- JARDIN BOTANIQUE
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-JRB-2026'
AND e.code IN (
  'JRB-BUL-01','B7021','B7028',
  'JRB-CB-01','JRB-CB-02','JRB-CB-03','JRB-CB-04','JRB-CB-05',
  'JRB-CB-06','JRB-CB-07','JRB-CB-08','JRB-CB-09','JRB-CB-10',
  'JRB-CB-11','JRB-CB-12','JRB-CB-13','JRB-CB-14','JRB-CB-15',
  'JRB-HIB-01','JRB-HIB-02','CG0001',
  'CP0001','CT0001','CCE0017',
  'CH2023','CH2024',
  'GO0025','JRB-GO-01',
  'TE0006',
  'JRB-CO-01','JRB-CO-02','JRB-CO-03',
  'GR0001','GR0002',
  'JRB-PC-01','JRB-PC-02','JRB-PC-03','JRB-PC-04',
  'PC2030','PC2031','PC2025','PC2024','PC2035','PC2036',
  'TR0023','TR0024'
);

-- BORD DE MER
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-BDM-2026'
AND e.code IN ('BDM-CH-01','BDM-CH-02','BDM-PC-01','BDM-PC-02');

-- AKIMIDJONGONI
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-AKI-2026'
AND e.code IN (
  'AKI-BUL-01','AKI-HIB-01',
  'AKI-CB-01','AKI-CB-02','AKI-CB-03','AKI-CB-04','AKI-CB-05','AKI-CB-06',
  'CO0027','GO0023',
  'PC2026','PC2029','PC3015',
  'TR0026','TR0022'
);

-- BEL AIR
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-BEL-2026'
AND e.code IN ('CO0030','TR0028','BEL-PC-01');

-- VOIRIE DU 5e
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-V5E-2026'
AND e.code IN ('V5E-PC-01','V5E-CB-01','V5E-CO-01','GO0028','V5E-CB-02','V5E-TR-01');

-- BERGE DE LA LOWE
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-BLW-2026'
AND e.code IN (
  'B7027','BLW-CB-01','BLW-CB-02',
  'CO0008','CO0028',
  'DO0014','DO3500',
  'GO0027',
  'PC02033','PC2034','BLW-PC-01',
  'B7025'
);

-- DONGUILA
INSERT IGNORE INTO affectations_engin_projet
  (projet_id, engin_id, date_debut, heures_reelles, statut, created_at, updated_at)
SELECT p.id, e.id, '2026-01-01', 0, 'EN_COURS', NOW(), NOW()
FROM projets p JOIN engins e
ON p.code_projet = 'PROJ-DNG-2026'
AND e.code IN ('CB0121','CB0120','CB0115','CO0007','CO0026','PC2022','DNG-PC-01');

-- ================================================================
-- VÉRIFICATION RAPIDE (optionnel — à exécuter après le script)
-- ================================================================
/*
SELECT
    p.nom                              AS chantier,
    COUNT(a.id)                        AS nb_engins_affectes,
    SUM(e.est_location)                AS dont_location,
    SUM(1 - e.est_location)            AS dont_mika
FROM projets p
LEFT JOIN affectations_engin_projet a ON a.projet_id = p.id AND a.statut = 'EN_COURS'
LEFT JOIN engins e ON e.id = a.engin_id
WHERE p.code_projet LIKE 'PROJ-%-2026'
GROUP BY p.nom
ORDER BY p.nom;
*/

-- ================================================================
-- ANNEXE — ANOMALIES DÉTECTÉES DANS LA SOURCE
-- ================================================================
-- 1. N° Parc CO0031 DUPLIQUÉ
--    - NKOLTANG    : XCMG XS18         → conservé : CO0031
--    - 1ER CAMPEMENT : BOMAG BW90 SL5  → renommé   : CMP-CO-01
--    À régulariser sur le terrain et dans le système.
--
-- 2. N° Parc CO0008 DUPLIQUÉ (BERGE DE LA LOWE)
--    - Ligne "COMPACTEUR TAMPING CAT 815F | N° Série 1GN00600 | CO0008"
--    - Ligne "TAMPING CAT | GN009727 | 1GN00600 | CO0008"
--    → Même engin listé deux fois avec des noms légèrement différents.
--    → Seule la première ligne a été insérée.
--
-- 3. Immatriculation KK 044 AA DUPLIQUÉE
--    - AKIMIDJONGONI : AKI-CB-05 (SINOTRUK)
--    - VOIRIE DU 5e  : V5E-CB-01 (SINOTRUK HOWO)
--    → Même immatriculation sur deux chantiers différents.
--    → Les deux ont été insérés avec des codes distincts.
--    → À vérifier absolument sur le terrain.
--
-- 4. N° Parc CB119 (KANGO)
--    → Probable typo pour CB0119. Corrigé en CB0119.
--
-- 5. N° Parc CB01120 (DONGUILA)
--    → Probable typo pour CB0120. Corrigé en CB0120.
--
-- 6. N° Parc TR023 / TR024 (JARDIN BOTANIQUE)
--    → Probable typo pour TR0023 / TR0024. Corrigés.
--
-- 7. LEBAMBA : données très incomplètes (aucun N° Parc, marque, modèle).
--    Les 3 engins sont insérés avec des codes temporaires LEB-xxx.
--    À compléter dès que les informations sont disponibles.
--
-- 8. LAMBARÉNÉ : 2 lignes PELLE HYDRAULIQUE CAT sans N° Parc/Série.
--    Le récap indique 0 MIKA / 1 location. Insérées toutes deux en
--    location (LAM-PC-01, LAM-PC-02). Peut-être un doublon.
-- ================================================================
-- TOTAL : 13 chantiers | 149 engins | 149 affectations EN_COURS
-- ================================================================

