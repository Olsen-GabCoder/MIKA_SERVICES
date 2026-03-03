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

        // Rôle CHEF_PROJET : modification des projets dont il est responsable (vérification métier dans les services)
        roleRepository.findByCode("CHEF_PROJET").orElseGet {
            val chefProjetPermissionCodes = setOf(
                "PROJET_READ", "PROJET_UPDATE", "PROJET_CREATE",
                "CHANTIER_READ", "CHANTIER_UPDATE", "CHANTIER_CREATE",
                "EQUIPE_READ", "EQUIPE_UPDATE", "EQUIPE_CREATE",
                "QUALITE_READ", "QUALITE_UPDATE", "QUALITE_CREATE",
                "BUDGET_READ", "BUDGET_UPDATE",
                "DOCUMENT_READ", "DOCUMENT_UPDATE", "DOCUMENT_CREATE",
                "PLANNING_READ", "PLANNING_UPDATE", "PLANNING_CREATE",
                "REUNION_HEBDO_READ", "REUNION_HEBDO_UPDATE", "REUNION_HEBDO_CREATE"
            )
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
