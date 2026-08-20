package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.materiel.entity.SourcePosition
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.ConsommationCarburantCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.InspectionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.PositionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.MouvementEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.ReleveCompteurCreateRequest
import com.mikaservices.platform.modules.materiel.dto.response.MouvementEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.TerrainEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.CarnetEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.ConsommationCarburantResponse
import com.mikaservices.platform.modules.materiel.dto.response.IncidentEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.InspectionEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.PositionEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.ReleveCompteurResponse
import com.mikaservices.platform.modules.materiel.dto.response.TerrainChantierResponse
import com.mikaservices.platform.modules.materiel.dto.response.TerrainMeChantierResponse
import com.mikaservices.platform.modules.materiel.dto.response.TerrainMeResponse
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.chantier.repository.AffectationUtilisateurProjetRepository
import com.mikaservices.platform.modules.materiel.entity.Engin
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.ConsommationCarburantRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.InspectionEnginRepository
import com.mikaservices.platform.common.exception.UnauthorizedException
import com.mikaservices.platform.modules.communication.dto.response.NotificationResponse
import com.mikaservices.platform.modules.communication.service.NotificationService
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

/**
 * Service de l'application mobile terrain (conducteurs d'engins).
 * Délègue aux services métier existants sans modifier leurs règles.
 */
