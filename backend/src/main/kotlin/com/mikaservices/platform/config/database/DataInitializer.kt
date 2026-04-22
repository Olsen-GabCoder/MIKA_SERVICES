package com.mikaservices.platform.config.database

import com.mikaservices.platform.common.enums.NiveauExperience
import com.mikaservices.platform.common.enums.NiveauHierarchique
import com.mikaservices.platform.common.enums.TypeClient
import com.mikaservices.platform.common.enums.TypeContrat
import com.mikaservices.platform.common.enums.TypePermission
import com.mikaservices.platform.modules.projet.entity.Client
import com.mikaservices.platform.modules.projet.repository.ClientRepository
import com.mikaservices.platform.modules.user.entity.Permission
import com.mikaservices.platform.modules.user.entity.Role
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.repository.PermissionRepository
import com.mikaservices.platform.modules.user.repository.RoleRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.security.crypto.password.PasswordEncoder
import java.time.LocalDate

@Configuration
class DataInitializer(
    private val permissionRepository: PermissionRepository,
    private val roleRepository: RoleRepository,
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val clientRepository: ClientRepository,
    @Value("\${app.init.admin.email:}") private val initAdminEmail: String,
    @Value("\${app.init.admin.password:}") private val initAdminPassword: String,
    @Value("\${spring.profiles.active:aucun}") private val activeProfile: String
) {
    
    private val logger = LoggerFactory.getLogger(DataInitializer::class.java)
    
    @Bean
    @Profile("dev", "staging", "docker", "prod")
    @Order(Ordered.HIGHEST_PRECEDENCE)
    fun initData(): CommandLineRunner {
        return CommandLineRunner {
            logger.warn("MIKA DataInitializer DEMARRAGE (profil actif: $activeProfile)")
            logger.info("Initialisation des données de base...")
            
            // Initialiser les permissions
            initPermissions()
            
            // Initialiser les rôles
            initRoles()
            
            // Initialiser l'utilisateur admin
            initAdminUser()
            
            // Clients prédéfinis (liste visible dès le démarrage)
            initClientsPredefinis()
            
            logger.info("Initialisation des données terminée avec succès")
        }
    }
    
    private fun initPermissions() {
        val permissions = listOf(
            // Permissions utilisateur
            createPermissionIfNotExists("USER_READ", "Lire les utilisateurs", "USER", TypePermission.READ),
            createPermissionIfNotExists("USER_CREATE", "Créer un utilisateur", "USER", TypePermission.CREATE),
            createPermissionIfNotExists("USER_UPDATE", "Modifier un utilisateur", "USER", TypePermission.UPDATE),
            createPermissionIfNotExists("USER_DELETE", "Supprimer un utilisateur", "USER", TypePermission.DELETE),
            
            // Permissions rôle
            createPermissionIfNotExists("ROLE_READ", "Lire les rôles", "ROLE", TypePermission.READ),
            createPermissionIfNotExists("ROLE_CREATE", "Créer un rôle", "ROLE", TypePermission.CREATE),
            createPermissionIfNotExists("ROLE_UPDATE", "Modifier un rôle", "ROLE", TypePermission.UPDATE),
            createPermissionIfNotExists("ROLE_DELETE", "Supprimer un rôle", "ROLE", TypePermission.DELETE),
            
            // Permissions projet
            createPermissionIfNotExists("PROJET_READ", "Lire les projets", "PROJET", TypePermission.READ),
            createPermissionIfNotExists("PROJET_CREATE", "Créer un projet", "PROJET", TypePermission.CREATE),
            createPermissionIfNotExists("PROJET_UPDATE", "Modifier un projet", "PROJET", TypePermission.UPDATE),
            createPermissionIfNotExists("PROJET_DELETE", "Supprimer un projet", "PROJET", TypePermission.DELETE),
            
            // Permissions budget
            createPermissionIfNotExists("BUDGET_READ", "Lire les budgets", "BUDGET", TypePermission.READ),
            createPermissionIfNotExists("BUDGET_CREATE", "Créer un budget", "BUDGET", TypePermission.CREATE),
            createPermissionIfNotExists("BUDGET_UPDATE", "Modifier un budget", "BUDGET", TypePermission.UPDATE),
            createPermissionIfNotExists("BUDGET_DELETE", "Supprimer un budget", "BUDGET", TypePermission.DELETE),
            // Permissions chantier
            createPermissionIfNotExists("CHANTIER_READ", "Lire les chantiers", "CHANTIER", TypePermission.READ),
            createPermissionIfNotExists("CHANTIER_CREATE", "Créer un chantier", "CHANTIER", TypePermission.CREATE),
            createPermissionIfNotExists("CHANTIER_UPDATE", "Modifier un chantier", "CHANTIER", TypePermission.UPDATE),
            createPermissionIfNotExists("CHANTIER_DELETE", "Supprimer un chantier", "CHANTIER", TypePermission.DELETE),
            // Permissions équipe
            createPermissionIfNotExists("EQUIPE_READ", "Lire les équipes", "EQUIPE", TypePermission.READ),
            createPermissionIfNotExists("EQUIPE_CREATE", "Créer une équipe", "EQUIPE", TypePermission.CREATE),
            createPermissionIfNotExists("EQUIPE_UPDATE", "Modifier une équipe", "EQUIPE", TypePermission.UPDATE),
            createPermissionIfNotExists("EQUIPE_DELETE", "Supprimer une équipe", "EQUIPE", TypePermission.DELETE),
            // Permissions qualité
            createPermissionIfNotExists("QUALITE_READ", "Lire la qualité", "QUALITE", TypePermission.READ),
            createPermissionIfNotExists("QUALITE_CREATE", "Créer un contrôle qualité", "QUALITE", TypePermission.CREATE),
            createPermissionIfNotExists("QUALITE_UPDATE", "Modifier la qualité", "QUALITE", TypePermission.UPDATE),
            createPermissionIfNotExists("QUALITE_DELETE", "Supprimer un contrôle qualité", "QUALITE", TypePermission.DELETE),
            // Permissions document
            createPermissionIfNotExists("DOCUMENT_READ", "Lire les documents", "DOCUMENT", TypePermission.READ),
            createPermissionIfNotExists("DOCUMENT_CREATE", "Créer un document", "DOCUMENT", TypePermission.CREATE),
            createPermissionIfNotExists("DOCUMENT_UPDATE", "Modifier un document", "DOCUMENT", TypePermission.UPDATE),
            createPermissionIfNotExists("DOCUMENT_DELETE", "Supprimer un document", "DOCUMENT", TypePermission.DELETE),
            // Permissions planning
            createPermissionIfNotExists("PLANNING_READ", "Lire le planning", "PLANNING", TypePermission.READ),
            createPermissionIfNotExists("PLANNING_CREATE", "Créer une tâche", "PLANNING", TypePermission.CREATE),
            createPermissionIfNotExists("PLANNING_UPDATE", "Modifier le planning", "PLANNING", TypePermission.UPDATE),
            createPermissionIfNotExists("PLANNING_DELETE", "Supprimer une tâche", "PLANNING", TypePermission.DELETE),
            // Permissions réunion hebdo
            createPermissionIfNotExists("REUNION_HEBDO_READ", "Lire les réunions hebdo", "REUNION_HEBDO", TypePermission.READ),
            createPermissionIfNotExists("REUNION_HEBDO_CREATE", "Créer une réunion hebdo", "REUNION_HEBDO", TypePermission.CREATE),
            createPermissionIfNotExists("REUNION_HEBDO_UPDATE", "Modifier une réunion hebdo", "REUNION_HEBDO", TypePermission.UPDATE),
            createPermissionIfNotExists("REUNION_HEBDO_DELETE", "Supprimer une réunion hebdo", "REUNION_HEBDO", TypePermission.DELETE),

            // Module Engins & mouvements (spec MIKA Engins / DMA)
            createPermissionIfNotExists("ENGIN_VIEW", "Consulter le parc et le détail des engins", "ENGIN", TypePermission.READ),
            createPermissionIfNotExists("ENGIN_MANAGE", "Créer, modifier, désactiver un engin", "ENGIN", TypePermission.ADMIN),
            createPermissionIfNotExists("MOUVEMENT_CREATE", "Créer un ordre de mouvement inter-chantiers", "MOUVEMENT", TypePermission.CREATE),
            createPermissionIfNotExists(
                "MOUVEMENT_CONFIRM_DEPART",
                "Confirmer le départ d'un engin (chantier source)",
                "MOUVEMENT",
                TypePermission.VALIDATE
            ),
            createPermissionIfNotExists(
                "MOUVEMENT_CONFIRM_RECEPTION",
                "Confirmer la réception d'un engin (chantier destination)",
                "MOUVEMENT",
                TypePermission.VALIDATE
            ),

            // Module DMA (Demandes de matériel)
            createPermissionIfNotExists("DMA_CREATE", "Soumettre une demande de matériel (terrain)", "DMA", TypePermission.CREATE),
            createPermissionIfNotExists("DMA_VALIDATE_CHANTIER", "Valider ou rejeter une DMA au niveau chantier", "DMA", TypePermission.VALIDATE),
            createPermissionIfNotExists("DMA_VALIDATE_PROJET", "Valider ou rejeter une DMA au niveau projet", "DMA", TypePermission.VALIDATE),
            createPermissionIfNotExists("DMA_PROCESS", "Prendre en charge, commander, livrer une DMA", "DMA", TypePermission.UPDATE),
            createPermissionIfNotExists("DMA_CLOSE", "Clôturer une DMA après livraison", "DMA", TypePermission.UPDATE),
            createPermissionIfNotExists("DMA_VIEW_ALL", "Voir toutes les DMA (tous chantiers)", "DMA", TypePermission.READ),

            // Module Qualité v2 — permissions spécifiques
            createPermissionIfNotExists("QUALITE_SIGN", "Signer une section de fiche NC/RC/PPI", "QUALITE", TypePermission.VALIDATE),
            createPermissionIfNotExists("QUALITE_CONFIG", "Configurer les référentiels qualité (templates, documents)", "QUALITE", TypePermission.ADMIN),
        )
        
        logger.info("${permissions.size} permissions initialisées")
    }
    
    private fun createPermissionIfNotExists(
        code: String,
        nom: String,
        module: String,
        type: TypePermission
    ): Permission {
        return permissionRepository.findByCode(code).orElseGet {
            val permissionDescription = "Permission pour $nom"
            val permission = Permission(
                code = code,
                nom = nom,
                module = module,
                type = type,
                description = permissionDescription,
                actif = true
            )
            permissionRepository.save(permission)
            logger.debug("Permission créée: $code")
            permission
        }
    }

    /** Ajoute à un rôle existant les permissions listées (idempotent). */
    private fun mergePermissionsIntoRole(roleCode: String, permissionCodes: Collection<String>) {
        val role = roleRepository.findByCodeWithPermissions(roleCode).orElse(null) ?: return
        val want = permissionRepository.findAll().filter { it.code in permissionCodes.toSet() }.toSet()
        val missing = want.filter { p -> role.permissions.none { it.id == p.id } }
        if (missing.isNotEmpty()) {
            role.permissions.addAll(missing)
            roleRepository.save(role)
            logger.info("Rôle $roleCode : ${missing.size} permission(s) ajoutée(s) (${missing.joinToString { it.code }})")
        }
    }
    
    private fun initRoles() {
        // Rôle SUPER_ADMIN avec toutes les permissions (création ou mise à jour des permissions)
        val superAdminRole = roleRepository.findByCodeWithPermissions("SUPER_ADMIN").orElseGet {
            val role = Role(
                code = "SUPER_ADMIN",
                nom = "Super Administrateur",
                description = "Accès complet à toutes les fonctionnalités",
                niveau = NiveauHierarchique.DIRECTION,
                actif = true
            )
            roleRepository.save(role)
            logger.info("Rôle SUPER_ADMIN créé")
            role
        }
        val allPermissions = permissionRepository.findAll().toSet()
        val missing = allPermissions - superAdminRole.permissions
        if (missing.isNotEmpty()) {
            superAdminRole.permissions.addAll(missing)
            roleRepository.save(superAdminRole)
            logger.info("Rôle SUPER_ADMIN mis à jour avec ${missing.size} nouvelles permissions")
        }
        
        // Rôle ADMIN avec permissions de gestion
        roleRepository.findByCode("ADMIN").orElseGet {
            val adminPermissions = permissionRepository.findAll()
                .filter { it.module in listOf("USER", "ROLE") }
                .toSet()
            val role = Role(
                code = "ADMIN",
                nom = "Administrateur",
                description = "Gestion des utilisateurs et rôles",
                niveau = NiveauHierarchique.DIRECTION,
                actif = true
            )
            role.permissions.addAll(adminPermissions)
            roleRepository.save(role)
            logger.info("Rôle ADMIN créé avec ${adminPermissions.size} permissions")
            role
        }
        mergePermissionsIntoRole("ADMIN", setOf("ENGIN_MANAGE", "DMA_VIEW_ALL"))
        
        // Rôle USER standard
        roleRepository.findByCode("USER").orElseGet {
            val userPermissions = permissionRepository.findAll()
                .filter { it.type == TypePermission.READ && it.module == "PROJET" }
                .toSet()
            val role = Role(
                code = "USER",
                nom = "Utilisateur",
                description = "Accès en lecture aux projets",
                niveau = NiveauHierarchique.EMPLOYE,
                actif = true
            )
            role.permissions.addAll(userPermissions)
            roleRepository.save(role)
            logger.info("Rôle USER créé avec ${userPermissions.size} permissions")
            role
        }
        mergePermissionsIntoRole("USER", setOf("DMA_CREATE"))

        val chefProjetPermissionCodes = setOf(
            "PROJET_READ", "PROJET_UPDATE", "PROJET_CREATE",
            "CHANTIER_READ", "CHANTIER_UPDATE", "CHANTIER_CREATE",
            "EQUIPE_READ", "EQUIPE_UPDATE", "EQUIPE_CREATE",
            "QUALITE_READ", "QUALITE_UPDATE", "QUALITE_CREATE",
            "BUDGET_READ", "BUDGET_UPDATE",
            "DOCUMENT_READ", "DOCUMENT_UPDATE", "DOCUMENT_CREATE",
            "PLANNING_READ", "PLANNING_UPDATE", "PLANNING_CREATE",
            "REUNION_HEBDO_READ", "REUNION_HEBDO_UPDATE", "REUNION_HEBDO_CREATE",
            "ENGIN_VIEW",
            "MOUVEMENT_CONFIRM_DEPART",
            "MOUVEMENT_CONFIRM_RECEPTION",
            "DMA_VALIDATE_PROJET",
        )
        // Rôle CHEF_PROJET : modification des projets dont il est responsable (vérification métier dans les services)
        roleRepository.findByCodeWithPermissions("CHEF_PROJET").orElseGet {
            val chefProjetPermissions = permissionRepository.findAll()
                .filter { it.code in chefProjetPermissionCodes }
                .toSet()
            val role = Role(
                code = "CHEF_PROJET",
                nom = "Chef de projet",
                description = "Peut modifier toutes les informations relatives à ses propres projets",
                niveau = NiveauHierarchique.CADRE_MOYEN,
                actif = true
            )
            role.permissions.addAll(chefProjetPermissions)
            roleRepository.save(role)
            logger.info("Rôle CHEF_PROJET créé avec ${chefProjetPermissions.size} permissions")
            role
        }
        mergePermissionsIntoRole("CHEF_PROJET", chefProjetPermissionCodes)

        val logistiquePermissionCodes = setOf(
            "ENGIN_VIEW",
            "ENGIN_MANAGE",
            "MOUVEMENT_CREATE",
            "MOUVEMENT_CONFIRM_DEPART",
            "MOUVEMENT_CONFIRM_RECEPTION",
            "DMA_PROCESS",
            "DMA_CLOSE",
            "DMA_VIEW_ALL",
        )
        roleRepository.findByCodeWithPermissions("LOGISTIQUE").orElseGet {
            val role = Role(
                code = "LOGISTIQUE",
                nom = "Logistique",
                description = "Pilote du parc engins, mouvements inter-chantiers et traitement des DMA",
                niveau = NiveauHierarchique.CADRE_SUPERIEUR,
                actif = true
            )
            roleRepository.save(role)
            logger.info("Rôle LOGISTIQUE créé")
            role
        }
        mergePermissionsIntoRole("LOGISTIQUE", logistiquePermissionCodes)

        val chefChantierPermissionCodes = setOf(
            "ENGIN_VIEW",
            "MOUVEMENT_CONFIRM_DEPART",
            "MOUVEMENT_CONFIRM_RECEPTION",
            "DMA_CREATE",
            "DMA_VALIDATE_CHANTIER",
        )
        roleRepository.findByCodeWithPermissions("CHEF_CHANTIER").orElseGet {
            val role = Role(
                code = "CHEF_CHANTIER",
                nom = "Chef de chantier",
                description = "Chantiers assignés : saisie DMA, validation chantier, confirmation mouvements d'engins",
                niveau = NiveauHierarchique.CADRE_MOYEN,
                actif = true
            )
            roleRepository.save(role)
            logger.info("Rôle CHEF_CHANTIER créé")
            role
        }
        mergePermissionsIntoRole("CHEF_CHANTIER", chefChantierPermissionCodes)

        // ── Rôles Qualité v2 ──────────────────────────────────────────────
        // Permissions communes à tous les rôles Qualité
        val qualiteBasePermissionCodes = setOf(
            "QUALITE_READ", "QUALITE_CREATE", "QUALITE_UPDATE", "QUALITE_SIGN",
            "PROJET_READ"
        )

        // DIRECTEUR_TECHNIQUE — Direction, signature collégiale section 6
        roleRepository.findByCode("DIRECTEUR_TECHNIQUE").orElseGet {
            val role = Role(
                code = "DIRECTEUR_TECHNIQUE",
                nom = "Directeur Technique",
                description = "Signature collégiale section 6 des fiches NC/RC/PPI",
                niveau = NiveauHierarchique.DIRECTION,
                actif = true
            )
            roleRepository.save(role)
            logger.info("Rôle DIRECTEUR_TECHNIQUE créé")
            role
        }
        mergePermissionsIntoRole("DIRECTEUR_TECHNIQUE", qualiteBasePermissionCodes)

        // RESPONSABLE_QUALITE — Cadre supérieur, pilote le module
        val rqPermissionCodes = qualiteBasePermissionCodes + setOf(
            "QUALITE_DELETE", "QUALITE_CONFIG"
        )
        roleRepository.findByCode("RESPONSABLE_QUALITE").orElseGet {
            val role = Role(
                code = "RESPONSABLE_QUALITE",
                nom = "Responsable Qualité",
                description = "Pilote le module Qualité, signe sections 4, 5, 6 et 7",
                niveau = NiveauHierarchique.CADRE_SUPERIEUR,
                actif = true
            )
            roleRepository.save(role)
            logger.info("Rôle RESPONSABLE_QUALITE créé")
            role
        }
        mergePermissionsIntoRole("RESPONSABLE_QUALITE", rqPermissionCodes)

        // INGENIEUR_QUALITE — Cadre moyen, détection + proposition traitement + vérification
        roleRepository.findByCode("INGENIEUR_QUALITE").orElseGet {
            val role = Role(
                code = "INGENIEUR_QUALITE",
                nom = "Ingénieur Qualité",
                description = "Détection NC, proposition de traitement, vérification",
                niveau = NiveauHierarchique.CADRE_MOYEN,
                actif = true
            )
            roleRepository.save(role)
            logger.info("Rôle INGENIEUR_QUALITE créé")
            role
        }
        mergePermissionsIntoRole("INGENIEUR_QUALITE", qualiteBasePermissionCodes)

        // CONTROLEUR_TECHNIQUE — Cadre moyen, vérification section 4 + collégiale section 6
        roleRepository.findByCode("CONTROLEUR_TECHNIQUE").orElseGet {
            val role = Role(
                code = "CONTROLEUR_TECHNIQUE",
                nom = "Contrôleur Technique",
                description = "Vérification du traitement (section 4), signature collégiale section 6",
                niveau = NiveauHierarchique.CADRE_MOYEN,
                actif = true
            )
            roleRepository.save(role)
            logger.info("Rôle CONTROLEUR_TECHNIQUE créé")
            role
        }
        mergePermissionsIntoRole("CONTROLEUR_TECHNIQUE", qualiteBasePermissionCodes)

        // ASSISTANT_QUALITE — Agent de maîtrise, détection terrain + aide saisie
        roleRepository.findByCode("ASSISTANT_QUALITE").orElseGet {
            val role = Role(
                code = "ASSISTANT_QUALITE",
                nom = "Assistant Qualité",
                description = "Détection terrain des NC, aide à la saisie",
                niveau = NiveauHierarchique.AGENT_MAITRISE,
                actif = true
            )
            roleRepository.save(role)
            logger.info("Rôle ASSISTANT_QUALITE créé")
            role
        }
        mergePermissionsIntoRole("ASSISTANT_QUALITE", qualiteBasePermissionCodes)

        // TECHNICIEN_LABORATOIRE — Agent de maîtrise, essais labo béton
        roleRepository.findByCode("TECHNICIEN_LABORATOIRE").orElseGet {
            val role = Role(
                code = "TECHNICIEN_LABORATOIRE",
                nom = "Technicien Laboratoire Qualité",
                description = "Saisie des essais laboratoire béton (slump, prélèvements, coulage)",
                niveau = NiveauHierarchique.AGENT_MAITRISE,
                actif = true
            )
            roleRepository.save(role)
            logger.info("Rôle TECHNICIEN_LABORATOIRE créé")
            role
        }
        mergePermissionsIntoRole("TECHNICIEN_LABORATOIRE", qualiteBasePermissionCodes)

        // TECHNICIEN_TOPOGRAPHIE — Agent de maîtrise, levée topographique
        roleRepository.findByCode("TECHNICIEN_TOPOGRAPHIE").orElseGet {
            val role = Role(
                code = "TECHNICIEN_TOPOGRAPHIE",
                nom = "Technicien Topographie",
                description = "Saisie des données de levée topographique (profils implantés, réceptionnés)",
                niveau = NiveauHierarchique.AGENT_MAITRISE,
                actif = true
            )
            roleRepository.save(role)
            logger.info("Rôle TECHNICIEN_TOPOGRAPHIE créé")
            role
        }
        mergePermissionsIntoRole("TECHNICIEN_TOPOGRAPHIE", qualiteBasePermissionCodes)

        // CHEF_CHANTIER : ajout permission QUALITE_SIGN (rôle CC dans le workflow section 6)
        mergePermissionsIntoRole("CHEF_CHANTIER", setOf("QUALITE_READ", "QUALITE_CREATE", "QUALITE_SIGN"))
    }
    
    private fun initAdminUser() {
        // Lecture directe des variables d'environnement (Railway les injecte ainsi ; Spring peut ne pas les voir via app.init.admin.*)
        val emailFromEnv = System.getenv("INIT_ADMIN_EMAIL")?.trim().orEmpty()
        val passwordFromEnv = System.getenv("INIT_ADMIN_PASSWORD").orEmpty()
        val email = (initAdminEmail.trim().ifBlank { emailFromEnv }).trim()
        val password = (initAdminPassword.ifBlank { passwordFromEnv })
        logger.warn("MIKA DataInitializer: initAdminUser (app.init: ${initAdminEmail.isNotBlank()}, env INIT_ADMIN_EMAIL: ${emailFromEnv.isNotBlank()}, email final: ${email.isNotBlank()})")
        if (email.isBlank() || password.isBlank()) {
            logger.warn("Admin initial non créé: définir INIT_ADMIN_EMAIL et INIT_ADMIN_PASSWORD (variables d'environnement)")
            return
        }
        if (userRepository.existsByEmail(email)) {
            logger.warn("L'utilisateur admin pour $email existe déjà")
            return
        }
        
        val adminRole = roleRepository.findByCode("SUPER_ADMIN")
            .orElseThrow { IllegalStateException("Le rôle SUPER_ADMIN n'existe pas") }
        
        val encodedPassword = passwordEncoder.encode(password)!!
        val adminUser = User(
            matricule = "ADMIN001",
            nom = "Administrateur",
            prenom = "Système",
            email = email,
            motDePasse = encodedPassword,
            telephone = null,
            dateNaissance = null,
            adresse = null,
            ville = null,
            quartier = null,
            province = null,
            numeroCNI = null,
            numeroPasseport = null,
            dateEmbauche = LocalDate.now(),
            photo = null,
            salaireMensuel = null,
            typeContrat = TypeContrat.CDI,
            niveauExperience = NiveauExperience.SENIOR,
            actif = true
        )
        
        adminUser.roles.add(adminRole)
        userRepository.save(adminUser)
        
        logger.warn("Admin initial créé pour l'email: $email")
    }
    
    private fun initClientsPredefinis() {
        if (clientRepository.count() > 0L) {
            logger.info("Des clients existent déjà, pas de clients prédéfinis créés")
            return
        }
        val clientsPredefinis = listOf(
            Triple("CLI-ETAT-001", "État Gabon", TypeClient.ETAT_GABON),
            Triple("CLI-MIN-001", "Ministère des Travaux Publics", TypeClient.MINISTERE),
            Triple("CLI-MIN-002", "Ministère de l'Éducation", TypeClient.MINISTERE),
            Triple("CLI-COL-001", "Ville de Libreville", TypeClient.COLLECTIVITE),
            Triple("CLI-COL-002", "Commune d'Owendo", TypeClient.COLLECTIVITE),
            Triple("CLI-EP-001", "Maurel & Prom", TypeClient.ENTREPRISE_PRIVEE),
            Triple("CLI-EP-002", "GABOIL", TypeClient.ENTREPRISE_PRIVEE),
            Triple("CLI-EP-003", "ATRICOM", TypeClient.ENTREPRISE_PRIVEE),
            Triple("CLI-EP-004", "AVANTIS", TypeClient.ENTREPRISE_PRIVEE),
            Triple("CLI-EP-005", "BGFI Bank", TypeClient.ENTREPRISE_PRIVEE),
        )
        clientsPredefinis.forEach { (code, nom, type) ->
            if (!clientRepository.existsByCode(code)) {
                clientRepository.save(Client(code = code, nom = nom, type = type))
                logger.debug("Client prédéfini créé: $nom ($code)")
            }
        }
        logger.info("${clientsPredefinis.size} clients prédéfinis créés — liste visible dans le formulaire projet")
    }
}
