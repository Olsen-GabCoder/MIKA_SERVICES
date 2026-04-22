package com.mikaservices.platform.modules.qshe.enums

enum class TypeAction {
    /** Action immediate pour eliminer le probleme constate */
    CORRECTION,
    /** Action pour eliminer la cause racine */
    ACTION_CORRECTIVE,
    /** Action pour empecher l'occurrence dans d'autres contextes */
    ACTION_PREVENTIVE
}
