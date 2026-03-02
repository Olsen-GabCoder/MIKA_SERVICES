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
import com.mikaservices.platform.modules.qualite.entity.ControleQualite
import com.mikaservices.platform.modules.qualite.repository.ControleQualiteRepository
import com.mikaservices.platform.modules.securite.entity.Incident
import com.mikaservices.platform.modules.securite.entity.Risque
import com.mikaservices.platform.modules.securite.repository.IncidentRepository
import com.mikaservices.platform.modules.securite.repository.RisqueRepository
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
import java.time.LocalTime

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
    private val controleQualiteRepository: ControleQualiteRepository,
    private val incidentRepository: IncidentRepository,
    private val risqueRepository: RisqueRepository,
    private val equipeRepository: EquipeRepository,
    private val fournisseurRepository: FournisseurRepository,
    private val materiauRepository: MateriauRepository,
    private val enginRepository: EnginRepository,
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(SeedDataInitializer::class.java)

    @Bean
    fun seedData(): CommandLineRunner {
        return CommandLineRunner {
            if (projetRepository.count() > 0L) {
                logger.info("Données de seed déjà présentes, skip.")
                return@CommandLineRunner
            }
            logger.info("Initialisation du jeu de données réaliste...")
            initClients()
            initChefProjetUsers()
            initProjets()
            ensureProjetId1()
            initDepenses()
            initTaches()
            initPointsBloquants()
            initPrevisions()
            initControlesQualite()
            initIncidents()
            initRisques()
            initEquipes()
            initFournisseurs()
            initMateriaux()
            initEngins()
            logger.info("Jeu de données réaliste initialisé avec succès.")
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

    private fun initControlesQualite() {
        if (controleQualiteRepository.count() > 0L) return
        val projets = projetRepository.findByActifTrue(PageRequest.of(0, 500)).content.take(2)
        val users = userRepository.findAll().firstOrNull()
        if (projets.isEmpty()) return
        val controles = mutableListOf<ControleQualite>()
        projets.forEachIndexed { i, p ->
            controles.add(ControleQualite(p, "CQ-${p.id}-01", "Contrôle compactage", null, TypeControle.EN_COURS_EXECUTION, StatutControleQualite.CONFORME, inspecteur = users, datePlanifiee = LocalDate.now().minusDays(7), dateRealisation = LocalDate.now().minusDays(5), zoneControlee = "Axe 1", noteGlobale = 85))
            controles.add(ControleQualite(p, "CQ-${p.id}-02", "Contrôle granulométrie", null, TypeControle.RECEPTION_MATERIAUX, StatutControleQualite.PLANIFIE, inspecteur = users, datePlanifiee = LocalDate.now().plusDays(5), zoneControlee = "Stock agrégats"))
        }
        controleQualiteRepository.saveAll(controles)
        logger.info("${controles.size} contrôles qualité créés")
    }

    private fun initIncidents() {
        if (incidentRepository.count() > 0L) return
        val p1 = projetRepository.findByActifTrue(PageRequest.of(0, 500)).content.firstOrNull() ?: return
        val user = userRepository.findAll().firstOrNull()
        val incidents = listOf(
            Incident(p1, "INC-2025-001", "Presqu'accident chute de charge", "Charge déplacée à proximité d'un ouvrier.", TypeIncident.PRESQU_ACCIDENT, GraviteIncident.LEGER, StatutIncident.CLOTURE, LocalDate.now().minusDays(15), lieu = "Chantier Axe 2", declarePar = user, mesuresImmediates = "Sensibilisation équipe"),
            Incident(p1, "INC-2025-002", "Incident matériel engin", "Panne mineure niveleuse.", TypeIncident.INCIDENT_MATERIEL, GraviteIncident.BENIN, StatutIncident.CLOTURE, LocalDate.now().minusDays(8), declarePar = user)
        )
        incidentRepository.saveAll(incidents)
        logger.info("${incidents.size} incidents créés")
    }

    private fun initRisques() {
        if (risqueRepository.count() > 0L) return
        val projets = projetRepository.findByActifTrue(PageRequest.of(0, 500)).content.take(2)
        if (projets.isEmpty()) return
        val risques = mutableListOf<Risque>()
        projets.forEach { p ->
            risques.add(Risque(p, "Risque glissement de terrain", "Zone en déblai sensible aux pluies", NiveauRisque.MOYEN, probabilite = 3, impact = 4, zoneConcernee = "Axe 3", mesuresPrevention = "Drainage et talutage"))
            risques.add(Risque(p, "Exposition électrique", "Proximité lignes aériennes", NiveauRisque.ELEVE, probabilite = 2, impact = 5, mesuresPrevention = "Consignation et balisage"))
        }
        risqueRepository.saveAll(risques)
        logger.info("${risques.size} risques créés")
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
}
