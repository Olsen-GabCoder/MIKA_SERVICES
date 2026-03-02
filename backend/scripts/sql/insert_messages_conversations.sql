-- =============================================================================
-- SCRIPT 2 : INSERTION DE CONVERSATIONS RICHES — CORRIGÉ (erreur 1093)
-- Correctif : chaque parent_id utilise une table dérivée intermédiaire
--   (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp)
-- au lieu de (SELECT id FROM messages ORDER BY id DESC LIMIT 1)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- CONVERSATION A : Gabriel → Olsen — Rapport chantier Nord (3 messages)
-- ─────────────────────────────────────────────────────────────────────────────

-- A1 : Gabriel → Olsen (message initial, non lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Bonjour Olsen,\n\nJe te fais parvenir le rapport complet d\'avancement du chantier Nord pour la semaine écoulée.\n\nConcernant les fondations : les travaux de coulage du radier général sont terminés à 80 %. L\'équipe de maçonnerie a travaillé en deux rotations pour tenir le calendrier. Le dosage béton a été contrôlé par le laboratoire partenaire et est conforme aux spécifications du marché (résistance cible C25/30).\n\nPour les structures en élévation : le ferraillage du niveau RDC est en cours, avec environ 60 % de pose des armatures réalisée. Nous avons rencontré un léger retard dû à la livraison tardive des aciers HA chez le fournisseur SETRAG-BTP, mais la situation est régularisée depuis mercredi.\n\nPoints de vigilance pour la semaine prochaine :\n  - Contrôle du coffrage avant coulage du poteau P7\n  - Vérification de l\'implantation de la réservation électrique au niveau dalle\n  - Réception du béton prêt à l\'emploi prévue mardi matin (commande n°BPE-2024-114)\n\nJe reste disponible pour tout complément d\'information.\n\nCordialement,\nGabriel ONDO MVONO\nResponsable Travaux',
  NOW(), 'gabriel.ondo@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 2 DAY),
  NULL,
  2, 9, 0, NULL,
  'Rapport avancement chantier Nord — Semaine 47',
  NOW(), 'gabriel.ondo@mikaservices.com'
);

-- A2 : Olsen → Gabriel (réponse, lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Bonjour Gabriel,\n\nMerci pour ce rapport très détaillé. Je prends bonne note des points de vigilance, en particulier la réservation électrique au niveau dalle — c\'est un point que le maître d\'ouvrage avait déjà soulevé lors de la dernière réunion de chantier.\n\nPeux-tu me confirmer que le plan d\'exécution révisé (REV2) est bien pris en compte pour le poteau P7 ? Je veux m\'assurer qu\'on ne travaille pas sur l\'ancienne version qui avait un décalage de 15 cm sur l\'axe Y.\n\nPar ailleurs, pour la livraison BPE de mardi, vérifie bien que le bon de commande mentionne l\'affaissement cône d\'Abrams entre 16 et 20 cm (S4) comme prescrit dans le CCTP. On a eu des problèmes similaires sur le chantier Sud le mois dernier.\n\nBonne continuation,\nOlsen',
  NOW(), 'olsenfauldy@gmail.com',
  DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR,
  DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR,
  9, 2, 1,
  (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp),
  NULL,
  NOW(), 'olsenfauldy@gmail.com'
);

-- A3 : Gabriel → Olsen (2e réponse, non lue)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Olsen,\n\nConfirmé pour le plan REV2 — j\'ai vérifié personnellement avec le chef de chantier ce matin, c\'est bien la bonne version utilisée pour le P7. L\'écart de 15 cm a été corrigé et intégré dans le plan d\'exécution visé par le bureau de contrôle.\n\nPour le béton BPE, le bon de commande est modifié et mentionne bien la classe d\'affaissement S4. J\'ai demandé au chauffeur de présenter le bon de livraison avec le résultat du cône avant tout déchargement.\n\nJe t\'enverrai les photos du coffrage P7 avant coulage pour validation.\n\nGabriel',
  NOW(), 'gabriel.ondo@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 5 HOUR),
  NULL,
  2, 9, 0,
  (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp),
  NULL,
  NOW(), 'gabriel.ondo@mikaservices.com'
);


-- ─────────────────────────────────────────────────────────────────────────────
-- CONVERSATION B : Yves → Olsen — Non-conformités qualité (4 messages)
-- ─────────────────────────────────────────────────────────────────────────────

-- B1 : Yves → Olsen (message initial, non lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Bonjour Olsen,\n\nSuite à l\'inspection interne réalisée hier sur le lot 3, nous avons relevé deux non-conformités mineures :\n\nNC-001 : Épaisseur d\'enrobage insuffisante sur le voile V12 (mesure 2 cm constatée vs 3 cm prescrit). Le ferraillage a été posé sans cale d\'enrobage aux points d\'angle. Action corrective : mise en place immédiate des cales manquantes avant tout coulage.\n\nNC-002 : Absence de PV de réception pour la dernière livraison de sables (bon de livraison n°BL-0892). Le fournisseur n\'a pas joint le certificat de conformité matière. Action corrective : obtenir le certificat auprès de SABLIÈRE DU GABON sous 48h ou procéder à un prélèvement pour essai granulométrique.\n\nJe t\'enverrai le rapport de non-conformité officiel (formulaire QC-02) d\'ici fin de journée pour signature.\n\nCordialement,\nYves DITENGOU\nResponsable Qualité',
  NOW(), 'yves.ditengou@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 5 DAY),
  NULL,
  2, 11, 0, NULL,
  'Non-conformités NC-001 et NC-002 — Lot 3',
  NOW(), 'yves.ditengou@mikaservices.com'
);

-- B2 : Olsen → Yves (réponse rapide, lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Yves,\n\nReçu. Pour NC-001, je contacte immédiatement le chef d\'équipe pour bloquer le coulage du voile V12 jusqu\'à correction. J\'attends ta confirmation une fois les cales mises en place.\n\nPour NC-002, j\'ai déjà appelé SABLIÈRE DU GABON — ils m\'ont confirmé que le certificat sera transmis par mail d\'ici demain 9h. Si ce n\'est pas le cas, on procède au prélèvement sans attendre.\n\nEnvoie-moi le QC-02 dès qu\'il est prêt, je le signe dans la journée.\n\nMerci pour la vigilance.\nOlsen',
  NOW(), 'olsenfauldy@gmail.com',
  DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR,
  DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR,
  11, 2, 1,
  (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp),
  NULL,
  NOW(), 'olsenfauldy@gmail.com'
);

