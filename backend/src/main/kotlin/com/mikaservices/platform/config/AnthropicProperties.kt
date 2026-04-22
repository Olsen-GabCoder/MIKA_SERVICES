package com.mikaservices.platform.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationProperties(prefix = "app.anthropic")
data class AnthropicProperties(
    var apiKey: String = "",
    var model: String = "claude-sonnet-4-5-20250929",
    var maxTokens: Int = 4096,
    var timeoutSeconds: Long = 60,
    var maxRetries: Int = 3
) {
    override fun toString() = "AnthropicProperties(apiKey=***, model=$model, maxTokens=$maxTokens, timeoutSeconds=$timeoutSeconds, maxRetries=$maxRetries)"
}
