-- ============================================================
-- Seed complet du projet DONGUILA (id 47) — environnement LOCAL
-- Objectif : aucune rubrique vide pour les tests.
-- Exécution : mysql -u root -D mika_services_dev < seed_donguila_47.sql
-- ============================================================

SET @P = 47;                 -- projet DONGUILA
SET @NOW = NOW(6);

-- ─────────────────────────────────────────────
-- 0. Compléter la fiche projet
-- ─────────────────────────────────────────────
UPDATE projets SET
  responsable_projet_id = 2,
  montant_ht      = 8500000000.00,
  montant_initial = 8500000000.00,
  montant_ttc     = 10030000000.00,
  date_debut = '2026-01-15',
  date_fin   = '2027-07-15',
  updated_at = @NOW
WHERE id = @P;

-- ─────────────────────────────────────────────
-- 1. Référentiels globaux : fournisseurs & matériaux
-- ─────────────────────────────────────────────
INSERT INTO fournisseurs (created_at, updated_at, actif, code, nom, contact_nom, email, telephone, specialite, adresse, note_evaluation) VALUES
(@NOW,@NOW,1,'FRN-001','CIMGABON','ONDO Marcel','contact@cimgabon.ga','+241 062 11 22 33','Ciment et liants','Owendo, Libreville',4),
(@NOW,@NOW,1,'FRN-002','SOGAFER','MBOUMBA Chantal','ventes@sogafer.ga','+241 066 44 55 66','Aciers et fers à béton','ZI Oloumi, Libreville',5),
(@NOW,@NOW,1,'FRN-003','CARRIERES DU KOMO','NDONG Pierre','carrieres.komo@gmail.com','+241 074 77 88 99','Granulats et agrégats','Ntoum, Estuaire',4),
(@NOW,@NOW,1,'FRN-004','GABON TP DISTRIBUTION','OBAME Serge','sales@gabontp.ga','+241 065 12 34 56','Matériel et quincaillerie BTP','Akanda, Libreville',3),
(@NOW,@NOW,1,'FRN-005','PETRO SERVICES','KOUMBA Alix','logistique@petroservices.ga','+241 077 98 76 54','Carburants et lubrifiants','Port-Gentil',4);

SET @F1=(SELECT id FROM fournisseurs WHERE code='FRN-001');
SET @F2=(SELECT id FROM fournisseurs WHERE code='FRN-002');
SET @F3=(SELECT id FROM fournisseurs WHERE code='FRN-003');
SET @F4=(SELECT id FROM fournisseurs WHERE code='FRN-004');

INSERT INTO materiaux (created_at, updated_at, actif, code, nom, type, unite, prix_unitaire, stock_actuel, stock_minimum, fournisseur, description) VALUES
(@NOW,@NOW,1,'MAT-001','Ciment CEM II 42.5','CIMENT','SAC',7500.00,850.00,200.00,'CIMGABON','Sac de 50 kg pour béton structurel'),
(@NOW,@NOW,1,'MAT-002','Sable de rivière 0/4','SABLE','M3',18000.00,120.00,40.00,'CARRIERES DU KOMO','Sable lavé pour béton et mortier'),
(@NOW,@NOW,1,'MAT-003','Gravier concassé 5/15','GRAVIER','M3',22000.00,95.00,30.00,'CARRIERES DU KOMO','Granulat pour béton hydraulique'),
(@NOW,@NOW,1,'MAT-004','Fer à béton HA12','FER_A_BETON','TONNE',780000.00,14.50,5.00,'SOGAFER','Barres haute adhérence 12 m'),
(@NOW,@NOW,1,'MAT-005','Fer à béton HA8','FER_A_BETON','TONNE',760000.00,8.00,10.00,'SOGAFER','Barres HA8 pour cadres et épingles'),
(@NOW,@NOW,1,'MAT-006','Buse béton Ø800','BUSE','UNITE',145000.00,24.00,10.00,'GABON TP DISTRIBUTION','Buse armée pour assainissement pluvial'),
(@NOW,@NOW,1,'MAT-007','Géotextile 200g/m²','GEOTEXTILE','M2',1200.00,3500.00,1000.00,'GABON TP DISTRIBUTION','Non-tissé anticontaminant'),
(@NOW,@NOW,1,'MAT-008','Bitume 50/70','BITUME','TONNE',650000.00,3.00,6.00,'PETRO SERVICES','Liant hydrocarboné pour enrobé'),
(@NOW,@NOW,1,'MAT-009','Bordure T2','BORDURE','UNITE',9500.00,410.00,100.00,'GABON TP DISTRIBUTION','Bordure béton préfabriquée 1 m'),
(@NOW,@NOW,1,'MAT-010','Tuyau PVC Ø200','TUYAU_PVC','UNITE',28000.00,60.00,20.00,'GABON TP DISTRIBUTION','Tube assainissement CR8, 6 m');

SET @M1=(SELECT id FROM materiaux WHERE code='MAT-001');
SET @M2=(SELECT id FROM materiaux WHERE code='MAT-002');
SET @M3=(SELECT id FROM materiaux WHERE code='MAT-003');
SET @M4=(SELECT id FROM materiaux WHERE code='MAT-004');
SET @M6=(SELECT id FROM materiaux WHERE code='MAT-006');

-- ─────────────────────────────────────────────
-- 2. Commandes fournisseurs
-- ─────────────────────────────────────────────
INSERT INTO commandes (created_at, updated_at, reference, designation, statut, date_commande, date_livraison_prevue, date_livraison_effective, montant_total, notes, fournisseur_id, projet_id) VALUES
(@NOW,@NOW,'CMD-DNG-001','Ciment CEM II — 500 sacs','LIVREE','2026-03-02','2026-03-10','2026-03-09',3750000.00,'Livraison conforme, stockée base vie',@F1,@P),
(@NOW,@NOW,'CMD-DNG-002','Fer HA12 — 10 tonnes','EN_LIVRAISON','2026-06-20','2026-07-25',NULL,7800000.00,'Transport depuis Libreville en cours',@F2,@P),
(@NOW,@NOW,'CMD-DNG-003','Granulats 5/15 — 80 m³','CONFIRMEE','2026-07-05','2026-07-30',NULL,1760000.00,NULL,@F3,@P),
(@NOW,@NOW,'CMD-DNG-004','Buses Ø800 — 20 unités','ENVOYEE','2026-07-12','2026-08-05',NULL,2900000.00,'En attente confirmation fournisseur',@F4,@P);

SET @CMD1=(SELECT id FROM commandes WHERE reference='CMD-DNG-001');
SET @CMD2=(SELECT id FROM commandes WHERE reference='CMD-DNG-002');

