package com.mikaservices.platform.common.enums

/**
 * Mode de génération / d'affichage du tableau de suivi mensuel.
 * - AUTO : mois dérivés automatiquement d'une plage de dates (logique actuelle côté frontend).
 * - MANUEL : liste de mois paramétrée manuellement (sans contrainte de cohérence temporelle).
 */
enum class ModeSuiviMensuel {
    AUTO,
    MANUEL
}