-- B3 : Yves → Olsen (suivi NC soldées, non lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Olsen,\n\nBonne nouvelle pour NC-001 : les cales d\'enrobage ont été posées sur l\'ensemble du voile V12. J\'ai procédé à un contrôle visuel et au pied à coulisse sur 12 points de mesure — toutes les valeurs sont entre 3,0 et 3,5 cm, conformes aux prescriptions. Le coulage peut reprendre.\n\nPour NC-002 : le certificat de SABLIÈRE DU GABON a bien été reçu ce matin à 8h47. Référence : CERT-SG-2024-0892. Granulométrie conforme 0/4. NC-002 soldée.\n\nJe joins le QC-02 signé de ma part. Il ne reste plus que ta signature pour clôturer officiellement les deux fiches.\n\nYves',
  NOW(), 'yves.ditengou@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 4 DAY),
  NULL,
  2, 11, 0,
  (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp),
  NULL,
  NOW(), 'yves.ditengou@mikaservices.com'
);

-- B4 : Yves → Olsen (nouveau sujet EHS, non lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Olsen,\n\nEn dehors des NC déjà traitées, je voulais te remonter un point complémentaire détecté lors de mon passage sur site ce matin.\n\nL\'aire de stockage des matériaux n\'est plus clairement délimitée depuis le déplacement de la grue la semaine dernière. Des palettes de parpaings ont été stockées dans la zone de circulation piétons, ce qui constitue un risque EHS. J\'ai demandé au chef de chantier de remédier à cela avant 16h aujourd\'hui.\n\nJe pense qu\'il serait utile de refaire un plan de masse de l\'installation de chantier actualisé et de l\'afficher à l\'entrée du site. Je peux m\'en charger si tu me confirmes les nouvelles dimensions de la zone grue.\n\nCordialement,\nYves',
  NOW(), 'yves.ditengou@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 1 DAY),
  NULL,
  2, 11, 0, NULL,
  'Point EHS — Stockage matériaux et plan de masse',
  NOW(), 'yves.ditengou@mikaservices.com'
);


-- ─────────────────────────────────────────────────────────────────────────────
-- CONVERSATION C : Ulrich → Gabriel — Planning équipes semaine 48 (3 messages)
-- ─────────────────────────────────────────────────────────────────────────────

-- C1 : Ulrich → Gabriel (non lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Bonjour Gabriel,\n\nJe te transmets la proposition de planning d\'affectation des équipes pour la semaine 48 :\n\nÉquipe A (Maçonnerie / Chef : Rodrigue) → Chantier Nord, voiles RDC + poteaux P4 à P9\nÉquipe B (Ferraillage / Chef : Arsène) → Chantier Est, dalles du niveau R+1\nÉquipe C (Coffreurs / Chef : Patrick) → Chantier Nord, préparation coffrage escalier cage 1\nÉquipe D (Manutention) → Rotation approvisionnements Chantier Nord et Est\n\nAttention : Arsène signale que deux membres de son équipe sont en arrêt maladie jusqu\'à jeudi. Il demande soit un renfort de 2 personnes de l\'équipe D, soit un décalage d\'une journée du démarrage du R+1 à vendredi.\n\nMerci de me confirmer ton choix avant ce soir 18h afin que je puisse mettre à jour les fiches d\'affectation.\n\nUlrich Landry IBOUANA\nGestionnaire RH / Planification',
  NOW(), 'ulrich.ibouana@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 6 DAY),
  NULL,
  9, 12, 0, NULL,
  'Planning affectation équipes — Semaine 48',
  NOW(), 'ulrich.ibouana@mikaservices.com'
);

-- C2 : Gabriel → Ulrich (réponse, lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Ulrich,\n\nMerci pour la proposition. Voici ma décision :\n\nPour l\'équipe B : je préfère le renfort plutôt que le décalage. On ne peut pas repousser le démarrage du R+1, on est déjà en limite de marge sur le planning contractuel. Affecte 2 personnes de l\'équipe D à Arsène du lundi au jeudi, puis ils reviennent en manutention vendredi.\n\nPour l\'escalier cage 1 : dis à Patrick qu\'il doit absolument prendre connaissance du plan de coffrage révisé (DR-COFF-005 REV1) avant de commencer. L\'ancien plan avait un angle de fuite incorrect sur le limon gauche.\n\nLe reste du planning me convient. Tu peux mettre à jour les fiches et les distribuer.\n\nGabriel',
  NOW(), 'gabriel.ondo@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 4 HOUR,
  DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 4 HOUR,
  12, 9, 1,
  (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp),
  NULL,
  NOW(), 'gabriel.ondo@mikaservices.com'
);

-- C3 : Ulrich → Gabriel (confirmation + alerte, non lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Gabriel,\n\nC\'est pris en compte. Fiches d\'affectation semaine 48 mises à jour et distribuées aux chefs d\'équipe ce soir.\n\nJ\'ai informé Arsène du renfort de 2 personnes dès lundi matin. Pour Patrick, je lui ai transmis le plan DR-COFF-005 REV1 par WhatsApp et il m\'a confirmé réception et lecture.\n\nUne dernière chose : Rodrigue me signale que la commande de coffrages métalliques prévue pour la semaine 49 n\'a toujours pas été validée côté achats. Si ce n\'est pas signé avant vendredi, on risque un arrêt de travaux pour l\'équipe A en début de semaine 49. Peux-tu relancer Olivier WEMEYI ?\n\nMerci,\nUlrich',
  NOW(), 'ulrich.ibouana@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 19 HOUR,
  NULL,
  9, 12, 0,
  (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp),
  NULL,
  NOW(), 'ulrich.ibouana@mikaservices.com'
);


