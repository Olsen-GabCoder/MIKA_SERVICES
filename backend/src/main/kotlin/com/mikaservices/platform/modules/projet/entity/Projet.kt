package com.mikaservices.platform.modules.projet.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.ConditionAcces
import com.mikaservices.platform.common.enums.ModeSuiviMensuel
import com.mikaservices.platform.common.enums.SourceFinancement
import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.common.enums.ZoneClimatique
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "projets", indexes = [
    Index(name = "idx_projet_numero_marche", columnList = "numero_marche"),
    Index(name = "idx_projet_code", columnList = "code_projet"),
    Index(name = "idx_projet_statut", columnList = "statut"),
    Index(name = "idx_projet_client", columnList = "client_id")
])
class Projet(
    @Column(name = "code_projet", nullable = false, unique = true, length = 50)
    var codeProjet: String,

    @Column(name = "numero_marche", length = 100)
    var numeroMarche: String? = null,

    @Column(name = "nom", nullable = false, length = 300)
    var nom: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypeProjet,

    /** Types multiples (ex. voirie + ouvrage d'art). Le champ type ci‑dessus garde le premier pour index/filtre. */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "projet_types", joinColumns = [JoinColumn(name = "projet_id")])
    @Enumerated(EnumType.STRING)
    @Column(name = "type_value", length = 30)
    @org.hibernate.annotations.BatchSize(size = 50)
    var types: MutableSet<TypeProjet> = mutableSetOf(),

    @Column(name = "type_personnalise", length = 150)
    var typePersonnalise: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 30)
    var statut: StatutProjet = StatutProjet.EN_ATTENTE,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    var client: Client? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "source_financement", length = 30)
    var sourceFinancement: SourceFinancement? = null,

    @Column(name = "imputation_budgetaire", length = 100)
    var imputationBudgetaire: String? = null,

    @Column(name = "province", length = 100)
    var province: String? = null,

    @Column(name = "ville", length = 100)
    var ville: String? = null,

    @Column(name = "quartier", length = 100)
    var quartier: String? = null,

    @Column(name = "adresse", length = 500)
    var adresse: String? = null,

    @Column(name = "latitude")
    var latitude: Double? = null,

    @Column(name = "longitude")
    var longitude: Double? = null,

    @Column(name = "superficie", precision = 15, scale = 2)
    var superficie: BigDecimal? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_acces", length = 20)
    var conditionAcces: ConditionAcces? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "zone_climatique", length = 20)
    var zoneClimatique: ZoneClimatique? = null,

    @Column(name = "distance_depot_km")
    var distanceDepotKm: Double? = null,

    @Column(name = "nombre_ouvriers_prevu")
    var nombreOuvriersPrevu: Int? = null,

    @Column(name = "horaire_travail", length = 50)
    var horaireTravail: String? = null,

    @Column(name = "montant_ht", precision = 20, scale = 2)
    var montantHT: BigDecimal? = null,

    @Column(name = "montant_ttc", precision = 20, scale = 2)
    var montantTTC: BigDecimal? = null,

    @Column(name = "montant_initial", precision = 20, scale = 2)
    var montantInitial: BigDecimal? = null,

    @Column(name = "montant_revise", precision = 20, scale = 2)
    var montantRevise: BigDecimal? = null,

    @Column(name = "delai_mois")
    var delaiMois: Int? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_suivi_mensuel", length = 10)
    var modeSuiviMensuel: ModeSuiviMensuel? = ModeSuiviMensuel.AUTO,

    @Column(name = "date_debut")
    var dateDebut: LocalDate? = null,

    @Column(name = "date_fin")
    var dateFin: LocalDate? = null,

    @Column(name = "date_debut_reel")
    var dateDebutReel: LocalDate? = null,

    @Column(name = "date_fin_reelle")
    var dateFinReelle: LocalDate? = null,

    @Column(name = "avancement_global", precision = 5, scale = 2)
    var avancementGlobal: BigDecimal = BigDecimal.ZERO,

    @Column(name = "avancement_physique_pct", precision = 5, scale = 2)
    var avancementPhysiquePct: BigDecimal? = null,

    @Column(name = "avancement_financier_pct", precision = 5, scale = 2)
    var avancementFinancierPct: BigDecimal? = null,

    @Column(name = "delai_consomme_pct", precision = 5, scale = 2)
    var delaiConsommePct: BigDecimal? = null,

    @Column(name = "besoins_materiel", columnDefinition = "TEXT")
    var besoinsMateriel: String? = null,

    @Column(name = "besoins_humain", columnDefinition = "TEXT")
    var besoinsHumain: String? = null,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null,

    @Column(name = "propositions_amelioration", columnDefinition = "TEXT")
    var propositionsAmelioration: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_projet_id")
    var responsableProjet: User? = null,

    @Column(name = "partenaire_principal", length = 200)
    var partenairePrincipal: String? = null,

    @Column(name = "actif", nullable = false)
    var actif: Boolean = true,

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "projet_partenaires",
        joinColumns = [JoinColumn(name = "projet_id")],
        inverseJoinColumns = [JoinColumn(name = "partenaire_id")]
    )
    var partenaires: MutableSet<Partenaire> = mutableSetOf(),

    @OneToMany(mappedBy = "projet", fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    var sousProjets: MutableList<SousProjet> = mutableListOf(),

    @OneToMany(mappedBy = "projet", fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    var caPrevisionnelsRealises: MutableList<CAPrevisionnelRealise> = mutableListOf(),

    @OneToMany(mappedBy = "projet", fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    var pointsBloquants: MutableList<PointBloquant> = mutableListOf(),

    @OneToMany(mappedBy = "projet", fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    var previsions: MutableList<Prevision> = mutableListOf(),

    @OneToMany(mappedBy = "projet", fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    var revisionsBudget: MutableList<RevisionBudget> = mutableListOf(),

    @OneToMany(mappedBy = "projet", fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    var avancementEtudes: MutableList<AvancementEtudeProjet> = mutableListOf()
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Projet) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: nom.hashCode()

    override fun toString(): String = "Projet(id=$id, nom='$nom')"
}
