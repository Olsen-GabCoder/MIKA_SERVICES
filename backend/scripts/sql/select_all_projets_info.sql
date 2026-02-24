-- =============================================================================
-- Requête : toutes les informations sur tous les projets
-- Base : structure JPA/Hibernate (tables projets, clients, users, projet_types)
-- =============================================================================

SELECT
  -- Projet (table projets + BaseEntity)
  p.id                    AS projet_id,
  p.code_projet           AS projet_code,
  p.numero_marche         AS projet_numero_marche,
  p.nom                   AS projet_nom,
  p.description           AS projet_description,
  p.type                  AS projet_type_principal,
  p.type_personnalise     AS projet_type_personnalise,
  p.statut                AS projet_statut,
  p.source_financement    AS projet_source_financement,
  p.imputation_budgetaire AS projet_imputation_budgetaire,
  p.province              AS projet_province,
  p.ville                 AS projet_ville,
  p.quartier              AS projet_quartier,
  p.adresse               AS projet_adresse,
  p.latitude              AS projet_latitude,
  p.longitude             AS projet_longitude,
  p.superficie            AS projet_superficie,
  p.condition_acces       AS projet_condition_acces,
  p.zone_climatique       AS projet_zone_climatique,
  p.distance_depot_km     AS projet_distance_depot_km,
  p.nombre_ouvriers_prevu AS projet_nombre_ouvriers_prevu,
  p.horaire_travail       AS projet_horaire_travail,
  p.montant_ht            AS projet_montant_ht,
  p.montant_ttc           AS projet_montant_ttc,
  p.montant_initial       AS projet_montant_initial,
  p.montant_revise        AS projet_montant_revise,
  p.delai_mois            AS projet_delai_mois,
  p.date_debut            AS projet_date_debut,
  p.date_fin              AS projet_date_fin,
  p.date_debut_reel       AS projet_date_debut_reel,
  p.date_fin_reelle       AS projet_date_fin_reelle,
  p.avancement_global     AS projet_avancement_global,
  p.avancement_physique_pct   AS projet_avancement_physique_pct,
  p.avancement_financier_pct  AS projet_avancement_financier_pct,
  p.delai_consomme_pct    AS projet_delai_consomme_pct,
  p.besoins_materiel      AS projet_besoins_materiel,
  p.besoins_humain        AS projet_besoins_humain,
  p.observations          AS projet_observations,
  p.propositions_amelioration AS projet_propositions_amelioration,
  p.partenaire_principal  AS projet_partenaire_principal,
  p.actif                 AS projet_actif,
  p.created_at            AS projet_created_at,
  p.updated_at            AS projet_updated_at,
  p.created_by            AS projet_created_by,
  p.updated_by            AS projet_updated_by,
  -- Client (table clients)
  p.client_id             AS client_id,
  c.code                  AS client_code,
  c.nom                   AS client_nom,
  c.type                  AS client_type,
  c.ministere             AS client_ministere,
  c.telephone             AS client_telephone,
  c.email                 AS client_email,
  c.adresse               AS client_adresse,
  c.contact_principal     AS client_contact_principal,
  c.telephone_contact     AS client_telephone_contact,
  c.actif                 AS client_actif,
  -- Responsable projet (table users)
  p.responsable_projet_id AS responsable_projet_id,
  u.matricule             AS responsable_matricule,
  u.nom                   AS responsable_nom,
  u.prenom                AS responsable_prenom,
  u.email                 AS responsable_email,
  u.telephone             AS responsable_telephone,
  -- Types multiples (table projet_types, agrégés en liste)
  (SELECT GROUP_CONCAT(pt.type_value ORDER BY pt.type_value SEPARATOR ', ')
   FROM projet_types pt
   WHERE pt.projet_id = p.id) AS projet_types_liste,
  -- Comptages liés (optionnel)
  (SELECT COUNT(*) FROM sous_projets sp WHERE sp.projet_id = p.id)           AS nb_sous_projets,
  (SELECT COUNT(*) FROM points_bloquants pb WHERE pb.projet_id = p.id)       AS nb_points_bloquants,
  (SELECT COUNT(*) FROM previsions pv WHERE pv.projet_id = p.id)             AS nb_previsions,
  (SELECT COUNT(*) FROM ca_previsionnel_realise ca WHERE ca.projet_id = p.id) AS nb_ca_previsionnel_realise,
  (SELECT COUNT(*) FROM revisions_budget rb WHERE rb.projet_id = p.id)       AS nb_revisions_budget
FROM projets p
LEFT JOIN clients c   ON p.client_id = c.id
LEFT JOIN users u     ON p.responsable_projet_id = u.id
ORDER BY p.id;
