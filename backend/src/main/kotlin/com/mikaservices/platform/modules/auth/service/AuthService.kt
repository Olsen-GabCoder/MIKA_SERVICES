package com.mikaservices.platform.modules.auth.service

import com.mikaservices.platform.common.constants.SecurityConstants
import com.mikaservices.platform.common.exception.AccountLockedException
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.common.exception.UnauthorizedException
import com.mikaservices.platform.config.mail.EmailService
import com.mikaservices.platform.config.security.JwtTokenProvider
import com.mikaservices.platform.modules.auth.dto.request.Disable2FARequest
import com.mikaservices.platform.modules.auth.dto.request.Verify2FARequest
import com.mikaservices.platform.modules.auth.dto.request.Verify2FASetupRequest
import com.mikaservices.platform.modules.auth.dto.response.Login2FAPendingResponse
import com.mikaservices.platform.modules.auth.dto.response.LoginResult
import com.mikaservices.platform.modules.auth.dto.response.Setup2FAResponse
import com.mikaservices.platform.modules.auth.dto.request.ForgotPasswordRequest
import com.mikaservices.platform.modules.auth.dto.request.LoginRequest
import com.mikaservices.platform.modules.auth.dto.request.RefreshTokenRequest
import com.mikaservices.platform.modules.auth.dto.request.ResetPasswordRequest
import com.mikaservices.platform.modules.auth.dto.response.AuthResponse
import com.mikaservices.platform.modules.auth.dto.response.SessionResponse
import com.mikaservices.platform.modules.auth.entity.PasswordResetToken
import com.mikaservices.platform.modules.auth.entity.Session
import com.mikaservices.platform.modules.auth.repository.PasswordResetTokenRepository
import com.mikaservices.platform.modules.auth.repository.SessionRepository
import com.mikaservices.platform.modules.user.dto.response.UserResponse
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.mapper.UserMapper
import com.mikaservices.platform.modules.user.repository.UserRepository
import com.mikaservices.platform.modules.user.service.AuditLogService
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
@Transactional
class AuthService(
    private val userRepository: UserRepository,
    private val sessionRepository: SessionRepository,
    private val passwordResetTokenRepository: PasswordResetTokenRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val passwordEncoder: PasswordEncoder,
    private val emailService: EmailService,
    private val twoFactorService: TwoFactorService,
    private val auditLogService: AuditLogService,
    @Value("\${app.mail.notify-on-login:false}") private val notifyOnLogin: Boolean,
    @Value("\${app.auth.lockout-max-attempts:5}") private val lockoutMaxAttempts: Int,
    @Value("\${app.auth.lockout-duration-minutes:15}") private val lockoutDurationMinutes: Int
) {

    private val logger = LoggerFactory.getLogger(AuthService::class.java)
    private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

    fun login(request: LoginRequest, httpRequest: HttpServletRequest): LoginResult {
        logger.debug("Tentative de connexion pour l'email: ${request.email}")

        val user = userRepository.findByEmail(request.email)
            .orElseThrow { UnauthorizedException("Email ou mot de passe incorrect") }

        if (!user.actif) {
            throw UnauthorizedException("Compte utilisateur désactivé")
        }

        val now = LocalDateTime.now()
        if (user.lockoutUntil != null) {
            if (user.lockoutUntil!!.isAfter(now)) {
                val msg = "Compte temporairement verrouillé. Réessayez après ${user.lockoutUntil!!.format(timeFormatter)} ou utilisez Mot de passe oublié."
                throw AccountLockedException(msg, user.lockoutUntil)
            }
            user.failedLoginAttempts = 0
            user.lockoutUntil = null
            userRepository.save(user)
        }

        if (!passwordEncoder.matches(request.password, user.motDePasse)) {
            user.failedLoginAttempts = user.failedLoginAttempts + 1
            if (user.failedLoginAttempts >= lockoutMaxAttempts) {
                user.lockoutUntil = now.plusMinutes(lockoutDurationMinutes.toLong())
                userRepository.save(user)
                val msg = "Compte temporairement verrouillé après trop de tentatives. Réessayez après ${user.lockoutUntil!!.format(timeFormatter)} ou utilisez Mot de passe oublié."
                throw AccountLockedException(msg, user.lockoutUntil)
            }
            userRepository.save(user)
            throw UnauthorizedException("Email ou mot de passe incorrect")
        }

        user.failedLoginAttempts = 0
        user.lockoutUntil = null
        userRepository.save(user)

        // Si 2FA activé, retourner token temporaire au lieu de créer la session
        if (user.totpEnabled) {
            val tempToken = jwtTokenProvider.generate2FAPendingToken(user.email)
            logger.debug("2FA requis pour: ${user.email}")
            return LoginResult.Requires2FA(
                Login2FAPendingResponse(tempToken = tempToken)
            )
        }
        
        val (response, isNewDevice) = createSessionAndAuthResponse(user, httpRequest, request.rememberMe)
        if (notifyOnLogin && user.alertNewLoginEnabled && isNewDevice) {
            emailService.sendLoginNotificationAsync(
                user.email,
                "${user.prenom} ${user.nom}",
                httpRequest.remoteAddr,
                httpRequest.getHeader("User-Agent")
            )
        }
        return LoginResult.Success(response)
    }

    fun verify2FA(request: Verify2FARequest, httpRequest: HttpServletRequest): AuthResponse {
        logger.debug("Vérification 2FA")
        val email = jwtTokenProvider.validate2FAPendingToken(request.tempToken)
            ?: throw UnauthorizedException("Token temporaire invalide ou expiré")
        val user = userRepository.findByEmail(email)
            .orElseThrow { UnauthorizedException("Token invalide") }
        if (!user.actif) throw UnauthorizedException("Compte désactivé")
        val secret = user.totpSecret ?: throw UnauthorizedException("2FA non configuré")
        if (!twoFactorService.verifyCode(secret, request.code)) {
            throw UnauthorizedException("Code 2FA incorrect")
        }
        logger.info("2FA validé pour: ${user.email}")
        val (response, isNewDevice) = createSessionAndAuthResponse(user, httpRequest, request.rememberMe)
        if (notifyOnLogin && user.alertNewLoginEnabled && isNewDevice) {
            emailService.sendLoginNotificationAsync(
                user.email,
                "${user.prenom} ${user.nom}",
                httpRequest.remoteAddr,
                httpRequest.getHeader("User-Agent")
            )
        }
        return response
    }

    private data class SessionResult(val response: AuthResponse, val isNewDevice: Boolean)

    private fun createSessionAndAuthResponse(user: User, httpRequest: HttpServletRequest, rememberMe: Boolean = false): SessionResult {
        val roles = user.roles.map { it.code }
        val sessionDurationMs = when {
            rememberMe -> SecurityConstants.LONG_SESSION_MS
            user.defaultSessionDuration == "LONG" -> SecurityConstants.LONG_SESSION_MS
            user.defaultSessionDuration == "SHORT" -> SecurityConstants.SHORT_SESSION_MS
            else -> SecurityConstants.SHORT_SESSION_MS
        }
        val accessToken = jwtTokenProvider.generateToken(user.email, roles, SecurityConstants.DEFAULT_JWT_EXPIRATION_MS)
        val refreshToken = jwtTokenProvider.generateRefreshToken(user.email, sessionDurationMs)
        val now = LocalDateTime.now()
        val refreshTokenExpiration = now.plusSeconds(sessionDurationMs / 1000)
        val ip = httpRequest.remoteAddr
        val ua = httpRequest.getHeader("User-Agent") ?: ""
        val deviceName = parseDeviceName(ua)

        val matchingSessions = if (ip.isNotBlank() && ua.isNotBlank()) {
            sessionRepository.findActiveByUserIdAndIpAndUserAgent(user.id!!, ip, ua)
        } else emptyList()

        val existingSession = matchingSessions.firstOrNull()
        val isNewDevice = existingSession == null

        if (matchingSessions.size > 1) {
            val duplicates = matchingSessions.drop(1)
            duplicates.forEach { it.active = false }
            sessionRepository.saveAll(duplicates)
            logger.info("Nettoyage de ${duplicates.size} session(s) dupliquée(s) pour userId=${user.id}, ip=$ip")
        }

        val session = if (existingSession != null) {
            existingSession.token = accessToken
            existingSession.refreshToken = refreshToken
            existingSession.lastActivity = now
            existingSession.dateExpiration = refreshTokenExpiration
            existingSession.deviceName = deviceName
            existingSession
        } else {
            enforceMaxSessions(user.id!!, MAX_SESSIONS_PER_USER)
            Session(
                user = user,
                token = accessToken,
                refreshToken = refreshToken,
                ipAddress = ip,
                userAgent = ua,
                deviceName = deviceName,
                dateDebut = now,
                dateExpiration = refreshTokenExpiration
            )
        }
        sessionRepository.save(session)
        user.lastLogin = now
        userRepository.save(user)
        auditLogService.log(user, "AUTH", "LOGIN", deviceName.ifBlank { null }, ip, actorOverride = user.email)
        if (isNewDevice) {
            logger.info("Nouvel appareil détecté pour ${user.email}: $deviceName (IP: $ip)")
        }
        return SessionResult(
            response = AuthResponse(
                accessToken = accessToken,
                refreshToken = refreshToken,
                expiresIn = SecurityConstants.DEFAULT_JWT_EXPIRATION_MS / 1000,
                sessionExpiresIn = sessionDurationMs / 1000,
                user = UserMapper.toResponse(user)
            ),
            isNewDevice = isNewDevice
        )
    }

    private fun enforceMaxSessions(userId: Long, max: Int) {
        val activeCount = sessionRepository.countActiveByUserId(userId)
        if (activeCount >= max) {
            val orderedSessions = sessionRepository.findActiveSessionsByUserIdOrderByLastActivityAsc(userId)
            val toDeactivate = orderedSessions.take((activeCount - max + 1).toInt())
            toDeactivate.forEach { it.active = false }
            sessionRepository.saveAll(toDeactivate)
            logger.info("Désactivation de ${toDeactivate.size} session(s) ancienne(s) pour userId=$userId (limite=$max)")
        }
    }

    internal fun parseDeviceName(userAgent: String?): String {
        if (userAgent.isNullOrBlank()) return "Appareil inconnu"
        val ua = userAgent.lowercase()

        val browser = when {
            ua.contains("edg/") || ua.contains("edge/") -> "Edge"
            ua.contains("opr/") || ua.contains("opera") -> "Opera"
            ua.contains("chrome") && !ua.contains("edg") -> "Chrome"
            ua.contains("firefox") -> "Firefox"
            ua.contains("safari") && !ua.contains("chrome") -> "Safari"
            else -> "Navigateur"
        }

        val os = when {
            ua.contains("iphone") -> "iPhone"
            ua.contains("ipad") -> "iPad"
            ua.contains("android") -> "Android"
            ua.contains("windows") -> "Windows"
            ua.contains("macintosh") || ua.contains("mac os") -> "Mac"
            ua.contains("linux") -> "Linux"
            else -> "Autre"
        }

        return "$browser sur $os"
    }
    
    fun setup2FA(): Setup2FAResponse {
        val email = SecurityContextHolder.getContext().authentication?.name
            ?: throw UnauthorizedException("Non authentifié")
        val user = userRepository.findByEmail(email)
            .orElseThrow { UnauthorizedException("Utilisateur introuvable") }
        // Toujours générer un nouveau secret pour éviter les problèmes d'anciens formats
        val (s, qr) = twoFactorService.generateSecretAndQr(user.email)
        user.totpSecret = s
        user.totpEnabled = false
        userRepository.saveAndFlush(user)
        logger.info("Setup 2FA initié pour: ${user.email}")
        return Setup2FAResponse(secret = s, qrImageBase64 = qr)
    }
    
    fun verifySetup2FA(request: Verify2FASetupRequest): UserResponse {
        val email = SecurityContextHolder.getContext().authentication?.name
            ?: throw UnauthorizedException("Non authentifié")
        val user = userRepository.findByEmail(email)
            .orElseThrow { UnauthorizedException("Utilisateur introuvable") }
        val rawSecret = user.totpSecret ?: throw BadRequestException("Effectuez d'abord l'étape de configuration 2FA")
        val secret = twoFactorService.cleanSecret(rawSecret)
        if (secret != rawSecret) {
            user.totpSecret = secret
            userRepository.saveAndFlush(user)
        }
        val digitsOnly = request.code.filter { it.isDigit() }
        if (digitsOnly.length < 6) {
            throw BadRequestException("Le code doit contenir exactement 6 chiffres.")
        }
        val codeToVerify = digitsOnly.take(6)
        if (!twoFactorService.verifyCode(secret, codeToVerify)) {
            throw BadRequestException("Code incorrect. Vérifiez l'heure de votre appareil et réessayez.")
        }
        user.totpEnabled = true
        userRepository.saveAndFlush(user)
        logger.info("2FA activé avec succès pour: ${user.email}")
        if (user.emailNotificationsEnabled) {
            try {
                emailService.send2FAEnabledNotification(user.email, "${user.prenom} ${user.nom}")
            } catch (e: Exception) {
                logger.warn("Envoi notification 2FA activée échoué: ${e.message}")
            }
        }
        return UserMapper.toResponse(user)
    }

    fun disable2FA(request: Disable2FARequest) {
        val email = SecurityContextHolder.getContext().authentication?.name
            ?: throw UnauthorizedException("Non authentifié")
        val user = userRepository.findByEmail(email)
            .orElseThrow { UnauthorizedException("Utilisateur introuvable") }
        if (!passwordEncoder.matches(request.password, user.motDePasse)) {
            throw BadRequestException("Mot de passe incorrect")
        }
        user.totpSecret = null
        user.totpEnabled = false
        userRepository.save(user)
        logger.info("2FA désactivé pour: ${user.email}")
        if (user.emailNotificationsEnabled) {
            try {
                emailService.send2FADisabledNotification(user.email, "${user.prenom} ${user.nom}")
            } catch (e: Exception) {
                logger.warn("Envoi notification 2FA désactivée échoué: ${e.message}")
            }
        }
    }

    fun refreshToken(request: RefreshTokenRequest): AuthResponse {
        logger.debug("Tentative de renouvellement de token")
        val token = request.refreshToken?.takeIf { it.isNotBlank() }
            ?: throw UnauthorizedException("Refresh token manquant")
        val session = sessionRepository.findByRefreshToken(token)
            .orElseThrow { UnauthorizedException("Refresh token invalide") }
        
        if (!session.active) {
            throw UnauthorizedException("Session inactive")
        }
        
        if (session.dateExpiration.isBefore(LocalDateTime.now())) {
            session.active = false
            sessionRepository.save(session)
            throw UnauthorizedException("Refresh token expiré")
        }
        
        val user = session.user
        
        if (!user.actif) {
            throw UnauthorizedException("Compte utilisateur désactivé")
        }
        
        // Génération de nouveaux tokens — conserver la même date d'expiration de session
        val roles = user.roles.map { it.code }
        val now = LocalDateTime.now()
        val remainingSeconds = java.time.Duration.between(now, session.dateExpiration).seconds.coerceAtLeast(60)
        val newAccessToken = jwtTokenProvider.generateToken(user.email, roles, SecurityConstants.DEFAULT_JWT_EXPIRATION_MS)
        val newRefreshToken = jwtTokenProvider.generateRefreshToken(user.email, remainingSeconds * 1000)
        
        session.token = newAccessToken
        session.refreshToken = newRefreshToken
        session.lastActivity = now
        sessionRepository.save(session)
        
        logger.info("Token renouvelé pour l'utilisateur: ${user.email}")
        
        return AuthResponse(
            accessToken = newAccessToken,
            refreshToken = newRefreshToken,
            expiresIn = SecurityConstants.DEFAULT_JWT_EXPIRATION_MS / 1000,
            sessionExpiresIn = remainingSeconds,
            user = UserMapper.toResponse(user)
        )
    }
    
    fun logout(token: String) {
        logger.debug("Déconnexion")
        
        val session = sessionRepository.findByToken(token)
            .orElse(null)
        
        session?.let {
            it.active = false
            sessionRepository.save(it)
            logger.info("Session désactivée pour l'utilisateur: ${it.user.email}")
        }
    }
    
    fun logoutAll(userId: Long) {
        logger.debug("Déconnexion de toutes les sessions pour l'utilisateur: $userId")
        sessionRepository.deactivateAllUserSessions(userId)
    }

    fun getMySessions(userId: Long, currentToken: String? = null): List<SessionResponse> {
        val sessions = sessionRepository.findActiveSessionsByUserId(userId)
        return sessions.map { s ->
            SessionResponse(
                id = s.id!!,
                ipAddress = s.ipAddress,
                userAgent = s.userAgent,
                deviceName = s.deviceName ?: parseDeviceName(s.userAgent),
                isCurrent = currentToken != null && s.token == currentToken,
                dateDebut = s.dateDebut,
                lastActivity = s.lastActivity
            )
        }
    }

    fun revokeMySession(userId: Long, sessionId: Long) {
        val session = sessionRepository.findById(sessionId)
            .orElseThrow { ResourceNotFoundException("Session introuvable") }
        if (session.user.id != userId) {
            throw ResourceNotFoundException("Session introuvable")
        }
        session.active = false
        sessionRepository.save(session)
        logger.info("Session $sessionId révoquée pour l'utilisateur: ${session.user.email}")
    }

    companion object {
        private const val RESET_TOKEN_EXPIRATION_HOURS = 1L
        private const val MAX_SESSIONS_PER_USER = 3
    }

    /**
     * Demande de réinitialisation du mot de passe.
     * Ne révèle jamais si l'email existe ou non (protection contre l'énumération).
     */
    fun forgotPassword(request: ForgotPasswordRequest) {
        logger.debug("Demande reset mot de passe pour: ${request.email}")
        val user = userRepository.findByEmail(request.email).orElse(null) ?: run {
            logger.debug("Email non trouvé: ${request.email} (réponse générique envoyée)")
            return
        }
        if (!user.actif) {
            logger.debug("Compte désactivé: ${request.email}")
            return
        }
        val token = UUID.randomUUID().toString().replace("-", "")
        val expiry = LocalDateTime.now().plusHours(RESET_TOKEN_EXPIRATION_HOURS)
        val resetToken = PasswordResetToken(user = user, token = token, dateExpiration = expiry)
        passwordResetTokenRepository.save(resetToken)
        try {
            emailService.sendPasswordResetEmail(user.email, user.prenom, token)
        } catch (e: Exception) {
            logger.warn("Envoi email réinitialisation mot de passe échoué pour ${user.email}: ${e.message}", e)
        }
    }

    /**
     * Réinitialise le mot de passe avec le token reçu par email.
     */
    fun resetPassword(request: ResetPasswordRequest) {
        logger.debug("Tentative reset mot de passe avec token")
        val resetToken = passwordResetTokenRepository.findByToken(request.token)
            ?: throw BadRequestException("Token invalide ou expiré")
        if (resetToken.used) {
            throw BadRequestException("Token déjà utilisé")
        }
        if (resetToken.isExpired()) {
            resetToken.used = true
            passwordResetTokenRepository.save(resetToken)
            throw BadRequestException("Token expiré. Veuillez faire une nouvelle demande.")
        }
        val user = resetToken.user
        if (!user.actif) {
            throw BadRequestException("Compte utilisateur désactivé")
        }
        user.motDePasse = passwordEncoder.encode(request.newPassword)!!
        user.failedLoginAttempts = 0
        user.lockoutUntil = null
        userRepository.save(user)
        resetToken.used = true
        passwordResetTokenRepository.save(resetToken)
        logger.info("Mot de passe réinitialisé pour: ${user.email}")
        if (user.emailNotificationsEnabled) {
            try {
                emailService.sendPasswordChangedNotification(user.email, "${user.prenom} ${user.nom}")
            } catch (e: Exception) {
                logger.warn("Envoi notification mot de passe modifié échoué: ${e.message}")
            }
        }
    }
}