-- ─────────────────────────────────────────────
-- 3. Demandes de matériel (tous les statuts) + lignes + historique
-- ─────────────────────────────────────────────
INSERT INTO demandes_materiel (created_at, updated_at, reference, statut, priorite, date_souhaitee, montant_estime, commentaire, createur_user_id, projet_id, commande_id) VALUES
(@NOW,@NOW,'DMA-DNG-001','SOUMISE','NORMALE','2026-08-10',1250000.00,'Besoin coffrage dalot OH3',2,@P,NULL),
(@NOW,@NOW,'DMA-DNG-002','EN_VALIDATION_CHANTIER','URGENTE','2026-07-28',5850000.00,'Rupture imminente ciment — bétonnage semelles',2,@P,NULL),
(@NOW,@NOW,'DMA-DNG-003','EN_VALIDATION_PROJET','NORMALE','2026-08-15',3120000.00,'Aciers pour voile de soutènement PK2+400',2,@P,NULL),
(@NOW,@NOW,'DMA-DNG-004','PRISE_EN_CHARGE','NORMALE','2026-08-01',2160000.00,'Granulats couche de base',2,@P,NULL),
(@NOW,@NOW,'DMA-DNG-005','EN_COMMANDE','URGENTE','2026-07-30',7800000.00,'Fer HA12 ferraillage pont',2,@P,@CMD2),
(@NOW,@NOW,'DMA-DNG-006','LIVRE','NORMALE','2026-03-08',3750000.00,'Ciment fondations bâtiment exploitation',2,@P,@CMD1),
(@NOW,@NOW,'DMA-DNG-007','CLOTUREE','NORMALE','2026-02-20',960000.00,'Géotextile plateforme base vie',2,@P,NULL),
(@NOW,@NOW,'DMA-DNG-008','REJETEE','NORMALE','2026-06-05',14500000.00,'Demande enrobé jugée prématurée (chaussée non prête)',2,@P,NULL),
(@NOW,@NOW,'DMA-DNG-009','EN_ATTENTE_COMPLEMENT','NORMALE','2026-08-20',1830000.00,'Préciser les métrés des tuyaux PVC',2,@P,NULL);

SET @D1=(SELECT id FROM demandes_materiel WHERE reference='DMA-DNG-001');
SET @D2=(SELECT id FROM demandes_materiel WHERE reference='DMA-DNG-002');
SET @D3=(SELECT id FROM demandes_materiel WHERE reference='DMA-DNG-003');
SET @D4=(SELECT id FROM demandes_materiel WHERE reference='DMA-DNG-004');
SET @D5=(SELECT id FROM demandes_materiel WHERE reference='DMA-DNG-005');
SET @D6=(SELECT id FROM demandes_materiel WHERE reference='DMA-DNG-006');
SET @D7=(SELECT id FROM demandes_materiel WHERE reference='DMA-DNG-007');
SET @D8=(SELECT id FROM demandes_materiel WHERE reference='DMA-DNG-008');
SET @D9=(SELECT id FROM demandes_materiel WHERE reference='DMA-DNG-009');

INSERT INTO demandes_materiel_lignes (created_at, updated_at, designation, quantite, unite, prix_unitaire_est, fournisseur_suggere, demande_id, materiau_id) VALUES
(@NOW,@NOW,'Contreplaqué coffrage 18 mm',60,'M2',15000.00,'GABON TP DISTRIBUTION',@D1,NULL),
(@NOW,@NOW,'Chevrons 8x8',40,'UNITE',8500.00,'GABON TP DISTRIBUTION',@D1,NULL),
(@NOW,@NOW,'Ciment CEM II 42.5',780,'SAC',7500.00,'CIMGABON',@D2,@M1),
(@NOW,@NOW,'Fer à béton HA12',4,'TONNE',780000.00,'SOGAFER',@D3,@M4),
(@NOW,@NOW,'Fil d''attache recuit',80,'UNITE',1500.00,'SOGAFER',@D3,NULL),
(@NOW,@NOW,'Gravier concassé 5/15',60,'M3',22000.00,'CARRIERES DU KOMO',@D4,@M3),
(@NOW,@NOW,'Sable de rivière 0/4',48,'M3',18000.00,'CARRIERES DU KOMO',@D4,@M2),
(@NOW,@NOW,'Fer à béton HA12',10,'TONNE',780000.00,'SOGAFER',@D5,@M4),
(@NOW,@NOW,'Ciment CEM II 42.5',500,'SAC',7500.00,'CIMGABON',@D6,@M1),
(@NOW,@NOW,'Géotextile 200g/m²',800,'M2',1200.00,'GABON TP DISTRIBUTION',@D7,NULL),
(@NOW,@NOW,'Enrobé bitumineux 0/10',350,'TONNE',95000.00,'COLAS GABON',@D8,NULL),
(@NOW,@NOW,'Tuyau PVC Ø200 CR8',45,'UNITE',28000.00,'GABON TP DISTRIBUTION',@D9,NULL),
(@NOW,@NOW,'Coudes PVC Ø200 45°',24,'UNITE',9500.00,'GABON TP DISTRIBUTION',@D9,NULL);

INSERT INTO demandes_materiel_historique (created_at, updated_at, date_transition, de_statut, vers_statut, commentaire, demande_id, user_id) VALUES
(@NOW,@NOW,'2026-07-18 08:30:00',NULL,'SOUMISE','Création de la demande',@D1,2),
(@NOW,@NOW,'2026-07-15 07:45:00',NULL,'SOUMISE','Création de la demande',@D2,2),
(@NOW,@NOW,'2026-07-15 10:20:00','SOUMISE','EN_VALIDATION_CHANTIER','Validation chantier — besoin confirmé',@D2,13),
(@NOW,@NOW,'2026-07-10 09:00:00',NULL,'SOUMISE','Création de la demande',@D3,2),
(@NOW,@NOW,'2026-07-10 14:10:00','SOUMISE','EN_VALIDATION_CHANTIER','OK chantier',@D3,13),
(@NOW,@NOW,'2026-07-11 08:05:00','EN_VALIDATION_CHANTIER','EN_VALIDATION_PROJET','Validation chef de projet',@D3,2),
(@NOW,@NOW,'2026-07-05 08:00:00',NULL,'SOUMISE','Création de la demande',@D4,2),
(@NOW,@NOW,'2026-07-05 11:30:00','SOUMISE','EN_VALIDATION_CHANTIER','OK chantier',@D4,13),
(@NOW,@NOW,'2026-07-06 09:15:00','EN_VALIDATION_CHANTIER','EN_VALIDATION_PROJET','Validation projet',@D4,2),
(@NOW,@NOW,'2026-07-07 10:00:00','EN_VALIDATION_PROJET','PRISE_EN_CHARGE','Prise en charge logistique',@D4,1),
(@NOW,@NOW,'2026-06-15 08:00:00',NULL,'SOUMISE','Création de la demande',@D5,2),
(@NOW,@NOW,'2026-06-15 15:00:00','SOUMISE','EN_VALIDATION_CHANTIER','Urgence confirmée',@D5,13),
(@NOW,@NOW,'2026-06-16 08:30:00','EN_VALIDATION_CHANTIER','EN_VALIDATION_PROJET','Validation projet',@D5,2),
(@NOW,@NOW,'2026-06-17 09:00:00','EN_VALIDATION_PROJET','PRISE_EN_CHARGE','Prise en charge logistique',@D5,1),
(@NOW,@NOW,'2026-06-20 10:00:00','PRISE_EN_CHARGE','EN_COMMANDE','Commande CMD-DNG-002 passée',@D5,1),
(@NOW,@NOW,'2026-02-25 08:00:00',NULL,'SOUMISE','Création de la demande',@D6,2),
(@NOW,@NOW,'2026-02-25 11:00:00','SOUMISE','EN_VALIDATION_CHANTIER','OK chantier',@D6,13),
(@NOW,@NOW,'2026-02-26 09:00:00','EN_VALIDATION_CHANTIER','EN_VALIDATION_PROJET','Validation projet',@D6,2),
(@NOW,@NOW,'2026-02-27 08:30:00','EN_VALIDATION_PROJET','PRISE_EN_CHARGE','Prise en charge logistique',@D6,1),
(@NOW,@NOW,'2026-03-02 10:00:00','PRISE_EN_CHARGE','EN_COMMANDE','Commande CMD-DNG-001 passée',@D6,1),
(@NOW,@NOW,'2026-03-09 16:00:00','EN_COMMANDE','LIVRE','Livraison réceptionnée sur site',@D6,2),
(@NOW,@NOW,'2026-02-05 08:00:00',NULL,'SOUMISE','Création de la demande',@D7,2),
(@NOW,@NOW,'2026-02-05 10:00:00','SOUMISE','EN_VALIDATION_CHANTIER','OK chantier',@D7,13),
(@NOW,@NOW,'2026-02-06 09:00:00','EN_VALIDATION_CHANTIER','EN_VALIDATION_PROJET','Validation projet',@D7,2),
(@NOW,@NOW,'2026-02-07 08:00:00','EN_VALIDATION_PROJET','PRISE_EN_CHARGE','Prise en charge',@D7,1),
(@NOW,@NOW,'2026-02-10 10:00:00','PRISE_EN_CHARGE','EN_COMMANDE','Commande locale',@D7,1),
(@NOW,@NOW,'2026-02-18 15:00:00','EN_COMMANDE','LIVRE','Livré base vie',@D7,2),
(@NOW,@NOW,'2026-02-20 09:00:00','LIVRE','CLOTUREE','Clôture après contrôle quantitatif',@D7,1),
(@NOW,@NOW,'2026-06-03 08:00:00',NULL,'SOUMISE','Création de la demande',@D8,2),
(@NOW,@NOW,'2026-06-04 10:30:00','SOUMISE','REJETEE','Rejet : couche de base non réceptionnée, demande prématurée',@D8,13),
(@NOW,@NOW,'2026-07-16 08:00:00',NULL,'SOUMISE','Création de la demande',@D9,2),
(@NOW,@NOW,'2026-07-17 09:30:00','SOUMISE','EN_ATTENTE_COMPLEMENT','Merci de joindre le métré du réseau EP',@D9,13);

