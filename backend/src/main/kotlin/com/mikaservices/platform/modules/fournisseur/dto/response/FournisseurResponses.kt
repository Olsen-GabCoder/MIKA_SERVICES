package com.mikaservices.platform.modules.fournisseur.dto.response

import com.mikaservices.platform.common.enums.StatutCommande
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class FournisseurResponse(
    val id: Long, val code: String, val nom: String, val adresse: String?,
    val telephone: String?, val email: String?, val contactNom: String?,
    val specialite: String?, val noteEvaluation: Int?, val actif: Boolean,
    val nbCommandes: Int, val createdAt: LocalDateTime?, val updatedAt: LocalDateTime?
)

data class CommandeResponse(
    val id: Long, val reference: String, val fournisseurId: Long, val fournisseurNom: String,
    val projetId: Long?, val projetNom: String?, val designation: String,
    val montantTotal: BigDecimal?, val statut: StatutCommande,
    val dateCommande: LocalDate?, val dateLivraisonPrevue: LocalDate?,
    val dateLivraisonEffective: LocalDate?, val notes: String?,
    val createdAt: LocalDateTime?, val updatedAt: LocalDateTime?
)
