package com.mikaservices.platform.common.exception

sealed class AnthropicException(
    val statusCode: Int,
    val errorCode: String,
    message: String
) : RuntimeException(message)

class AnthropicRetryableException(
    statusCode: Int,
    message: String
) : AnthropicException(statusCode, "RETRYABLE", message)

class AnthropicNonRetryableException(
    statusCode: Int,
    errorCode: String,
    message: String
) : AnthropicException(statusCode, errorCode, message)

class AnthropicApiException(
    statusCode: Int,
    errorCode: String,
    message: String
) : AnthropicException(statusCode, errorCode, message)