@Service
@Transactional(readOnly = true)
class TerrainService(
    private val enginRepository: EnginRepository,
    private val affectationRepository: AffectationEnginChantierRepository,
    private val inspectionRepository: InspectionEnginRepository,
    private val consommationRepository: ConsommationCarburantRepository,
    private val positionEnginService: PositionEnginService,
    private val releveCompteurService: ReleveCompteurService,
    private val consommationCarburantService: ConsommationCarburantService,
    private val incidentEnginService: IncidentEnginService,
    private val inspectionEnginService: InspectionEnginService,
    private val carnetEnginService: CarnetEnginService,
    private val mouvementEnginService: MouvementEnginService,
    private val notificationService: NotificationService,
    private val currentUserService: CurrentUserService,
    private val affectationUtilisateurRepository: AffectationUtilisateurProjetRepository,
    private val projetRepository: ProjetRepository
) {

    /** Contexte de l'utilisateur connecté : identité, rôles, permissions et chantiers EN_COURS. */
    fun me(): TerrainMeResponse {
        val user = actingUser()
        val chantiers = affectationUtilisateurRepository
            .findByUserIdAndStatutIn(user.id!!, listOf(StatutAffectation.EN_COURS))
            .filter { it.projet.actif }
            .map { TerrainMeChantierResponse(it.projet.id!!, it.projet.nom, it.poste, it.dateDebut) }
            .sortedBy { it.nom.lowercase() }
        return TerrainMeResponse(
            id = user.id!!,
            nom = user.nom,
            prenom = user.prenom,
            email = user.email,
            roles = user.roles.filter { it.actif }.map { it.code }.sorted(),
            permissions = user.roles.filter { it.actif }
                .flatMap { r -> r.permissions.filter { it.actif }.map { it.code } }
                .distinct().sorted(),
            chantiers = chantiers
        )
    }

    /** Nom complet de l'utilisateur connecté (pour tracer qui agit sur le terrain). */
    private fun currentUserNom(): String? =
        currentUserService.getCurrentUser()?.let { "${it.prenom} ${it.nom}".trim() }

    /** Utilisateur connecté (l'API terrain exige un token, cf. SecurityConfig). */
    private fun actingUser(): User =
        currentUserService.getCurrentUser()
            ?: throw UnauthorizedException("Authentification requise")

    // ── Notifications in-app (écran Alertes terrain) ──────────────────────

    fun mesNotifications(pageable: Pageable): Page<NotificationResponse> =
        notificationService.getMesNotifications(actingUser().id!!, pageable)

    fun countNotificationsNonLues(): Long =
        notificationService.countNonLues(actingUser().id!!)

    @Transactional
    fun marquerNotificationLue(notificationId: Long): NotificationResponse =
        notificationService.marquerCommeLue(notificationId, actingUser().id!!)

    @Transactional
    fun marquerToutesNotificationsLues(): Int =
        notificationService.marquerToutesLues(actingUser().id!!)

    /** Affectation « ouverte » — même définition que MouvementEnginService (localisation réelle de l'engin). */
    private val statutsAffectationOuverte = listOf(StatutAffectation.PLANIFIEE, StatutAffectation.EN_COURS)

    private fun affectationOuverte(enginId: Long) =
        affectationRepository.findOuvertesParEngin(enginId, statutsAffectationOuverte).firstOrNull()

    private fun chantierEnCours(enginId: Long): String? =
        affectationOuverte(enginId)?.projet?.nom

    private fun toTerrainResponse(engin: Engin): TerrainEnginResponse {
        val id = engin.id!!
        val affectation = affectationOuverte(id)
        return TerrainEnginResponse(
            id = id,
            code = engin.code,
            nom = engin.nom,
            type = engin.type,
            statut = engin.statut,
            marque = engin.marque,
            modele = engin.modele,
            heuresCompteur = engin.heuresCompteur,
            chantierNom = affectation?.projet?.nom,
            chantierDepuis = affectation?.dateDebut,
            inspectionFaiteAujourdhui = inspectionRepository.existsByEnginIdAndDateInspection(id, LocalDate.now()),
            dernierPlein = consommationRepository.findByEnginIdOrderByDatePleinDesc(id).firstOrNull()?.datePlein,
            // URL Cloudinary directe, sinon repli sur le flux photo terrain (fichiers legacy stockés en local)
            photo = engin.photo?.let {
                if (it.startsWith("http://") || it.startsWith("https://")) it
                else "/api/terrain/engins/$id/photo"
            }
        )
    }

    /** Rôles qui voient l'intégralité du parc (transversaux). */
    private val rolesParcComplet = setOf("SUPER_ADMIN", "ADMIN", "LOGISTIQUE")

    private fun hasParcComplet(user: User): Boolean =
        user.roles.any { it.actif && it.code in rolesParcComplet }

    /** Projets affectés EN_COURS de l'utilisateur (périmètre recalculé à chaque requête). */
    private fun projetsAffectes(user: User): Set<Long> =
        affectationUtilisateurRepository
            .findByUserIdAndStatutIn(user.id!!, listOf(StatutAffectation.EN_COURS))
            .mapNotNull { it.projet.id }
            .toSet()

    /**
     * Périmètre engin (règle unique terrain) : trio LOGISTIQUE/ADMIN/SUPER_ADMIN = tout ;
     * sinon l'engin doit être affecté EN_COURS à un de mes chantiers (affectation EN_COURS).
     * Engin au dépôt (sans affectation) = trio uniquement. Hors périmètre → 404, jamais 403.
     */
    fun assertEnginDansPerimetre(enginId: Long) {
        val user = actingUser()
        if (hasParcComplet(user)) return
        val projetId = affectationRepository
            .findByEnginIdAndStatut(enginId, StatutAffectation.EN_COURS)
            .firstOrNull()?.projet?.id
        if (projetId == null || projetId !in projetsAffectes(user)) {
            throw ResourceNotFoundException("Engin non trouvé: $enginId")
        }
    }

    /** Rôles habilités à initier un transfert (miroir de ROLES_TRANSFERT du contrôleur). */
    private val rolesTransfert = setOf("CHEF_PROJET", "CHEF_CHANTIER", "LOGISTIQUE", "ADMIN", "SUPER_ADMIN")

    /**
     * Chantiers sélectionnables dans les formulaires : trio = tous les actifs, sinon affectations EN_COURS.
     * Exception unique (matrice §2.4) : contexte « transfert » = tous les chantiers actifs comme
     * destinations possibles, réservée aux rôles habilités à initier un transfert.
     */
    fun chantiersVisibles(contexte: String? = null): List<TerrainChantierResponse> {
        val user = actingUser()
        val listeComplete = hasParcComplet(user) ||
            (contexte == "transfert" && user.roles.any { it.actif && it.code in rolesTransfert })
        val chantiers = if (listeComplete) {
            projetRepository.findAll()
                .filter { it.actif }
                .map { TerrainChantierResponse(it.id!!, it.nom) }
        } else {
            affectationUtilisateurRepository
                .findByUserIdAndStatutIn(user.id!!, listOf(StatutAffectation.EN_COURS))
                .filter { it.projet.actif }
                .map { TerrainChantierResponse(it.projet.id!!, it.projet.nom) }
                .distinctBy { it.id }
        }
        return chantiers.sortedBy { it.nom.lowercase() }
    }

    /**
     * Engins visibles par l'utilisateur : tout le parc pour les rôles transversaux,
     * sinon uniquement les engins affectés (EN_COURS) à ses chantiers (affectation EN_COURS).
     */
    fun mesEngins(): List<TerrainEnginResponse> {
        val user = actingUser()
        val actifs = enginRepository.findAll().filter { it.actif }
        val visibles = if (user.roles.any { it.actif && it.code in rolesParcComplet }) {
            actifs
        } else {
            val mesProjets = affectationUtilisateurRepository
                .findByUserIdAndStatutIn(user.id!!, listOf(StatutAffectation.EN_COURS))
                .mapNotNull { it.projet.id }
                .toSet()
            actifs.filter { engin ->
                val projetId = affectationRepository
                    .findByEnginIdAndStatut(engin.id!!, StatutAffectation.EN_COURS)
                    .firstOrNull()?.projet?.id
                projetId != null && projetId in mesProjets
            }
        }
        return visibles.map { toTerrainResponse(it) }
    }

    /**
     * Résout un engin depuis un scan QR ou une saisie manuelle.
     * Accepte : le code engin (ENG-2024-042), le token QR, ou l'URL encodée dans le QR
     * (…/engins/{id} ou …/terrain?engin={id}) — quel que soit le domaine (prod/local).
     */
    fun scan(q: String): TerrainEnginResponse {
        val query = q.trim()
        val engin = enginRepository.findByCode(query).orElse(null)
            ?: enginRepository.findByQrCodeToken(query).orElse(null)
            ?: (Regex("""/engins/(\d+)""").find(query) ?: Regex("""[?&]engin=(\d+)""").find(query))
                ?.groupValues?.get(1)?.toLongOrNull()
                ?.let { enginRepository.findById(it).orElse(null) }
            ?: throw ResourceNotFoundException("Aucun engin trouvé pour « $query »")
        if (!engin.actif) throw ResourceNotFoundException("Engin inactif : ${engin.code}")
        return toTerrainResponse(engin)
    }

    /** Timeline d'historique de l'engin (fiche enrichie E03). */
    fun carnet(enginId: Long): CarnetEnginResponse {
        assertEnginDansPerimetre(enginId)
        return carnetEnginService.getCarnet(enginId)
    }

    /** Confirmation de position au scan QR : source forcée QR_SCAN, traçabilité conducteur + chantier. */
    @Transactional
    fun confirmerPosition(enginId: Long, request: PositionEnginCreateRequest): PositionEnginResponse {
        assertEnginDansPerimetre(enginId)
        return positionEnginService.create(
            enginId,
            request.copy(
                source = SourcePosition.QR_SCAN,
                confirmePar = request.confirmePar ?: currentUserNom(),
                chantierNom = request.chantierNom ?: chantierEnCours(enginId)
            )
        )
    }

    @Transactional
    fun creerReleve(enginId: Long, request: ReleveCompteurCreateRequest): ReleveCompteurResponse {
        assertEnginDansPerimetre(enginId)
        return releveCompteurService.create(enginId, request.copy(relevePar = request.relevePar ?: currentUserNom()))
    }

    @Transactional
    fun creerRavitaillement(enginId: Long, request: ConsommationCarburantCreateRequest): ConsommationCarburantResponse {
        assertEnginDansPerimetre(enginId)
        return consommationCarburantService.create(enginId, request.copy(pleinPar = request.pleinPar ?: currentUserNom()))
    }

    @Transactional
    fun signalerIncident(enginId: Long, request: IncidentEnginCreateRequest): IncidentEnginResponse {
        // Décision métier : tout rôle peut signaler (sécurité), mais uniquement dans son périmètre.
        assertEnginDansPerimetre(enginId)
        return incidentEnginService.create(enginId, request.copy(signalePar = request.signalePar ?: currentUserNom()))
    }

    @Transactional
    fun creerInspection(enginId: Long, request: InspectionEnginCreateRequest): InspectionEnginResponse {
        assertEnginDansPerimetre(enginId)
        return inspectionEnginService.create(enginId, request.copy(inspectePar = request.inspectePar ?: currentUserNom()))
    }

    /** Demande de transfert terrain : le chantier d'origine est résolu automatiquement (affectation EN_COURS). */
    @Transactional
    fun creerTransfert(request: MouvementEnginCreateRequest): MouvementEnginResponse =
        // L'origine est résolue par le serveur (MouvementEnginService.create) depuis la
        // localisation réelle de l'engin : toute origine fournie par le client est ignorée.
        mouvementEnginService.create(request.copy(projetOrigineId = null))
}
