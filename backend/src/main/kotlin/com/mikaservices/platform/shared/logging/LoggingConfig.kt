package com.mikaservices.platform.shared.logging

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Configuration

@Configuration
class LoggingConfig {
    companion object {
        inline fun <reified T> logger(): Logger = LoggerFactory.getLogger(T::class.java)
    }
}
