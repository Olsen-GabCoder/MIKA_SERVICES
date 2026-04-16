package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.common.enums.PrioriteDemandeMateriel
import com.mikaservices.platform.common.enums.StatutDemandeMateriel
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class DemandeMaterielLigneResponse(
    val id: Long,
    val designation: String,
    val materiauId: Long?,
    val materiauCode: String?,
    val quantite: BigDecimal,
    val unite: String,
    val prixUnitaireEst: BigDecimal?,
    val fournisseurSuggere: String?,
)

data class DemandeMaterielHistoriqueResponse(
    val id: Long,
    val deStatut: StatutDemandeMateriel?,
    val versStatut: StatutDemandeMateriel,
    val userId: Long,
    val userNom: String,
    val dateTransition: LocalDateTime,
    val commentaire: String?,
)

data class DemandeMaterielResponse(
    val id: Long,
    val reference: String,
    val projetId: Long,
    val projetNom: String,
    val createurUserId: Long,
    val createurNom: String,
    val statut: StatutDemandeMateriel,
    val priorite: PrioriteDemandeMateriel,
    val dateSouhaitee: LocalDate?,
    val commentaire: String?,
    val montantEstime: BigDecimal?,
    val commandeId: Long?,
    val commandeReference: String?,
    val lignes: List<DemandeMaterielLigneResponse>,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)
