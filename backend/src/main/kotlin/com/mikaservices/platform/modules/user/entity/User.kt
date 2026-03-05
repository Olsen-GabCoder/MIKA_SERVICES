package com.mikaservices.platform.modules.user.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.NiveauExperience
import com.mikaservices.platform.common.enums.Sexe
import com.mikaservices.platform.common.enums.SexeConverter
import com.mikaservices.platform.common.enums.TypeContrat
import jakarta.persistence.*
import org.hibernate.annotations.BatchSize
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "users", indexes = [
    Index(name = "idx_email", columnList = "email", unique = true),
    Index(name = "idx_matricule", columnList = "matricule", unique = true)
])
class User(
    @Column(name = "matricule", nullable = false, unique = true, length = 50)
    var matricule: String,
    
    @Column(name = "nom", nullable = false, length = 100)
    var nom: String,
    
    @Column(name = "prenom", nullable = false, length = 100)
    var prenom: String,
    
    @Column(name = "email", nullable = false, unique = true, length = 100)
    var email: String,

    @Convert(converter = SexeConverter::class)
    @Column(name = "sexe", length = 10)
    var sexe: Sexe? = null,
    
    @Column(name = "mot_de_passe", nullable = false, length = 255)
    var motDePasse: String,
    
    @Column(name = "telephone", length = 20)
    var telephone: String? = null,
    
    @Column(name = "date_naissance")
    var dateNaissance: LocalDate? = null,
    
    @Column(name = "adresse", length = 255)
    var adresse: String? = null,
    
    @Column(name = "ville", length = 100)
    var ville: String? = null,
    
    @Column(name = "quartier", length = 100)
    var quartier: String? = null,
    
    @Column(name = "province", length = 100)
    var province: String? = null,
    
    @Column(name = "numero_cni", length = 50)
    var numeroCNI: String? = null,
    
    @Column(name = "numero_passeport", length = 50)
    var numeroPasseport: String? = null,
    
    @Column(name = "date_embauche")
    var dateEmbauche: LocalDate? = null,
    
    @Column(name = "photo", length = 500)
    var photo: String? = null,

    @Column(name = "fiche_mission", columnDefinition = "TEXT")
    var ficheMission: String? = null,

    @Column(name = "salaire_mensuel", precision = 15, scale = 2)
    var salaireMensuel: BigDecimal? = null,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type_contrat", length = 20)
    var typeContrat: TypeContrat? = null,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_experience", length = 20)
    var niveauExperience: NiveauExperience? = null,
    
    @Column(name = "actif", nullable = false)
    var actif: Boolean = true,
    
    @Column(name = "last_login")
    var lastLogin: LocalDateTime? = null,

    @Column(name = "totp_secret", length = 64)
    var totpSecret: String? = null,

    @Column(name = "totp_enabled", nullable = false)
    var totpEnabled: Boolean = false,

    @Column(name = "must_change_password", nullable = false)
    var mustChangePassword: Boolean = false,

    @Column(name = "failed_login_attempts", nullable = false)
    var failedLoginAttempts: Int = 0,

    @Column(name = "lockout_until")
    var lockoutUntil: LocalDateTime? = null,

    /** Préférence : recevoir les e-mails transactionnels (MDP modifié, 2FA désactivée, etc.). Bienvenue et reset MDP toujours envoyés. */
    @Column(name = "email_notifications_enabled", nullable = false)
    var emailNotificationsEnabled: Boolean = true,

    /** Préférence : recevoir un e-mail à chaque nouvelle connexion (si config globale notify-on-login activée). */
    @Column(name = "alert_new_login_enabled", nullable = false)
    var alertNewLoginEnabled: Boolean = true,

    /** Préférence : recevoir un résumé quotidien par e-mail (notifications + messages non lus). */
    @Column(name = "daily_digest_enabled", nullable = false)
    var dailyDigestEnabled: Boolean = false,

    /** Préférence : recevoir un résumé hebdomadaire par e-mail. */
    @Column(name = "weekly_digest_enabled", nullable = false)
    var weeklyDigestEnabled: Boolean = false,

    /** Heure d'envoi des résumés (format HH:mm, fuseau serveur). Défaut 18:00. */
    @Column(name = "digest_time", length = 5)
    var digestTime: String? = "18:00",

    /** Préférence : afficher les notifications in-app (badge, alertes dans l'interface). */
    @Column(name = "in_app_notifications_enabled", nullable = false)
    var inAppNotificationsEnabled: Boolean = true,

    /** Préférence : jouer un son à la réception d'une notification ou d'un message in-app. */
    @Column(name = "notification_sound_enabled", nullable = false)
    var notificationSoundEnabled: Boolean = true,

    /** Préférence : durée de session par défaut à la connexion. "SHORT" = 1 h, "LONG" = 5 h. Null = utiliser le choix du formulaire (rememberMe). */
    @Column(name = "default_session_duration", length = 10)
    var defaultSessionDuration: String? = null,

    /** Préférence : déconnexion à la fermeture du navigateur (token en sessionStorage côté client). */
    @Column(name = "logout_on_browser_close", nullable = false)
    var logoutOnBrowserClose: Boolean = false,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "superieur_hierarchique_id")
    var superieurHierarchique: User? = null,
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "role_id")]
    )
    @BatchSize(size = 20)
    var roles: MutableSet<Role> = mutableSetOf(),

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_departements",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "departement_id")]
    )
    @BatchSize(size = 20)
    var departements: MutableSet<Departement> = mutableSetOf(),

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_specialites",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "specialite_id")]
    )
    @BatchSize(size = 20)
    var specialites: MutableSet<Specialite> = mutableSetOf()
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is User) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: email.hashCode()

    override fun toString(): String = "User(id=$id, email='$email', nom='$nom', prenom='$prenom')"
}
