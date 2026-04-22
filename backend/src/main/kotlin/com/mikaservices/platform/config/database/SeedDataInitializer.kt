package com.mikaservices.platform.config.database

import com.mikaservices.platform.common.enums.*
import com.mikaservices.platform.modules.budget.entity.Depense
import com.mikaservices.platform.modules.budget.repository.DepenseRepository
import com.mikaservices.platform.modules.chantier.entity.Equipe
import com.mikaservices.platform.modules.chantier.repository.EquipeRepository
import com.mikaservices.platform.modules.fournisseur.entity.Fournisseur
import com.mikaservices.platform.modules.fournisseur.repository.FournisseurRepository
import com.mikaservices.platform.modules.materiel.entity.Engin
import com.mikaservices.platform.modules.materiel.entity.Materiau
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.MateriauRepository
import com.mikaservices.platform.modules.planning.entity.Tache
import com.mikaservices.platform.modules.planning.repository.TacheRepository
import com.mikaservices.platform.modules.projet.entity.Client
import com.mikaservices.platform.modules.projet.entity.PointBloquant
import com.mikaservices.platform.modules.projet.entity.Prevision
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.projet.repository.ClientRepository
import com.mikaservices.platform.modules.projet.repository.PointBloquantRepository
import com.mikaservices.platform.modules.projet.repository.PrevisionRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.qualite.entity.*
import com.mikaservices.platform.modules.qualite.enums.*
import com.mikaservices.platform.modules.qualite.repository.*
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.repository.RoleRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.data.domain.PageRequest
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.YearMonth

/**
 * Seed de données réalistes pour dev/staging.
 * S'exécute après DataInitializer (permissions, rôles, admin).
 * Crée : clients, chefs de projet, projets, dépenses, tâches, points bloquants,
 * prévisions, contrôles qualité, incidents, risques, équipes, fournisseurs, matériaux, engins.
 */