-- ─────────────────────────────────────────────
-- 4. Mouvements d'engins + événements
-- ─────────────────────────────────────────────
INSERT INTO mouvements_engin (created_at, updated_at, date_demande, date_depart_confirmee, date_reception_confirmee, statut, commentaire, engin_id, initiateur_user_id, projet_destination_id, projet_origine_id) VALUES
(@NOW,@NOW,'2026-02-01 08:00:00','2026-02-03 06:30:00','2026-02-04 17:00:00','RECU','Mobilisation pelle pour terrassements généraux',1,2,@P,NULL),
(@NOW,@NOW,'2026-02-10 09:00:00','2026-02-12 07:00:00','2026-02-13 16:30:00','RECU','Bulldozer pour ouverture emprise',2,2,@P,NULL),
(@NOW,@NOW,'2026-06-25 10:00:00','2026-07-15 06:00:00',NULL,'EN_TRANSIT','Compacteur en convoi depuis Ntoum',3,2,@P,15),
(@NOW,@NOW,'2026-07-10 11:00:00',NULL,NULL,'EN_ATTENTE_DEPART','Niveleuse pour réglage couche de forme',4,2,@P,NULL),
(@NOW,@NOW,'2026-07-16 14:00:00',NULL,NULL,'EN_ATTENTE_DEPART','Chargeuse en renfort carrière',5,2,@P,NULL),
(@NOW,@NOW,'2026-05-05 09:00:00',NULL,NULL,'ANNULE','Grue mobile finalement non nécessaire (poutres coulées en place)',6,2,@P,NULL);

INSERT INTO mouvements_engin_evenements (created_at, updated_at, occurred_at, type_evenement, payload_json, auteur_user_id, mouvement_engin_id)
SELECT @NOW,@NOW,m.date_depart_confirmee,'DEPART_CONFIRME',NULL,2,m.id FROM mouvements_engin m WHERE m.projet_destination_id=@P AND m.date_depart_confirmee IS NOT NULL;
INSERT INTO mouvements_engin_evenements (created_at, updated_at, occurred_at, type_evenement, payload_json, auteur_user_id, mouvement_engin_id)
SELECT @NOW,@NOW,m.date_reception_confirmee,'RECEPTION_CONFIRMEE',NULL,2,m.id FROM mouvements_engin m WHERE m.projet_destination_id=@P AND m.date_reception_confirmee IS NOT NULL;
INSERT INTO mouvements_engin_evenements (created_at, updated_at, occurred_at, type_evenement, payload_json, auteur_user_id, mouvement_engin_id)
SELECT @NOW,@NOW,'2026-05-06 10:00:00','ANNULATION',NULL,2,m.id FROM mouvements_engin m WHERE m.projet_destination_id=@P AND m.statut='ANNULE';

-- ─────────────────────────────────────────────
-- 5. Dépenses
-- ─────────────────────────────────────────────
INSERT INTO depenses (created_at, updated_at, reference, libelle, montant, date_depense, date_validation, type, statut, fournisseur, numero_facture, observations, projet_id, valide_par_id) VALUES
(@NOW,@NOW,'DEP-DNG-001','Achat ciment fondations','3750000.00','2026-03-09','2026-03-12','MATERIAUX','PAYEE','CIMGABON','FAC-2026-0187',NULL,@P,2),
(@NOW,@NOW,'DEP-DNG-002','Gasoil engins — février','4820000.00','2026-02-28','2026-03-03','CARBURANT','PAYEE','PETRO SERVICES','FAC-2026-0201',NULL,@P,2),
(@NOW,@NOW,'DEP-DNG-003','Location compacteur V5','2600000.00','2026-04-30','2026-05-05','LOCATION_ENGIN','PAYEE','LOCA-BTP','FAC-2026-0345',NULL,@P,2),
(@NOW,@NOW,'DEP-DNG-004','Main d''œuvre — avril','9450000.00','2026-04-30','2026-05-02','MAIN_OEUVRE','PAYEE',NULL,NULL,'Paie équipes terrassement + GC',@P,2),
(@NOW,@NOW,'DEP-DNG-005','Études géotechniques complémentaires','5200000.00','2026-03-15','2026-03-20','ETUDES','VALIDEE','GEOTECH GABON','FAC-2026-0289','Sondages PK1 à PK4',@P,2),
(@NOW,@NOW,'DEP-DNG-006','Transport buses depuis Libreville','850000.00','2026-05-18',NULL,'TRANSPORT','SOUMISE','TRANS-EQUAT',NULL,NULL,@P,NULL),
(@NOW,@NOW,'DEP-DNG-007','Sous-traitance clôture base vie','3200000.00','2026-02-15','2026-02-20','SOUS_TRAITANCE','PAYEE','SARL EBANDZA','FAC-2026-0102',NULL,@P,2),
(@NOW,@NOW,'DEP-DNG-008','Gasoil engins — juin','5140000.00','2026-06-30',NULL,'CARBURANT','SOUMISE','PETRO SERVICES','FAC-2026-0512',NULL,@P,NULL),
(@NOW,@NOW,'DEP-DNG-009','Assurance tous risques chantier','7800000.00','2026-01-20','2026-01-25','ASSURANCE','PAYEE','OGAR ASSURANCES','POL-2026-045','Police annuelle TRC',@P,2),
(@NOW,@NOW,'DEP-DNG-010','Fournitures bureau chantier','420000.00','2026-07-08',NULL,'FRAIS_GENERAUX','BROUILLON',NULL,NULL,NULL,@P,NULL);

-- ─────────────────────────────────────────────
-- 6. DQE : chapitres + lignes
-- ─────────────────────────────────────────────
INSERT INTO dqe_chapitres (created_at, updated_at, numero, designation, ordre, projet_id) VALUES
(@NOW,@NOW,'100','Installation de chantier',1,@P),
(@NOW,@NOW,'200','Terrassements généraux',2,@P),
(@NOW,@NOW,'300','Assainissement et drainage',3,@P),
(@NOW,@NOW,'400','Chaussée et revêtement',4,@P),
(@NOW,@NOW,'500','Ouvrages d''art et signalisation',5,@P);