-- ─────────────────────────────────────────────────────────────────────────────
-- CONVERSATION D : Jeremie → Olivier — Devis coffrages (4 messages)
-- ─────────────────────────────────────────────────────────────────────────────

-- D1 : Jeremie → Olivier (long, non lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Bonjour Olivier,\n\nJe te transmets pour validation les trois devis reçus cette semaine pour la fourniture de coffrages métalliques (commande planifiée semaine 49) :\n\n1. COFRA GABON — Réf. DEV-CG-2024-0441\n   Quantité : 120 m² panneau bois-métal + 48 ml banche standard\n   Prix unitaire panneaux : 18 500 F CFA / m²\n   Prix unitaire banche   :  9 200 F CFA / ml\n   Délai de livraison     : 5 jours ouvrés\n   Total TTC              : 2 658 600 F CFA\n   Observations : fournisseur historique, matériel neuf, bonne réactivité.\n\n2. BATIEQUIP INTERNATIONAL — Réf. DEV-BI-2024-1187\n   Quantité : identique\n   Prix unitaire panneaux : 17 200 F CFA / m²\n   Prix unitaire banche   :  8 750 F CFA / ml\n   Délai de livraison     : 8 jours ouvrés\n   Total TTC              : 2 484 000 F CFA\n   Observations : nouveau fournisseur, matériel d\'occasion remis en état.\n\n3. SETRAG-EQUIPEMENTS — Réf. DEV-SE-2024-0093\n   Quantité : identique\n   Prix unitaire panneaux : 19 000 F CFA / m²\n   Prix unitaire banche   :  9 600 F CFA / ml\n   Délai de livraison     : 3 jours ouvrés\n   Total TTC              : 2 731 200 F CFA\n   Observations : délai le plus court, matériel certifié, tarif le plus élevé.\n\nMa recommandation : COFRA GABON (option 1) — meilleur compromis coût/délai/qualité. BATIEQUIP est moins cher mais le délai de 8 jours nous mettrait en risque de rupture pour la semaine 49.\n\nMerci de valider ou contre-proposer avant vendredi 17h.\n\nCordialement,\nJeremie OMPINDI AKAGA\nService Achats',
  NOW(), 'jeremie.akaga@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 3 DAY),
  NULL,
  10, 13, 0, NULL,
  'Validation devis — Coffrages métalliques semaine 49',
  NOW(), 'jeremie.akaga@mikaservices.com'
);

-- D2 : Olivier → Jeremie (réponse, lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Jeremie,\n\nMerci pour l\'analyse comparative. Je suis d\'accord avec ta recommandation : on retient COFRA GABON.\n\nCependant, avant de valider définitivement, j\'ai besoin de deux éléments :\n1. Confirmation que les panneaux sont compatibles avec nos systèmes de serrage existants (on a du matériel PERI). Peux-tu poser la question à COFRA ?\n2. Vérification que le bon de commande BC-2024-049 pré-saisi dans notre ERP est bien à jour avec les bons codes articles COFRA.\n\nSi ces deux points sont confirmés avant demain midi, je valide et tu peux émettre le bon de commande.\n\nOlivier WEMEYI\nDirecteur Administratif',
  NOW(), 'olivier.wemeyi@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 HOUR,
  DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 HOUR,
  13, 10, 1,
  (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp),
  NULL,
  NOW(), 'olivier.wemeyi@mikaservices.com'
);

-- D3 : Jeremie → Olivier (suivi, non lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Olivier,\n\nJ\'ai les réponses aux deux points :\n\n1. Compatibilité PERI : confirmée par COFRA. Leurs panneaux utilisent le même système de serrage 15/17 compatible PERI. Pas besoin de connecteurs d\'adaptation.\n\n2. Codes articles dans l\'ERP : j\'ai vérifié le BC-2024-049 — deux articles étaient sur les anciens codes. Je les ai corrigés. Le bon est maintenant à jour et prêt à émettre.\n\nTu peux valider. Je transmets à COFRA dès réception de ta confirmation.\n\nJeremie',
  NOW(), 'jeremie.akaga@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 11 HOUR,
  NULL,
  10, 13, 0,
  (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp),
  NULL,
  NOW(), 'jeremie.akaga@mikaservices.com'
);

-- D4 : Jeremie → Olivier (relance urgente, non lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Olivier,\n\nJe me permets de relancer car je n\'ai pas eu de retour depuis mon message d\'hier. COFRA attend notre confirmation et la livraison doit être programmée cette semaine pour être reçue avant lundi.\n\nSi un point bloque la validation, dis-le moi et on trouve une solution rapidement. Sinon, un simple accord par retour de message suffira.\n\nMerci d\'avance,\nJeremie',
  NOW(), 'jeremie.akaga@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 3 HOUR),
  NULL,
  10, 13, 0,
  (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp),
  NULL,
  NOW(), 'jeremie.akaga@mikaservices.com'
);


-- ─────────────────────────────────────────────────────────────────────────────
-- CONVERSATION E : Justin → Davy — Anomalie engin ENG-07 (3 messages)
-- ─────────────────────────────────────────────────────────────────────────────

-- E1 : Justin → Davy (non lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Bonjour Davy,\n\nJe dois faire remonter un problème sur l\'engin ENG-07 (chargeuse CAT 950). Depuis lundi matin, l\'opérateur signale une vibration anormale à l\'avant lors des montées en charge supérieures à 2 tonnes. Le symptôme est intermittent mais s\'aggrave.\n\nJ\'ai consulté le carnet d\'entretien : la dernière révision complète date de 4 mois. Le filtre hydraulique aurait dû être changé il y a 6 semaines selon le planning d\'entretien préventif — ça n\'a pas été fait.\n\nJ\'ai mis l\'engin en statut "disponibilité restreinte" en attendant ton diagnostic. Peux-tu organiser une inspection technique avant jeudi ?\n\nJustin NDONG ONGUIE\nResponsable Matériel',
  NOW(), 'justin.onguie@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 4 DAY),
  NULL,
  15, 14, 0, NULL,
  'Anomalie ENG-07 — Chargeuse CAT 950',
  NOW(), 'justin.onguie@mikaservices.com'
);

