package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.TypeEngin
import java.time.LocalDate

/** Vue engin pour l'application mobile terrain (conducteurs). */
data class TerrainEnginResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val type: TypeEngin,
    val statut: StatutEngin,
    val marque: String?,
    val modele: String?,
    val heuresCompteur: Int,
    /** Chantier de l'affectation EN_COURS, null sinon. */
    val chantierNom: String?,
    /** Date de début de l'affectation EN_COURS (depuis quand l'engin est sur ce chantier). */
    val chantierDepuis: LocalDate?,
    /** Inspection quotidienne déjà réalisée aujourd'hui. */
    val inspectionFaiteAujourdhui: Boolean,
    /** Date du dernier plein de carburant. */
    val dernierPlein: LocalDate?,
    /** Photo de profil de l'engin (URL Cloudinary directe, null sinon). */
    val photo: String?
)
