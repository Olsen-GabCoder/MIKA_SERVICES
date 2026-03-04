-- =============================================================================
-- Récupérer tous les projets avec le chef de projet (responsable)
-- Tables réelles : projets, users (noms au pluriel)
-- =============================================================================

SELECT
    p.id,
    p.code_projet,
    p.nom,
    p.description,
    p.statut,
    p.type AS type_projet,
    p.montant_ht,
    p.date_debut,
    p.date_fin,
    p.client_id,
    p.responsable_projet_id,
    u_resp.matricule AS resp_matricule,
    CONCAT(u_resp.prenom, ' ', u_resp.nom) AS chef_projet_nom,
    u_resp.email AS chef_projet_email
FROM projets p
LEFT JOIN users u_resp ON u_resp.id = p.responsable_projet_id
ORDER BY p.id
LIMIT 0, 1000;
