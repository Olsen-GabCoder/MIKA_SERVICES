package com.mikaservices.platform.modules.bareme.dto.response

/**
 * Diagnostic lecture seule : types SQL réels des colonnes barème (source de vérité côté base).
 */
data class BaremeDbSchemaDiagnosticResponse(
    val databaseProductName: String,
    val databaseProductVersion: String?,
    val currentSchema: String?,
    /** Colonnes des tables barème (public) avec type SQL déclaré. */
    val baremeColumns: List<BaremeColumnTypeRow>,
    /** Colonnes encore en BYTEA sur ces tables (problème typique sous PostgreSQL avec LOWER() Hibernate). */
    val byteaColumns: List<BaremeColumnTypeRow>,
    /** Colonnes utilisées dans les filtres / facettes / liste : si l’une est bytea sous PG → erreur 500 probable. */
    val filterColumnsWithWrongType: List<BaremeColumnTypeRow>,
    val hypothesis: String,
)

data class BaremeColumnTypeRow(
    val tableName: String,
    val columnName: String,
    val dataType: String,
    val udtName: String?,
)