@Configuration
@Profile("dev", "staging")
@Order(Ordered.LOWEST_PRECEDENCE)
class SeedDataInitializer(
    private val clientRepository: ClientRepository,
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val passwordEncoder: PasswordEncoder,
    private val projetRepository: ProjetRepository,
    private val depenseRepository: DepenseRepository,
    private val tacheRepository: TacheRepository,
    private val pointBloquantRepository: PointBloquantRepository,
    private val previsionRepository: PrevisionRepository,
    private val equipeRepository: EquipeRepository,
    private val fournisseurRepository: FournisseurRepository,
    private val materiauRepository: MateriauRepository,
    private val enginRepository: EnginRepository,
    private val jdbcTemplate: JdbcTemplate,
    private val demandeReceptionRepository: DemandeReceptionRepository,
    private val essaiLaboBetonRepository: EssaiLaboBetonRepository,
    private val leveeTopoRepository: LeveeTopoRepository,
    private val agrementMarcheRepository: AgrementMarcheRepository,
    private val evenementQualiteRepository: EvenementQualiteRepository,
    private val sectionEvenementRepository: SectionEvenementRepository,
    private val documentQualiteRepository: DocumentQualiteRepository
) {
    private val logger = LoggerFactory.getLogger(SeedDataInitializer::class.java)

    @Bean
    fun seedData(): CommandLineRunner {
        return CommandLineRunner {
            if (projetRepository.count() == 0L) {
                logger.info("Initialisation du jeu de données réaliste...")
                initClients()
                initChefProjetUsers()
                initProjets()
                ensureProjetId1()
                initDepenses()
                initTaches()
                initPointsBloquants()
                initPrevisions()
                initQualiteUsers()
                initEquipes()
                initFournisseurs()
                initMateriaux()
                initEngins()
                logger.info("Jeu de données réaliste initialisé avec succès.")
            }
            // Users qualité + données qualité : gardes internes, s'exécutent toujours
            initQualiteUsers()
            initQualiteData()
        }
    }

    private fun initClients() {
        if (clientRepository.count() > 0L) return
        val clients = listOf(
            Client("CLI-001", "Ministère des Travaux Publics", TypeClient.MINISTERE, ministere = "MTP", telephone = "+241 01 76 00 00", email = "contact@mtp.ga", adresse = "Libreville, Gabon", contactPrincipal = "Direction des marchés", telephoneContact = "+241 01 76 00 01"),
            Client("CLI-002", "Ville de Libreville", TypeClient.COLLECTIVITE, telephone = "+241 01 72 00 00", email = "mairie@libreville.ga", adresse = "Libreville", contactPrincipal = "Service technique"),
            Client("CLI-003", "État gabonais", TypeClient.ETAT_GABON, telephone = "+241 01 70 00 00", adresse = "Libreville"),
            Client("CLI-004", "Région Ogooué-Maritime", TypeClient.COLLECTIVITE, telephone = "+241 05 55 00 00", adresse = "Port-Gentil"),
            Client("CLI-005", "GSEZ", TypeClient.ENTREPRISE_PRIVEE, telephone = "+241 01 77 00 00", email = "contact@gsez.ga", adresse = "Zone économique, Libreville")
        )
        clientRepository.saveAll(clients)
        logger.info("${clients.size} clients créés")
    }

    private fun initChefProjetUsers(): List<User> {
        val chefRole = roleRepository.findByCode("CHEF_PROJET").orElse(null) ?: return emptyList()
        val existing = userRepository.findAll().filter { u -> u.roles.any { it.code == "CHEF_PROJET" } }
        if (existing.isNotEmpty()) return existing
        val users = listOf(
            User(matricule = "CP001", nom = "Mbenda", prenom = "Jean", email = "jean.mbenda@mikaservices.com", motDePasse = passwordEncoder.encode("Chef@2024")!!, dateEmbauche = LocalDate.now().minusYears(2), typeContrat = TypeContrat.CDI, niveauExperience = NiveauExperience.SENIOR, actif = true),
            User(matricule = "CP002", nom = "Okoué", prenom = "Marie", email = "marie.okoue@mikaservices.com", motDePasse = passwordEncoder.encode("Chef@2024")!!, dateEmbauche = LocalDate.now().minusYears(1), typeContrat = TypeContrat.CDI, niveauExperience = NiveauExperience.CONFIRME, actif = true),
            User(matricule = "CP003", nom = "Mba", prenom = "Paul", email = "paul.mba@mikaservices.com", motDePasse = passwordEncoder.encode("Chef@2024")!!, dateEmbauche = LocalDate.now().minusMonths(6), typeContrat = TypeContrat.CDI, niveauExperience = NiveauExperience.DEBUTANT, actif = true)
        )
        users.forEach { it.roles.add(chefRole); userRepository.save(it) }
        logger.info("${users.size} chefs de projet créés (mot de passe: Chef@2024)")
        return userRepository.findAll().filter { u -> u.roles.any { it.code == "CHEF_PROJET" } }
    }

    private fun initProjets() {
        if (projetRepository.count() > 0L) return
        val clients = clientRepository.findByActifTrue()
        val chefs = initChefProjetUsers()
        if (clients.size < 3 || chefs.size < 2) return
        val projets = listOf(
            Projet(codeProjet = "144/MTP/SG/2024", numeroMarche = "144/MTP/SG/2024", nom = "Réhabilitation RN1 - Section Libreville / Owendo", description = "Réhabilitation de la section Libreville-Owendo de la RN1.", type = TypeProjet.VOIRIE, statut = StatutProjet.EN_COURS, province = "Estuaire", ville = "Libreville", quartier = "Owendo", montantHT = BigDecimal("120000000"), montantTTC = BigDecimal("141600000"), montantInitial = BigDecimal("120000000"), delaiMois = 18, dateDebut = LocalDate.of(2024, 1, 15), dateFin = LocalDate.of(2025, 6, 30), avancementGlobal = BigDecimal("58"), avancementPhysiquePct = BigDecimal("58"), partenairePrincipal = "Bureau d'études associé").apply { client = clients[0]; responsableProjet = chefs[0] },
            Projet(codeProjet = "004/ED/MENFPFC/CTRI/2024", numeroMarche = "004/ED/MENFPFC/CTRI/2024", nom = "Assainissement quartier Akébé", description = "Réseau d'assainissement quartier Akébé.", type = TypeProjet.ASSAINISSEMENT, statut = StatutProjet.EN_COURS, province = "Estuaire", ville = "Libreville", quartier = "Akébé", montantHT = BigDecimal("85000000"), montantTTC = BigDecimal("100300000"), montantInitial = BigDecimal("85000000"), delaiMois = 12, dateDebut = LocalDate.of(2024, 3, 1), dateFin = LocalDate.of(2025, 2, 28), avancementGlobal = BigDecimal("67"), avancementPhysiquePct = BigDecimal("67"), partenairePrincipal = "Partenaires techniques").apply { client = clients[1]; responsableProjet = chefs[1] },
            Projet(codeProjet = "MAR-2024-003", numeroMarche = "MAR-2024-003", nom = "Construction pont sur la Komo", description = "Ouvrage d'art sur la Komo.", type = TypeProjet.PONT, statut = StatutProjet.PLANIFIE, province = "Estuaire", ville = "Libreville", montantHT = BigDecimal("250000000"), montantTTC = BigDecimal("295000000"), montantInitial = BigDecimal("250000000"), delaiMois = 24, dateDebut = LocalDate.of(2025, 1, 1), dateFin = LocalDate.of(2026, 12, 31), partenairePrincipal = "Maître d'œuvre").apply { client = clients[2]; responsableProjet = chefs.getOrNull(2) ?: chefs[0] },
            Projet(codeProjet = "N°PG/2023/008", numeroMarche = "N°PG/2023/008", nom = "Voirie secondaire Port-Gentil", description = "Voirie secondaire Port-Gentil.", type = TypeProjet.VOIRIE, statut = StatutProjet.TERMINE, province = "Ogooué-Maritime", ville = "Port-Gentil", montantHT = BigDecimal("45000000"), montantTTC = BigDecimal("53100000"), montantInitial = BigDecimal("45000000"), delaiMois = 12, dateDebut = LocalDate.of(2023, 6, 1), dateFin = LocalDate.of(2024, 5, 15), avancementGlobal = BigDecimal("100"), avancementPhysiquePct = BigDecimal("100"), partenairePrincipal = "Région").apply { client = clients[3]; responsableProjet = chefs[0] },
            Projet(codeProjet = "GSEZ/2023/012", numeroMarche = "GSEZ/2023/012", nom = "Terrassement zone industrielle", description = "Terrassement et préparation zone industrielle GSEZ.", type = TypeProjet.TERRASSEMENT, statut = StatutProjet.TERMINE, province = "Estuaire", ville = "Libreville", montantHT = BigDecimal("32000000"), montantTTC = BigDecimal("37760000"), montantInitial = BigDecimal("32000000"), delaiMois = 8, dateDebut = LocalDate.of(2023, 9, 1), dateFin = LocalDate.of(2024, 4, 30), avancementGlobal = BigDecimal("100"), avancementPhysiquePct = BigDecimal("100")).apply { client = clients.getOrNull(4) ?: clients[0]; responsableProjet = chefs[1] }
        )
        projetRepository.saveAll(projets)
        logger.info("${projets.size} projets créés")
    }

    private fun ensureProjetId1() {
        if (projetRepository.findById(1L).isPresent) return
        jdbcTemplate.update("""
            INSERT INTO projets (id, code_projet, numero_marche, nom, description, type, statut, actif, created_at, updated_at)
            VALUES (1, 'N°148/MTP/SG/2024', 'N°148/MTP/SG/2024', 'Projet de test (démo)', 'Projet créé automatiquement en environnement de développement.', 'AMENAGEMENT', 'EN_COURS', 1, NOW(), NOW())
        """.trimIndent())
        logger.info("Projet id=1 créé (fallback)")
    }

    private fun initDepenses() {
        if (depenseRepository.count() > 0L) return
        val projets = projetRepository.findByActifTrue(PageRequest.of(0, 500)).content
        if (projets.isEmpty()) return
        val admin = userRepository.findAll().firstOrNull()
        val depenses = mutableListOf<Depense>()
        projets.take(3).forEachIndexed { i, p ->
            depenses.add(Depense(p, "DEP-${p.id}-01", "Main d'œuvre mois ${i + 1}", TypeDepense.MAIN_OEUVRE, BigDecimal("5000000"), LocalDate.now().minusMonths(1), StatutDepense.VALIDEE, validePar = admin, dateValidation = LocalDate.now().minusMonths(1)))
            depenses.add(Depense(p, "DEP-${p.id}-02", "Matériaux chantier", TypeDepense.MATERIAUX, BigDecimal("3500000"), LocalDate.now().minusMonths(1), StatutDepense.VALIDEE, fournisseur = "Fournisseur local", validePar = admin, dateValidation = LocalDate.now().minusMonths(1)))
            depenses.add(Depense(p, "DEP-${p.id}-03", "Carburant engins", TypeDepense.CARBURANT, BigDecimal("800000"), LocalDate.now(), StatutDepense.SOUMISE))
        }
        depenseRepository.saveAll(depenses)
        logger.info("${depenses.size} dépenses créées")
    }

    private fun initTaches() {
        if (tacheRepository.count() > 0L) return
        val projets = projetRepository.findByActifTrue(PageRequest.of(0, 500)).content
        val chefs = userRepository.findAll().filter { it.roles.any { r -> r.code == "CHEF_PROJET" } }
        if (projets.isEmpty() || chefs.isEmpty()) return
        val taches = mutableListOf<Tache>()
        projets.take(3).forEachIndexed { pi, p ->
            taches.add(Tache(p, "Étude géotechnique", "Réalisation étude sol", StatutTache.TERMINEE, Priorite.HAUTE, assigneA = chefs[pi % chefs.size], dateDebut = LocalDate.now().minusMonths(2), dateFin = LocalDate.now().minusMonths(1), pourcentageAvancement = 100))
            taches.add(Tache(p, "Terrassement phase 1", "Terrassement axe principal", StatutTache.EN_COURS, Priorite.HAUTE, assigneA = chefs[pi % chefs.size], dateDebut = LocalDate.now().minusMonths(1), dateEcheance = LocalDate.now().plusWeeks(2), pourcentageAvancement = 60))
            taches.add(Tache(p, "Pose réseaux", "Réseaux eau et assainissement", StatutTache.A_FAIRE, Priorite.NORMALE, assigneA = chefs.getOrNull(pi + 1) ?: chefs[0], dateDebut = LocalDate.now().plusWeeks(1), dateEcheance = LocalDate.now().plusMonths(1), pourcentageAvancement = 0))
        }
        tacheRepository.saveAll(taches)
        logger.info("${taches.size} tâches créées")
    }

    private fun initPointsBloquants() {
        if (pointBloquantRepository.count() > 0L) return
        val projets = projetRepository.findByActifTrue(PageRequest.of(0, 500)).content.take(2)
        val users = userRepository.findAll().take(2)
        if (projets.isEmpty() || users.size < 2) return
        val points = mutableListOf<PointBloquant>()
        projets.forEach { p ->
            points.add(PointBloquant(p, "Conduite en fonte sur Axe 3", "Déplacement nécessaire avant poursuite des travaux.", Priorite.HAUTE, StatutPointBloquant.OUVERT, detectePar = users[0], assigneA = users[1], dateDetection = LocalDate.now().minusDays(5)))
            points.add(PointBloquant(p, "Transfo à déplacer sur l'emprise Axe 4", "Coordination avec énergie électrique.", Priorite.NORMALE, StatutPointBloquant.EN_COURS, detectePar = users[0], dateDetection = LocalDate.now().minusDays(10)))
        }
        pointBloquantRepository.saveAll(points)
        logger.info("${points.size} points bloquants créés")
    }

    private fun initPrevisions() {
        if (previsionRepository.count() > 0L) return
        val projets = projetRepository.findByActifTrue(PageRequest.of(0, 500)).content
        if (projets.isEmpty()) return
        val previsions = mutableListOf<Prevision>()
        projets.take(3).forEach { p ->
            previsions.add(Prevision(p, 2, 2025, "Décompte N°3", TypePrevision.HEBDOMADAIRE, LocalDate.of(2025, 1, 6), LocalDate.of(2025, 1, 12), avancementPct = 75))
            previsions.add(Prevision(p, null, 2025, "Transmission documents MTPC - validation DQE", TypePrevision.MENSUELLE, null, null, avancementPct = 30))
            previsions.add(Prevision(p, null, 2025, "Délai d'exécution actualisé S2", TypePrevision.TRIMESTRIELLE, null, null, avancementPct = 100))
        }
        previsionRepository.saveAll(previsions)
        logger.info("${previsions.size} prévisions créées")
    }

    private fun initQualiteUsers() {
        val qualiteRoles = mapOf(
            "DIRECTEUR_TECHNIQUE" to Triple("DT001", "Nzamba", "François"),
            "RESPONSABLE_QUALITE" to Triple("RQ001", "Mbazonga", "Kao"),
            "INGENIEUR_QUALITE" to Triple("IQ001", "Ndimbi", "Paul Eric"),
            "CONTROLEUR_TECHNIQUE" to Triple("CT001", "Ondo", "Michel"),
            "ASSISTANT_QUALITE" to Triple("AQ001", "Moussavou", "Carine"),
            "TECHNICIEN_LABORATOIRE" to Triple("TL001", "Obiang", "Serge"),
            "TECHNICIEN_TOPOGRAPHIE" to Triple("TT001", "Nguema", "David"),
        )
        qualiteRoles.forEach { (roleCode, userData) ->
            val (matricule, nom, prenom) = userData
            val email = "${prenom.lowercase().replace(" ", "")}.${nom.lowercase()}@mikaservices.com"
            if (userRepository.existsByEmail(email)) return@forEach
            val role = roleRepository.findByCode(roleCode).orElse(null) ?: return@forEach
            val user = User(
                matricule = matricule,
                nom = nom,
                prenom = prenom,
                email = email,
                motDePasse = passwordEncoder.encode("Qualite@2026")!!,
                dateEmbauche = LocalDate.now().minusMonths(3),
                typeContrat = TypeContrat.CDI,
                niveauExperience = NiveauExperience.CONFIRME,
                actif = true
            )
            user.roles.add(role)
            userRepository.save(user)
            logger.debug("Utilisateur qualité créé: $prenom $nom ($roleCode)")
        }
        logger.info("Utilisateurs qualité initialisés (mot de passe: Qualite@2026)")
    }

    private fun initEquipes() {
        if (equipeRepository.count() > 0L) return
        val chefs = userRepository.findAll().filter { it.roles.any { r -> r.code == "CHEF_PROJET" } }
        if (chefs.size < 2) return
        val equipes = listOf(
            Equipe("EQ-001", "Équipe terrassement Nord", TypeEquipe.TERRASSEMENT, chefEquipe = chefs[0], effectif = 8),
            Equipe("EQ-002", "Équipe voirie Axe 1", TypeEquipe.VOIRIE, chefEquipe = chefs[1], effectif = 6),
            Equipe("EQ-003", "Équipe polyvalente", TypeEquipe.POLYVALENTE, effectif = 4)
        )
        equipeRepository.saveAll(equipes)
        logger.info("${equipes.size} équipes créées")
    }

    private fun initFournisseurs() {
        if (fournisseurRepository.count() > 0L) return
        val fournisseurs = listOf(
            Fournisseur("FOU-001", "BTP Materials Gabon", adresse = "Libreville, Zone industrielle", telephone = "+241 01 70 01 00", email = "contact@btpmaterials.ga", contactNom = "M. Okoua", specialite = "Ciment, agrégats", noteEvaluation = 85),
            Fournisseur("FOU-002", "Engins & Co", adresse = "Owendo", telephone = "+241 01 70 02 00", contactNom = "M. Mba", specialite = "Location engins", noteEvaluation = 78),
            Fournisseur("FOU-003", "Électricité industrielle", telephone = "+241 01 70 03 00", specialite = "Groupes électrogènes, câbles")
        )
        fournisseurRepository.saveAll(fournisseurs)
        logger.info("${fournisseurs.size} fournisseurs créés")
    }

    private fun initMateriaux() {
        if (materiauRepository.count() > 0L) return
        val materiaux = listOf(
            Materiau("MAT-001", "Ciment CPJ 42.5", TypeMateriau.CIMENT, Unite.TONNE, prixUnitaire = BigDecimal("85000"), stockActuel = BigDecimal("120"), stockMinimum = BigDecimal("50"), fournisseur = "BTP Materials"),
            Materiau("MAT-002", "Sable 0/5", TypeMateriau.SABLE, Unite.M3, prixUnitaire = BigDecimal("12000"), stockActuel = BigDecimal("500"), stockMinimum = BigDecimal("200")),
            Materiau("MAT-003", "Gravier 5/15", TypeMateriau.GRAVIER, Unite.M3, prixUnitaire = BigDecimal("15000"), stockActuel = BigDecimal("300"), stockMinimum = BigDecimal("150")),
            Materiau("MAT-004", "Fer à béton HA8", TypeMateriau.FER_A_BETON, Unite.TONNE, prixUnitaire = BigDecimal("450000"), stockActuel = BigDecimal("8"), stockMinimum = BigDecimal("5")),
            Materiau("MAT-005", "Enrobé 0/10", TypeMateriau.ENROBE, Unite.TONNE, prixUnitaire = BigDecimal("65000"), stockActuel = BigDecimal("0"), stockMinimum = BigDecimal("20"))
        )
        materiauRepository.saveAll(materiaux)
        logger.info("${materiaux.size} matériaux créés")
    }

    private fun initEngins() {
        if (enginRepository.count() > 0L) return
        val engins = listOf(
            Engin("ENG-001", "Niveleuse CAT 120M", TypeEngin.NIVELEUSE, marque = "Caterpillar", modele = "120M", immatriculation = "LB-1234-A", statut = StatutEngin.EN_SERVICE),
            Engin("ENG-002", "Compacteur BOMAG", TypeEngin.COMPACTEUR, marque = "Bomag", statut = StatutEngin.EN_SERVICE),
            Engin("ENG-003", "Pelleteuse Hitachi", TypeEngin.PELLETEUSE, marque = "Hitachi", statut = StatutEngin.DISPONIBLE),
            Engin("ENG-004", "Camion benne 20t", TypeEngin.CAMION_BENNE, statut = StatutEngin.EN_MAINTENANCE),
            Engin("ENG-005", "Bétonnière 400L", TypeEngin.BETONNIERE, statut = StatutEngin.DISPONIBLE)
        )
        enginRepository.saveAll(engins)
        logger.info("${engins.size} engins créés")
    }

    // ========================================================================================
    // MODULE QUALITE — SEED DATA
    // ========================================================================================

    private fun initQualiteData() {
        if (demandeReceptionRepository.count() > 0L) return
        logger.info("Initialisation des données qualité...")

        val projets = projetRepository.findByActifTrue(PageRequest.of(0, 500)).content
        if (projets.isEmpty()) {
            logger.warn("Aucun projet actif trouvé, skip qualité")
            return
        }

        // Resolve qualité users by matricule
        val allUsers = userRepository.findAll()
        val userDT = allUsers.firstOrNull { it.matricule == "DT001" }
        val userRQ = allUsers.firstOrNull { it.matricule == "RQ001" }
        val userIQ = allUsers.firstOrNull { it.matricule == "IQ001" }
        val userCT = allUsers.firstOrNull { it.matricule == "CT001" }
        val userAQ = allUsers.firstOrNull { it.matricule == "AQ001" }
        val userTL = allUsers.firstOrNull { it.matricule == "TL001" }
        val userTT = allUsers.firstOrNull { it.matricule == "TT001" }

        if (userRQ == null || userIQ == null) {
            logger.warn("Utilisateurs qualité manquants, skip qualité")
            return
        }

        val today = LocalDate.now()
        val now = LocalDateTime.now()

        // --- 1. Demandes de réception ---
        initDemandesReception(projets, today, userIQ, userCT, userRQ, userDT, userTT, userTL)

        // --- 2. Agréments marché ---
        initAgrementsMarche(projets, today, userRQ, userDT, userIQ)

        // --- 3. Essais labo béton ---
        initEssaisLaboBeton(projets, userTL)

        // --- 4. Levées topographiques ---
        initLeveesTopographiques(projets, userTT)

        // --- 5. Fiches NC/RC/PPI ---
        initFichesEvenements(projets, today, now, userDT, userRQ, userIQ, userCT, userAQ)

        // --- 6. Documents qualité ---
        initDocumentsQualite()

        logger.info("Données qualité initialisées avec succès.")
    }

    // ---- 1. DEMANDES DE RECEPTION ----

    private fun initDemandesReception(
        projets: List<Projet>,
        today: LocalDate,
        userIQ: User,
        userCT: User?,
        userRQ: User,
        userDT: User?,
        userTT: User?,
        userTL: User?
    ) {
        var globalCounter = 0

        val titresTopo = listOf(
            "Implantation voirie accès sud", "Profils T3-01 à T3-08", "Piquetage parcelle nord",
            "Implantation axe principal PK0+000 à PK1+200", "Levée parcellaire zone B",
            "Contrôle nivellement plateforme", "Implantation ouvrage OH3",
            "Profils en travers PK2+000 à PK2+500", "Bornage emprise chantier",
            "Implantation réseau EU secteur 4"
        )
        val titresGeo = listOf(
            "Essais Proctor parcelle T1", "Compactage couche de forme axe 2",
            "Essais CBR remblai zone nord", "Béton de propreté radier",
            "Slump test béton C30/37 poteau P12", "Portance plateforme secteur C",
            "Granulométrie sable 0/4 lot 12", "Densité in situ remblai accès",
            "Essais Marshall enrobé PK1+500", "Contrôle Proctor couche de base"
        )
        val titresOuvrage = listOf(
            "Fondations bloc A", "Dalle haute niveau R+1", "Semelles filantes bâtiment B",
            "Enrochement berge gauche", "Couche de base chaussée",
            "Remblais accès principal", "Béton poteau P8 à P15",
            "Mur de soutènement MS2", "Ferraillage radier bâtiment C",
            "Terrassement parcelle nord T3"
        )

        val combos = listOf(
            Triple(NatureReception.TOPOGRAPHIE, SousTypeReception.TERRASSEMENT, titresTopo),
            Triple(NatureReception.TOPOGRAPHIE, SousTypeReception.GENIE_CIVIL, titresTopo),
            Triple(NatureReception.GEOTECHNIQUE_LABORATOIRE, SousTypeReception.TERRASSEMENT, titresGeo),
            Triple(NatureReception.GEOTECHNIQUE_LABORATOIRE, SousTypeReception.GENIE_CIVIL, titresGeo),
            Triple(NatureReception.OUVRAGE, SousTypeReception.TERRASSEMENT, titresOuvrage),
            Triple(NatureReception.OUVRAGE, SousTypeReception.GENIE_CIVIL, titresOuvrage),
        )

        // Statut distribution: 40% ACCORDEE_SANS_RESERVE, 25% ACCORDEE_AVEC_RESERVE, 15% EN_ATTENTE_MDC, 15% ETABLIE, 5% REJETEE
        val statutPool = buildList {
            repeat(8) { add(StatutReception.ACCORDEE_SANS_RESERVE) }
            repeat(5) { add(StatutReception.ACCORDEE_AVEC_RESERVE) }
            repeat(3) { add(StatutReception.EN_ATTENTE_MDC) }
            repeat(3) { add(StatutReception.ETABLIE) }
            repeat(1) { add(StatutReception.REJETEE) }
        }

        val demandeurs = listOfNotNull(userIQ, userCT, userRQ, userTT, userTL)
        val decideurs = listOfNotNull(userDT, userRQ)

        val zones = listOf(
            "Zone A", "Zone B", "Zone C", "Axe principal", "Axe secondaire",
            "Secteur nord", "Secteur sud", "Parcelle T1", "Parcelle T3", "PK0+000 à PK0+500"
        )

        projets.forEach { projet ->
            var projetCounter = 0

            combos.forEach { (nature, sousType, titres) ->
                val prefix = when (nature) {
                    NatureReception.TOPOGRAPHIE -> "TOPO"
                    NatureReception.GEOTECHNIQUE_LABORATOIRE -> "GEO"
                    NatureReception.OUVRAGE -> "OUV"
                }
                val stPrefix = if (sousType == SousTypeReception.TERRASSEMENT) "T" else "GC"

                // 3-4 per combo
                val count = if (projetCounter % 3 == 0) 4 else 3

                for (i in 0 until count) {
                    globalCounter++
                    projetCounter++
                    val statut = statutPool[(globalCounter - 1) % statutPool.size]
                    val dayOffset = (globalCounter * 4L) % 90
                    val dateDemande = today.minusDays(90 - dayOffset)
                    val moisRef = YearMonth.from(dateDemande).toString()
                    val titre = titres[(globalCounter - 1) % titres.size]

                    val dateDecision = if (statut != StatutReception.ETABLIE) dateDemande.plusDays((2..7).random().toLong()) else null

                    val observations = when (statut) {
                        StatutReception.ACCORDEE_AVEC_RESERVE -> "Réserves mineures : reprendre alignement axe."
                        StatutReception.REJETEE -> "Non-conformité dimensionnelle constatée. Refaire."
                        StatutReception.EN_ATTENTE_MDC -> "Dossier transmis au MDC, en attente de retour."
                        else -> null
                    }

                    val reference = "DR-$prefix-$stPrefix-${String.format("%04d", globalCounter)}"

                    val dr = DemandeReception(
                        projet = projet,
                        reference = reference,
                        titre = titre,
                        nature = nature,
                        sousType = sousType,
                        statut = statut,
                        description = "Demande de réception : $titre — Projet ${projet.nom}",
                        zoneOuvrage = zones[(globalCounter - 1) % zones.size],
                        dateDemande = dateDemande,
                        dateDecision = dateDecision,
                        demandeur = demandeurs[(globalCounter - 1) % demandeurs.size],
                        decideur = if (dateDecision != null) decideurs[(globalCounter - 1) % decideurs.size] else null,
                        observations = observations,
                        moisReference = moisRef
                    )
                    demandeReceptionRepository.save(dr)
                }
            }
        }
        logger.info("$globalCounter demandes de réception créées")
    }

    // ---- 2. AGREMENTS MARCHE ----

    private fun initAgrementsMarche(
        projets: List<Projet>,
        today: LocalDate,
        userRQ: User,
        userDT: User?,
        userIQ: User
    ) {
        val objets = listOf(
            "Ciment CEM I 42.5 — Lafarge",
            "Aciers HA500 — ArcelorMittal",
            "Sable 0/4 — Carrière Nkok",
            "Granulats 5/15 — SOCOBA",
            "Bitume 35/50 — Total Gabon",
            "Sous-traitant EBTP maçonnerie",
            "Géotextile bidim — TenCate",
            "Tubes PVC Ø400 — Nicoll",
            "Béton prêt à l'emploi C30/37",
            "Peinture routière — Aximum",
            "Aciers HA400 — Riva Acier",
            "Grave non traitée 0/31.5 — Carrière Nkok",
            "Bordures béton T2 — Préfabrication Gabon",
            "Joint de dilatation — Freyssinet",
            "Étanchéité bitumineuse — Sika",
            "Sous-traitant SOGEA-SATOM électricité",
            "Caniveaux préfabriqués — BPG",
        )

        val titres = listOf(
            "Agrément matériau ciment CEM I",
            "Agrément aciers haute adhérence",
            "Agrément sable de carrière",
            "Agrément granulats concassés",
            "Agrément bitume routier",
            "Agrément sous-traitant maçonnerie",
            "Agrément géotextile drainage",
            "Agrément tubes assainissement",
            "Agrément béton prêt à l'emploi",
            "Agrément peinture marquage routier",
            "Agrément aciers HA400",
            "Agrément GNT couche de base",
            "Agrément bordures préfabriquées",
            "Agrément joint de dilatation",
            "Agrément étanchéité membranes",
            "Agrément sous-traitant électricité",
            "Agrément caniveaux préfabriqués",
        )

        // All 6 statuts spread across entries
        val statuts = listOf(
            StatutAgrement.ACCORDE_SANS_RESERVE,
            StatutAgrement.ACCORDE_SANS_RESERVE,
            StatutAgrement.ACCORDE_AVEC_RESERVE,
            StatutAgrement.EN_ATTENTE_MDC,
            StatutAgrement.ACCORDE_SANS_RESERVE,
            StatutAgrement.ETABLI,
            StatutAgrement.REJETE,
            StatutAgrement.ACCORDE_SANS_RESERVE,
            StatutAgrement.PREVU_AU_MARCHE,
            StatutAgrement.ACCORDE_AVEC_RESERVE,
            StatutAgrement.ACCORDE_SANS_RESERVE,
            StatutAgrement.EN_ATTENTE_MDC,
            StatutAgrement.ACCORDE_SANS_RESERVE,
            StatutAgrement.ETABLI,
            StatutAgrement.ACCORDE_SANS_RESERVE,
            StatutAgrement.PREVU_AU_MARCHE,
            StatutAgrement.ACCORDE_AVEC_RESERVE,
        )

        val decideurs = listOfNotNull(userDT, userRQ)
        var globalCounter = 0

        projets.forEach { projet ->
            for (i in objets.indices) {
                globalCounter++
                val statut = statuts[i % statuts.size]
                val dayOffset = (i * 5L) % 90
                val dateSoumission = if (statut != StatutAgrement.PREVU_AU_MARCHE) today.minusDays(90 - dayOffset) else null
                val dateDecision = if (statut in listOf(
                        StatutAgrement.ACCORDE_SANS_RESERVE,
                        StatutAgrement.ACCORDE_AVEC_RESERVE,
                        StatutAgrement.REJETE
                    ) && dateSoumission != null
                ) dateSoumission.plusDays((3..10).random().toLong()) else null

                val moisRef = if (dateSoumission != null) YearMonth.from(dateSoumission).toString() else YearMonth.now().toString()

                val observations = when (statut) {
                    StatutAgrement.ACCORDE_AVEC_RESERVE -> "Fiches techniques incomplètes, complément requis."
                    StatutAgrement.REJETE -> "Non conforme aux spécifications CCTP. Soumettre nouveau produit."
                    StatutAgrement.EN_ATTENTE_MDC -> "Dossier transmis au MDC pour avis."
                    StatutAgrement.PREVU_AU_MARCHE -> "En attente de soumission par l'entreprise."
                    else -> null
                }

                val reference = "AG-${String.format("%04d", globalCounter)}"

                val ag = AgrementMarche(
                    projet = projet,
                    reference = reference,
                    objet = objets[i],
                    titre = titres[i],
                    statut = statut,
                    description = "Dossier d'agrément : ${objets[i]}",
                    dateSoumission = dateSoumission,
                    dateDecision = dateDecision,
                    decideur = if (dateDecision != null) decideurs[globalCounter % decideurs.size] else null,
                    observations = observations,
                    moisReference = moisRef
                )
                agrementMarcheRepository.save(ag)
            }
        }
        logger.info("$globalCounter agréments marché créés")
    }

    // ---- 3. ESSAIS LABO BETON ----

    private fun initEssaisLaboBeton(projets: List<Projet>, userTL: User?) {
        val currentMonth = YearMonth.now()
        var count = 0

        // Realistic values per month (varying)
        val monthData = listOf(
            intArrayOf(12, 12, 5, 6),  // month-5: 12 camions, 12 slumps, 5 jours, 6 prélèvements
            intArrayOf(18, 18, 8, 9),  // month-4
            intArrayOf(15, 15, 6, 8),  // month-3
            intArrayOf(22, 22, 10, 11), // month-2
            intArrayOf(20, 19, 9, 10), // month-1
            intArrayOf(8, 8, 4, 4),    // current month (partial)
        )

        val observationsPool = listOf(
            "Coulages conformes, aucune anomalie.",
            "1 slump non conforme (affaissement > 22cm), lot rejeté.",
            "Conditions météo défavorables, 2 jours reportés.",
            "Tous essais conformes. RAS.",
            "Prélèvements supplémentaires suite contrôle MDC.",
            null,
        )

        projets.forEach { projet ->
            for (offset in 5 downTo 0) {
                val mois = currentMonth.minusMonths(offset.toLong())
                val data = monthData[5 - offset]
                val essai = EssaiLaboratoireBeton(
                    projet = projet,
                    moisReference = mois.toString(),
                    nbCamionsMalaxeursVolumeCoulee = data[0] + (projet.id?.toInt()?.rem(5) ?: 0),
                    nbEssaisSlump = data[1] + (projet.id?.toInt()?.rem(3) ?: 0),
                    nbJoursCoulage = data[2],
                    nbPrelevements = data[3] + (projet.id?.toInt()?.rem(2) ?: 0),
                    observations = observationsPool[(offset + (projet.id?.toInt() ?: 0)) % observationsPool.size],
                    saisiPar = userTL
                )
                essaiLaboBetonRepository.save(essai)
                count++
            }
        }
        logger.info("$count essais labo béton créés")
    }

    // ---- 4. LEVEES TOPOGRAPHIQUES ----

    private fun initLeveesTopographiques(projets: List<Projet>, userTT: User?) {
        val currentMonth = YearMonth.now()
        var count = 0

        val monthData = listOf(
            intArrayOf(25, 20, 8),   // month-5
            intArrayOf(32, 28, 12),  // month-4
            intArrayOf(28, 25, 10),  // month-3
            intArrayOf(40, 35, 15),  // month-2
            intArrayOf(35, 30, 14),  // month-1
            intArrayOf(15, 10, 5),   // current (partial)
        )

        val observationsPool = listOf(
            "Implantations conformes au plan d'exécution.",
            "Décalage 3cm constaté sur profil P12, corrigé.",
            "Pluies abondantes, 3 jours sans levée.",
            "Tous contrôles conformes.",
            "Recalage GPS effectué début de mois.",
            null,
        )

        projets.forEach { projet ->
            for (offset in 5 downTo 0) {
                val mois = currentMonth.minusMonths(offset.toLong())
                val data = monthData[5 - offset]
                val levee = LeveeTopographique(
                    projet = projet,
                    moisReference = mois.toString(),
                    nbProfilsImplantes = data[0] + (projet.id?.toInt()?.rem(8) ?: 0),
                    nbProfilsReceptionnes = data[1] + (projet.id?.toInt()?.rem(5) ?: 0),
                    nbControlesRealises = data[2] + (projet.id?.toInt()?.rem(3) ?: 0),
                    observations = observationsPool[(offset + (projet.id?.toInt() ?: 0)) % observationsPool.size],
                    saisiPar = userTT
                )
                leveeTopoRepository.save(levee)
                count++
            }
        }
        logger.info("$count levées topographiques créées")
    }

    // ---- 5. FICHES NC/RC/PPI ----

    private fun initFichesEvenements(
        projets: List<Projet>,
        today: LocalDate,
        now: LocalDateTime,
        userDT: User?,
        userRQ: User,
        userIQ: User,
        userCT: User?,
        userAQ: User?
    ) {
        var globalRef = 0

        // First create the specific "Document B" fiche on the first project
        globalRef = createDocumentBFiche(projets.first(), userDT, userRQ, userIQ, userCT, globalRef)

        // Then create generic fiches per project
        projets.forEach { projet ->
            globalRef = createGenericFiches(projet, today, now, userDT, userRQ, userIQ, userCT, userAQ, globalRef)
        }
        logger.info("$globalRef fiches NC/RC/PPI créées")
    }

    /**
     * Creates the specific Document B fiche:
     * Chantier Donguila, Maison témoin n°1, sous-traitant EBTP
     */
    private fun createDocumentBFiche(
        projet: Projet,
        userDT: User?,
        userRQ: User,
        userIQ: User,
        userCT: User?,
        startRef: Int
    ): Int {
        val refNum = startRef + 1
        val reference = "NC-${String.format("%04d", refNum)}"

        val evenement = EvenementQualite(
            projet = projet,
            reference = reference,
            typeEvenement = TypeEvenement.NC,
            categories = mutableSetOf(CategorieEvenement.QUALITE),
            origine = OrigineEvenement.TRAVAUX,
            ouvrageConcerne = "Chantier Donguila — Maison témoin n°1",
            controleExigeCctp = true,
            fournisseurNom = "EBTP",
            numeroBc = "BC2510S11010167",
            numeroBl = "BL du 14/12/2025",
            dateLivraison = LocalDate.of(2025, 12, 14),
            description = "Non-conformité constatée sur maison témoin n°1 chantier Donguila. " +
                "Sous-traitant EBTP, BC N°2510S11010167.",
            createur = userIQ
        )
        val savedEvt = evenementQualiteRepository.save(evenement)

        // Section 1 — Détection (Paul Eric NDIMBI, 14/03/2026)
        val s1 = SectionEvenement(
            evenement = savedEvt,
            numeroSection = NumeroSection.SECTION_1,
            contenu = "Constat : a) fissure mur en béton côté mer (RDC), b) muret cuisine tordu, " +
                "c) entrée d'eau côté douche. Sous-traitant EBTP, BC N°2510S11010167.",
            signataireDesigne = userIQ,
            signataireEffectif = userIQ,
            dateSignature = LocalDateTime.of(2026, 3, 14, 10, 30),
            signee = true
        )
        savedEvt.sections.add(s1)

        // Section 2 — Traitement (Kao MBAZONGA, 16/03/2026)
        val s2 = SectionEvenement(
            evenement = savedEvt,
            numeroSection = NumeroSection.SECTION_2,
            contenu = "Traitement par correction. 3 actions définies pour reprise des désordres constatés.",
            signataireDesigne = userRQ,
            signataireEffectif = userRQ,
            dateSignature = LocalDateTime.of(2026, 3, 16, 14, 0),
            signee = true,
            choixTraitement = ChoixTraitement.CORRECTION
        )
        savedEvt.sections.add(s2)

        // Section 4 — Vérification
        val s4 = SectionEvenement(
            evenement = savedEvt,
            numeroSection = NumeroSection.SECTION_4,
            contenu = "Vérification effectuée. Reprises conformes aux prescriptions.",
            signataireDesigne = userIQ,
            signataireEffectif = userIQ,
            dateSignature = LocalDateTime.of(2026, 3, 17, 9, 0),
            signee = true
        )
        savedEvt.sections.add(s4)

        // Section 5 — Levée
        val s5 = SectionEvenement(
            evenement = savedEvt,
            numeroSection = NumeroSection.SECTION_5,
            contenu = "Non-conformité levée. Travaux de reprise validés.",
            signataireDesigne = userRQ,
            signataireEffectif = userRQ,
            dateSignature = LocalDateTime.of(2026, 3, 17, 16, 0),
            signee = true
        )
        savedEvt.sections.add(s5)

        // Section 6 — Analyse (collégiale, Kao MBAZONGA 18/03/2026)
        val s6 = SectionEvenement(
            evenement = savedEvt,
            numeroSection = NumeroSection.SECTION_6,
            contenu = "Analyse des causes : défaut d'exécution du sous-traitant EBTP. " +
                "Absence de contrôle intermédiaire. CAPA nécessaire.",
            signataireDesigne = userRQ,
            signataireEffectif = userRQ,
            dateSignature = LocalDateTime.of(2026, 3, 18, 10, 0),
            signee = true,
            necessiteCapa = true
        )
        savedEvt.sections.add(s6)

        // Section 7 — Clôture
        val s7 = SectionEvenement(
            evenement = savedEvt,
            numeroSection = NumeroSection.SECTION_7,
            contenu = "Clôture de la fiche. Actions correctives mises en place. Dossier archivé.",
            signataireDesigne = userDT ?: userRQ,
            signataireEffectif = userDT ?: userRQ,
            dateSignature = LocalDateTime.of(2026, 3, 20, 11, 0),
            signee = true
        )
        savedEvt.sections.add(s7)

        // Save all sections
        evenementQualiteRepository.save(savedEvt)

        // Now add actions to section 2 (need saved section with id)
        val savedS2 = savedEvt.sections.first { it.numeroSection == NumeroSection.SECTION_2 }
        val action1 = ActionTraitement(
            section = savedS2,
            descriptionAction = "Reprendre la fissure mur béton côté mer (RDC) par injection résine époxy.",
            responsable = "EBTP — Chef d'équipe maçonnerie",
            delaiPrevu = LocalDate.of(2026, 3, 25)
        )
        val action2 = ActionTraitement(
            section = savedS2,
            descriptionAction = "Démolir et reconstruire muret cuisine tordu avec contrôle d'aplomb.",
            responsable = "EBTP — Chef d'équipe maçonnerie",
            delaiPrevu = LocalDate.of(2026, 3, 28)
        )
        val action3 = ActionTraitement(
            section = savedS2,
            descriptionAction = "Réaliser étanchéité côté douche avec membrane PVC et test d'eau 48h.",
            responsable = "EBTP — Étanchéiste",
            delaiPrevu = LocalDate.of(2026, 3, 30)
        )
        savedS2.actionsTraitement.addAll(listOf(action1, action2, action3))
        sectionEvenementRepository.save(savedS2)

        // Add 4 collegial signatories to section 6, all signed
        val savedS6 = savedEvt.sections.first { it.numeroSection == NumeroSection.SECTION_6 }
        val collegialDT = SectionSignataireCollegial(
            section = savedS6,
            roleAttendu = RoleCollegial.DT,
            signataireDesigne = userDT,
            signataireEffectif = userDT,
            dateSignature = LocalDateTime.of(2026, 3, 18, 11, 0),
            signee = true
        )
        val collegialRQ = SectionSignataireCollegial(
            section = savedS6,
            roleAttendu = RoleCollegial.RQ,
            signataireDesigne = userRQ,
            signataireEffectif = userRQ,
            dateSignature = LocalDateTime.of(2026, 3, 18, 10, 0),
            signee = true
        )
        val collegialCT = SectionSignataireCollegial(
            section = savedS6,
            roleAttendu = RoleCollegial.CT,
            signataireDesigne = userCT,
            signataireEffectif = userCT,
            dateSignature = LocalDateTime.of(2026, 3, 18, 14, 0),
            signee = true
        )
        val collegialCC = SectionSignataireCollegial(
            section = savedS6,
            roleAttendu = RoleCollegial.CC,
            signataireDesigne = userRQ, // CC role filled by RQ in this case
            signataireEffectif = userRQ,
            dateSignature = LocalDateTime.of(2026, 3, 18, 15, 0),
            signee = true
        )
        savedS6.signatairesCollegiaux.addAll(listOf(collegialDT, collegialRQ, collegialCT, collegialCC))
        sectionEvenementRepository.save(savedS6)

        // Recalculate statut
        savedEvt.recalculerStatut()
        evenementQualiteRepository.save(savedEvt)

        logger.info("Fiche Document B créée: $reference (statut=${savedEvt.statut})")
        return refNum
    }

    /**
     * Creates 25+ generic fiches per project at various workflow stages.
     */
    private fun createGenericFiches(
        projet: Projet,
        today: LocalDate,
        now: LocalDateTime,
        userDT: User?,
        userRQ: User,
        userIQ: User,
        userCT: User?,
        userAQ: User?,
        startRef: Int
    ): Int {
        var refNum = startRef

        // Type distribution: 70% NC, 20% RC, 10% PPI
        // Categories mix
        val categoriesList = listOf(
            mutableSetOf(CategorieEvenement.QUALITE),
            mutableSetOf(CategorieEvenement.QUALITE),
            mutableSetOf(CategorieEvenement.QUALITE, CategorieEvenement.SECURITE),
            mutableSetOf(CategorieEvenement.QUALITE),
            mutableSetOf(CategorieEvenement.QUALITE, CategorieEvenement.ENVIRONNEMENT),
            mutableSetOf(CategorieEvenement.QUALITE),
            mutableSetOf(CategorieEvenement.QUALITE, CategorieEvenement.SECURITE, CategorieEvenement.ENVIRONNEMENT),
            mutableSetOf(CategorieEvenement.QUALITE),
        )

        // Ouvrages and descriptions
        val ouvrages = listOf(
            "Poteau P12 — niveau R+1",
            "Dalle N2 — bâtiment A",
            "Terrasse — bloc B étage 3",
            "Chaussée PK2+500",
            "Axe principal — implantation",
            "Livraison ciment lot 45",
            "Câblage tableau TGBT",
            "Balcon B3 — façade est",
            "Dalle parking sous-sol",
            "Joint de dilatation JD4",
            "Fondation semelle S8",
            "Mur de soutènement MS1",
            "Regard R12 assainissement",
            "Bordure T2 axe 3",
            "Couche de roulement PK1+000",
            "Ferraillage poteau P20",
            "Béton radier bâtiment D",
            "Remblai zone stockage",
            "Enrobé trottoir secteur B",
            "Coffrage voile V5",
            "Escalier cage A niveau 2",
            "Caniveau C8 — sortie parking",
            "Pieux P3 à P7 — fondation profonde",
            "Enduit façade nord bâtiment A",
            "Cunette CU3 — collecteur principal",
        )

        val descriptions = listOf(
            "Béton fissuré poteau P12 — fissures de retrait visibles à 48h.",
            "Ferraillage non conforme dalle N2 — espacement cadres hors tolérance.",
            "Défaut étanchéité terrasse — infiltration constatée après pluie.",
            "Enrobé avec ségrégation PK2+500 — granulats apparents en surface.",
            "Implantation décalée 15cm axe principal — erreur piquetage.",
            "Livraison ciment hors spécification — résistance 28j insuffisante.",
            "Câblage non conforme NF C 15-100 — section fils sous-dimensionnée.",
            "Armatures exposées balcon B3 — enrobage insuffisant.",
            "Fissures retrait dalle parking — retrait plastique non maîtrisé.",
            "Joint de dilatation mal positionné — décalage 8cm / plan.",
            "Semelle S8 — dimension non conforme au plan béton armé.",
            "Mur de soutènement MS1 — défaut verticalité 2cm/m.",
            "Regard R12 — fond non conforme cote fil d'eau.",
            "Bordure T2 — alignement défectueux sur 15ml.",
            "Couche de roulement — épaisseur insuffisante (4cm au lieu de 6cm).",
            "Ferraillage poteau P20 — aciers HA non conformes (HA400 au lieu de HA500).",
            "Béton radier D — bullage excessif face coffrée.",
            "Remblai — compactage insuffisant (95% OPM au lieu de 98%).",
            "Enrobé trottoir — température de mise en œuvre trop basse.",
            "Coffrage voile V5 — flambement constaté lors du coulage.",
            "Escalier — contremarches irrégulières (écart > 1cm).",
            "Caniveau C8 — pente inversée sur 3ml.",
            "Pieux — déviation > 2% constatée sur P5.",
            "Enduit façade — faïençage généralisé après séchage.",
            "Cunette CU3 — fissure longitudinale sur 5ml.",
        )

        val fournisseurs = listOf(null, null, null, "EBTP", "SOGEA-SATOM", null, "BTP Materials", null, null, null)
        val bcNumbers = listOf(null, null, null, "BC2510S11010234", "BC2510S11010345", null, "BC2510S11010456", null, null, null)

        // Define the 25 fiches with their target workflow stage
        data class FicheSpec(
            val stage: String,    // BROUILLON, DETECTEE, EN_TRAITEMENT, EN_VERIFICATION, LEVEE, PARTIAL_S6, CLOTUREE, EN_RETARD
            val typeEvt: TypeEvenement,
            val origineEvt: OrigineEvenement,
            val daysAgo: Long     // base date offset from today
        )

        val specs = listOf(
            // 5 BROUILLON (section 1 NOT signed)
            FicheSpec("BROUILLON", TypeEvenement.NC, OrigineEvenement.TRAVAUX, 2),
            FicheSpec("BROUILLON", TypeEvenement.NC, OrigineEvenement.TRAVAUX, 3),
            FicheSpec("BROUILLON", TypeEvenement.RC, OrigineEvenement.RECEPTION_PRODUITS, 1),
            FicheSpec("BROUILLON", TypeEvenement.NC, OrigineEvenement.ETUDE, 4),
            FicheSpec("BROUILLON", TypeEvenement.PPI, OrigineEvenement.TRAVAUX, 5),

            // 4 EN_TRAITEMENT (sections 1+2 signed) — note: section 1 signed = DETECTEE, then section 2 = EN_TRAITEMENT
            FicheSpec("EN_TRAITEMENT", TypeEvenement.NC, OrigineEvenement.TRAVAUX, 12),
            FicheSpec("EN_TRAITEMENT", TypeEvenement.NC, OrigineEvenement.RECEPTION_PRODUITS, 10),
            FicheSpec("EN_TRAITEMENT", TypeEvenement.RC, OrigineEvenement.TRAVAUX, 8),
            FicheSpec("EN_TRAITEMENT", TypeEvenement.NC, OrigineEvenement.TRAVAUX, 14),

            // 3 EN_VERIFICATION (sections 1+2+4 signed)
            FicheSpec("EN_VERIFICATION", TypeEvenement.NC, OrigineEvenement.TRAVAUX, 20),
            FicheSpec("EN_VERIFICATION", TypeEvenement.NC, OrigineEvenement.RECEPTION_PRODUITS, 18),
            FicheSpec("EN_VERIFICATION", TypeEvenement.RC, OrigineEvenement.TRAVAUX, 22),

            // 3 LEVEE (sections 1+2+4+5 signed)
            FicheSpec("LEVEE", TypeEvenement.NC, OrigineEvenement.TRAVAUX, 30),
            FicheSpec("LEVEE", TypeEvenement.NC, OrigineEvenement.ETUDE, 28),
            FicheSpec("LEVEE", TypeEvenement.PPI, OrigineEvenement.TRAVAUX, 25),

            // 3 partial section 6 (1+2+4+5 signed, section 6 with 1-2 of 4 collegial)
            FicheSpec("PARTIAL_S6", TypeEvenement.NC, OrigineEvenement.TRAVAUX, 35),
            FicheSpec("PARTIAL_S6", TypeEvenement.NC, OrigineEvenement.RECEPTION_PRODUITS, 33),
            FicheSpec("PARTIAL_S6", TypeEvenement.RC, OrigineEvenement.TRAVAUX, 38),

            // 4 CLOTUREE (ALL sections signed)
            FicheSpec("CLOTUREE", TypeEvenement.NC, OrigineEvenement.TRAVAUX, 60),
            FicheSpec("CLOTUREE", TypeEvenement.NC, OrigineEvenement.RECEPTION_PRODUITS, 55),
            FicheSpec("CLOTUREE", TypeEvenement.RC, OrigineEvenement.TRAVAUX, 50),
            FicheSpec("CLOTUREE", TypeEvenement.NC, OrigineEvenement.ETUDE, 45),

            // 3 "en retard" (EN_TRAITEMENT with section 2 signed > 15 days ago)
            FicheSpec("EN_RETARD", TypeEvenement.NC, OrigineEvenement.TRAVAUX, 25),
            FicheSpec("EN_RETARD", TypeEvenement.NC, OrigineEvenement.TRAVAUX, 30),
            FicheSpec("EN_RETARD", TypeEvenement.RC, OrigineEvenement.RECEPTION_PRODUITS, 20),
        )

        specs.forEachIndexed { idx, spec ->
            refNum++
            val typePrefix = spec.typeEvt.name
            val reference = "$typePrefix-${String.format("%04d", refNum)}"

            val catIdx = idx % categoriesList.size
            val baseDate = today.minusDays(spec.daysAgo)
            val baseDateTime = baseDate.atTime(9, 0)

            val evenement = EvenementQualite(
                projet = projet,
                reference = reference,
                typeEvenement = spec.typeEvt,
                categories = categoriesList[catIdx].toMutableSet(),
                origine = spec.origineEvt,
                ouvrageConcerne = ouvrages[idx % ouvrages.size],
                controleExigeCctp = idx % 3 == 0,
                fournisseurNom = fournisseurs[idx % fournisseurs.size],
                numeroBc = bcNumbers[idx % bcNumbers.size],
                description = descriptions[idx % descriptions.size],
                createur = if (idx % 2 == 0) userIQ else userRQ
            )
            val savedEvt = evenementQualiteRepository.save(evenement)

            when (spec.stage) {
                "BROUILLON" -> {
                    // Section 1 created but NOT signed
                    val s1 = SectionEvenement(
                        evenement = savedEvt,
                        numeroSection = NumeroSection.SECTION_1,
                        contenu = descriptions[idx % descriptions.size],
                        signataireDesigne = userIQ,
                        signee = false
                    )
                    savedEvt.sections.add(s1)
                    evenementQualiteRepository.save(savedEvt)
                    savedEvt.recalculerStatut()
                    evenementQualiteRepository.save(savedEvt)
                }

                "EN_TRAITEMENT", "EN_RETARD" -> {
                    val s1Date = if (spec.stage == "EN_RETARD") baseDateTime.minusDays(5) else baseDateTime
                    val s2Date = if (spec.stage == "EN_RETARD") baseDateTime.minusDays(3) else baseDateTime.plusDays(2)

                    // Section 1 signed
                    val s1 = SectionEvenement(
                        evenement = savedEvt,
                        numeroSection = NumeroSection.SECTION_1,
                        contenu = descriptions[idx % descriptions.size],
                        signataireDesigne = userIQ,
                        signataireEffectif = userIQ,
                        dateSignature = s1Date,
                        signee = true
                    )
                    savedEvt.sections.add(s1)

                    // Section 2 signed
                    val choix = if (idx % 3 == 0) ChoixTraitement.DEROGATION else ChoixTraitement.CORRECTION
                    val s2 = SectionEvenement(
                        evenement = savedEvt,
                        numeroSection = NumeroSection.SECTION_2,
                        contenu = "Traitement décidé : ${choix.name.lowercase()}. Actions correctives à mener.",
                        signataireDesigne = userRQ,
                        signataireEffectif = userRQ,
                        dateSignature = s2Date,
                        signee = true,
                        choixTraitement = choix
                    )
                    savedEvt.sections.add(s2)
                    evenementQualiteRepository.save(savedEvt)

                    // Add actions to section 2
                    val savedS2 = savedEvt.sections.first { it.numeroSection == NumeroSection.SECTION_2 }
                    val a1 = ActionTraitement(
                        section = savedS2,
                        descriptionAction = "Reprendre les travaux selon les prescriptions du CCTP.",
                        responsable = "Chef de chantier",
                        delaiPrevu = baseDate.plusDays(7)
                    )
                    val a2 = ActionTraitement(
                        section = savedS2,
                        descriptionAction = "Contrôle de conformité après reprise.",
                        responsable = "Ingénieur qualité",
                        delaiPrevu = baseDate.plusDays(10)
                    )
                    savedS2.actionsTraitement.addAll(listOf(a1, a2))
                    sectionEvenementRepository.save(savedS2)

                    savedEvt.recalculerStatut()
                    evenementQualiteRepository.save(savedEvt)
                }

                "EN_VERIFICATION" -> {
                    // Sections 1, 2, 4 signed
                    val s1 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_1,
                        contenu = descriptions[idx % descriptions.size],
                        signataireDesigne = userIQ, signataireEffectif = userIQ,
                        dateSignature = baseDateTime, signee = true
                    )
                    val s2 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_2,
                        contenu = "Traitement par correction.",
                        signataireDesigne = userRQ, signataireEffectif = userRQ,
                        dateSignature = baseDateTime.plusDays(2), signee = true,
                        choixTraitement = ChoixTraitement.CORRECTION
                    )
                    val s4 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_4,
                        contenu = "Vérification en cours. Reprises partiellement conformes.",
                        signataireDesigne = userIQ, signataireEffectif = userIQ,
                        dateSignature = baseDateTime.plusDays(5), signee = true
                    )
                    savedEvt.sections.addAll(listOf(s1, s2, s4))
                    evenementQualiteRepository.save(savedEvt)

                    // Actions on s2
                    val savedS2 = savedEvt.sections.first { it.numeroSection == NumeroSection.SECTION_2 }
                    savedS2.actionsTraitement.add(ActionTraitement(
                        section = savedS2,
                        descriptionAction = "Reprise des travaux non conformes.",
                        responsable = "Conducteur de travaux",
                        delaiPrevu = baseDate.plusDays(10)
                    ))
                    sectionEvenementRepository.save(savedS2)

                    savedEvt.recalculerStatut()
                    evenementQualiteRepository.save(savedEvt)
                }

                "LEVEE" -> {
                    // Sections 1, 2, 4, 5 signed
                    val s1 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_1,
                        contenu = descriptions[idx % descriptions.size],
                        signataireDesigne = userIQ, signataireEffectif = userIQ,
                        dateSignature = baseDateTime, signee = true
                    )
                    val s2 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_2,
                        contenu = "Traitement par correction. Actions correctives menées.",
                        signataireDesigne = userRQ, signataireEffectif = userRQ,
                        dateSignature = baseDateTime.plusDays(2), signee = true,
                        choixTraitement = ChoixTraitement.CORRECTION
                    )
                    val s4 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_4,
                        contenu = "Vérification : reprises conformes.",
                        signataireDesigne = userIQ, signataireEffectif = userIQ,
                        dateSignature = baseDateTime.plusDays(5), signee = true
                    )
                    val s5 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_5,
                        contenu = "Non-conformité levée. Résultat satisfaisant.",
                        signataireDesigne = userRQ, signataireEffectif = userRQ,
                        dateSignature = baseDateTime.plusDays(7), signee = true
                    )
                    savedEvt.sections.addAll(listOf(s1, s2, s4, s5))
                    evenementQualiteRepository.save(savedEvt)

                    val savedS2 = savedEvt.sections.first { it.numeroSection == NumeroSection.SECTION_2 }
                    savedS2.actionsTraitement.add(ActionTraitement(
                        section = savedS2,
                        descriptionAction = "Démolition et reconstruction de l'élément non conforme.",
                        responsable = "Chef d'équipe",
                        delaiPrevu = baseDate.plusDays(8)
                    ))
                    sectionEvenementRepository.save(savedS2)

                    savedEvt.recalculerStatut()
                    evenementQualiteRepository.save(savedEvt)
                }

                "PARTIAL_S6" -> {
                    // Sections 1, 2, 4, 5 signed + section 6 with partial collegial
                    val s1 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_1,
                        contenu = descriptions[idx % descriptions.size],
                        signataireDesigne = userIQ, signataireEffectif = userIQ,
                        dateSignature = baseDateTime, signee = true
                    )
                    val s2 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_2,
                        contenu = "Traitement par correction.",
                        signataireDesigne = userRQ, signataireEffectif = userRQ,
                        dateSignature = baseDateTime.plusDays(2), signee = true,
                        choixTraitement = ChoixTraitement.CORRECTION
                    )
                    val s4 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_4,
                        contenu = "Vérification OK.",
                        signataireDesigne = userIQ, signataireEffectif = userIQ,
                        dateSignature = baseDateTime.plusDays(5), signee = true
                    )
                    val s5 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_5,
                        contenu = "Levée prononcée.",
                        signataireDesigne = userRQ, signataireEffectif = userRQ,
                        dateSignature = baseDateTime.plusDays(7), signee = true
                    )
                    // Section 6 — NOT fully signed (collegial incomplete)
                    val s6 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_6,
                        contenu = "Analyse en cours. En attente des signatures collégiales.",
                        signataireDesigne = userRQ,
                        signee = false, // not fully signed because collegial incomplete
                        necessiteCapa = true
                    )
                    savedEvt.sections.addAll(listOf(s1, s2, s4, s5, s6))
                    evenementQualiteRepository.save(savedEvt)

                    // Add partial collegial signatures (1-2 out of 4)
                    val savedS6 = savedEvt.sections.first { it.numeroSection == NumeroSection.SECTION_6 }
                    val nbSigned = if (idx % 2 == 0) 1 else 2

                    val cDT = SectionSignataireCollegial(
                        section = savedS6, roleAttendu = RoleCollegial.DT,
                        signataireDesigne = userDT,
                        signataireEffectif = userDT,
                        dateSignature = baseDateTime.plusDays(9),
                        signee = true
                    )
                    val cRQ = SectionSignataireCollegial(
                        section = savedS6, roleAttendu = RoleCollegial.RQ,
                        signataireDesigne = userRQ,
                        signataireEffectif = if (nbSigned >= 2) userRQ else null,
                        dateSignature = if (nbSigned >= 2) baseDateTime.plusDays(9) else null,
                        signee = nbSigned >= 2
                    )
                    val cCT = SectionSignataireCollegial(
                        section = savedS6, roleAttendu = RoleCollegial.CT,
                        signataireDesigne = userCT,
                        signee = false
                    )
                    val cCC = SectionSignataireCollegial(
                        section = savedS6, roleAttendu = RoleCollegial.CC,
                        signataireDesigne = userRQ,
                        signee = false
                    )
                    savedS6.signatairesCollegiaux.addAll(listOf(cDT, cRQ, cCT, cCC))
                    sectionEvenementRepository.save(savedS6)

                    // Add actions on s2
                    val savedS2 = savedEvt.sections.first { it.numeroSection == NumeroSection.SECTION_2 }
                    savedS2.actionsTraitement.add(ActionTraitement(
                        section = savedS2,
                        descriptionAction = "Reprise complète de l'ouvrage non conforme.",
                        responsable = "Conducteur de travaux",
                        delaiPrevu = baseDate.plusDays(12)
                    ))
                    sectionEvenementRepository.save(savedS2)

                    savedEvt.recalculerStatut()
                    evenementQualiteRepository.save(savedEvt)
                }

                "CLOTUREE" -> {
                    // ALL sections signed including collegial
                    val s1 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_1,
                        contenu = descriptions[idx % descriptions.size],
                        signataireDesigne = userIQ, signataireEffectif = userIQ,
                        dateSignature = baseDateTime, signee = true
                    )
                    val choix = if (idx % 2 == 0) ChoixTraitement.CORRECTION else ChoixTraitement.DEROGATION
                    val s2 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_2,
                        contenu = "Traitement par ${choix.name.lowercase()}.",
                        signataireDesigne = userRQ, signataireEffectif = userRQ,
                        dateSignature = baseDateTime.plusDays(2), signee = true,
                        choixTraitement = choix
                    )
                    val s4 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_4,
                        contenu = "Vérification : résultat conforme.",
                        signataireDesigne = userIQ, signataireEffectif = userIQ,
                        dateSignature = baseDateTime.plusDays(5), signee = true
                    )
                    val s5 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_5,
                        contenu = "Non-conformité levée définitivement.",
                        signataireDesigne = userRQ, signataireEffectif = userRQ,
                        dateSignature = baseDateTime.plusDays(7), signee = true
                    )
                    val s6 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_6,
                        contenu = "Analyse des causes terminée. ${if (idx % 2 == 0) "CAPA nécessaire." else "Pas de CAPA."}",
                        signataireDesigne = userRQ, signataireEffectif = userRQ,
                        dateSignature = baseDateTime.plusDays(10), signee = true,
                        necessiteCapa = idx % 2 == 0
                    )
                    val s7 = SectionEvenement(
                        evenement = savedEvt, numeroSection = NumeroSection.SECTION_7,
                        contenu = "Clôture de la fiche. Dossier archivé.",
                        signataireDesigne = userDT ?: userRQ,
                        signataireEffectif = userDT ?: userRQ,
                        dateSignature = baseDateTime.plusDays(12), signee = true
                    )
                    savedEvt.sections.addAll(listOf(s1, s2, s4, s5, s6, s7))
                    evenementQualiteRepository.save(savedEvt)

                    // Collegial signatures on section 6 — all 4 signed
                    val savedS6 = savedEvt.sections.first { it.numeroSection == NumeroSection.SECTION_6 }
                    val cDT = SectionSignataireCollegial(
                        section = savedS6, roleAttendu = RoleCollegial.DT,
                        signataireDesigne = userDT, signataireEffectif = userDT,
                        dateSignature = baseDateTime.plusDays(10), signee = true
                    )
                    val cRQ = SectionSignataireCollegial(
                        section = savedS6, roleAttendu = RoleCollegial.RQ,
                        signataireDesigne = userRQ, signataireEffectif = userRQ,
                        dateSignature = baseDateTime.plusDays(10), signee = true
                    )
                    val cCT = SectionSignataireCollegial(
                        section = savedS6, roleAttendu = RoleCollegial.CT,
                        signataireDesigne = userCT, signataireEffectif = userCT,
                        dateSignature = baseDateTime.plusDays(10).plusHours(2), signee = true
                    )
                    val cCC = SectionSignataireCollegial(
                        section = savedS6, roleAttendu = RoleCollegial.CC,
                        signataireDesigne = userRQ, signataireEffectif = userRQ,
                        dateSignature = baseDateTime.plusDays(10).plusHours(3), signee = true
                    )
                    savedS6.signatairesCollegiaux.addAll(listOf(cDT, cRQ, cCT, cCC))
                    sectionEvenementRepository.save(savedS6)

                    // Actions on s2
                    val savedS2 = savedEvt.sections.first { it.numeroSection == NumeroSection.SECTION_2 }
                    savedS2.actionsTraitement.add(ActionTraitement(
                        section = savedS2,
                        descriptionAction = "Reprise intégrale de l'ouvrage.",
                        responsable = "Chef de chantier",
                        delaiPrevu = baseDate.plusDays(8)
                    ))
                    savedS2.actionsTraitement.add(ActionTraitement(
                        section = savedS2,
                        descriptionAction = "Contrôle final de conformité.",
                        responsable = "Ingénieur qualité",
                        delaiPrevu = baseDate.plusDays(10)
                    ))
                    sectionEvenementRepository.save(savedS2)

                    savedEvt.recalculerStatut()
                    evenementQualiteRepository.save(savedEvt)
                }
            }
        }

        return refNum
    }

    // ---- 6. DOCUMENTS QUALITE ----

    private fun initDocumentsQualite() {
        if (documentQualiteRepository.count() > 0L) return

        val documents = listOf(
            DocumentQualite(
                codeDocument = "MS-QUA-F1-V1",
                titre = "Fiche de contrôle qualité réception",
                versionCourante = "1",
                description = "Formulaire standard de contrôle qualité pour les réceptions de travaux et matériaux."
            ),
            DocumentQualite(
                codeDocument = "MS-QUA-F2-V1",
                titre = "Fiche NC/RC/PPI",
                versionCourante = "1",
                description = "Formulaire de gestion des non-conformités, remarques correctives et propositions de piste d'amélioration."
            ),
            DocumentQualite(
                codeDocument = "MS-QUA-F3-V1",
                titre = "Fiche d'agrément matériau",
                versionCourante = "1",
                description = "Formulaire de demande d'agrément pour les matériaux et produits de construction."
            ),
            DocumentQualite(
                codeDocument = "MS-QUA-P1-V2",
                titre = "Procédure de contrôle béton in situ",
                versionCourante = "2",
                description = "Procédure détaillée pour le contrôle qualité du béton sur chantier : slump test, prélèvements, essais compression."
            ),
            DocumentQualite(
                codeDocument = "MS-QUA-P2-V1",
                titre = "Procédure de levée topographique",
                versionCourante = "1",
                description = "Procédure de contrôle topographique : implantation, réception profils, contrôle nivellement."
            ),
            DocumentQualite(
                codeDocument = "MS-Chantier-QUA-T3-V1",
                titre = "Template synthèse mensuelle",
                versionCourante = "1",
                description = "Modèle de rapport de synthèse mensuelle qualité chantier."
            ),
            DocumentQualite(
                codeDocument = "MS-QUA-M1-V1",
                titre = "Manuel qualité entreprise",
                versionCourante = "1",
                description = "Manuel qualité de l'entreprise Mika Services : politique qualité, organisation, responsabilités."
            ),
            DocumentQualite(
                codeDocument = "MS-QUA-G1-V1",
                titre = "Guide des contrôles CCTP",
                versionCourante = "1",
                description = "Guide de référence des contrôles qualité exigés par les CCTP des marchés publics gabonais."
            ),
        )
        documents.forEach { documentQualiteRepository.save(it) }
        logger.info("${documents.size} documents qualité créés")
    }
}
