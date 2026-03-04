-- =============================================================================
-- Récupérer tous les utilisateurs actuellement en base
-- Base : table `users` (+ tables de liaison pour rôles, départements, spécialités)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tous les utilisateurs (colonnes métier principales, SANS mot de passe)
--    À utiliser pour export / liste / analyse.
-- -----------------------------------------------------------------------------
SELECT
    u.id,
    u.matricule,
    u.nom,
    u.prenom,
    u.email,
    u.telephone,
    u.date_naissance,
    u.adresse,
    u.ville,
    u.quartier,
    u.province,
    u.numero_cni,
    u.numero_passeport,
    u.date_embauche,
    u.photo,
    u.type_contrat,
    u.niveau_experience,
    u.actif,
    u.last_login,
    u.totp_enabled,
    u.must_change_password,
    u.failed_login_attempts,
    u.lockout_until,
    u.superieur_hierarchique_id,
    u.created_at,
    u.updated_at,
    u.created_by,
    u.updated_by
FROM users u
ORDER BY u.id;


-- -----------------------------------------------------------------------------
-- 2. Tous les utilisateurs avec TOUTES les colonnes (y compris mot_de_passe)
--    À réserver à la migration / sauvegarde technique.
-- -----------------------------------------------------------------------------
-- SELECT * FROM users ORDER BY id;


-- -----------------------------------------------------------------------------
-- 3. Utilisateurs + rôles (une ligne par user, rôles en liste)
-- -----------------------------------------------------------------------------
SELECT
    u.id,
    u.matricule,
    u.nom,
    u.prenom,
    u.email,
    u.actif,
    u.last_login,
    GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ', ') AS roles,
    GROUP_CONCAT(DISTINCT r.nom ORDER BY r.nom SEPARATOR ', ') AS roles_noms
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
GROUP BY u.id, u.matricule, u.nom, u.prenom, u.email, u.actif, u.last_login
ORDER BY u.id;


-- -----------------------------------------------------------------------------
-- 4. Utilisateurs + rôles + départements + spécialités (synthèse)
-- -----------------------------------------------------------------------------
SELECT
    u.id,
    u.matricule,
    CONCAT(u.nom, ' ', u.prenom) AS nom_complet,
    u.email,
    u.telephone,
    u.actif,
    u.last_login,
    GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ', ') AS roles,
    GROUP_CONCAT(DISTINCT d.nom ORDER BY d.nom SEPARATOR ', ') AS departements,
    GROUP_CONCAT(DISTINCT s.nom ORDER BY s.nom SEPARATOR ', ') AS specialites,
    sh.nom   AS superieur_nom,
    sh.prenom AS superieur_prenom
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN user_departements ud ON ud.user_id = u.id
LEFT JOIN departements d ON d.id = ud.departement_id
LEFT JOIN user_specialites us ON us.user_id = u.id
LEFT JOIN specialites s ON s.id = us.specialite_id
LEFT JOIN users sh ON sh.id = u.superieur_hierarchique_id
GROUP BY u.id, u.matricule, u.nom, u.prenom, u.email, u.telephone, u.actif, u.last_login,
         sh.nom, sh.prenom
ORDER BY u.id;


-- -----------------------------------------------------------------------------
-- 5. Nombre d’utilisateurs (actifs / inactifs)
-- -----------------------------------------------------------------------------
SELECT
    actif,
    COUNT(*) AS nombre
FROM users
GROUP BY actif;
