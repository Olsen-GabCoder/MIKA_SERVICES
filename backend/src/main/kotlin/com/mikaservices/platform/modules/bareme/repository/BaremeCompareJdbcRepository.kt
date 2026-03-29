package com.mikaservices.platform.modules.bareme.repository

import com.mikaservices.platform.common.enums.TypeLigneBareme
import com.mikaservices.platform.modules.bareme.dto.BaremeArticleGroupKey
import org.springframework.beans.factory.annotation.Value
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository

/**
 * Comptage et pagination des **groupes** article (corps + libellé + unité + type), sans la référence MAT-.
 * Compatible MySQL 8 et PostgreSQL.
 */
@Repository
class BaremeCompareJdbcRepository(
    private val jdbc: NamedParameterJdbcTemplate,
    @Value("\${spring.datasource.url:}") private val jdbcUrl: String
) {
    private val isPostgres: Boolean get() = jdbcUrl.contains("postgresql", ignoreCase = true)

    /** Colonne enum type : mot réservé sous PostgreSQL. */
    private fun sqlTypeColumn(alias: String): String =
        if (isPostgres) "$alias.\"type\"" else "$alias.type"

    private fun baseWhereAndParams(
        corpsEtatId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        uniteAliasT: Boolean,
        article: String?,
        search: String?
    ): Pair<String, MapSqlParameterSource> {
        val p = MapSqlParameterSource()
        val sb = StringBuilder()
        sb.append("l.parent_id IS NULL")
        if (corpsEtatId != null) {
            sb.append(" AND l.corps_etat_id = :corpsEtatId")
            p.addValue("corpsEtatId", corpsEtatId)
        }
        if (type != null) {
            sb.append(" AND ").append(sqlTypeColumn("l")).append(" = :typeEnum")
            p.addValue("typeEnum", type.name)
        }
        if (fournId != null) {
            sb.append(" AND l.fournisseur_bareme_id = :fournId")
            p.addValue("fournId", fournId)
        }
        if (!fournNom.isNullOrBlank()) {
            sb.append(" AND LOWER(COALESCE(f.nom, '')) = LOWER(:fournNom)")
            p.addValue("fournNom", fournNom.trim())
        }
        if (!famille.isNullOrBlank()) {
            sb.append(" AND LOWER(COALESCE(l.famille, '')) = LOWER(:famille)")
            p.addValue("famille", famille.trim())
        }
        if (!categorie.isNullOrBlank()) {
            sb.append(" AND LOWER(COALESCE(l.categorie, '')) = LOWER(:categorie)")
            p.addValue("categorie", categorie.trim())
        }
        if (!unite.isNullOrBlank()) {
            val u = unite.trim().uppercase()
            if (uniteAliasT && u in setOf("T", "TON", "TONNE")) {
                sb.append(
                    """ AND (
                    LOWER(COALESCE(l.unite, COALESCE(l.unite_prestation, ''))) = 'T'
                    OR LOWER(COALESCE(l.unite, COALESCE(l.unite_prestation, ''))) IN ('ton','tonne')
                )"""
                )
            } else {
                sb.append(" AND LOWER(COALESCE(l.unite, COALESCE(l.unite_prestation, ''))) = LOWER(:unite)")
                p.addValue("unite", unite.trim())
            }
        }
        if (!article.isNullOrBlank()) {
            sb.append(
                " AND LOWER(COALESCE(l.libelle, COALESCE(l.reference, ''))) = LOWER(:article)"
            )
            p.addValue("article", article.trim())
        }
        if (!search.isNullOrBlank()) {
            sb.append(" AND LOWER(l.libelle) LIKE LOWER(:searchLike)")
            p.addValue("searchLike", "%${search.trim()}%")
        }
        return sb.toString() to p
    }

    fun countDistinctArticleGroups(
        corpsEtatId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        uniteAliasT: Boolean,
        article: String?,
        search: String?
    ): Long {
        val (where, params) = baseWhereAndParams(
            corpsEtatId, type, fournId, fournNom, famille, categorie, unite, uniteAliasT, article, search
        )
        val typeCol = sqlTypeColumn("l")
        val sql = """
            SELECT COUNT(*) FROM (
              SELECT 1
              FROM bareme_lignes_prix l
              INNER JOIN bareme_corps_etat c ON l.corps_etat_id = c.id
              LEFT JOIN bareme_fournisseurs f ON l.fournisseur_bareme_id = f.id
              WHERE $where
              GROUP BY l.corps_etat_id, c.ordre_affichage, l.libelle, l.unite, $typeCol
            ) grp
        """.trimIndent()
        val n = jdbc.queryForObject(sql, params, Long::class.java) ?: 0L
        return n
    }

    /**
     * Page de clés de groupes, ordre aligné sur la liste barème (corps puis libellé).
     */
    fun findDistinctArticleGroupKeys(
        corpsEtatId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        uniteAliasT: Boolean,
        article: String?,
        search: String?,
        offset: Int,
        limit: Int
    ): List<BaremeArticleGroupKey> {
        val (where, params) = baseWhereAndParams(
            corpsEtatId, type, fournId, fournNom, famille, categorie, unite, uniteAliasT, article, search
        )
        params.addValue("offset", offset)
        params.addValue("limit", limit)
        val typeCol = sqlTypeColumn("l")
        val query = """
            SELECT l.corps_etat_id, l.libelle, l.unite, $typeCol AS ligne_type
            FROM bareme_lignes_prix l
            INNER JOIN bareme_corps_etat c ON l.corps_etat_id = c.id
            LEFT JOIN bareme_fournisseurs f ON l.fournisseur_bareme_id = f.id
            WHERE $where
            GROUP BY l.corps_etat_id, c.ordre_affichage, l.libelle, l.unite, $typeCol
            ORDER BY c.ordre_affichage ASC, l.libelle ASC
            LIMIT :limit OFFSET :offset
        """.trimIndent()

        return jdbc.query(query, params) { rs, _ ->
            BaremeArticleGroupKey(
                corpsEtatId = rs.getLong("corps_etat_id"),
                libelle = rs.getString("libelle"),
                unite = rs.getString("unite"),
                type = TypeLigneBareme.valueOf(rs.getString("ligne_type"))
            )
        }
    }
}
