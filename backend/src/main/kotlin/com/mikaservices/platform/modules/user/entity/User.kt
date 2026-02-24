package com.mikaservices.platform.modules.user.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.NiveauExperience
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
