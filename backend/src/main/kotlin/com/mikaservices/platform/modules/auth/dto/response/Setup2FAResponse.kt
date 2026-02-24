package com.mikaservices.platform.modules.auth.dto.response

data class Setup2FAResponse(
    val secret: String,
    val qrImageBase64: String,
    val message: String = "Scannez le QR code avec votre application d'authentification"
)
