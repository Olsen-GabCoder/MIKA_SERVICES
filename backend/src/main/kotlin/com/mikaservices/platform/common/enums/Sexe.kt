package com.mikaservices.platform.common.enums

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

enum class Sexe {
    HOMME, FEMME
}

@Converter(autoApply = false)
class SexeConverter : AttributeConverter<Sexe?, String?> {
    override fun convertToDatabaseColumn(attribute: Sexe?): String? {
        return attribute?.name
    }

    override fun convertToEntityAttribute(dbData: String?): Sexe? {
        if (dbData.isNullOrBlank() || dbData.equals("NULL", ignoreCase = true)) return null
        return try {
            Sexe.valueOf(dbData)
        } catch (_: IllegalArgumentException) {
            null
        }
    }
}
