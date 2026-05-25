package com.mikaservices.platform.modules.ia.dto

data class MikaAssistantRequest(
    val message: String,
    val pageContext: String,
    val pageRoute: String,
    val conversationHistory: List<ConversationMessage> = emptyList(),
    val pageData: Map<String, Any?> = emptyMap()
)

data class ConversationMessage(
    val role: String,
    val content: String
)