-- E2 : Davy → Justin (diagnostic complet, lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Justin,\n\nJ\'ai inspecté l\'ENG-07 hier après-midi. Voici mon diagnostic :\n\nCause principale : le palier du cardan avant présente un jeu excessif (usure prématurée). Ce n\'est pas directement lié au filtre hydraulique non changé, mais combiné au niveau d\'huile hydraulique légèrement bas (85 % du niveau nominal), ça amplifie les vibrations en montée en charge.\n\nActions réalisées :\n  - Remplacement du filtre hydraulique (stock interne)\n  - Remise à niveau de l\'huile hydraulique\n  - Serrage des brides cardans avant\n\nActions à prévoir :\n  - Remplacement du palier cardan avant → pièce à commander (réf. CAT 186-3758). Délai fournisseur estimé : 5 à 7 jours ouvrés. Coût estimé : 420 000 F CFA.\n  - En attendant, je recommande de limiter les charges à 1,5 tonne max.\n\nJe te soumets une demande de commande de pièce formelle dès cet après-midi.\n\nDavy NDONG\nTechnicien Engins',
  NOW(), 'davy.ndong@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 8 HOUR,
  DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 8 HOUR,
  14, 15, 1,
  (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp),
  NULL,
  NOW(), 'davy.ndong@mikaservices.com'
);

-- E3 : Justin → Davy (validation + nouvelle demande, non lu)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES (
  'Davy,\n\nMerci pour le diagnostic rapide. La limitation à 1,5 tonne est appliquée dès maintenant — j\'ai informé l\'opérateur et mis à jour la fiche engin.\n\nPour la pièce CAT 186-3758 : j\'ai transmis ta demande au service achats (Jeremie). Il faut aussi mettre à jour le planning d\'entretien préventif dans la GMAO pour que le changement de filtre hydraulique soit automatiquement généré tous les 500h.\n\nAu passage, peux-tu vérifier l\'ENG-03 (compacteur BOMAG) la semaine prochaine ? L\'opérateur signale une difficulté à maintenir la pression de compactage en mode vibratoire. Pas urgent, mais à ne pas laisser traîner.\n\nMerci,\nJustin',
  NOW(), 'justin.onguie@mikaservices.com',
  DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 14 HOUR,
  NULL,
  15, 14, 0,
  (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp),
  NULL,
  NOW(), 'justin.onguie@mikaservices.com'
);


-- =============================================================================
-- CONVERSATIONS MASSIVES — TOUS LES UTILISATEURS, TOUS LES TYPES
-- =============================================================================

-- F : Olsen → Olivier — Coordination administrative (2 msgs)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Olivier, peux-tu valider les bons de commande en attente pour le chantier Nord avant vendredi ? Merci.', NOW(), 'olsenfauldy@gmail.com', DATE_SUB(NOW(), INTERVAL 8 DAY), NULL, 10, 2, 0, NULL, 'Validation BC chantier Nord', NOW(), 'olsenfauldy@gmail.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('C\'est fait, les trois BC sont validés. Tu peux les récupérer dans l\'ERP.', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR, 2, 10, 1, (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp), NULL, NOW(), 'olivier.wemeyi@mikaservices.com');

-- G : Ulrich → Olsen — Demande congés (3 msgs)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Bonjour Olsen, je souhaite poser 3 jours de congés du 15 au 17 décembre. Est-ce que le planning le permet ? Ulrich', NOW(), 'ulrich.ibouana@mikaservices.com', DATE_SUB(NOW(), INTERVAL 12 DAY), NULL, 2, 12, 0, NULL, 'Demande congés décembre', NOW(), 'ulrich.ibouana@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Oui, pas de souci. Pense à faire relayer par Landry pour les affectations. Bonnes vacances !', NOW(), 'olsenfauldy@gmail.com', DATE_SUB(NOW(), INTERVAL 11 DAY) + INTERVAL 14 HOUR, DATE_SUB(NOW(), INTERVAL 11 DAY) + INTERVAL 14 HOUR, 12, 2, 1, (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp), NULL, NOW(), 'olsenfauldy@gmail.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Merci beaucoup !', NOW(), 'ulrich.ibouana@mikaservices.com', DATE_SUB(NOW(), INTERVAL 11 DAY) + INTERVAL 15 HOUR, NULL, 2, 12, 0, (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp), NULL, NOW(), 'ulrich.ibouana@mikaservices.com');

-- H : Jeremie → Yves — Réception matériel qualité (2 msgs)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Yves, la livraison de ciment CEM II pour le lot 3 arrive demain 8h. Peux-tu prévoir un contrôle à réception (température, aspect) ? Jeremie', NOW(), 'jeremie.akaga@mikaservices.com', DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, 11, 13, 0, NULL, 'Contrôle réception ciment lot 3', NOW(), 'jeremie.akaga@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('OK, je serai là. Envoie-moi le bon de livraison dès réception.', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 9 HOUR, 13, 11, 1, (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp), NULL, NOW(), 'yves.ditengou@mikaservices.com');

-- I : Davy → Gabriel — Commande pièces (1 msg)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Gabriel, la commande de pièces pour ENG-07 est partie. Délai fournisseur 5-7 j. Je te tiens au courant. Davy', NOW(), 'davy.ndong@mikaservices.com', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 9, 15, 0, NULL, NULL, NOW(), 'davy.ndong@mikaservices.com');

-- J : Olsen → Justin — Statut engins (2 msgs)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Justin, besoin du statut des engins affectés au chantier Nord pour la réunion de demain. Merci.', NOW(), 'olsenfauldy@gmail.com', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR, 14, 2, 1, NULL, 'Statut engins chantier Nord', NOW(), 'olsenfauldy@gmail.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Voici le récap : ENG-01, 02, 05 opérationnels. ENG-07 en dispo restreinte (voir échange avec Davy). ENG-03 à surveiller. J\'envoie le détail par mail.', NOW(), 'justin.onguie@mikaservices.com', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 3 HOUR, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 3 HOUR, 2, 14, 1, (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp), NULL, NOW(), 'justin.onguie@mikaservices.com');

