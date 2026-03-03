package com.mikaservices.platform.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import java.util.concurrent.Executor

/**
 * Fournit un bean "taskExecutor" pour que @Async (ex. envoi email de bienvenue en retry)
 * sache quel exécuteur utiliser lorsque plusieurs TaskExecutor sont présents (ex. WebSocket).
 */
@Configuration
class AsyncConfig {

    @Bean(name = ["taskExecutor"])
    fun taskExecutor(): Executor {
        val executor = ThreadPoolTaskExecutor()
        executor.corePoolSize = 2
        executor.maxPoolSize = 4
        executor.setQueueCapacity(50)
        executor.setThreadNamePrefix("async-")
        executor.initialize()
        return executor
    }
}
