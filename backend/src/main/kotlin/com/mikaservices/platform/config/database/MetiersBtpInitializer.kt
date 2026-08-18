package com.mikaservices.platform.config.database

import com.mikaservices.platform.common.enums.TypeSpecialite
import com.mikaservices.platform.modules.user.entity.Specialite
import com.mikaservices.platform.modules.user.repository.SpecialiteRepository
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Référentiel des métiers BTP, seedé comme spécialités (idempotent, par code).
 * La migration @PostConstruct supprime d'abord la contrainte CHECK PostgreSQL sur
 * specialites.categorie (bloquerait les nouvelles catégories de l'enum TypeSpecialite).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class MetiersBtpInitializer(
    private val jdbcTemplate: JdbcTemplate,
    private val specialiteRepository: SpecialiteRepository
) {
    private val logger = LoggerFactory.getLogger(MetiersBtpInitializer::class.java)

    @PostConstruct
    fun dropCategorieCheckConstraint() {
        try {
            jdbcTemplate.execute("ALTER TABLE specialites DROP CONSTRAINT IF EXISTS specialites_categorie_check")
            logger.warn("[MetiersBtpInitializer] Contrainte specialites_categorie_check supprimee (si existante).")
        } catch (e: Exception) {
            logger.warn("[MetiersBtpInitializer] Pas de contrainte a supprimer : ${e.message}")
        }
    }

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent::class)
    fun seedMetiers() {
        try {
            val metiers = listOf(
                // Encadrement chantier
                Triple("MET-DIR-TRAVAUX", "Directeur travaux", TypeSpecialite.ENCADREMENT_CHANTIER),
                Triple("MET-COND-TRAVAUX", "Conducteur de travaux", TypeSpecialite.ENCADREMENT_CHANTIER),
                Triple("MET-CHEF-CHANTIER", "Chef de chantier", TypeSpecialite.ENCADREMENT_CHANTIER),
                Triple("MET-CHEF-EQUIPE", "Chef d'équipe", TypeSpecialite.ENCADREMENT_CHANTIER),
                Triple("MET-POINTEUR", "Pointeur", TypeSpecialite.ENCADREMENT_CHANTIER),
                // Études & technique
                Triple("MET-ING-ETUDES", "Ingénieur études", TypeSpecialite.ETUDES_TECHNIQUE),
                Triple("MET-METREUR", "Métreur", TypeSpecialite.ETUDES_TECHNIQUE),
                Triple("MET-DESSINATEUR", "Dessinateur-projeteur", TypeSpecialite.ETUDES_TECHNIQUE),
                Triple("MET-TOPOGRAPHE", "Topographe", TypeSpecialite.ETUDES_TECHNIQUE),
                Triple("MET-GEOMETRE", "Géomètre", TypeSpecialite.ETUDES_TECHNIQUE),
                Triple("MET-LABORANTIN", "Laborantin", TypeSpecialite.ETUDES_TECHNIQUE),
                // Gros œuvre / VRD
                Triple("MET-MACON", "Maçon", TypeSpecialite.GROS_OEUVRE_VRD),
                Triple("MET-COFFREUR", "Coffreur-brancheur", TypeSpecialite.GROS_OEUVRE_VRD),
                Triple("MET-FERRAILLEUR", "Ferrailleur", TypeSpecialite.GROS_OEUVRE_VRD),
                Triple("MET-TERRASSIER", "Terrassier", TypeSpecialite.GROS_OEUVRE_VRD),
                Triple("MET-CANALISATEUR", "Canalisateur", TypeSpecialite.GROS_OEUVRE_VRD),
                Triple("MET-OUVRIER-VRD", "Ouvrier VRD", TypeSpecialite.GROS_OEUVRE_VRD),
                Triple("MET-MANOEUVRE", "Manœuvre", TypeSpecialite.GROS_OEUVRE_VRD),
                // Second œuvre
                Triple("MET-ELECTRICIEN", "Électricien", TypeSpecialite.SECOND_OEUVRE),
                Triple("MET-PLOMBIER", "Plombier", TypeSpecialite.SECOND_OEUVRE),
                Triple("MET-MENUISIER", "Menuisier", TypeSpecialite.SECOND_OEUVRE),
                Triple("MET-CHARPENTIER", "Charpentier", TypeSpecialite.SECOND_OEUVRE),
                Triple("MET-PEINTRE", "Peintre", TypeSpecialite.SECOND_OEUVRE),
                Triple("MET-CARRELEUR", "Carreleur", TypeSpecialite.SECOND_OEUVRE),
                Triple("MET-SOUDEUR", "Soudeur", TypeSpecialite.SECOND_OEUVRE),
                Triple("MET-ETANCHEUR", "Étancheur", TypeSpecialite.SECOND_OEUVRE),
                // Matériel & conduite
                Triple("MET-COND-ENGINS", "Conducteur d'engins", TypeSpecialite.MATERIEL_CONDUITE),
                Triple("MET-GRUTIER", "Grutier", TypeSpecialite.MATERIEL_CONDUITE),
                Triple("MET-CHAUFFEUR-PL", "Chauffeur poids lourd", TypeSpecialite.MATERIEL_CONDUITE),
                Triple("MET-MECANICIEN", "Mécanicien engins", TypeSpecialite.MATERIEL_CONDUITE),
                Triple("MET-RESP-MATERIEL", "Responsable matériel", TypeSpecialite.MATERIEL_CONDUITE),
                // Logistique & support chantier
                Triple("MET-MAGASINIER", "Magasinier", TypeSpecialite.LOGISTIQUE_SUPPORT),
                Triple("MET-ASSIST-LOG", "Assistant logistique", TypeSpecialite.LOGISTIQUE_SUPPORT),
                Triple("MET-APPRO", "Approvisionneur / Acheteur", TypeSpecialite.LOGISTIQUE_SUPPORT),
                Triple("MET-GARDIEN", "Gardien de chantier", TypeSpecialite.LOGISTIQUE_SUPPORT),
                // QSHE
                Triple("MET-RESP-QSHE", "Responsable QSHE", TypeSpecialite.QSHE),
                Triple("MET-ANIM-HSE", "Animateur HSE", TypeSpecialite.QSHE),
                Triple("MET-CTRL-QUALITE", "Contrôleur qualité", TypeSpecialite.QSHE),
                // Administratif
                Triple("MET-ASSIST-ADMIN", "Assistant administratif chantier", TypeSpecialite.ADMINISTRATIF),
                Triple("MET-COMPTABLE", "Comptable chantier", TypeSpecialite.ADMINISTRATIF),
                Triple("MET-RH", "Ressources humaines", TypeSpecialite.ADMINISTRATIF)
            )
            var created = 0
            metiers.forEach { (code, nom, categorie) ->
                if (!specialiteRepository.existsByCode(code)) {
                    specialiteRepository.save(Specialite(code = code, nom = nom, categorie = categorie))
                    created++
                }
            }
            if (created > 0) logger.warn("[MetiersBtpInitializer] $created métier(s) BTP seedé(s) comme spécialités.")
        } catch (e: Exception) {
            logger.error("[MetiersBtpInitializer] ERREUR seed métiers : ${e.message}", e)
        }
    }
}
