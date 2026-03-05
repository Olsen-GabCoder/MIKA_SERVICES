package com.mikaservices.platform.modules.user.service

import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.common.utils.PasswordGenerator
import com.mikaservices.platform.config.mail.EmailService
import com.mikaservices.platform.modules.auth.repository.PasswordResetTokenRepository
import com.mikaservices.platform.modules.auth.repository.SessionRepository
import com.mikaservices.platform.modules.user.dto.request.AdminResetPasswordRequest
import com.mikaservices.platform.modules.user.dto.request.ChangePasswordRequest
import com.mikaservices.platform.modules.user.dto.request.NotificationPreferencesUpdateRequest
import com.mikaservices.platform.modules.user.dto.request.SessionPreferencesUpdateRequest
import com.mikaservices.platform.modules.user.dto.request.UserCreateRequest
import com.mikaservices.platform.modules.user.dto.request.UserUpdateRequest
import com.mikaservices.platform.modules.user.dto.response.AuditLogResponse
import com.mikaservices.platform.modules.user.dto.response.LoginHistoryEntryResponse
import com.mikaservices.platform.modules.user.dto.response.UserForMessagingResponse
import com.mikaservices.platform.modules.user.dto.response.UserResponse
import com.mikaservices.platform.modules.user.entity.Departement
import com.mikaservices.platform.modules.user.entity.Role
import com.mikaservices.platform.modules.user.entity.Specialite
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.mapper.UserMapper
import com.mikaservices.platform.modules.user.entity.AuditLog
import com.mikaservices.platform.modules.user.repository.*
import com.mikaservices.platform.modules.user.service.AuditLogService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.domain.Specification
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import jakarta.persistence.criteria.JoinType
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption

@Service
@Transactional
class UserService(
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val departementRepository: DepartementRepository,
    private val specialiteRepository: SpecialiteRepository,
    private val auditLogRepository: AuditLogRepository,
    private val auditLogService: AuditLogService,
    private val passwordEncoder: PasswordEncoder,
    private val emailService: EmailService,
    private val sessionRepository: SessionRepository,
    private val passwordResetTokenRepository: PasswordResetTokenRepository
) {

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    @Value("\${app.upload.dir:uploads}")
    private lateinit var uploadDir: String

    private val logger = LoggerFactory.getLogger(UserService::class.java)
    
    fun create(request: UserCreateRequest): UserResponse {
        logger.debug("Création d'un nouvel utilisateur: ${request.email}")
        
        // Vérification unicité email
        if (userRepository.existsByEmail(request.email)) {
            throw ConflictException("Un utilisateur avec cet email existe déjà")
        }
        
        // Vérification unicité matricule
        if (userRepository.existsByMatricule(request.matricule)) {
            throw ConflictException("Un utilisateur avec ce matricule existe déjà")
        }
        
        // Mot de passe généré automatiquement ; envoyé par email de bienvenue
        val plainPassword = request.password?.takeIf { it.isNotBlank() } ?: PasswordGenerator.generate()
        val user = UserMapper.fromCreateRequest(request, plainPassword, passwordEncoder, mustChangePassword = true)
        
        // Récupération du nom d'utilisateur actuel pour audit
        val currentUsername = SecurityContextHolder.getContext().authentication?.name
        user.createdBy = currentUsername
        
        // Association des rôles
        if (request.roleIds.isNotEmpty()) {
            val roles = roleRepository.findAllById(request.roleIds)
            if (roles.size != request.roleIds.size) {
                throw BadRequestException("Un ou plusieurs rôles sont introuvables")
            }
            user.roles.addAll(roles)
        }
        
        // Association des départements
        if (request.departementIds.isNotEmpty()) {
            val departements = departementRepository.findAllById(request.departementIds)
            if (departements.size != request.departementIds.size) {
                throw BadRequestException("Un ou plusieurs départements sont introuvables")
            }
            user.departements.addAll(departements)
        }
        
        // Association des spécialités
        if (request.specialiteIds.isNotEmpty()) {
            val specialites = specialiteRepository.findAllById(request.specialiteIds)
            if (specialites.size != request.specialiteIds.size) {
                throw BadRequestException("Un ou plusieurs spécialités sont introuvables")
            }
            user.specialites.addAll(specialites)
        }
        
        // Association du supérieur hiérarchique
        request.superieurHierarchiqueId?.let { id ->
            val superieur = userRepository.findById(id)
                .orElseThrow { ResourceNotFoundException("Supérieur hiérarchique introuvable") }
            user.superieurHierarchique = superieur
        }
        
        val savedUser = userRepository.save(user)
        auditLogService.log(savedUser, "USER", "CREATE", "Utilisateur créé: ${savedUser.email}")
        var welcomeEmailSent = false
        try {
            logger.info("Envoi de l'email de bienvenue à ${savedUser.email}...")
            emailService.sendWelcomeEmail(savedUser.email, savedUser.prenom, plainPassword)
            welcomeEmailSent = true
            logger.info("Email de bienvenue envoyé à ${savedUser.email}")
        } catch (e: Exception) {
            logger.error("Échec envoi email de bienvenue à ${savedUser.email}: ${e.javaClass.simpleName} - ${e.message}", e)
            logger.error("Vérifiez MAIL_* dans .env. Voir la chaîne des causes ci-dessus (cause: ...). Relance async dans 2s.")
            // Retry asynchrone hors contexte HTTP/transaction (parfois l'envoi réussit dans un autre thread)
            try {
                emailService.sendWelcomeEmailAsync(savedUser.email, savedUser.prenom, plainPassword)
            } catch (e2: Exception) {
                logger.warn("Relance async email bienvenue échouée: ${e2.message}")
            }
        }
        logger.info("Utilisateur créé avec succès: ${savedUser.email}")
        return UserMapper.toResponse(savedUser).copy(welcomeEmailSent = welcomeEmailSent)
    }
    
    fun findAll(search: String?, actif: Boolean?, roleId: Long?, pageable: Pageable): Page<UserResponse> {
        val spec = buildUserSpecification(search, actif, roleId)
        return userRepository.findAll(spec, pageable).map { UserMapper.toResponse(it) }
    }

    private fun buildUserSpecification(search: String?, actif: Boolean?, roleId: Long?): Specification<User> {
        return Specification { root, query, cb ->
            query.distinct(true)
            val predicates = mutableListOf<jakarta.persistence.criteria.Predicate>()
            actif?.let { predicates.add(cb.equal(root.get<Boolean>("actif"), it)) }
            if (!search.isNullOrBlank()) {
                val pattern = "%${search.lowercase()}%"
                predicates.add(
                    cb.or(
                        cb.like(cb.lower(root.get("nom")), pattern),
                        cb.like(cb.lower(root.get("prenom")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("matricule")), pattern)
                    )
                )
            }
            roleId?.let {
                val rolesJoin = root.join<User, Role>("roles", JoinType.INNER)
                predicates.add(cb.equal(rolesJoin.get<Long>("id"), it))
            }
            if (predicates.isEmpty()) cb.conjunction() else cb.and(*predicates.toTypedArray())
        }
    }
    
    fun findById(id: Long): UserResponse {
        val user = userRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable avec l'ID: $id") }
        return UserMapper.toResponse(user)
    }
    
    fun findByEmail(email: String): UserResponse {
        val user = userRepository.findByEmail(email)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable avec l'email: $email") }
        return UserMapper.toResponse(user)
    }
    
    fun getCurrentUser(): UserResponse {
        val email = SecurityContextHolder.getContext().authentication?.name
            ?: throw BadRequestException("Utilisateur non authentifié")
        return findByEmail(email)
    }

    /** Liste des autres utilisateurs actifs (destinataires possibles pour la messagerie). Accessible à tout utilisateur connecté. */
    fun getPeersForMessaging(): List<UserForMessagingResponse> {
        val currentUser = getCurrentUserEntityOrNull()
            ?: throw BadRequestException("Utilisateur non authentifié")
        val currentId = currentUser.id!!
        return userRepository.findByActifTrue()
            .filter { it.id != currentId }
            .map { UserMapper.toForMessagingResponse(it) }
    }

    /** Dernières connexions (audit AUTH/LOGIN), les plus récentes en premier. */
    fun getMyLoginHistory(userId: Long): List<LoginHistoryEntryResponse> {
        val page = auditLogRepository.findByUser_IdAndModuleAndActionOrderByCreatedAtDesc(
            userId, "AUTH", "LOGIN", PageRequest.of(0, 50)
        )
        return page.content.map { log ->
            val deviceSummary = log.details?.substringBefore(" | Par: ")?.takeIf { it.isNotBlank() }
            LoginHistoryEntryResponse(
                createdAt = log.createdAt,
                ipAddress = log.ipAddress,
                deviceSummary = deviceSummary
            )
        }
    }

    fun updateMyNotificationPreferences(request: NotificationPreferencesUpdateRequest): UserResponse {
        val user = getCurrentUserEntityOrNull()
            ?: throw BadRequestException("Utilisateur non authentifié")
        request.emailNotificationsEnabled?.let { user.emailNotificationsEnabled = it }
        request.alertNewLoginEnabled?.let { user.alertNewLoginEnabled = it }
        request.dailyDigestEnabled?.let { user.dailyDigestEnabled = it }
        request.weeklyDigestEnabled?.let { user.weeklyDigestEnabled = it }
        request.digestTime?.takeIf { it.matches(Regex("^([01]?[0-9]|2[0-3]):[0-5][0-9]$")) }?.let { user.digestTime = it }
        request.inAppNotificationsEnabled?.let { user.inAppNotificationsEnabled = it }
        request.notificationSoundEnabled?.let { user.notificationSoundEnabled = it }
        userRepository.save(user)
        logger.debug("Préférences notifications mises à jour pour: ${user.email}")
        return UserMapper.toResponse(user)
    }

    fun updateMySessionPreferences(request: SessionPreferencesUpdateRequest): UserResponse {
        val user = getCurrentUserEntityOrNull()
            ?: throw BadRequestException("Utilisateur non authentifié")
        request.defaultSessionDuration?.let { value ->
            user.defaultSessionDuration = if (value == "SHORT" || value == "LONG") value else null
        }
        request.logoutOnBrowserClose?.let { user.logoutOnBrowserClose = it }
        userRepository.save(user)
        logger.debug("Préférences session mises à jour pour: ${user.email} (defaultSessionDuration=${user.defaultSessionDuration}, logoutOnBrowserClose=${user.logoutOnBrowserClose})")
        return UserMapper.toResponse(user)
    }

    private fun getCurrentUserEntityOrNull(): User? {
        val email = SecurityContextHolder.getContext().authentication?.name ?: return null
        return userRepository.findByEmail(email).orElse(null)
    }
    
    fun update(id: Long, request: UserUpdateRequest): UserResponse {
        logger.debug("Mise à jour de l'utilisateur: $id")
        
        val user = userRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable avec l'ID: $id") }
        val currentUser = getCurrentUserEntityOrNull()
        
        // Protection : un utilisateur ne peut pas se désactiver lui-même
        if (currentUser != null && currentUser.id == user.id && request.actif == false) {
            throw BadRequestException("Vous ne pouvez pas vous désactiver vous-même")
        }
        
        // Vérification unicité email si modifié
        if (request.email != user.email && userRepository.existsByEmail(request.email)) {
            throw ConflictException("Un utilisateur avec cet email existe déjà")
        }
        
        // Mise à jour des champs
        UserMapper.updateFromRequest(user, request)
        
        // Mise à jour des rôles si fournis
        request.roleIds?.let { roleIds ->
            // Protection : un admin ne peut pas se retirer tous ses rôles admin (SUPER_ADMIN/ADMIN)
            if (currentUser != null && currentUser.id == user.id) {
                val newRoles = roleRepository.findAllById(roleIds)
                val hasAdminRole = newRoles.any { it.code == "SUPER_ADMIN" || it.code == "ADMIN" }
                if (!hasAdminRole) {
                    throw BadRequestException("Vous ne pouvez pas retirer tous vos rôles d'administration")
                }
            }
            val roles = roleRepository.findAllById(roleIds)
            if (roles.size != roleIds.size) {
                throw BadRequestException("Un ou plusieurs rôles sont introuvables")
            }
            user.roles.clear()
            user.roles.addAll(roles)
        }
        
        // Mise à jour des départements si fournis
        request.departementIds?.let { departementIds ->
            val departements = departementRepository.findAllById(departementIds)
            if (departements.size != departementIds.size) {
                throw BadRequestException("Un ou plusieurs départements sont introuvables")
            }
            user.departements.clear()
            user.departements.addAll(departements)
        }
        
        // Mise à jour des spécialités si fournis
        request.specialiteIds?.let { specialiteIds ->
            val specialites = specialiteRepository.findAllById(specialiteIds)
            if (specialites.size != specialiteIds.size) {
                throw BadRequestException("Un ou plusieurs spécialités sont introuvables")
            }
            user.specialites.clear()
            user.specialites.addAll(specialites)
        }
        
        // Mise à jour du supérieur hiérarchique uniquement si un id est fourni (évite d'effacer en mise à jour partielle, ex. toggle actif)
        request.superieurHierarchiqueId?.let { superieurId ->
            val superieur = userRepository.findById(superieurId)
                .orElseThrow { ResourceNotFoundException("Supérieur hiérarchique introuvable") }
            user.superieurHierarchique = superieur
        }
        
        // Récupération du nom d'utilisateur actuel pour audit
        val currentUsername = SecurityContextHolder.getContext().authentication?.name
        user.updatedBy = currentUsername
        
        val savedUser = userRepository.save(user)
        auditLogService.log(savedUser, "USER", "UPDATE", "Utilisateur mis à jour: ${savedUser.email}")
        logger.info("Utilisateur mis à jour avec succès: ${savedUser.email}")

        return UserMapper.toResponse(savedUser)
    }

    fun changeMyPassword(request: ChangePasswordRequest) {
        val email = SecurityContextHolder.getContext().authentication?.name
            ?: throw BadRequestException("Utilisateur non authentifié")
        
        logger.debug("Changement de mot de passe pour l'utilisateur connecté: $email")
        
        val user = userRepository.findByEmail(email)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable") }
        
        // Vérification du mot de passe actuel
        if (!passwordEncoder.matches(request.currentPassword, user.motDePasse)) {
            throw BadRequestException("Mot de passe actuel incorrect")
        }
        
        // Mise à jour du mot de passe
        user.motDePasse = passwordEncoder.encode(request.newPassword)!!
        user.mustChangePassword = false
        
        val currentUsername = SecurityContextHolder.getContext().authentication?.name
        user.updatedBy = currentUsername
        
        userRepository.save(user)
        auditLogService.log(user, "USER", "PASSWORD_CHANGE", "Mot de passe modifié par l'utilisateur")
        logger.info("Mot de passe changé avec succès pour l'utilisateur: ${user.email}")
        if (user.emailNotificationsEnabled) {
            try {
                emailService.sendPasswordChangedNotification(user.email, "${user.prenom} ${user.nom}")
            } catch (e: Exception) {
                logger.warn("Envoi notification mot de passe modifié échoué: ${e.message}")
            }
        }
    }

    fun changePassword(id: Long, request: ChangePasswordRequest) {
        logger.debug("Changement de mot de passe pour l'utilisateur: $id")
        
        val user = userRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable avec l'ID: $id") }
        
        // Vérification du mot de passe actuel
        if (!passwordEncoder.matches(request.currentPassword, user.motDePasse)) {
            throw BadRequestException("Mot de passe actuel incorrect")
        }
        
        // Mise à jour du mot de passe
        user.motDePasse = passwordEncoder.encode(request.newPassword)!!
        
        val currentUsername = SecurityContextHolder.getContext().authentication?.name
        user.updatedBy = currentUsername
        
        userRepository.save(user)
        auditLogService.log(user, "USER", "PASSWORD_CHANGE", "Mot de passe modifié par un administrateur")
        logger.info("Mot de passe changé avec succès pour l'utilisateur: ${user.email}")
        if (user.emailNotificationsEnabled) {
            try {
                emailService.sendPasswordChangedNotification(user.email, "${user.prenom} ${user.nom}")
            } catch (e: Exception) {
                logger.warn("Envoi notification mot de passe modifié échoué: ${e.message}")
            }
        }
    }

    fun adminResetPassword(id: Long, request: AdminResetPasswordRequest) {
        logger.debug("Réinitialisation du mot de passe par admin pour l'utilisateur: $id")
        val user = userRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable avec l'ID: $id") }
        user.motDePasse = passwordEncoder.encode(request.newPassword)!!
        user.mustChangePassword = true
        user.failedLoginAttempts = 0
        user.lockoutUntil = null
        val currentUsername = SecurityContextHolder.getContext().authentication?.name
        user.updatedBy = currentUsername
        userRepository.save(user)
        auditLogService.log(user, "USER", "PASSWORD_RESET", "Mot de passe réinitialisé par un administrateur")
        logger.info("Mot de passe réinitialisé par admin pour l'utilisateur: ${user.email}")
        if (user.emailNotificationsEnabled) {
            try {
                emailService.sendPasswordChangedNotification(user.email, "${user.prenom} ${user.nom}")
            } catch (e: Exception) {
                logger.warn("Envoi notification mot de passe modifié échoué: ${e.message}")
            }
        }
    }

    fun adminDisable2FA(id: Long) {
        logger.debug("Désactivation 2FA par admin pour l'utilisateur: $id")
        val user = userRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable avec l'ID: $id") }
        user.totpSecret = null
        user.totpEnabled = false
        val currentUsername = SecurityContextHolder.getContext().authentication?.name
        user.updatedBy = currentUsername
        userRepository.save(user)
        auditLogService.log(user, "USER", "2FA_DISABLE", "2FA désactivé par un administrateur")
        logger.info("2FA désactivé par admin pour l'utilisateur: ${user.email}")
        if (user.emailNotificationsEnabled) {
            try {
                emailService.send2FADisabledNotification(user.email, "${user.prenom} ${user.nom}")
            } catch (e: Exception) {
                logger.warn("Envoi notification 2FA désactivée échoué: ${e.message}")
            }
        }
    }

    fun delete(id: Long) {
        logger.debug("Suppression définitive de l'utilisateur: $id")
        val user = userRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable avec l'ID: $id") }
        val currentUser = getCurrentUserEntityOrNull()
        if (currentUser != null && currentUser.id == user.id) {
            throw BadRequestException("Vous ne pouvez pas supprimer votre propre compte")
        }
        val userId = user.id!!
        val deletedUserEmail = user.email
        // Log avec user=null pour éviter TransientPropertyValueException (on supprime l'utilisateur juste après)
        auditLogService.log(null, "USER", "DELETE", "Utilisateur supprimé: $deletedUserEmail (id=$userId)")
        sessionRepository.deleteAllByUserId(userId)
        passwordResetTokenRepository.deleteAllByUserId(userId)
        auditLogRepository.setUserNullForUserId(userId)
        userRepository.findAllBySuperieurHierarchiqueId(userId).forEach { it.superieurHierarchique = null }
        userRepository.flush()
        nullifyUserReferences(userId)
        deleteUserDependentRows(userId)
        user.roles.clear()
        user.departements.clear()
        user.specialites.clear()
        userRepository.flush()
        userRepository.delete(user)
        logger.info("Utilisateur supprimé définitivement: ${user.email}")
    }

    private fun nullifyUserReferences(userId: Long) {
        val updates = listOf(
            "UPDATE users SET superieur_hierarchique_id = NULL WHERE superieur_hierarchique_id = :id",
            "UPDATE projets SET responsable_projet_id = NULL WHERE responsable_projet_id = :id",
            "UPDATE depenses SET valide_par_id = NULL WHERE valide_par_id = :id",
            "UPDATE documents SET uploade_par_id = NULL WHERE uploade_par_id = :id",
            "UPDATE incidents SET declare_par_id = NULL WHERE declare_par_id = :id",
            "UPDATE controles_qualite SET inspecteur_id = NULL WHERE inspecteur_id = :id",
            "UPDATE taches SET assigne_a_id = NULL WHERE assigne_a_id = :id",
            "UPDATE reunions_hebdo SET redacteur_id = NULL WHERE redacteur_id = :id",
            "UPDATE actions_prevention SET responsable_id = NULL WHERE responsable_id = :id",
            "UPDATE non_conformites SET responsable_traitement_id = NULL WHERE responsable_traitement_id = :id",
            "UPDATE equipes SET chef_equipe_id = NULL WHERE chef_equipe_id = :id",
            "UPDATE revisions_budget SET valide_par_id = NULL WHERE valide_par_id = :id",
            "UPDATE points_bloquants SET detecte_par_id = NULL, assigne_a_id = NULL WHERE detecte_par_id = :id OR assigne_a_id = :id",
            "UPDATE sous_projets SET responsable_id = NULL WHERE responsable_id = :id",
            "UPDATE departements SET responsable_id = NULL WHERE responsable_id = :id"
        )
        updates.forEach { sql ->
            entityManager.createNativeQuery(sql).setParameter("id", userId).executeUpdate()
        }
    }

    private fun deleteUserDependentRows(userId: Long) {
        listOf(
            "DELETE FROM participants_reunion WHERE user_id = :id",
            "DELETE FROM membres_equipe WHERE user_id = :id",
            "DELETE FROM notifications WHERE destinataire_id = :id",
            "DELETE FROM messages WHERE expediteur_id = :id OR destinataire_id = :id"
        ).forEach { sql ->
            entityManager.createNativeQuery(sql).setParameter("id", userId).executeUpdate()
        }
    }

    fun uploadPhoto(file: MultipartFile): UserResponse {
        val email = SecurityContextHolder.getContext().authentication?.name
            ?: throw BadRequestException("Utilisateur non authentifié")
        val user = userRepository.findByEmail(email)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable") }
        val profilDir = Paths.get(uploadDir).resolve("profil").toAbsolutePath().normalize()
        Files.createDirectories(profilDir)
        val ext = file.originalFilename?.substringAfterLast(".", "jpg") ?: "jpg"
        val filename = "profil/${user.id}_${System.currentTimeMillis()}.$ext"
        val targetPath = Paths.get(uploadDir).resolve(filename).toAbsolutePath().normalize()
        if (!targetPath.startsWith(Paths.get(uploadDir).toAbsolutePath())) {
            throw BadRequestException("Chemin de fichier invalide")
        }
        Files.copy(file.inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING)
        user.photo = filename
        val currentUsername = SecurityContextHolder.getContext().authentication?.name
        user.updatedBy = currentUsername
        userRepository.save(user)
        logger.info("Photo de profil mise à jour pour: ${user.email}")
        return UserMapper.toResponse(user)
    }

    @Transactional(readOnly = true)
    fun getPhotoResource(): Resource? {
        val email = SecurityContextHolder.getContext().authentication?.name ?: return null
        val user = userRepository.findByEmail(email).orElse(null) ?: return null
        return getPhotoResourceForUser(user)
    }

    @Transactional(readOnly = true)
    fun getPhotoResourceForUser(userId: Long): Resource? {
        val user: User? = userRepository.findById(userId).orElse(null)
        return user?.let { getPhotoResourceForUser(it) }
    }

    private fun getPhotoResourceForUser(user: User): Resource? {
        val photoPath = user.photo ?: return null
        val path = Paths.get(uploadDir).resolve(photoPath).toAbsolutePath().normalize()
        val basePath = Paths.get(uploadDir).toAbsolutePath().normalize()
        if (!path.startsWith(basePath) || !Files.exists(path)) return null
        return UrlResource(path.toUri())
    }

    @Transactional(readOnly = true)
    fun getAuditLogs(userId: Long, pageable: Pageable): Page<AuditLogResponse> {
        val user = userRepository.findById(userId)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable avec l'ID: $userId") }
        return auditLogRepository.findByUser(user, pageable).map { log ->
            AuditLogResponse(
                id = log.id!!,
                userId = log.user?.id,
                action = log.action,
                module = log.module,
                details = log.details,
                ipAddress = log.ipAddress,
                createdAt = log.createdAt
            )
        }
    }
}