SET @C1=(SELECT id FROM dqe_chapitres WHERE projet_id=@P AND numero='100');
SET @C2=(SELECT id FROM dqe_chapitres WHERE projet_id=@P AND numero='200');
SET @C3=(SELECT id FROM dqe_chapitres WHERE projet_id=@P AND numero='300');
SET @C4=(SELECT id FROM dqe_chapitres WHERE projet_id=@P AND numero='400');
SET @C5=(SELECT id FROM dqe_chapitres WHERE projet_id=@P AND numero='500');

INSERT INTO dqe_lignes (created_at, updated_at, numero_poste, designation, unite, quantite, prix_unitaire, montant_total, avancement_pct, ordre, chapitre_id) VALUES
(@NOW,@NOW,'101','Amenée et repli du matériel','UNITE',1,250000000.00,250000000.00,100.00,1,@C1),
(@NOW,@NOW,'102','Installation base vie et bureaux','UNITE',1,180000000.00,180000000.00,100.00,2,@C1),
(@NOW,@NOW,'103','Études d''exécution et implantation','UNITE',1,95000000.00,95000000.00,85.00,3,@C1),
(@NOW,@NOW,'201','Débroussaillage et décapage','M2',185000,850.00,157250000.00,90.00,1,@C2),
(@NOW,@NOW,'202','Déblais mis en dépôt','M3',96000,4500.00,432000000.00,72.00,2,@C2),
(@NOW,@NOW,'203','Remblais compactés','M3',78000,6200.00,483600000.00,55.00,3,@C2),
(@NOW,@NOW,'301','Fossés bétonnés','UNITE',8200,38000.00,311600000.00,40.00,1,@C3),
(@NOW,@NOW,'302','Buses Ø800 posées','UNITE',64,420000.00,26880000.00,35.00,2,@C3),
(@NOW,@NOW,'303','Dalots 2x2','UNITE',6,68000000.00,408000000.00,33.00,3,@C3),
(@NOW,@NOW,'401','Couche de fondation en grave 0/31.5','M3',24000,28000.00,672000000.00,25.00,1,@C4),
(@NOW,@NOW,'402','Couche de base en grave ciment','M3',18000,42000.00,756000000.00,10.00,2,@C4),
(@NOW,@NOW,'403','Revêtement en enrobé 0/10 ép. 5 cm','TONNE',21500,98000.00,2107000000.00,0.00,3,@C4),
(@NOW,@NOW,'501','Pont sur la Donguila (35 ml)','UNITE',1,1850000000.00,1850000000.00,20.00,1,@C5),
(@NOW,@NOW,'502','Signalisation verticale','UNITE',120,185000.00,22200000.00,0.00,2,@C5),
(@NOW,@NOW,'503','Marquage au sol','UNITE',14500,4800.00,69600000.00,0.00,3,@C5);

-- ─────────────────────────────────────────────
-- 7. Zones, sous-projets, installations
-- ─────────────────────────────────────────────
INSERT INTO zones_projet (created_at, updated_at, actif, code, nom, type, niveau_danger, superficie, description, projet_id) VALUES
(@NOW,@NOW,1,'Z-BV','Base vie principale','ZONE_BASE_VIE','FAIBLE',4500.00,'Hébergement, réfectoire, infirmerie',@P),
(@NOW,@NOW,1,'Z-STK','Aire de stockage matériaux','ZONE_STOCKAGE','MOYEN',2200.00,'Stockage ciment, aciers, buses',@P),
(@NOW,@NOW,1,'Z-TRX1','Zone travaux PK0-PK4','ZONE_TRAVAUX','ELEVE',NULL,'Terrassements et assainissement',@P),
(@NOW,@NOW,1,'Z-PONT','Zone pont Donguila','ZONE_DANGEREUSE','CRITIQUE',1800.00,'Travaux en hauteur et levage — accès restreint',@P),
(@NOW,@NOW,1,'Z-PREF','Aire de préfabrication','ZONE_PREFABRICATION','MOYEN',1200.00,'Préfabrication bordures et éléments dalots',@P);

INSERT INTO sous_projets (created_at, updated_at, code, nom, statut, type_travaux, avancement_physique, date_debut, date_fin, delai_mois, montant_ht, description, projet_id, responsable_id) VALUES
(@NOW,@NOW,'SP-DNG-01','Terrassements et couche de forme','EN_COURS','TERRASSEMENT',62.00,'2026-02-01','2026-09-30',8,1072850000.00,'Section PK0 à PK8',@P,13),
(@NOW,@NOW,'SP-DNG-02','Assainissement et ouvrages hydrauliques','EN_COURS','ASSAINISSEMENT',36.00,'2026-04-01','2026-12-31',9,746480000.00,'Fossés, buses et dalots',@P,13),
(@NOW,@NOW,'SP-DNG-03','Pont sur la rivière Donguila','EN_COURS','PONT',20.00,'2026-05-15','2027-05-15',12,1850000000.00,'Ouvrage 35 ml, 2 travées',@P,2),
(@NOW,@NOW,'SP-DNG-04','Chaussée et revêtement','PLANIFIE','VOIRIE',0.00,'2026-10-01','2027-06-30',9,3535000000.00,'Fondation, base et enrobé',@P,2);

INSERT INTO installations_projet (created_at, updated_at, type, statut, date_installation, date_retrait, description, projet_id) VALUES
(@NOW,@NOW,'BASE_VIE','EN_SERVICE','2026-01-25',NULL,'Base vie 60 personnes',@P),
(@NOW,@NOW,'BUREAU_CHANTIER','EN_SERVICE','2026-01-28',NULL,'Bureaux direction de chantier + salle de réunion',@P),
(@NOW,@NOW,'GROUPE_ELECTROGENE','EN_SERVICE','2026-01-26',NULL,'Groupe 150 kVA base vie',@P),
(@NOW,@NOW,'CENTRALE_BETON','EN_COURS_INSTALLATION','2026-07-10',NULL,'Centrale 30 m³/h pour le pont',@P),
(@NOW,@NOW,'AIRE_STOCKAGE','INSTALLEE','2026-02-05',NULL,'Plateforme stabilisée 2200 m²',@P),
(@NOW,@NOW,'SIGNALISATION','EN_SERVICE','2026-02-01',NULL,'Signalisation temporaire de chantier',@P);

-- ─────────────────────────────────────────────
-- 8. Incidents, risques, contrôles qualité, révisions budget
-- ─────────────────────────────────────────────
INSERT INTO incidents (created_at, updated_at, reference, titre, type_incident, gravite, statut, date_incident, heure_incident, lieu, description, mesures_immediates, arret_travail, nb_blesses, nb_jours_arret, projet_id, declare_par_id) VALUES
(@NOW,@NOW,'INC-DNG-001','Chute de plain-pied près du dalot OH2','ACCIDENT_TRAVAIL','LEGER','CLOTURE','2026-03-14','10:30:00','PK2+150','Ouvrier glissé sur talus boueux','Premiers soins, nettoyage accès',0,1,0,@P,13),
(@NOW,@NOW,'INC-DNG-002','Presqu''accident recul camion benne','PRESQU_ACCIDENT','BENIN','CLOTURE','2026-04-22','15:45:00','Aire de stockage','Manœuvre de recul sans guide','Rappel protocole manœuvres, désignation d''un guide',0,0,0,@P,13),
(@NOW,@NOW,'INC-DNG-003','Déversement gasoil au ravitaillement','INCIDENT_ENVIRONNEMENTAL','LEGER','ACTIONS_EN_COURS','2026-06-18','08:15:00','Zone engins PK4','Fuite ~40 L lors du plein de la pelle','Terres souillées excavées et confinées',0,0,0,@P,2),
(@NOW,@NOW,'INC-DNG-004','Coupure main manutention ferraille','ACCIDENT_TRAVAIL','LEGER','EN_INVESTIGATION','2026-07-11','14:20:00','Zone préfabrication','Coupure superficielle malgré gants','Soins infirmerie, vérification état des gants',1,1,2,@P,13),
(@NOW,@NOW,'INC-DNG-005','Basculement d''une buse au déchargement','INCIDENT_MATERIEL','GRAVE','ANALYSE','2026-07-02','11:00:00','Aire de stockage','Élingage défectueux, buse endommagée','Mise au rebut élingues, contrôle du parc de levage',0,0,0,@P,2);

