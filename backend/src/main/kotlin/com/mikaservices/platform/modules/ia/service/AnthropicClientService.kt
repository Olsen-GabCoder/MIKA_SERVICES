package com.mikaservices.platform.modules.ia.service

import com.mikaservices.platform.common.exception.AnthropicApiException
import com.mikaservices.platform.common.exception.AnthropicNonRetryableException
import com.mikaservices.platform.common.exception.AnthropicRetryableException
import com.mikaservices.platform.config.AnthropicProperties
import org.slf4j.LoggerFactory
import org.springframework.http.*
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Service
import org.springframework.web.client.HttpClientErrorException
import org.springframework.web.client.HttpServerErrorException
import org.springframework.web.client.ResourceAccessException
import org.springframework.web.client.RestTemplate
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.time.Duration

@Service
class AnthropicClientService(
    private val anthropicProperties: AnthropicProperties,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val apiUrl = "https://api.anthropic.com/v1/messages"
    private val apiVersion = "2023-06-01"

    private val restTemplate: RestTemplate = RestTemplate(
        SimpleClientHttpRequestFactory().apply {
            setConnectTimeout(Duration.ofSeconds(10))
            setReadTimeout(Duration.ofSeconds(anthropicProperties.timeoutSeconds))
        }
    )

    /**
     * Appelle l'API Claude Messages avec tool_use et retourne le JSON extrait du tool call.
     *
     * @param systemPrompt Le prompt système (consignes d'extraction)
     * @param userContent Les blocs de contenu utilisateur (texte et/ou document base64)
     * @param tool La définition du tool (name, description, input_schema)
     * @return Pair<JsonNode, TokenUsage> — le JSON input du tool call + usage tokens
     * @throws AnthropicApiException si l'appel échoue après retries
     */
    fun callWithToolUse(
        systemPrompt: String,
        userContent: List<Map<String, Any>>,
        tool: Map<String, Any>
    ): Pair<JsonNode, TokenUsage> {

        val requestBody = buildRequestBody(systemPrompt, userContent, tool)

        var lastException: Exception? = null

        for (attempt in 1..anthropicProperties.maxRetries) {
            try {
                val response = executeRequest(requestBody)
                return parseToolUseResponse(response)
            } catch (e: AnthropicRetryableException) {
                lastException = e
                logger.warn(
                    "Anthropic API attempt {}/{} failed ({}): {}",
                    attempt, anthropicProperties.maxRetries, e.statusCode, e.message
                )
                if (attempt < anthropicProperties.maxRetries) {
                    val delayMs = (1L shl attempt) * 1000 // 2s, 4s
                    Thread.sleep(delayMs)
                }
            } catch (e: AnthropicNonRetryableException) {
                throw AnthropicApiException(e.statusCode, e.errorCode, e.message ?: "Erreur API Anthropic")
            }
        }

        throw AnthropicApiException(
            statusCode = (lastException as? AnthropicRetryableException)?.statusCode ?: 503,
            errorCode = "SERVICE_IA_INDISPONIBLE",
            message = "Échec après ${anthropicProperties.maxRetries} tentatives: ${lastException?.message}"
        )
    }

    private fun buildRequestBody(
        systemPrompt: String,
        userContent: List<Map<String, Any>>,
        tool: Map<String, Any>
    ): Map<String, Any> = mapOf(
        "model" to anthropicProperties.model,
        "max_tokens" to anthropicProperties.maxTokens,
        "system" to systemPrompt,
        "tools" to listOf(tool),
        "tool_choice" to mapOf("type" to "tool", "name" to tool["name"]!!),
        "messages" to listOf(
            mapOf(
                "role" to "user",
                "content" to userContent
            )
        )
    )

    private fun executeRequest(body: Map<String, Any>): JsonNode {
        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            set("x-api-key", anthropicProperties.apiKey)
            set("anthropic-version", apiVersion)
        }

        val entity = HttpEntity(objectMapper.writeValueAsString(body), headers)

        try {
            val response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                entity,
                String::class.java
            )
            return objectMapper.readTree(response.body)
        } catch (e: HttpClientErrorException) {
            val status = e.statusCode.value()
            val errorBody = tryParseError(e.responseBodyAsString)
            when (status) {
                429 -> throw AnthropicRetryableException(status, "Quota dépassé — rate limited")
                401 -> throw AnthropicNonRetryableException(status, "CLE_API_INVALIDE", "Clé API Anthropic invalide")
                400 -> throw AnthropicNonRetryableException(status, "REQUETE_INVALIDE", errorBody)
                else -> throw AnthropicNonRetryableException(status, "ERREUR_CLIENT", errorBody)
            }
        } catch (e: HttpServerErrorException) {
            val status = e.statusCode.value()
            throw AnthropicRetryableException(status, "Erreur serveur Anthropic ($status)")
        } catch (e: ResourceAccessException) {
            throw AnthropicRetryableException(503, "Timeout ou connexion impossible: ${e.message}")
        }
    }

    private fun parseToolUseResponse(response: JsonNode): Pair<JsonNode, TokenUsage> {
        val usage = TokenUsage(
            inputTokens = response.path("usage").path("input_tokens").asInt(0),
            outputTokens = response.path("usage").path("output_tokens").asInt(0)
        )

        val stopReason = response.path("stop_reason").asText("")
        if (stopReason != "tool_use") {
            logger.warn("Réponse Claude sans tool_use (stop_reason={})", stopReason)
            throw AnthropicApiException(
                statusCode = 502,
                errorCode = "EXTRACTION_ECHOUEE",
                message = "Le modèle n'a pas produit d'extraction structurée (stop_reason=$stopReason)"
            )
        }

        val toolUseBlock = response.path("content")
            .firstOrNull { it.path("type").asText() == "tool_use" }
            ?: throw AnthropicApiException(
                statusCode = 502,
                errorCode = "EXTRACTION_ECHOUEE",
                message = "Aucun bloc tool_use dans la réponse"
            )

        return Pair(toolUseBlock.path("input"), usage)
    }

    private fun tryParseError(body: String): String {
        return try {
            val node = objectMapper.readTree(body)
            node.path("error").path("message").asText(body)
        } catch (e: Exception) {
            body
        }
    }

    data class TokenUsage(
        val inputTokens: Int,
        val outputTokens: Int
    )
}
