package com.mikaservices.platform.modules.qualite.dto.response

import com.mikaservices.platform.modules.qualite.enums.NatureReception
import com.mikaservices.platform.modules.qualite.enums.SousTypeReception
import com.mikaservices.platform.modules.qualite.enums.StatutAgrement
import com.mikaservices.platform.modules.qualite.enums.StatutEvenement
import com.mikaservices.platform.modules.qualite.enums.StatutReception

/** Réponse complète de la synthèse mensuelle Qualité (Document A). */
data class SyntheseMensuelleResponse(
    val projetId: Long?,
    val projetNom: String?,
    val moisReference: String,
    // Blocs 1-3 : Réceptions par nature × sous-type
    val receptions: List<BlocReceptionSynthese>,
    // Bloc 4 : Essais laboratoire béton
    val essaisLabo: EssaisLaboSynthese?,
    // Bloc 5 : Levée topographique
    val leveeTopo: LeveeTopoSynthese?,
    // Bloc 6 : Agréments marché
    val agrements: AgrementsSynthese,
    // Encart NC
    val ncSynthese: NcSynthese,
)

data class BlocReceptionSynthese(
    val nature: NatureReception,
    val sousType: SousTypeReception,
    val total: Long,
    val parStatut: Map<StatutReception, Long>,
    /** Pourcentage de chaque statut = count / total * 100 */
    val statistiques: Map<StatutReception, Double>,
)

data class EssaisLaboSynthese(
    val nbCamionsMalaxeursVolumeCoulee: Int,
    val nbEssaisSlump: Int,
    val nbJoursCoulage: Int,
    val nbPrelevements: Int,
    val observations: String?,
)

data class LeveeTopoSynthese(
    val nbProfilsImplantes: Int,
    val nbProfilsReceptionnes: Int,
    val nbControlesRealises: Int,
    val observations: String?,
)

data class AgrementsSynthese(
    val total: Long,
    val parStatut: Map<StatutAgrement, Long>,
    val statistiques: Map<StatutAgrement, Double>,
)

data class NcSynthese(
    val enregistrees: Long,
    val traitees: Long,
    val ouvertes: Long,
    val parStatut: Map<StatutEvenement, Long>,
)