INSERT INTO risques (created_at, updated_at, actif, titre, niveau, probabilite, impact, zone_concernee, description, mesures_prevention, projet_id) VALUES
(@NOW,@NOW,1,'Crue de la rivière Donguila en saison des pluies','CRITIQUE',4,5,'Zone pont','Risque de submersion des batardeaux','Suivi météo quotidien, batardeaux dimensionnés crue décennale, plan d''évacuation',@P),
(@NOW,@NOW,1,'Retard d''approvisionnement en bitume','ELEVE',3,4,'Chaussée','Importation dépendante du port d''Owendo','Commande anticipée 3 mois, fournisseur de secours',@P),
(@NOW,@NOW,1,'Instabilité des talus de déblai PK5-PK6','ELEVE',3,4,'Zone travaux','Sols argileux saturés','Purge, risbermes, drainage provisoire',@P),
(@NOW,@NOW,1,'Conflit avec les riverains sur emprise','MOYEN',2,3,'Traversée village','Emprise contestée sur 300 ml','Concertation avec autorités locales, PAR actualisé',@P),
(@NOW,@NOW,1,'Panne prolongée de la centrale à béton','MOYEN',2,4,'Zone pont','Centrale unique pour le bétonnage du tablier','Contrat de maintenance, BPE de secours à Ntoum',@P);

INSERT INTO controles_qualite (created_at, updated_at, reference, titre, type_controle, statut, date_planifiee, date_realisation, zone_controlee, description, note_globale, observations, projet_id, inspecteur_id) VALUES
(@NOW,@NOW,'CQ-DNG-001','Réception plateforme couche de forme PK0-PK2','EN_COURS_EXECUTION','CONFORME','2026-05-10','2026-05-12','PK0-PK2','Essais de plaque et nivellement',4,'EV2 > 50 MPa sur tous les points',@P,27),
(@NOW,@NOW,'CQ-DNG-002','Réception ferraillage semelle pile P1','EN_COURS_EXECUTION','CONFORME','2026-06-08','2026-06-08','Zone pont','Vérification enrobages, recouvrements, calage',5,NULL,@P,27),
(@NOW,@NOW,'CQ-DNG-003','Réception granulats carrière Komo','RECEPTION_MATERIAUX','NON_CONFORME','2026-06-20','2026-06-21','Aire de stockage','Contrôle propreté et granulométrie',2,'ES insuffisant sur lot 12 — lot refusé',@P,27),
(@NOW,@NOW,'CQ-DNG-004','Audit interne système qualité chantier','AUDIT_INTERNE','EN_COURS','2026-07-15',NULL,'Bureaux chantier','Revue documentaire PAQ et fiches de contrôle',NULL,NULL,@P,25),
(@NOW,@NOW,'CQ-DNG-005','Contrôle compactage remblai PK3+200','EN_COURS_EXECUTION','PLANIFIE','2026-07-28',NULL,'PK3+200','Essais densité en place',NULL,NULL,@P,27);

INSERT INTO revisions_budget (created_at, updated_at, ancien_montant, nouveau_montant, date_revision, motif, projet_id, valide_par_id) VALUES
(@NOW,@NOW,8500000000.00,8720000000.00,'2026-04-15','Avenant n°1 : purge supplémentaire des sols compressibles PK5-PK6',@P,1),
(@NOW,@NOW,8720000000.00,8880000000.00,'2026-06-30','Avenant n°2 : protection en enrochements des culées du pont',@P,1);

-- ─────────────────────────────────────────────
-- 9. Affectations matériaux / équipe, point PV
-- ─────────────────────────────────────────────
INSERT INTO affectations_materiau_projet (created_at, updated_at, date_affectation, quantite_affectee, unite, observations, materiau_id, projet_id) VALUES
(@NOW,@NOW,'2026-03-10',500.00,'SAC','Ciment fondations bâtiment exploitation',@M1,@P),
(@NOW,@NOW,'2026-03-12',60.00,'M3','Sable pour béton de propreté',@M2,@P),
(@NOW,@NOW,'2026-03-12',45.00,'M3','Gravier pour béton de propreté',@M3,@P),
(@NOW,@NOW,'2026-06-10',6.50,'TONNE','Aciers semelle pile P1',@M4,@P),
(@NOW,@NOW,'2026-05-20',12.00,'UNITE','Buses traversée PK1+800',@M6,@P);

INSERT INTO affectations_projet (created_at, updated_at, date_debut, date_fin, statut, observations, equipe_id, projet_id) VALUES
(@NOW,@NOW,'2026-02-01',NULL,'EN_COURS','Équipe principale mobilisée sur les terrassements',1,@P);

INSERT INTO points_projet_pv (created_at, updated_at, ordre_affichage, avancement_physique_pct, avancement_financier_pct, delai_consomme_pct, resume_travaux_previsions, points_bloquants_resume, besoins_materiel, besoins_humain, propositions_amelioration, projet_id, reunion_id) VALUES
(@NOW,@NOW,1,38.50,32.20,28.00,'Terrassements PK0-PK6 en cours ; démarrage fûts de pile P1 ; prévision : poursuite remblais et pose buses PK2','Attente validation avenant n°2 ; retard livraison fer HA12','Fer HA12 (10 t), compacteur supplémentaire','1 chef d''équipe GC, 4 coffreurs','Doubler les postes de bétonnage en saison sèche',@P,2);

-- ─────────────────────────────────────────────
-- 10. Module QSHE
-- ─────────────────────────────────────────────
INSERT INTO qshe_causeries (created_at, updated_at, reference, sujet, date_causerie, heure_debut, duree_minutes, lieu, description, observations, animateur_id, projet_id) VALUES
(@NOW,@NOW,'CAU-DNG-001','Port des EPI en zone de levage','2026-07-06','07:00:00',15,'Base vie','Rappel casque, harnais et périmètre de sécurité grue','32 participants',26,@P),
(@NOW,@NOW,'CAU-DNG-002','Manœuvres et circulation des engins','2026-07-13','07:00:00',20,'Base vie','Protocole guide de manœuvre, angles morts','28 participants',26,@P),
(@NOW,@NOW,'CAU-DNG-003','Hydratation et travail sous forte chaleur','2026-07-20','07:00:00',15,'Base vie','Pauses, points d''eau, signes de coup de chaleur',NULL,26,@P);

INSERT INTO qshe_inspections (created_at, updated_at, reference, titre, type_inspection, statut, date_planifiee, date_realisation, zone_inspecte, description, score_global, observations, inspecteur_id, projet_id) VALUES
(@NOW,@NOW,'INSP-DNG-001','Inspection hebdomadaire zone pont','HEBDOMADAIRE','TERMINEE','2026-07-07','2026-07-07','Zone pont','Contrôle échafaudages, garde-corps, levage',82,'2 observations mineures levées sur place',26,@P),
(@NOW,@NOW,'INSP-DNG-002','Inspection mensuelle base vie','MENSUELLE','TERMINEE','2026-07-01','2026-07-02','Base vie','Hygiène, incendie, électricité',91,NULL,26,@P),
(@NOW,@NOW,'INSP-DNG-003','Visite d''inspection commune (VIC) carrière','VIC','PLANIFIEE','2026-07-25',NULL,'Carrière Komo',NULL,NULL,NULL,25,@P);

