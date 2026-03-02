-- Vérification et mise à jour du projet Donguila (id 15)
-- Assure que le projet a toutes les informations nécessaires pour s'afficher dans la liste
SET NAMES utf8mb4;

-- Vérifier l'état actuel du projet
SELECT 
    id,
    code_projet,
    numero_marche,
    nom,
    statut,
    actif,
    responsable_projet_id,
    client_id,
    montant_ht,
    date_debut,
    date_fin
FROM projets 
WHERE id = 15;

-- Mettre à jour le projet pour s'assurer qu'il est actif et a toutes les infos nécessaires
-- Note: Le chef de projet (Jérémie OMPINDI AKAGA) doit exister en base avec le rôle CHEF_PROJET
UPDATE projets SET
    actif = TRUE,
    numero_marche = COALESCE(numero_marche, '01/MMPEB/SG/2025'),
    code_projet = COALESCE(code_projet, '01/MMPEB/SG/2025'),
    statut = COALESCE(statut, 'EN_COURS'),
    updated_at = NOW()
WHERE id = 15;

-- Vérifier que le projet a un responsable (chef de projet)
-- Si responsable_projet_id est NULL, il faut l'assigner manuellement après avoir trouvé l'ID de Jérémie OMPINDI AKAGA
SELECT 
    u.id,
    u.nom,
    u.prenom,
    u.email,
    GROUP_CONCAT(r.code) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE (u.nom LIKE '%OMPINDI%' OR u.prenom LIKE '%Jérémie%' OR u.email LIKE '%jeremie%')
GROUP BY u.id;

-- Si aucun utilisateur trouvé, créer un script pour créer Jérémie OMPINDI AKAGA comme chef de projet
-- (à exécuter séparément si nécessaire)
