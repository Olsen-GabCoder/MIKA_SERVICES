package com.mikaservices.platform.common.enums

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.module.SimpleModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * Accepte chaîne vide "" pour typeContrat / niveauExperience → désérialisé en null.
 * Évite : Cannot coerce empty String ("") to TypeContrat value.
 */
@Configuration
class EnumJacksonConfig {

    @Bean
    fun enumEmptyStringModule(): SimpleModule {
        val module = SimpleModule()
        module.addDeserializer(TypeContrat::class.java, object : JsonDeserializer<TypeContrat?>() {
            override fun deserialize(p: JsonParser, ctxt: DeserializationContext): TypeContrat? {
                val v = p.valueAsString ?: return null
                if (v.isBlank()) return null
                return try {
                    TypeContrat.valueOf(v.trim())
                } catch (_: IllegalArgumentException) {
                    null
                }
            }
        })
        module.addDeserializer(NiveauExperience::class.java, object : JsonDeserializer<NiveauExperience?>() {
            override fun deserialize(p: JsonParser, ctxt: DeserializationContext): NiveauExperience? {
                val v = p.valueAsString ?: return null
                if (v.isBlank()) return null
                return try {
                    NiveauExperience.valueOf(v.trim())
                } catch (_: IllegalArgumentException) {
                    null
                }
            }
        })
        return module
    }
}