SET @INSP1=(SELECT id FROM qshe_inspections WHERE reference='INSP-DNG-001');

INSERT INTO qshe_non_conformites (created_at, updated_at, reference, titre, gravite, statut, type_defaut, date_detection, date_echeance_correction, zone_localisation, lot_ouvrage, description, cause_identifiee, action_corrective, est_reserve, projet_id, detecte_par_id, responsable_traitement_id) VALUES
(@NOW,@NOW,'NC-DNG-001','Enrobage insuffisant ferraillage voile C1','MAJEURE','EN_TRAITEMENT','EXECUTION','2026-06-25','2026-07-30','Zone pont','Culée C1','Enrobage mesuré 2 cm au lieu de 4 cm sur face amont','Cales oubliées sur une zone','Repositionnement des cales avant coulage',0,@P,26,2),
(@NOW,@NOW,'NC-DNG-002','Granulats lot 12 non conformes (ES)','CRITIQUE','ACTION_CORRECTIVE','MATERIAUX','2026-06-21','2026-07-15','Aire de stockage','Granulats','Équivalent de sable de 42 < seuil 50','Défaut de lavage en carrière','Retour du lot, contrôle renforcé à réception',0,@P,27,25),
(@NOW,@NOW,'NC-DNG-003','Fiche de bétonnage non renseignée','MINEURE','CLOTUREE','DOCUMENTATION','2026-05-30','2026-06-10','Zone pont','Semelle P1','Fiche de suivi de bétonnage incomplète','Oubli du chef de poste','Sensibilisation et double contrôle',0,@P,25,26);

SET @NC2=(SELECT id FROM qshe_non_conformites WHERE reference='NC-DNG-002');

INSERT INTO qshe_risques (created_at, updated_at, actif, reference, titre, categorie, gravite_brute, probabilite_brute, niveau_brut, gravite_residuelle, probabilite_residuelle, niveau_residuel, unite_travail, zone_concernee, danger_identifie, mesures_ingenierie, mesures_administratives, mesures_epi, projet_id) VALUES
(@NOW,@NOW,1,'RSK-DNG-001','Chute de hauteur — pile et tablier du pont','CHUTE_HAUTEUR',5,3,'CRITIQUE',3,2,'MOYEN','Équipe GC pont','Zone pont','Travaux à plus de 6 m','Garde-corps, filets, plateformes sécurisées','Permis travail en hauteur, vérification quotidienne','Harnais double longe',@P),
(@NOW,@NOW,1,'RSK-DNG-002','Collision engin-piéton','CIRCULATION',4,3,'ELEVE',3,2,'MOYEN','Tous','Zone travaux','Coactivité engins/personnel','Séparation des flux, voies balisées','Plan de circulation, guides de manœuvre','Gilets HV classe 2',@P),
(@NOW,@NOW,1,'RSK-DNG-003','Ensevelissement en fouille dalot','ENSEVELISSEMENT',5,2,'ELEVE',3,1,'FAIBLE','Équipe assainissement','PK1-PK3','Fouilles > 1,30 m en sols meubles','Blindage ou talutage 3H/2V','Permis de fouille, contrôle avant descente','Casque, chaussures S3',@P),
(@NOW,@NOW,1,'RSK-DNG-004','Exposition au bruit des engins','BRUIT',3,4,'ELEVE',2,3,'MOYEN','Conducteurs et manœuvres','Zone travaux','Niveau > 85 dB(A) à proximité des compacteurs','Cabines insonorisées','Rotation des postes','Bouchons moulés / casques antibruit',@P);

INSERT INTO qshe_dechets (created_at, updated_at, designation, type_dechet, quantite, unite, date_enlevement, destination, transporteur, filiere_elimination, numero_bsd, observations, projet_id) VALUES
(@NOW,@NOW,'Déblais inertes excédentaires','INERTE',1250.00,'m3','2026-06-15','Zone de dépôt agréée PK7','Interne','Réutilisation remblais secondaires',NULL,NULL,@P),
(@NOW,@NOW,'Terres souillées aux hydrocarbures','DANGEREUX',6.50,'t','2026-06-25','Centre de traitement Owendo','SOGATRA','Traitement biologique','BSD-2026-0148','Suite incident INC-DNG-003',@P),
(@NOW,@NOW,'Ferrailles et chutes d''acier','NON_DANGEREUX',3.20,'t','2026-07-05','Recycleur Libreville','TRANS-EQUAT','Recyclage métaux',NULL,NULL,@P),
(@NOW,@NOW,'Déchets ménagers base vie','NON_DANGEREUX',2.80,'t','2026-07-12','Décharge municipale Ntoum','Interne','Enfouissement',NULL,'Collecte hebdomadaire',@P);

INSERT INTO qshe_permis_travail (created_at, updated_at, reference, type_permis, statut, date_debut_validite, date_fin_validite, heure_debut, heure_fin, zone_travail, description_travaux, mesures_securite, conditions_particulieres, date_approbation, demandeur_id, autorisateur_id, projet_id) VALUES
(@NOW,@NOW,'PT-DNG-001','TRAVAIL_HAUTEUR','ACTIF','2026-07-15','2026-07-31','06:30:00','17:30:00','Zone pont — pile P1','Coffrage et ferraillage du chevêtre P1 (h = 8 m)','Harnais double longe, filets, balisage au sol','Interdiction par vent > 40 km/h','2026-07-14 16:00:00',13,26,@P),
(@NOW,@NOW,'PT-DNG-002','FOUILLE','ACTIF','2026-07-10','2026-08-10','06:30:00','17:30:00','PK2+150','Fouille dalot OH3 profondeur 2,4 m','Talutage 3H/2V, échelle d''accès, contrôle quotidien','Arrêt en cas de pluie forte','2026-07-09 15:00:00',13,26,@P),
(@NOW,@NOW,'PT-DNG-003','LEVAGE','CLOTURE','2026-06-05','2026-06-20','07:00:00','16:00:00','Zone pont','Pose des prédalles de la semelle P1','Périmètre de sécurité, élingues contrôlées, chef de manœuvre','Grue 50 t certifiée','2026-06-04 14:00:00',2,26,@P),
(@NOW,@NOW,'PT-DNG-004','PERMIS_FEU','DEMANDE','2026-07-22','2026-07-24',NULL,NULL,'Atelier mécanique','Soudure sur châssis de la niveleuse','Extincteur à poste, bâche ignifuge, surveillance 30 min après travaux',NULL,NULL,13,NULL,@P);

INSERT INTO qshe_suivi_environnemental (created_at, updated_at, date_mesure, type_mesure, parametre, valeur, unite, limite_reglementaire, conforme, localisation, observations, projet_id) VALUES
(@NOW,@NOW,'2026-06-10','QUALITE_EAU','MES rivière Donguila aval',38.0000,'mg/L',50.0000,1,'100 m aval du pont','Prélèvement mensuel',@P),
(@NOW,@NOW,'2026-07-10','QUALITE_EAU','MES rivière Donguila aval',61.0000,'mg/L',50.0000,0,'100 m aval du pont','Dépassement lié aux travaux de batardeau — filtre à paille installé',@P),
(@NOW,@NOW,'2026-07-08','BRUIT','Niveau sonore limite village',62.0000,'dB(A)',70.0000,1,'Traversée village Donguila',NULL,@P),
(@NOW,@NOW,'2026-07-08','POUSSIERE','Empoussièrement piste',3.2000,'mg/m3',5.0000,1,'PK3','Arrosage 2x/jour maintenu',@P);

