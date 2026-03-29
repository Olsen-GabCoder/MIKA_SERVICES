package com.mikaservices.platform.modules.bareme.service

import com.mikaservices.platform.modules.bareme.dto.response.BaremeColumnTypeRow
import com.mikaservices.platform.modules.bareme.dto.response.BaremeDbSchemaDiagnosticResponse
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import java.sql.Connection

/**
 * Diagnostic sans modifier la base : types SQL réels des colonnes barème.
 */
@Service
class BaremeSchemaDiagnosticService(
    private val jdbcTemplate: JdbcTemplate,
) {
    private val baremeTables = listOf("bareme_lignes_prix", "bareme_fournisseurs", "bareme_corps_etat")

    private val filterColumnNames = setOf(
        "libelle", "reference", "unite", "unite_prestation", "famille", "categorie", "nom",
    )

    fun diagnose(): BaremeDbSchemaDiagnosticResponse {
        val (dbName, dbVersion, schemaName) = jdbcTemplate.execute { conn: Connection ->
            val md = conn.metaData
            val name = md.databaseProductName
            val ver = md.databaseProductVersion
            val schema = resolveSchema(conn, name)
            Triple(name, ver, schema)
        }!!

        val placeholders = baremeTables.joinToString(",") { "?" }
        val schemaArg: Array<Any> = listOf<Any>(schemaName).plus(baremeTables).toTypedArray()
        val colSql =
            if (dbName.contains("PostgreSQL", ignoreCase = true)) {
                "SELECT table_name, column_name, data_type, udt_name"
            } else {
                "SELECT table_name, column_name, data_type, CAST(NULL AS CHAR) AS udt_name"
            }
        val rows = jdbcTemplate.query(
            """
            $colSql
            FROM information_schema.columns
            WHERE table_schema = ? AND table_name IN ($placeholders)
            ORDER BY table_name, ordinal_position
            """.trimIndent(),
            { rs, _ ->
                BaremeColumnTypeRow(
                    tableName = rs.getString("table_name"),
                    columnName = rs.getString("column_name"),
                    dataType = rs.getString("data_type"),
                    udtName = rs.getString("udt_name"),
                )
            },
            *schemaArg,
        )

        val isPostgres = dbName.contains("PostgreSQL", ignoreCase = true)
        val bytea = rows.filter { it.dataType.equals("bytea", ignoreCase = true) }
        val blobLike = rows.filter {
            it.dataType.contains("blob", ignoreCase = true) ||
                it.dataType.equals("binary", ignoreCase = true)
        }
        val wrongForFilters = when {
            isPostgres ->
                rows.filter { row ->
                    row.columnName.lowercase() in filterColumnNames &&
                        row.dataType.equals("bytea", ignoreCase = true)
                }
            else ->
                rows.filter { row ->
                    row.columnName.lowercase() in filterColumnNames &&
                        (row.dataType.contains("blob", ignoreCase = true) ||
                            row.dataType.equals("binary", ignoreCase = true))
                }
        }

        val hypothesis = when {
            wrongForFilters.isNotEmpty() && isPostgres ->
                "Cause probable : Hibernate génère LOWER(colonne) sur du texte ; en PostgreSQL les colonnes " +
                    wrongForFilters.joinToString { "${it.tableName}.${it.columnName}(${it.dataType})" } +
                    " font que la base exécute lower(bytea), ce qui est invalide → 500 sur /bareme/facets et /bareme/articles."
            wrongForFilters.isNotEmpty() ->
                "Colonnes filtre avec type binaire détectées : " +
                    wrongForFilters.joinToString { "${it.tableName}.${it.columnName}" } +
                    " — comportement selon le moteur ; consulter le message d’erreur SQL exact dans les logs."
            isPostgres && bytea.isNotEmpty() ->
                "Colonnes BYTEA présentes (${bytea.joinToString { "${it.tableName}.${it.columnName}" }}) mais hors liste filtre connue ; " +
                    "si l’erreur mentionne lower(bytea), étendre la conversion de schéma à ces colonnes."
            isPostgres ->
                "Sous PostgreSQL, aucune colonne de filtre en BYTEA : si 500 persiste, la cause n’est vraisemblablement pas ce schéma " +
                    "(copier la cause racine depuis les logs serveur Render)."
            else ->
                "Environnement non PostgreSQL : comparer data_type des colonnes ci-dessous avec l’erreur JDBC/Hibernate dans les logs."
        }

        return BaremeDbSchemaDiagnosticResponse(
            databaseProductName = dbName,
            databaseProductVersion = dbVersion,
            currentSchema = schemaName,
            baremeColumns = rows,
            byteaColumns = if (isPostgres) bytea else blobLike,
            filterColumnsWithWrongType = wrongForFilters,
            hypothesis = hypothesis,
        )
    }

    private fun resolveSchema(conn: Connection, databaseProductName: String): String {
        return if (databaseProductName.contains("PostgreSQL", ignoreCase = true)) {
            "public"
        } else {
            conn.createStatement().use { st ->
                st.executeQuery("SELECT DATABASE()").use { rs ->
                    if (rs.next()) rs.getString(1) ?: "" else ""
                }
            }
        }
    }
}
