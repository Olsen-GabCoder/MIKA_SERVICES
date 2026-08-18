package com.mikaservices.platform.config.database

import com.mikaservices.platform.common.enums.FamilleRoleProjet
import com.mikaservices.platform.common.enums.FamilleRoleProjet.*
import com.mikaservices.platform.modules.projet.entity.RoleProjet
import com.mikaservices.platform.modules.projet.repository.RoleProjetRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

/**
 * Seed du référentiel complet des rôles projet BTP (~62 rôles en 10 familles).
 * Idempotent : n'insère que les codes absents.
 */
@Component
class RolesProjetInitializer(
    private val roleProjetRepository: RoleProjetRepository
) {
    private val logger = LoggerFactory.getLogger(RolesProjetInitializer::class.java)

    private data class Seed(val code: String, val nom: String, val famille: FamilleRoleProjet, val cumulable: Boolean = false)

    private val seeds = listOf(
        // Direction de projet
        Seed("RP-DIR-PROJET", "Directeur de projet", DIRECTION_PROJET, true),
        Seed("RP-DIR-TRAVAUX", "Directeur de travaux", DIRECTION_PROJET, true),
        Seed("RP-CHEF-PROJET", "Chef de projet", DIRECTION_PROJET),
        Seed("RP-CHEF-PROJET-ADJ", "Chef de projet adjoint", DIRECTION_PROJET),
        Seed("RP-COORD-PROJET", "Coordinateur de projet / PMO", DIRECTION_PROJET, true),
        Seed("RP-CHARGE-AFFAIRES", "Chargé d'affaires", DIRECTION_PROJET, true),
        // Encadrement travaux
        Seed("RP-COND-TRAVAUX-P", "Conducteur de travaux principal", ENCADREMENT_TRAVAUX),
        Seed("RP-COND-TRAVAUX", "Conducteur de travaux", ENCADREMENT_TRAVAUX),
        Seed("RP-ING-TRAVAUX", "Ingénieur travaux", ENCADREMENT_TRAVAUX),
        Seed("RP-PLANIFICATEUR", "Planificateur / Ingénieur planning", ENCADREMENT_TRAVAUX, true),
        Seed("RP-ING-METHODES", "Ingénieur méthodes", ENCADREMENT_TRAVAUX, true),
        Seed("RP-CTRL-GESTION", "Contrôleur de gestion chantier", ENCADREMENT_TRAVAUX, true),
        // Encadrement chantier
        Seed("RP-CHEF-CHANTIER", "Chef de chantier", ENCADREMENT_CHANTIER),
        Seed("RP-CHEF-CHANTIER-ADJ", "Chef de chantier adjoint", ENCADREMENT_CHANTIER),
        Seed("RP-CHEF-EQUIPE", "Chef d'équipe", ENCADREMENT_CHANTIER),
        Seed("RP-COMMIS-CHANTIER", "Commis de chantier", ENCADREMENT_CHANTIER),
        // Études & technique
        Seed("RP-ING-ETUDES", "Ingénieur d'études", ETUDES_TECHNIQUE, true),
        Seed("RP-ING-PRIX", "Ingénieur études de prix", ETUDES_TECHNIQUE, true),
        Seed("RP-ING-STRUCTURE", "Ingénieur structure / génie civil", ETUDES_TECHNIQUE, true),
        Seed("RP-ING-VRD", "Ingénieur VRD", ETUDES_TECHNIQUE, true),
        Seed("RP-ING-GEOTECH", "Ingénieur géotechnicien", ETUDES_TECHNIQUE, true),
        Seed("RP-ING-THERMIQUE", "Ingénieur génie thermique-climatique", ETUDES_TECHNIQUE, true),
        Seed("RP-BIM", "Chef de projet BIM", ETUDES_TECHNIQUE, true),
        Seed("RP-METREUR", "Métreur / Économiste de la construction", ETUDES_TECHNIQUE, true),
        Seed("RP-DESSINATEUR", "Dessinateur-projeteur", ETUDES_TECHNIQUE, true),
        Seed("RP-GEOMETRE", "Géomètre-topographe", ETUDES_TECHNIQUE),
        Seed("RP-TOPOGRAPHE", "Topographe", ETUDES_TECHNIQUE),
        Seed("RP-AIDE-TOPO", "Aide-topographe", ETUDES_TECHNIQUE),
        Seed("RP-LABORANTIN", "Laborantin / Technicien laboratoire", ETUDES_TECHNIQUE),
        // Exécution — gros œuvre & TP
        Seed("RP-MACON", "Maçon", GROS_OEUVRE_TP),
        Seed("RP-COFFREUR", "Coffreur-bancheur", GROS_OEUVRE_TP),
        Seed("RP-FERRAILLEUR", "Ferrailleur", GROS_OEUVRE_TP),
        Seed("RP-CHARPENTIER", "Charpentier (bois/métal)", GROS_OEUVRE_TP),
        Seed("RP-TAILLEUR-PIERRE", "Tailleur de pierre", GROS_OEUVRE_TP),
        Seed("RP-FACADIER", "Applicateur d'enduits / Façadier", GROS_OEUVRE_TP),
        Seed("RP-ETANCHEUR", "Étancheur", GROS_OEUVRE_TP),
        Seed("RP-COUVREUR", "Couvreur", GROS_OEUVRE_TP),
        Seed("RP-TERRASSIER", "Terrassier", GROS_OEUVRE_TP),
        Seed("RP-CANALISATEUR", "Canalisateur / Poseur de canalisations", GROS_OEUVRE_TP),
        Seed("RP-OUVRIER-VRD", "Ouvrier VRD", GROS_OEUVRE_TP),
        Seed("RP-BETON-ARME", "Constructeur en béton armé", GROS_OEUVRE_TP),
        Seed("RP-SOUDEUR", "Soudeur", GROS_OEUVRE_TP),
        Seed("RP-MANOEUVRE", "Manœuvre / Ouvrier d'exécution", GROS_OEUVRE_TP),
        // Exécution — second œuvre
        Seed("RP-ELECTRICIEN", "Électricien", SECOND_OEUVRE),
        Seed("RP-PLOMBIER", "Plombier-chauffagiste", SECOND_OEUVRE),
        Seed("RP-MENUISIER", "Menuisier", SECOND_OEUVRE),
        Seed("RP-PLAQUISTE", "Plaquiste", SECOND_OEUVRE),
        Seed("RP-PEINTRE", "Peintre", SECOND_OEUVRE),
        Seed("RP-CARRELEUR", "Carreleur", SECOND_OEUVRE),
        Seed("RP-PARQUETEUR", "Parqueteur", SECOND_OEUVRE),
        Seed("RP-FRIGORISTE", "Frigoriste / Climaticien", SECOND_OEUVRE),
        Seed("RP-VITRIER", "Vitrier-miroitier", SECOND_OEUVRE),
        Seed("RP-SERRURIER", "Serrurier-métallier", SECOND_OEUVRE),
        // Matériel & conduite d'engins
        Seed("RP-COND-ENGINS", "Conducteur d'engins", MATERIEL_ENGINS),
        Seed("RP-GRUTIER", "Grutier", MATERIEL_ENGINS),
        Seed("RP-CHAUFFEUR-PL", "Chauffeur PL / Conducteur camion", MATERIEL_ENGINS),
        Seed("RP-CHEF-PARC", "Chef de parc matériel", MATERIEL_ENGINS, true),
        Seed("RP-RESP-MATERIEL", "Responsable matériel", MATERIEL_ENGINS, true),
        Seed("RP-MECANICIEN", "Mécanicien engins de chantier", MATERIEL_ENGINS, true),
        Seed("RP-POMPISTE", "Pompiste (gestion carburant)", MATERIEL_ENGINS),
        // Logistique & approvisionnement
        Seed("RP-MAGASINIER", "Magasinier", LOGISTIQUE_APPRO),
        Seed("RP-ASSIST-LOG", "Assistant logistique", LOGISTIQUE_APPRO),
        Seed("RP-APPRO", "Approvisionneur / Acheteur chantier", LOGISTIQUE_APPRO, true),
        Seed("RP-GEST-STOCK", "Gestionnaire de stock", LOGISTIQUE_APPRO),
        // QSHE
        Seed("RP-RESP-QSHE", "Responsable QSHE", QSHE, true),
        Seed("RP-ANIM-HSE", "Animateur HSE", QSHE),
        Seed("RP-CTRL-QUALITE", "Contrôleur qualité", QSHE),
        Seed("RP-INFIRMIER", "Infirmier de chantier / Secouriste", QSHE),
        // Administratif & support
        Seed("RP-POINTEUR", "Pointeur", ADMINISTRATIF_SUPPORT),
        Seed("RP-ASSIST-ADMIN", "Assistant administratif chantier", ADMINISTRATIF_SUPPORT),
        Seed("RP-COMPTABLE", "Comptable chantier", ADMINISTRATIF_SUPPORT, true),
        Seed("RP-ASSIST-RH", "Assistant RH chantier", ADMINISTRATIF_SUPPORT, true),
        Seed("RP-GARDIEN", "Gardien / Agent de sécurité", ADMINISTRATIF_SUPPORT),
    )

    @EventListener(ApplicationReadyEvent::class)
    fun seed() {
        try {
            var created = 0
            for (s in seeds) {
                if (!roleProjetRepository.existsByCode(s.code)) {
                    roleProjetRepository.save(RoleProjet(code = s.code, nom = s.nom, famille = s.famille, cumulable = s.cumulable))
                    created++
                }
            }
            if (created > 0) logger.info("[RolesProjet] $created rôles projet créés (référentiel BTP).")
        } catch (e: Exception) {
            logger.error("[RolesProjet] ERREUR seed : ${e.message}", e)
        }
    }
}
