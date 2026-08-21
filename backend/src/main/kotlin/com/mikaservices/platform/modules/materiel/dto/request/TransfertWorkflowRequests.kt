package com.mikaservices.platform.modules.materiel.dto.request

import jakarta.validation.constraints.NotBlank

/** Validation logistique d'une demande de transfert (destination modifiable). */
data class ValidationTransfertRequest(
    val projetDestinationId: Long? = null,
    val commentaire: String? = null,
)

/** Rejet logistique d'une demande de transfert. */
data class RejetTransfertRequest(
    @field:NotBlank(message = "Le motif de rejet est obligatoire")
    val motif: String?,
)

/**
 * Réception à destination : exige le token du QR (scanné sur le téléphone du convoyeur)
 * OU le code manuel 6 chiffres (mode dégradé, tracé). GPS capturé au scan.
 */
data class ReceptionTransfertRequest(
    val token: String? = null,
    val code: String? = null,
    val avecReserves: Boolean = false,
    val commentaire: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val precisionMetres: Double? = null,
    /** URLs Cloudinary des photos de réserves (uploadées via /reception-photos). */
    val photos: List<String>? = null,
    /** Signature PNG du receveur (data URL base64). */
    val signatureDataUrl: String? = null,
    /** Horodatage capture sur l'appareil (epoch ms) — reception offline differee. */
    val dateReceptionTerrain: Long? = null,
    /** Idempotence offline : evite le double-replay (meme semantique que les autres mutations). */
    val clientRequestId: String? = null,
)
