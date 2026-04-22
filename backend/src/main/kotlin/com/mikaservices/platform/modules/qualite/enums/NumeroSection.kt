package com.mikaservices.platform.modules.qualite.enums

/**
 * Sections du formulaire NC/RC/PPI.
 * Option B retenue : on garde la numérotation du formulaire papier,
 * la section 3 n'existe pas (supprimée volontairement dans le document source).
 */
enum class NumeroSection(val numero: Int) {
    SECTION_1(1),
    SECTION_2(2),
    SECTION_4(4),
    SECTION_5(5),
    SECTION_6(6),
    SECTION_7(7);

    companion object {
        /** Sections dans l'ordre séquentiel du workflow. */
        val WORKFLOW_ORDER = listOf(SECTION_1, SECTION_2, SECTION_4, SECTION_5, SECTION_6, SECTION_7)

        fun fromNumero(n: Int): NumeroSection = entries.first { it.numero == n }
    }
}
