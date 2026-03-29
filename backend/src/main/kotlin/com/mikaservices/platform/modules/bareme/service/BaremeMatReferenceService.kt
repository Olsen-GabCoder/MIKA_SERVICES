package com.mikaservices.platform.modules.bareme.service

import com.mikaservices.platform.modules.bareme.entity.BaremeMatRefSequence
import com.mikaservices.platform.modules.bareme.repository.BaremeMatRefSequenceRepository
import com.mikaservices.platform.modules.bareme.repository.LignePrixBaremeRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Year
import java.util.regex.Pattern

/**
 * Génère une référence [MAT-YYYY-NNNNN] unique côté serveur (jamais depuis le client).
 * Priorité : compteur par année (version optimiste) ; reprise sur le max existant en base si besoin.
 */
@Service
class BaremeMatReferenceService(
    private val sequenceRepository: BaremeMatRefSequenceRepository,
    private val lignePrixBaremeRepository: LignePrixBaremeRepository
) {
    private val refPattern: Pattern = Pattern.compile("^MAT-(\\d{4})-(\\d{5})$")

    @Transactional
    fun nextMatReference(): String {
        val year = Year.now().value
        val maxFromDb = maxSequenceFromExistingLines(year)
        val row = sequenceRepository.findById(year).orElseGet {
            BaremeMatRefSequence(annee = year, dernierNumero = maxFromDb)
        }
        val next = maxOf(row.dernierNumero, maxFromDb) + 1
        row.dernierNumero = next
        sequenceRepository.save(row)
        return formatRef(year, next)
    }

    private fun formatRef(year: Int, seq: Int): String = "MAT-$year-" + String.format("%05d", seq)

    private fun maxSequenceFromExistingLines(year: Int): Int {
        val pattern = "MAT-$year-%"
        val refs = lignePrixBaremeRepository.findReferencesStartingWith(pattern)
        return refs.mapNotNull { parseSequence(it) }.maxOrNull() ?: 0
    }

    private fun parseSequence(ref: String): Int? {
        val m = refPattern.matcher(ref.trim())
        if (!m.matches()) return null
        return m.group(2).toIntOrNull()
    }
}
