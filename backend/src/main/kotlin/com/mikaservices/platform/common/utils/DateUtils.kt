package com.mikaservices.platform.common.utils

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

object DateUtils {
    
    private val DEFAULT_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
    private val DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    private val TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss")
    
    fun formatDateTime(dateTime: LocalDateTime): String {
        return dateTime.format(DEFAULT_FORMATTER)
    }
    
    fun formatDate(dateTime: LocalDateTime): String {
        return dateTime.format(DATE_FORMATTER)
    }
    
    fun formatTime(dateTime: LocalDateTime): String {
        return dateTime.format(TIME_FORMATTER)
    }
    
    fun now(): LocalDateTime {
        return LocalDateTime.now()
    }
}