SET @INC5=(SELECT id FROM incidents WHERE reference='INC-DNG-005');

INSERT INTO qshe_actions_correctives (created_at, updated_at, reference, titre, type_action, priorite, statut, source_type, source_id, source_reference, date_echeance, date_realisation, description_action, projet_id, responsable_id) VALUES
(@NOW,@NOW,'AC-DNG-001','Renforcer le contrôle des granulats à réception','ACTION_CORRECTIVE','HAUTE','EN_COURS','NON_CONFORMITE',@NC2,'NC-DNG-002','2026-07-31',NULL,'Essai ES systématique sur chaque lot livré avant déchargement',@P,27),
(@NOW,@NOW,'AC-DNG-002','Baliser la zone de rétention carburant','ACTION_CORRECTIVE','NORMALE','REALISEE','INSPECTION',@INSP1,'INSP-DNG-001','2026-07-15','2026-07-12','Bac de rétention mobile et kit antipollution au poste de ravitaillement',@P,26),
(@NOW,@NOW,'AC-DNG-003','Former les élingueurs du chantier','ACTION_PREVENTIVE','HAUTE','PLANIFIEE','INCIDENT',@INC5,'INC-DNG-005','2026-08-15',NULL,'Session de formation levage/élingage pour 8 agents',@P,26);

INSERT INTO qshe_controles_qualite (created_at, updated_at, reference, titre, type_controle, statut, resultat, date_planifiee, date_realisation, zone_controlee, lot_ouvrage, description, note_globale, observations, inspecteur_id, projet_id) VALUES
(@NOW,@NOW,'QCQ-DNG-001','Autocontrôle bétonnage semelle P1','AUTOCONTROLE','REALISE','CONFORME','2026-06-10','2026-06-10','Zone pont','Semelle P1','Affaissement, vibration, cure',4,'Slump 8 cm conforme',26,@P),
(@NOW,@NOW,'QCQ-DNG-002','Essai laboratoire béton C30/37 — 28 j','ESSAI_LABORATOIRE','REALISE','CONFORME','2026-07-08','2026-07-08','Labo chantier','Semelle P1','Écrasement éprouvettes 28 jours',5,'Rc moyen 38,2 MPa',29,@P),
(@NOW,@NOW,'QCQ-DNG-003','Réception matériaux — lot buses Ø800','RECEPTION_MATERIAUX','PLANIFIE','NON_EVALUE','2026-08-06',NULL,'Aire de stockage','Buses','Contrôle dimensionnel et aspect',NULL,NULL,27,@P);

INSERT INTO qshe_incidents (created_at, updated_at, reference, titre, type_incident, gravite, statut, date_incident, heure_incident, lieu, zone_chantier, description, description_circonstances, activite_en_cours, epi_portes, equipement_implique, mesures_conservatoires, declaration_cnss_effectuee, declaration_inspection_effectuee, declare_par_id, projet_id) VALUES
(@NOW,@NOW,'QINC-DNG-001','Coupure à la main lors de la manutention de ferraille','ACCIDENT_TRAVAIL','LEGERE','EN_INVESTIGATION','2026-07-11','14:20:00','Zone préfabrication','Z-PREF','Coupure superficielle à la main droite','Manipulation de barres HA12 sans passage par le portique','Ferraillage des cadres','Gants usés, casque, chaussures S3','Barres HA12','Soins infirmerie, remplacement du lot de gants',b'0',b'0',26,@P),
(@NOW,@NOW,'QINC-DNG-002','Presqu''accident recul camion benne','PRESQU_ACCIDENT','MINEURE','CLOTURE','2026-04-22','15:45:00','Aire de stockage','Z-STK','Recul sans guide de manœuvre à proximité de deux ouvriers','Chauffeur pressé, angle mort important','Déchargement granulats','Gilets HV','Camion benne 6x4','Rappel du protocole, guide obligatoire',b'0',b'0',26,@P),
(@NOW,@NOW,'QINC-DNG-003','Déversement de gasoil au ravitaillement','INCIDENT_ENVIRONNEMENTAL','LEGERE','INVESTIGATION_TERMINEE','2026-06-18','08:15:00','Zone engins PK4','Z-TRX1','Fuite d''environ 40 L au plein de la pelle','Pistolet défectueux sur la citerne mobile','Ravitaillement matinal','N/A','Citerne mobile 2000 L','Excavation des terres souillées, kit antipollution déployé',b'0',b'0',26,@P);

-- ─────────────────────────────────────────────
-- 11. Événements qualité (NC / PPI / RC)
-- ─────────────────────────────────────────────
INSERT INTO qualite_evenements (created_at, updated_at, reference, type_evenement, origine, statut, controle_exige_cctp, date_livraison, fournisseur_nom, numero_bc, numero_bl, ouvrage_concerne, description, createur_id, projet_id) VALUES
(@NOW,@NOW,'QEV-DNG-001','RC','RECEPTION_PRODUITS','CLOTUREE',1,'2026-03-09','CIMGABON','BC-2026-018','BL-4471','Fondations bâtiment','Réception 500 sacs de ciment — certificats CE vérifiés',25,@P),
(@NOW,@NOW,'QEV-DNG-002','NC','TRAVAUX','EN_TRAITEMENT',1,NULL,NULL,NULL,NULL,'Culée C1','Enrobage insuffisant sur ferraillage voile — cf. NC-DNG-001',26,@P),
(@NOW,@NOW,'QEV-DNG-003','PPI','TRAVAUX','EN_VERIFICATION',1,NULL,NULL,NULL,NULL,'Chevêtre P1','Point de passage inspection avant coulage du chevêtre',25,@P),
(@NOW,@NOW,'QEV-DNG-004','RC','RECEPTION_PRODUITS','DETECTEE',1,'2026-06-21','CARRIERES DU KOMO','BC-2026-032','BL-5102','Couche de base','Réception granulats lot 12 — ES non conforme, lot refusé',27,@P);

-- ─────────────────────────────────────────────
-- 12. Documents
-- ─────────────────────────────────────────────
INSERT INTO documents (created_at, updated_at, nom_fichier, nom_original, chemin_stockage, type_document, type_mime, taille_octets, description, projet_id, uploade_par_id) VALUES
(@NOW,@NOW,'dng_plan_masse_v2.pdf','Plan de masse DONGUILA v2.pdf','uploads/projets/47/dng_plan_masse_v2.pdf','PLAN','application/pdf',2458000,'Plan de masse général du projet',@P,2),
(@NOW,@NOW,'dng_paq_2026.pdf','PAQ DONGUILA 2026.pdf','uploads/projets/47/dng_paq_2026.pdf','RAPPORT','application/pdf',1820000,'Plan d''assurance qualité du chantier',@P,25),
(@NOW,@NOW,'dng_pv_reunion_s28.pdf','PV réunion chantier S28.pdf','uploads/projets/47/dng_pv_reunion_s28.pdf','PV_REUNION','application/pdf',640000,'PV de la réunion hebdomadaire semaine 28',@P,2),
(@NOW,@NOW,'dng_photo_pile_p1.jpg','Photo pile P1 juillet.jpg','uploads/projets/47/dng_photo_pile_p1.jpg','PHOTO','image/jpeg',3150000,'Avancement pile P1 — juillet 2026',@P,13);

