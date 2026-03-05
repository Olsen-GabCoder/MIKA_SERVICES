package com.mikaservices.platform.common.enums

import tools.jackson.core.JsonParser
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.ValueDeserializer
import tools.jackson.databind.module.SimpleModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class EnumJacksonConfig {

    @Bean
    fun enumEmptyStringModule(): SimpleModule {
        val module = SimpleModule()
        module.addDeserializer(TypeContrat::class.java, NullableEnumDeserializer(TypeContrat::class.java))
        module.addDeserializer(NiveauExperience::class.java, NullableEnumDeserializer(NiveauExperience::class.java))
        module.addDeserializer(Sexe::class.java, NullableEnumDeserializer(Sexe::class.java))
        return module
    }

    private class NullableEnumDeserializer<T : Enum<T>>(
        private val enumClass: Class<T>
    ) : ValueDeserializer<T?>() {
        override fun deserialize(p: JsonParser, ctxt: DeserializationContext): T? {
            val v = p.text ?: return null
            if (v.isBlank() || v.equals("null", ignoreCase = true)) return null
            return try {
                java.lang.Enum.valueOf(enumClass, v.trim())
            } catch (_: IllegalArgumentException) {
                null
            }
        }

        override fun getNullValue(ctxt: DeserializationContext): T? = null
    }
}
