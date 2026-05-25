package com.mikaservices.platform.modules.ia.dto

data class MikaAssistantResponse(
    val reply: String,
    val actions: List<SuggestedAction> = emptyList(),
    val tokensUsed: Int = 0
)

data class SuggestedAction(
    val label: String,
    val route: String? = null,
    val type: String = "navigate"
)
