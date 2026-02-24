package com.mikaservices.platform.common.constants

object ApiConstants {
    const val API_VERSION = "v1"
    const val API_BASE_PATH = "/api"
    
    // Messages d'erreur
    const val ERROR_RESOURCE_NOT_FOUND = "Ressource non trouvée"
    const val ERROR_UNAUTHORIZED = "Non autorisé"
    const val ERROR_FORBIDDEN = "Accès interdit"
    const val ERROR_BAD_REQUEST = "Requête invalide"
    const val ERROR_INTERNAL_SERVER = "Erreur interne du serveur"
    const val ERROR_VALIDATION_FAILED = "Erreur de validation"
    
    // Messages de succès
    const val SUCCESS_CREATED = "Créé avec succès"
    const val SUCCESS_UPDATED = "Mis à jour avec succès"
    const val SUCCESS_DELETED = "Supprimé avec succès"
}