-- K : Yves → Ulrich — Effectifs contrôle (1 msg)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Ulrich, pour la semaine prochaine j\'ai besoin de 2 personnes pour les contrôles destructifs sur le lot 3. Qui peux-tu me proposer ?', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 6 DAY), NULL, 12, 11, 0, NULL, 'Renfort contrôles lot 3', NOW(), 'yves.ditengou@mikaservices.com');

-- L : Olivier → Olsen — Budget (3 msgs)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Olsen, le budget chantier Nord dépasse de 8 % le prévisionnel. On se voit jeudi pour en discuter ? Olivier', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 2, 10, 0, NULL, 'Budget chantier Nord', NOW(), 'olivier.wemeyi@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Oui, 14h en salle 2 si tu es dispo.', NOW(), 'olsenfauldy@gmail.com', DATE_SUB(NOW(), INTERVAL 9 DAY) + INTERVAL 10 HOUR, DATE_SUB(NOW(), INTERVAL 9 DAY) + INTERVAL 10 HOUR, 10, 2, 1, (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp), NULL, NOW(), 'olsenfauldy@gmail.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Parfait, à jeudi.', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 9 DAY) + INTERVAL 10 HOUR + INTERVAL 15 MINUTE, DATE_SUB(NOW(), INTERVAL 9 DAY) + INTERVAL 10 HOUR + INTERVAL 20 MINUTE, 2, 10, 1, (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp), NULL, NOW(), 'olivier.wemeyi@mikaservices.com');

-- M : Gabriel → Yves — PV coulage (1 msg)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Yves, le coulage du poteau P7 est prévu demain 6h. Tu peux établir le PV de coulage et être présent ? Gabriel', NOW(), 'gabriel.ondo@mikaservices.com', DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 11, 9, 0, NULL, 'PV coulage P7', NOW(), 'gabriel.ondo@mikaservices.com');

-- N : Olsen → Jeremie — Urgent (1 msg)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Jeremie, relance COFRA pour la livraison coffrages, c\'est bloquant pour lundi. Merci.', NOW(), 'olsenfauldy@gmail.com', DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, 13, 2, 0, NULL, 'URGENT — Livraison coffrages', NOW(), 'olsenfauldy@gmail.com');

-- O : Justin → Olsen — Rapport hebdo engins (1 msg long)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Olsen,\n\nRapport hebdo parc engins — Semaine 48.\n\nDisponibilité : 12/15 engins (80 %). ENG-07 en réparation (palier cardan), ENG-03 en diagnostic, ENG-11 en entretien planifié.\n\nIncidents : 1 panne mineure ENG-05 (filtre à air colmaté), résolue en 2h.\n\nConsommables : commande gasoil validée, livraison prévue mercredi. Filtres et huiles en stock suffisant pour 2 semaines.\n\nRecommandation : avancer la révision ENG-09 (prochaine échéance dans 120 h).\n\nJustin', NOW(), 'justin.onguie@mikaservices.com', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 2, 14, 1, NULL, 'Rapport hebdo parc engins S48', NOW(), 'justin.onguie@mikaservices.com');

-- P : Ulrich → Gabriel — Absence équipe (2 msgs)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Gabriel, Rodrigue (équipe A) sera absent jeudi et vendredi — décès dans la famille. Il faut réorganiser le planning maçonnerie.', NOW(), 'ulrich.ibouana@mikaservices.com', DATE_SUB(NOW(), INTERVAL 9 DAY), NULL, 9, 12, 0, NULL, 'Absence Rodrigue — Réorganisation', NOW(), 'ulrich.ibouana@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Merci de m\'avoir prévenu. Je décale le voile V12 à la semaine prochaine et je renforce l\'équipe B sur les dalles. Condoléances à Rodrigue.', NOW(), 'gabriel.ondo@mikaservices.com', DATE_SUB(NOW(), INTERVAL 9 DAY) + INTERVAL 5 HOUR, DATE_SUB(NOW(), INTERVAL 9 DAY) + INTERVAL 5 HOUR, 12, 9, 1, (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp), NULL, NOW(), 'gabriel.ondo@mikaservices.com');

-- Q : Jeremie → Ulrich — Formation (1 msg)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Ulrich, la formation sécurité chantier est planifiée le 20 décembre. Peux-tu confirmer la liste des participants (chefs d\'équipe) ?', NOW(), 'jeremie.akaga@mikaservices.com', DATE_SUB(NOW(), INTERVAL 14 DAY), NULL, 12, 13, 0, NULL, 'Formation sécurité 20/12', NOW(), 'jeremie.akaga@mikaservices.com');

-- R : Davy → Olsen — ENG-03 (1 msg)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Olsen, inspection ENG-03 faite. Pas de défaut majeur, réglage vibrateur à prévoir. Je programme l\'intervention vendredi. Davy', NOW(), 'davy.ndong@mikaservices.com', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 16 HOUR, NULL, 2, 15, 0, NULL, NULL, NOW(), 'davy.ndong@mikaservices.com');

-- S : Yves → Gabriel — Résultat contrôle (1 msg)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Gabriel, résultat essai compression éprouvettes P7 : 28,2 MPa à J+7. Conforme. PV envoyé au MO. Yves', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 9, 11, 0, NULL, 'Résultat compression P7', NOW(), 'yves.ditengou@mikaservices.com');

-- T : Olivier → Jeremie — Commande (2 msgs)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Jeremie, valide le BC COFRA. Livraison à confirmer pour lundi 8h.', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR), 13, 10, 1, NULL, 'Validation BC COFRA', NOW(), 'olivier.wemeyi@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Validé et transmis à COFRA. Livraison confirmée lundi 8h-10h. Jeremie', NOW(), 'jeremie.akaga@mikaservices.com', DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, 10, 13, 0, (SELECT id FROM (SELECT id FROM messages ORDER BY id DESC LIMIT 1) AS tmp), NULL, NOW(), 'jeremie.akaga@mikaservices.com');

-- U : Olsen → Yves — Point qualité (1 msg)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Yves, on fait le point qualité chantier Nord vendredi 10h ? Réunion courte, 30 min.', NOW(), 'olsenfauldy@gmail.com', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 1 HOUR, 11, 2, 1, NULL, 'Point qualité vendredi', NOW(), 'olsenfauldy@gmail.com');