-- ─────────────────────────────────────────────
-- 13. Partenaires et types de projet
-- ─────────────────────────────────────────────
INSERT INTO partenaires (created_at, updated_at, actif, code, nom, type, contact_principal, email, telephone, pays, adresse) VALUES
(@NOW,@NOW,1,'PART-001','SOCOBA-EDTPL','CO_TRAITANT','MOUSSAVOU Jean','contact@socoba.ga','+241 011 76 22 33','Gabon','Libreville'),
(@NOW,@NOW,1,'PART-002','VERITAS GABON','BUREAU_CONTROLE','ELLA Marc','gabon@bureauveritas.com','+241 011 44 55 66','Gabon','Libreville'),
(@NOW,@NOW,1,'PART-003','SARL EBANDZA','SOUS_TRAITANT','EBANDZA Paul','ebandza.sarl@gmail.com','+241 066 77 88 99','Gabon','Ntoum');

INSERT INTO projet_partenaires (projet_id, partenaire_id) SELECT @P, id FROM partenaires WHERE code IN ('PART-001','PART-002','PART-003');
INSERT INTO projet_types (projet_id, type_value) VALUES (@P,'ROUTE'),(@P,'PONT'),(@P,'ASSAINISSEMENT');

-- ─────────────────────────────────────────────
-- 14. Avancement des travaux (section 4 — pilotage hebdo)
--     Semaines calées sur S30-2026 : adapter si rejoué plus tard.
-- ─────────────────────────────────────────────
INSERT INTO previsions (created_at, updated_at, annee, semaine, statut, type, description, avancement_pct, projet_id) VALUES
(@NOW,@NOW,2026,28,'VALIDEE','PRODUCTION','Coffrage du chevêtre de la pile P1',70,@P),
(@NOW,@NOW,2026,29,'VALIDEE','APPROVISIONNEMENT','Réception des 10 t de fer HA12 (CMD-DNG-002)',40,@P),
(@NOW,@NOW,2026,30,'REALISEE','PRODUCTION','Bétonnage du chevêtre P1 (35 m³ C30/37)',100,@P),
(@NOW,@NOW,2026,30,'REALISEE','PRODUCTION','Pose des buses Ø800 traversée PK1+800',80,@P),
(@NOW,@NOW,2026,30,'VALIDEE','PRODUCTION','Remblais compactés PK3+000 à PK3+400',60,@P),
(@NOW,@NOW,2026,30,'VALIDEE','MATERIEL','Montage de la centrale à béton 30 m³/h',45,@P),
(@NOW,@NOW,2026,30,'REALISEE','HEBDOMADAIRE','Réunion hebdomadaire MOE / entreprise (jeudi)',100,@P),
(@NOW,@NOW,2026,31,'VALIDEE','PRODUCTION','Décoffrage chevêtre P1 et cure du béton',0,@P),
(@NOW,@NOW,2026,31,'VALIDEE','PRODUCTION','Poursuite fossés bétonnés PK2 à PK3',0,@P),
(@NOW,@NOW,2026,31,'VALIDEE','APPROVISIONNEMENT','Livraison granulats 5/15 (CMD-DNG-003)',0,@P),
(@NOW,@NOW,2026,31,'VALIDEE','RESSOURCES_HUMAINES','Mobilisation de 4 coffreurs supplémentaires',0,@P);

-- ─────────────────────────────────────────────
-- 15. Suivi mensuel CA (janv → juil 2026, montants réalistes vs budget 8,5 Mds)
--     Les mois 3 et 4 existaient déjà : mis à jour (x1000).
-- ─────────────────────────────────────────────
UPDATE ca_previsionnel_realise SET ca_previsionnel=520000000, ca_realise=505000000, ecart=-15000000, avancement_cumule=12.53, updated_at=@NOW WHERE projet_id=@P AND mois=3 AND annee=2026;
UPDATE ca_previsionnel_realise SET ca_previsionnel=450000000, ca_realise=380000000, ecart=-70000000, avancement_cumule=17.00, updated_at=@NOW WHERE projet_id=@P AND mois=4 AND annee=2026;
INSERT INTO ca_previsionnel_realise (created_at, updated_at, annee, mois, ca_previsionnel, ca_realise, ecart, avancement_cumule, projet_id) VALUES
(@NOW,@NOW,2026,1,250000000,210000000,-40000000,2.47,@P),
(@NOW,@NOW,2026,2,380000000,350000000,-30000000,6.59,@P),
(@NOW,@NOW,2026,5,560000000,540000000,-20000000,23.35,@P),
(@NOW,@NOW,2026,6,610000000,585000000,-25000000,30.24,@P),
(@NOW,@NOW,2026,7,650000000,300000000,-350000000,33.76,@P);

-- ─────────────────────────────────────────────
-- 16. Tâches Planning (miroir des prévisions S28-S31 — la synchro
--     previsions→taches ne joue que via l'API, pas en SQL direct)
-- ─────────────────────────────────────────────
INSERT INTO taches (created_at, updated_at, titre, description, statut, priorite, pourcentage_avancement, date_debut, date_echeance, date_fin, assigne_a_id, projet_id) VALUES
(@NOW,@NOW,'Coffrage du chevêtre de la pile P1','Coffrage du chevêtre de la pile P1 — reporté de S28','EN_COURS','HAUTE',70,'2026-07-06','2026-07-12',NULL,13,@P),
(@NOW,@NOW,'Réception des 10 t de fer HA12 (CMD-DNG-002)','Livraison en transit depuis Libreville — reporté de S29','EN_COURS','URGENTE',40,'2026-07-13','2026-07-19',NULL,2,@P),
(@NOW,@NOW,'Bétonnage du chevêtre P1 (35 m³ C30/37)','Coulage réalisé avec la centrale mobile','TERMINEE','HAUTE',100,'2026-07-20','2026-07-26','2026-07-21',13,@P),
(@NOW,@NOW,'Pose des buses Ø800 traversée PK1+800','8 buses posées sur 10','EN_COURS','NORMALE',80,'2026-07-20','2026-07-26',NULL,13,@P),
(@NOW,@NOW,'Remblais compactés PK3+000 à PK3+400','Compactage par couches de 30 cm','EN_COURS','NORMALE',60,'2026-07-20','2026-07-26',NULL,13,@P),
(@NOW,@NOW,'Montage de la centrale à béton 30 m³/h','Montage mécanique en cours, raccordement électrique à venir','EN_COURS','HAUTE',45,'2026-07-20','2026-07-26',NULL,2,@P),
(@NOW,@NOW,'Réunion hebdomadaire MOE / entreprise (jeudi)','PV S30 rédigé et diffusé','TERMINEE','NORMALE',100,'2026-07-23','2026-07-23','2026-07-23',2,@P),
(@NOW,@NOW,'Décoffrage chevêtre P1 et cure du béton','Prévu S31 après 7 jours de cure','A_FAIRE','NORMALE',0,'2026-07-27','2026-08-02',NULL,13,@P),
(@NOW,@NOW,'Poursuite fossés bétonnés PK2 à PK3','Objectif : 400 ml supplémentaires','A_FAIRE','NORMALE',0,'2026-07-27','2026-08-02',NULL,13,@P),
(@NOW,@NOW,'Livraison granulats 5/15 (CMD-DNG-003)','Réception et contrôle ES à l''arrivée','A_FAIRE','HAUTE',0,'2026-07-27','2026-08-02',NULL,27,@P),
(@NOW,@NOW,'Mobilisation de 4 coffreurs supplémentaires','Renfort équipe GC pont','A_FAIRE','NORMALE',0,'2026-07-27','2026-08-02',NULL,2,@P);
