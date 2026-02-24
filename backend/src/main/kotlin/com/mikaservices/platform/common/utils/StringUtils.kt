package com.mikaservices.platform.common.utils

object StringUtils {
    
    fun isBlank(value: String?): Boolean {
        return value.isNullOrBlank()
    }
    
    fun isNotBlank(value: String?): Boolean {
        return !isBlank(value)
    }
    
    fun capitalize(value: String): String {
        if (value.isEmpty()) return value
        return value.substring(0, 1).uppercase() + value.substring(1).lowercase()
    }
    
    fun truncate(value: String, maxLength: Int): String {
        if (value.length <= maxLength) return value
        return value.substring(0, maxLength - 3) + "..."
    }
    
    fun sanitize(value: String): String {
        return value.trim().replace(Regex("\\s+"), " ")
    }
}
