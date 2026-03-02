package com.mikaservices.platform.modules.user.mapper

import com.mikaservices.platform.modules.user.dto.request.UserCreateRequest
import com.mikaservices.platform.modules.user.dto.request.UserUpdateRequest
import com.mikaservices.platform.modules.user.dto.response.UserForMessagingResponse
import com.mikaservices.platform.modules.user.dto.response.UserResponse
import com.mikaservices.platform.modules.user.dto.response.UserSummaryResponse
import com.mikaservices.platform.modules.user.entity.User
import org.springframework.security.crypto.password.PasswordEncoder

object UserMapper {
    
    fun toResponse(user: User): UserResponse {
        return UserResponse(
            id = user.id!!,
            matricule = user.matricule,
            nom = user.nom,
            prenom = user.prenom,
            email = user.email,
            telephone = user.telephone,
            dateNaissance = user.dateNaissance,
            adresse = user.adresse,
            ville = user.ville,
            quartier = user.quartier,
            province = user.province,
            numeroCNI = user.numeroCNI,
            numeroPasseport = user.numeroPasseport,
            dateEmbauche = user.dateEmbauche,
            photo = user.photo,
            ficheMission = user.ficheMission,
            salaireMensuel = user.salaireMensuel,
            typeContrat = user.typeContrat,
            niveauExperience = user.niveauExperience,
            actif = user.actif,
            totpEnabled = user.totpEnabled == true,
            mustChangePassword = user.mustChangePassword,
            lastLogin = user.lastLogin,
            roles = RoleMapper.toResponseList(user.roles),
            departements = DepartementMapper.toResponseList(user.departements),
            specialites = SpecialiteMapper.toResponseList(user.specialites),
            superieurHierarchique = user.superieurHierarchique?.let { toSummaryResponse(it) },
            createdAt = user.createdAt,
            updatedAt = user.updatedAt,
            emailNotificationsEnabled = user.emailNotificationsEnabled,
            alertNewLoginEnabled = user.alertNewLoginEnabled,
            dailyDigestEnabled = user.dailyDigestEnabled,
            weeklyDigestEnabled = user.weeklyDigestEnabled,
            digestTime = user.digestTime,
            inAppNotificationsEnabled = user.inAppNotificationsEnabled,
            notificationSoundEnabled = user.notificationSoundEnabled,
            defaultSessionDuration = user.defaultSessionDuration,
            logoutOnBrowserClose = user.logoutOnBrowserClose
        )
    }
    
    fun toSummaryResponse(user: User): UserSummaryResponse {
        return UserSummaryResponse(
            id = user.id!!,
            matricule = user.matricule,
            nom = user.nom,
            prenom = user.prenom,
            email = user.email
        )
    }

    fun toForMessagingResponse(user: User): UserForMessagingResponse {
        val roleLabel = user.roles.firstOrNull()?.nom?.takeIf { it.isNotBlank() }
            ?: user.roles.firstOrNull()?.code?.takeIf { it.isNotBlank() }
            ?: ""
        return UserForMessagingResponse(
            id = user.id!!,
            nom = user.nom,
            prenom = user.prenom,
            email = user.email,
            roleLabel = roleLabel
        )
    }
    
    fun toResponseList(users: Collection<User>): List<UserResponse> {
        return users.map { toResponse(it) }
    }
    
    fun fromCreateRequest(request: UserCreateRequest, plainPassword: String, passwordEncoder: PasswordEncoder, mustChangePassword: Boolean = true): User {
        val encodedPassword = passwordEncoder.encode(plainPassword)!!
        return User(
            matricule = request.matricule,
            nom = request.nom,
            prenom = request.prenom,
            email = request.email,
            motDePasse = encodedPassword,
            telephone = request.telephone,
            dateNaissance = request.dateNaissance,
            adresse = request.adresse,
            ville = request.ville,
            quartier = request.quartier,
            province = request.province,
            numeroCNI = request.numeroCNI,
            numeroPasseport = request.numeroPasseport,
            dateEmbauche = request.dateEmbauche,
            photo = request.photo,
            salaireMensuel = request.salaireMensuel,
            typeContrat = request.typeContrat,
            niveauExperience = request.niveauExperience,
            actif = true,
            mustChangePassword = mustChangePassword
        )
    }
    
    fun updateFromRequest(user: User, request: UserUpdateRequest) {
        user.nom = request.nom
        user.prenom = request.prenom
        user.email = request.email
        request.telephone?.let { user.telephone = it }
        request.dateNaissance?.let { user.dateNaissance = it }
        request.adresse?.let { user.adresse = it }
        request.ville?.let { user.ville = it }
        request.quartier?.let { user.quartier = it }
        request.province?.let { user.province = it }
        request.numeroCNI?.let { user.numeroCNI = it }
        request.numeroPasseport?.let { user.numeroPasseport = it }
        request.dateEmbauche?.let { user.dateEmbauche = it }
        request.photo?.let { user.photo = it }
        request.ficheMission?.let { user.ficheMission = it }
        request.salaireMensuel?.let { user.salaireMensuel = it }
        request.typeContrat?.let { user.typeContrat = it }
        request.niveauExperience?.let { user.niveauExperience = it }
        request.actif?.let { user.actif = it }
    }
}