-- V : Gabriel → Olivier — Demande achat (1 msg)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Olivier, j\'ai besoin d\'une autorisation d\'achat pour 50 t d\'aciers HA (diam. 12). Urgent pour le ferraillage R+1. Peux-tu débloquer ? Gabriel', NOW(), 'gabriel.ondo@mikaservices.com', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 10, 9, 0, NULL, 'Demande achat aciers HA', NOW(), 'gabriel.ondo@mikaservices.com');

-- W : Davy → Jeremie — Pièce détachée (1 msg)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Jeremie, la pièce CAT 186-3758 pour ENG-07 est bien en commande ? Justin m\'a dit qu\'il t\'a transmis la demande. Davy', NOW(), 'davy.ndong@mikaservices.com', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, NULL, 13, 15, 0, NULL, 'Commande pièce ENG-07', NOW(), 'davy.ndong@mikaservices.com');

-- X : Messages courts / rapides (plusieurs paires)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('OK merci', NOW(), 'olsenfauldy@gmail.com', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY) + INTERVAL 5 MINUTE, 9, 2, 1, NULL, NULL, NOW(), 'olsenfauldy@gmail.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Tu as la doc ?', NOW(), 'gabriel.ondo@mikaservices.com', DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, 2, 9, 0, NULL, NULL, NOW(), 'gabriel.ondo@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Réunion 14h confirmée', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY) + INTERVAL 10 MINUTE, 2, 10, 1, NULL, NULL, NOW(), 'olivier.wemeyi@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Je valide', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 8 DAY) + INTERVAL 14 HOUR, DATE_SUB(NOW(), INTERVAL 8 DAY) + INTERVAL 14 HOUR + INTERVAL 2 MINUTE, 12, 11, 1, NULL, NULL, NOW(), 'yves.ditengou@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Peux-tu me rappeler ?', NOW(), 'ulrich.ibouana@mikaservices.com', DATE_SUB(NOW(), INTERVAL 13 DAY), NULL, 13, 12, 0, NULL, NULL, NOW(), 'ulrich.ibouana@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Livraison prévue mardi', NOW(), 'jeremie.akaga@mikaservices.com', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 1 HOUR, 14, 13, 1, NULL, NULL, NOW(), 'jeremie.akaga@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Engin disponible à partir de demain', NOW(), 'justin.onguie@mikaservices.com', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 9 HOUR, NULL, 15, 14, 0, NULL, NULL, NOW(), 'justin.onguie@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('C\'est noté, merci Davy', NOW(), 'gabriel.ondo@mikaservices.com', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 30 MINUTE, 15, 9, 1, NULL, NULL, NOW(), 'gabriel.ondo@mikaservices.com');

-- Y : Plus de conversations croisées (tous types)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Bonjour, le PV de réunion de chantier de la semaine dernière est en pièce jointe. Cordialement.', NOW(), 'gabriel.ondo@mikaservices.com', DATE_SUB(NOW(), INTERVAL 20 DAY), NULL, 11, 9, 0, NULL, 'PV réunion chantier', NOW(), 'gabriel.ondo@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Rappel : échéance rapport mensuel demain 18h. Merci.', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY) + INTERVAL 2 HOUR, 2, 10, 1, NULL, 'Rappel rapport mensuel', NOW(), 'olivier.wemeyi@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Les certificats qualité du lot 3 sont conformes. Je les archive aujourd\'hui. Yves', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 22 DAY), NULL, 2, 11, 0, NULL, 'Certificats qualité lot 3', NOW(), 'yves.ditengou@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Nouvelle grille des effectifs semaine 49 envoyée. Ulrich', NOW(), 'ulrich.ibouana@mikaservices.com', DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 17 HOUR, DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 18 HOUR, 9, 12, 1, NULL, 'Effectifs S49', NOW(), 'ulrich.ibouana@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Devis reçu de BATIEQUIP. Je te l\'envoie pour comparaison. Jeremie', NOW(), 'jeremie.akaga@mikaservices.com', DATE_SUB(NOW(), INTERVAL 25 DAY), NULL, 10, 13, 0, NULL, 'Devis BATIEQUIP', NOW(), 'jeremie.akaga@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('ENG-05 réparé, back en service. Justin', NOW(), 'justin.onguie@mikaservices.com', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 11 HOUR, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 12 HOUR, 2, 14, 1, NULL, NULL, NOW(), 'justin.onguie@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Contrôle périodique ENG-02 effectué. RAS. Davy', NOW(), 'davy.ndong@mikaservices.com', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 14, 15, 0, NULL, 'Contrôle ENG-02', NOW(), 'davy.ndong@mikaservices.com');

-- Z : Série messages récents (inbox très chargée)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Point sécurité à 9h demain, salle 1.', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, NULL, 2, 11, 0, NULL, NULL, NOW(), 'yves.ditengou@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Réunion chantier Nord reportée à jeudi 14h.', NOW(), 'gabriel.ondo@mikaservices.com', DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 11 HOUR), 2, 9, 1, NULL, 'Report réunion', NOW(), 'gabriel.ondo@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Validation budget Q4 reçue. On peut lancer les commandes.', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 8 HOUR), NULL, 9, 10, 0, NULL, 'Budget Q4', NOW(), 'olivier.wemeyi@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('2 personnes en renfort pour contrôles à partir de lundi. Ulrich', NOW(), 'ulrich.ibouana@mikaservices.com', DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 29 DAY), 11, 12, 1, NULL, 'Renfort contrôles', NOW(), 'ulrich.ibouana@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Commande COFRA confirmée. BL à réception. Jeremie', NOW(), 'jeremie.akaga@mikaservices.com', DATE_SUB(NOW(), INTERVAL 6 HOUR), NULL, 10, 13, 0, NULL, NULL, NOW(), 'jeremie.akaga@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Rappel entretien ENG-09 à planifier. Justin', NOW(), 'justin.onguie@mikaservices.com', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 14 HOUR, NULL, 15, 14, 0, NULL, 'Entretien ENG-09', NOW(), 'justin.onguie@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Pièce CAT 186-3758 en route, ETA 5 jours. Davy', NOW(), 'davy.ndong@mikaservices.com', DATE_SUB(NOW(), INTERVAL 10 HOUR), NULL, 14, 15, 0, NULL, NULL, NOW(), 'davy.ndong@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Merci pour le rapport. On en parle vendredi. Olsen', NOW(), 'olsenfauldy@gmail.com', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR + INTERVAL 5 MINUTE, 14, 2, 1, NULL, NULL, NOW(), 'olsenfauldy@gmail.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('OK pour 14h jeudi. Gabriel', NOW(), 'gabriel.ondo@mikaservices.com', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 16 HOUR, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 16 HOUR, 12, 9, 1, NULL, NULL, NOW(), 'gabriel.ondo@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Certificat SABLIÈRE reçu et classé. Yves', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 28 DAY), NULL, 13, 11, 0, NULL, 'Certificat sables', NOW(), 'yves.ditengou@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Réunion reportée à 15h. Olivier', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR, 13, 10, 1, NULL, NULL, NOW(), 'olivier.wemeyi@mikaservices.com');

