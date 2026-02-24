package com.mikaservices.platform.common.exception

open class CustomException(message: String) : RuntimeException(message)

class ResourceNotFoundException(message: String) : CustomException(message)

class BadRequestException(message: String) : CustomException(message)

class UnauthorizedException(message: String) : CustomException(message)

class ForbiddenException(message: String) : CustomException(message)

class ConflictException(message: String) : CustomException(message)

class ValidationException(message: String, val errors: Map<String, String>? = null) : CustomException(message)

/** Compte temporairement verrouillé après N échecs de connexion (HTTP 423 Locked). */
class AccountLockedException(message: String, val lockoutUntil: java.time.LocalDateTime? = null) : CustomException(message)
