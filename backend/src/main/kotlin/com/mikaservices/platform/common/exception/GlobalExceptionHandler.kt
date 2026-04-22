package com.mikaservices.platform.common.exception

import com.mikaservices.platform.common.constants.ApiConstants
import com.mikaservices.platform.common.exception.AnthropicException
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.ConstraintViolationException
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.AuthenticationException
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.servlet.resource.NoResourceFoundException

@RestControllerAdvice
class GlobalExceptionHandler {
    
    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)
    
    @ExceptionHandler(ResourceNotFoundException::class)
    fun handleResourceNotFoundException(
        ex: ResourceNotFoundException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Resource not found: ${ex.message}", ex)
        val apiError = ApiError(
            status = HttpStatus.NOT_FOUND.value(),
            error = "Not Found",
            message = ex.message ?: ApiConstants.ERROR_RESOURCE_NOT_FOUND,
            path = request.requestURI
        )
        return ResponseEntity(apiError, HttpStatus.NOT_FOUND)
    }
    
    @ExceptionHandler(BadRequestException::class)
    fun handleBadRequestException(
        ex: BadRequestException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Bad request: ${ex.message}", ex)
        val apiError = ApiError(
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Bad Request",
            message = ex.message ?: ApiConstants.ERROR_BAD_REQUEST,
            path = request.requestURI
        )
        return ResponseEntity(apiError, HttpStatus.BAD_REQUEST)
    }
    
    @ExceptionHandler(UnauthorizedException::class)
    fun handleUnauthorizedException(
        ex: UnauthorizedException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Unauthorized: ${ex.message}", ex)
        val apiError = ApiError(
            status = HttpStatus.UNAUTHORIZED.value(),
            error = "Unauthorized",
            message = ex.message ?: ApiConstants.ERROR_UNAUTHORIZED,
            path = request.requestURI
        )
        return ResponseEntity(apiError, HttpStatus.UNAUTHORIZED)
    }
    
    @ExceptionHandler(ForbiddenException::class)
    fun handleForbiddenException(
        ex: ForbiddenException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Forbidden: ${ex.message}", ex)
        val apiError = ApiError(
            status = HttpStatus.FORBIDDEN.value(),
            error = "Forbidden",
            message = ex.message ?: ApiConstants.ERROR_FORBIDDEN,
            path = request.requestURI
        )
        return ResponseEntity(apiError, HttpStatus.FORBIDDEN)
    }
    
    @ExceptionHandler(AccountLockedException::class)
    fun handleAccountLockedException(
        ex: AccountLockedException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Account locked: ${ex.message}")
        val apiError = ApiError(
            status = HttpStatus.LOCKED.value(),
            error = "Locked",
            message = ex.message ?: "Compte temporairement verrouillé",
            path = request.requestURI
        )
        return ResponseEntity(apiError, HttpStatus.LOCKED)
    }

    @ExceptionHandler(ConflictException::class)
    fun handleConflictException(
        ex: ConflictException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Conflict: ${ex.message}", ex)
        val apiError = ApiError(
            status = HttpStatus.CONFLICT.value(),
            error = "Conflict",
            message = ex.message ?: "Conflict",
            path = request.requestURI
        )
        return ResponseEntity(apiError, HttpStatus.CONFLICT)
    }
    
    @ExceptionHandler(ValidationException::class)
    fun handleValidationException(
        ex: ValidationException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Validation error: ${ex.message}", ex)
        val apiError = ApiError(
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Validation Failed",
            message = ex.message ?: "Validation failed",
            path = request.requestURI,
            details = ex.errors
        )
        return ResponseEntity(apiError, HttpStatus.BAD_REQUEST)
    }
    
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleMethodArgumentNotValidException(
        ex: MethodArgumentNotValidException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Validation error: ${ex.message}", ex)
        val errors = ex.bindingResult.fieldErrors.associate { it.field to (it.defaultMessage ?: "") }
        val apiError = ApiError(
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Validation Failed",
            message = ApiConstants.ERROR_VALIDATION_FAILED,
            path = request.requestURI,
            details = errors
        )
        return ResponseEntity(apiError, HttpStatus.BAD_REQUEST)
    }
    
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleHttpMessageNotReadable(
        ex: HttpMessageNotReadableException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Invalid request body: ${ex.message}", ex)
        val message = ex.mostSpecificCause?.message ?: "Corps de la requête invalide (JSON ou type de donnée incorrect)"
        val apiError = ApiError(
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Bad Request",
            message = message,
            path = request.requestURI
        )
        return ResponseEntity(apiError, HttpStatus.BAD_REQUEST)
    }

    @ExceptionHandler(ConstraintViolationException::class)
    fun handleConstraintViolationException(
        ex: ConstraintViolationException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Constraint violation: ${ex.message}", ex)
        val errors = ex.constraintViolations.associate { 
            it.propertyPath.toString() to (it.message ?: "")
        }
        val apiError = ApiError(
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Validation Failed",
            message = ApiConstants.ERROR_VALIDATION_FAILED,
            path = request.requestURI,
            details = errors
        )
        return ResponseEntity(apiError, HttpStatus.BAD_REQUEST)
    }
    
    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthenticationException(
        ex: AuthenticationException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Authentication error: ${ex.message}", ex)
        val apiError = ApiError(
            status = HttpStatus.UNAUTHORIZED.value(),
            error = "Unauthorized",
            message = ex.message ?: ApiConstants.ERROR_UNAUTHORIZED,
            path = request.requestURI
        )
        return ResponseEntity(apiError, HttpStatus.UNAUTHORIZED)
    }
    
    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDeniedException(
        ex: AccessDeniedException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.warn("Access denied: ${ex.message}", ex)
        val apiError = ApiError(
            status = HttpStatus.FORBIDDEN.value(),
            error = "Forbidden",
            message = ApiConstants.ERROR_FORBIDDEN,
            path = request.requestURI
        )
        return ResponseEntity(apiError, HttpStatus.FORBIDDEN)
    }
    
    @ExceptionHandler(NoResourceFoundException::class)
    fun handleNoResourceFoundException(
        ex: NoResourceFoundException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.debug("No handler for request: ${ex.message}")
        val apiError = ApiError(
            status = HttpStatus.NOT_FOUND.value(),
            error = "Not Found",
            message = ex.message ?: "Ressource non trouvée",
            path = request.requestURI
        )
        return ResponseEntity(apiError, HttpStatus.NOT_FOUND)
    }

    @ExceptionHandler(AnthropicException::class)
    fun handleAnthropicException(
        ex: AnthropicException,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.error("Anthropic API error [{}]: {}", ex.errorCode, ex.message)
        val httpStatus = when (ex.statusCode) {
            429 -> HttpStatus.TOO_MANY_REQUESTS
            503, 529 -> HttpStatus.SERVICE_UNAVAILABLE
            504 -> HttpStatus.GATEWAY_TIMEOUT
            else -> HttpStatus.BAD_GATEWAY
        }
        val apiError = ApiError(
            status = httpStatus.value(),
            error = ex.errorCode,
            message = ex.message ?: "Erreur du service IA",
            path = request.requestURI
        )
        return ResponseEntity(apiError, httpStatus)
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(
        ex: Exception,
        request: HttpServletRequest
    ): ResponseEntity<ApiError> {
        logger.error("Unexpected error: ${ex.message}", ex)
        val apiError = ApiError(
            status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            error = "Internal Server Error",
            message = ApiConstants.ERROR_INTERNAL_SERVER,
            path = request.requestURI
        )
        return ResponseEntity(apiError, HttpStatus.INTERNAL_SERVER_ERROR)
    }
}