-- =============================================================================
-- BLOC SUPPLÉMENTAIRE — INBOX TRÈS CHARGÉES (tous utilisateurs)
-- =============================================================================

-- AA–AK : Messages variés (sujets, sans sujet, lu/non lu, anciens/récents)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Demande de congé du 20 au 22 décembre. Merci de valider. Ulrich', NOW(), 'ulrich.ibouana@mikaservices.com', DATE_SUB(NOW(), INTERVAL 35 DAY), NULL, 2, 12, 0, NULL, 'Congés décembre', NOW(), 'ulrich.ibouana@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Planning semaine 50 validé. Disponible sur le drive. Gabriel', NOW(), 'gabriel.ondo@mikaservices.com', DATE_SUB(NOW(), INTERVAL 33 DAY), DATE_SUB(NOW(), INTERVAL 33 DAY) + INTERVAL 3 HOUR, 12, 9, 1, NULL, NULL, NOW(), 'gabriel.ondo@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Rappel : inventaire stock chantier Nord demain 7h. Yves', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 19 DAY), NULL, 9, 11, 0, NULL, 'Inventaire stock', NOW(), 'yves.ditengou@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Devis aciers reçu. Je te l\'envoie pour validation. Jeremie', NOW(), 'jeremie.akaga@mikaservices.com', DATE_SUB(NOW(), INTERVAL 17 DAY) + INTERVAL 14 HOUR, DATE_SUB(NOW(), INTERVAL 17 DAY) + INTERVAL 15 HOUR, 9, 13, 1, NULL, 'Devis aciers HA', NOW(), 'jeremie.akaga@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('ENG-07 : pièce commandée, en attente livraison. Justin', NOW(), 'justin.onguie@mikaservices.com', DATE_SUB(NOW(), INTERVAL 14 DAY), NULL, 11, 14, 0, NULL, NULL, NOW(), 'justin.onguie@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Contrôle hydraulique ENG-07 terminé. Filtre et huile OK. Davy', NOW(), 'davy.ndong@mikaservices.com', DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 12 DAY) + INTERVAL 10 HOUR, 9, 15, 1, NULL, 'ENG-07 hydraulique', NOW(), 'davy.ndong@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Réunion budgétaire reportée au 23. Olivier', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 40 DAY) + INTERVAL 1 HOUR, 11, 10, 1, NULL, 'Report réunion budget', NOW(), 'olivier.wemeyi@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Effectifs décembre : 2 départs, 1 arrivée. Je t\'envoie le détail. Ulrich', NOW(), 'ulrich.ibouana@mikaservices.com', DATE_SUB(NOW(), INTERVAL 38 DAY), NULL, 13, 12, 0, NULL, 'Effectifs décembre', NOW(), 'ulrich.ibouana@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Commande urgente : 20 palettes parpaings. Livraison souhaitée avant vendredi. Jeremie', NOW(), 'jeremie.akaga@mikaservices.com', DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 24 DAY) + INTERVAL 2 HOUR, 14, 13, 1, NULL, 'Commande parpaings', NOW(), 'jeremie.akaga@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('ENG-03 diagnostic : réglage vibrateur prévu vendredi. Davy', NOW(), 'davy.ndong@mikaservices.com', DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 16 HOUR, NULL, 2, 15, 0, NULL, 'ENG-03', NOW(), 'davy.ndong@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('PV coulage P7 signé et archivé. Conformité OK. Yves', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 11 HOUR, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 11 HOUR, 9, 11, 1, NULL, 'PV P7', NOW(), 'yves.ditengou@mikaservices.com');

