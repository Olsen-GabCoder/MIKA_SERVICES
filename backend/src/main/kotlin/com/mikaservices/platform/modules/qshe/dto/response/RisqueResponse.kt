package com.mikaservices.platform.modules.qshe.dto.response

import com.mikaservices.platform.common.enums.NiveauRisque
import com.mikaservices.platform.modules.qshe.enums.CategorieRisque
import java.time.LocalDateTime

data class RisqueResponse(
    val id: Long, val reference: String, val titre: String, val description: String?,
    val categorie: CategorieRisque?, val uniteTravail: String?, val dangerIdentifie: String?,
    val probabiliteBrute: Int, val graviteBrute: Int, val niveauBrut: NiveauRisque,
    val mesuresElimination: String?, val mesuresSubstitution: String?,
    val mesuresIngenierie: String?, val mesuresAdministratives: String?, val mesuresEpi: String?,
    val probabiliteResiduelle: Int?, val graviteResiduelle: Int?, val niveauResiduel: NiveauRisque?,
    val projetId: Long, val projetNom: String,
    val sousProjetId: Long?, val sousProjetNom: String?,
    val zoneConcernee: String?, val actif: Boolean,
    val createdAt: LocalDateTime?, val updatedAt: LocalDateTime?
)

data class RisqueSummaryResponse(
    val totalRisques: Long, val risquesActifs: Long,
    val critiquesOuEleves: Long, val parNiveauBrut: Map<String, Long>
)