-- AL–AZ : Encore plus de messages (toutes paires)
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Merci pour la mise à jour.', NOW(), 'olsenfauldy@gmail.com', DATE_SUB(NOW(), INTERVAL 31 DAY), DATE_SUB(NOW(), INTERVAL 31 DAY) + INTERVAL 20 MINUTE, 10, 2, 1, NULL, NULL, NOW(), 'olsenfauldy@gmail.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Point quotidien 8h demain, comme d\'hab. Gabriel', NOW(), 'gabriel.ondo@mikaservices.com', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 18 HOUR, NULL, 2, 9, 0, NULL, NULL, NOW(), 'gabriel.ondo@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Facture fournisseur en attente de ta validation. Olivier', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 27 DAY), NULL, 13, 10, 0, NULL, 'Validation facture', NOW(), 'olivier.wemeyi@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Non-conformité mineure lot 3 : cales enrobage. Corrigé ce matin. Yves', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 23 DAY) + INTERVAL 10 HOUR, DATE_SUB(NOW(), INTERVAL 23 DAY) + INTERVAL 12 HOUR, 12, 11, 1, NULL, 'NC lot 3', NOW(), 'yves.ditengou@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Formation sécurité : liste des participants envoyée. Ulrich', NOW(), 'ulrich.ibouana@mikaservices.com', DATE_SUB(NOW(), INTERVAL 15 DAY), NULL, 13, 12, 0, NULL, 'Formation sécurité', NOW(), 'ulrich.ibouana@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Devis coffrages comparé. Recommandation COFRA. Jeremie', NOW(), 'jeremie.akaga@mikaservices.com', DATE_SUB(NOW(), INTERVAL 11 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 11 DAY) + INTERVAL 10 HOUR, 15, 13, 1, NULL, 'Devis coffrages', NOW(), 'jeremie.akaga@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Entretien préventif ENG-01 effectué. RAS. Justin', NOW(), 'justin.onguie@mikaservices.com', DATE_SUB(NOW(), INTERVAL 29 DAY), NULL, 11, 14, 0, NULL, 'Entretien ENG-01', NOW(), 'justin.onguie@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Pièce CAT livrée. Montage prévu demain. Davy', NOW(), 'davy.ndong@mikaservices.com', DATE_SUB(NOW(), INTERVAL 3 HOUR), NULL, 9, 15, 0, NULL, NULL, NOW(), 'davy.ndong@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Rappel : réunion direction vendredi 10h. Olsen', NOW(), 'olsenfauldy@gmail.com', DATE_SUB(NOW(), INTERVAL 42 DAY), DATE_SUB(NOW(), INTERVAL 42 DAY) + INTERVAL 1 HOUR, 10, 2, 1, NULL, 'Réunion direction', NOW(), 'olsenfauldy@gmail.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Avancement chantier Nord : 62 % au 30/11. Rapport joint. Gabriel', NOW(), 'gabriel.ondo@mikaservices.com', DATE_SUB(NOW(), INTERVAL 26 DAY), NULL, 11, 9, 0, NULL, 'Avancement chantier Nord', NOW(), 'gabriel.ondo@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Budget Q4 validé par la direction. Olivier', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 9 DAY) + INTERVAL 14 HOUR, DATE_SUB(NOW(), INTERVAL 9 DAY) + INTERVAL 15 HOUR, 12, 10, 1, NULL, 'Budget Q4', NOW(), 'olivier.wemeyi@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Contrôle granulométrie sable lot 3 : conforme. Yves', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 37 DAY), NULL, 14, 11, 0, NULL, 'Granulométrie lot 3', NOW(), 'yves.ditengou@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Planning congés décembre validé. Ulrich', NOW(), 'ulrich.ibouana@mikaservices.com', DATE_SUB(NOW(), INTERVAL 20 DAY) + INTERVAL 11 HOUR, DATE_SUB(NOW(), INTERVAL 20 DAY) + INTERVAL 11 HOUR, 15, 12, 1, NULL, NULL, NOW(), 'ulrich.ibouana@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Commande COFRA : BL reçu. Livraison lundi 8h. Jeremie', NOW(), 'jeremie.akaga@mikaservices.com', DATE_SUB(NOW(), INTERVAL 5 HOUR), NULL, 2, 13, 0, NULL, 'Livraison COFRA', NOW(), 'jeremie.akaga@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('ENG-07 remis en service. Limitation 1,5 t levée après montage. Justin', NOW(), 'justin.onguie@mikaservices.com', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 14 HOUR, NULL, 10, 14, 0, NULL, 'ENG-07 opérationnel', NOW(), 'justin.onguie@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Rapport GMAO novembre en pièce jointe. Davy', NOW(), 'davy.ndong@mikaservices.com', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY) + INTERVAL 4 HOUR, 11, 15, 1, NULL, 'Rapport GMAO', NOW(), 'davy.ndong@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Réunion chantier reportée à jeudi 14h. Salle 2. Olsen', NOW(), 'olsenfauldy@gmail.com', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 30 MINUTE, 9, 2, 1, NULL, 'Report réunion', NOW(), 'olsenfauldy@gmail.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Demande achat 50 t aciers HA validée. Bon à émettre. Olivier', NOW(), 'olivier.wemeyi@mikaservices.com', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 10 HOUR, NULL, 9, 10, 0, NULL, 'Achat aciers', NOW(), 'olivier.wemeyi@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Éprouvettes J+28 lot 3 : résultats conformes. PV signé. Yves', NOW(), 'yves.ditengou@mikaservices.com', DATE_SUB(NOW(), INTERVAL 44 DAY), NULL, 13, 11, 0, NULL, 'Éprouvettes J+28', NOW(), 'yves.ditengou@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Effectifs semaine 50 : aucun changement. Ulrich', NOW(), 'ulrich.ibouana@mikaservices.com', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, 14, 12, 1, NULL, NULL, NOW(), 'ulrich.ibouana@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Relance fournisseur sables : certificat reçu. Jeremie', NOW(), 'jeremie.akaga@mikaservices.com', DATE_SUB(NOW(), INTERVAL 16 DAY) + INTERVAL 15 HOUR, NULL, 11, 13, 0, NULL, 'Certificat sables', NOW(), 'jeremie.akaga@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Statut parc : 14/15 engins opérationnels. ENG-03 en réglage. Justin', NOW(), 'justin.onguie@mikaservices.com', DATE_SUB(NOW(), INTERVAL 45 MINUTE), NULL, 2, 14, 0, NULL, NULL, NOW(), 'justin.onguie@mikaservices.com');
INSERT INTO messages (contenu, created_at, created_by, date_envoi, date_lecture, destinataire_id, expediteur_id, lu, parent_id, sujet, updated_at, updated_by)
VALUES ('Montage palier ENG-07 terminé. Essai en cours. Davy', NOW(), 'davy.ndong@mikaservices.com', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), 13, 15, 1, NULL, 'ENG-07', NOW(), 'davy.ndong@mikaservices.com');


-- =============================================================================
-- VÉRIFICATION FINALE
-- =============================================================================
SELECT
  m.id,
  m.sujet,
  m.lu,
  m.date_envoi,
  CONCAT(u1.prenom, ' ', u1.nom) AS expediteur,
  CONCAT(u2.prenom, ' ', u2.nom) AS destinataire,
  LEFT(m.contenu, 60)             AS apercu
FROM messages m
JOIN users u1 ON u1.id = m.expediteur_id
JOIN users u2 ON u2.id = m.destinataire_id
ORDER BY m.date_envoi DESC;