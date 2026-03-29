package com.mikaservices.platform.modules.bareme.repository

import com.mikaservices.platform.common.enums.TypeLigneBareme
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.Pageable
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository

/**
 * PostgreSQL : liste + facettes barème en SQL natif avec `LOWER(...::text)` pour éviter l’erreur
 * « la fonction lower(bytea) n'existe pas » si des colonnes sont encore BYTEA.
 */
@Repository
class BaremeLignePgNativeRepository(
    private val jdbc: NamedParameterJdbcTemplate,
    @Value("\${spring.datasource.url:}") private val jdbcUrl: String,
    @Value("\${DATABASE_URL:}") private val databaseUrl: String,
) {
    val isPostgres: Boolean
        get() =
            jdbcUrl.contains("postgresql", ignoreCase = true) ||
                databaseUrl.startsWith("postgresql://", ignoreCase = true) ||
                databaseUrl.startsWith("postgres://", ignoreCase = true) ||
                databaseUrl.contains("jdbc:postgresql", ignoreCase = true)

    private fun typeCol(): String = """l."type""""

    private fun unitLowerExpr(): String =
        "LOWER(COALESCE(l.unite::text, COALESCE(l.unite_prestation::text, '')))"

    private fun addCommonFilterParams(
        p: MapSqlParameterSource,
        corpsId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        uniteAliasT: Boolean,
        article: String?,
        search: String?,
    ) {
        p.addValue("corpsId", corpsId)
        p.addValue("typeEnum", type?.name)
        p.addValue("fournId", fournId)
        p.addValue("fournNom", fournNom)
        p.addValue("famille", famille)
        p.addValue("categorie", categorie)
        p.addValue("unite", unite?.trim())
        p.addValue("uniteAliasT", uniteAliasT)
        p.addValue("article", article)
        p.addValue("search", search?.trim())
    }

    /** Chaque occurrence de paramètre est typée avec `CAST(:x AS …)` pour l’inférence PostgreSQL. */
    private fun clauseCorpsTypeFourn(): String {
        val tc = typeCol()
        return """
            l.parent_id IS NULL
            AND (l.corps_etat_id = CAST(:corpsId AS bigint) OR CAST(:corpsId AS bigint) IS NULL)
            AND ($tc = CAST(:typeEnum AS varchar) OR CAST(:typeEnum AS varchar) IS NULL)
            AND (l.fournisseur_bareme_id = CAST(:fournId AS bigint) OR CAST(:fournId AS bigint) IS NULL)
        """.trimIndent().replace("\n", " ")
    }

    private fun clauseFournNom(): String =
        "AND (LOWER(COALESCE(fb.nom::text, '')) = LOWER(CAST(:fournNom AS text)) OR CAST(:fournNom AS text) IS NULL) "

    private fun clauseFamille(): String =
        "AND (LOWER(COALESCE(l.famille::text, '')) = LOWER(CAST(:famille AS text)) OR CAST(:famille AS text) IS NULL) "

    private fun clauseCategorie(): String =
        "AND (LOWER(COALESCE(l.categorie::text, '')) = LOWER(CAST(:categorie AS text)) OR CAST(:categorie AS text) IS NULL) "

    private fun clauseUnite(): String {
        val u = unitLowerExpr()
        return """
            AND (
              CAST(:unite AS text) IS NULL
              OR $u = LOWER(CAST(:unite AS text))
              OR (CAST(:uniteAliasT AS boolean) IS TRUE AND $u IN ('t', 'ton', 'tonne'))
            )
        """.trimIndent().replace("\n", " ")
    }

    private fun clauseArticle(): String =
        "AND (LOWER(COALESCE(l.libelle::text, COALESCE(l.reference::text, ''))) = " +
            "LOWER(CAST(:article AS text)) OR CAST(:article AS text) IS NULL) "

    private fun clauseSearch(): String =
        "AND (CAST(:search AS text) IS NULL OR CAST(:search AS text) = '' OR " +
            "LOWER(l.libelle::text) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))) "

    private fun fromJoin(): String =
        "FROM bareme_lignes_prix l INNER JOIN bareme_fournisseurs fb ON fb.id = l.fournisseur_bareme_id "

    fun countArticlesFiltered(
        corpsId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        uniteAliasT: Boolean,
        article: String?,
        search: String?,
    ): Long {
        val p = MapSqlParameterSource()
        addCommonFilterParams(p, corpsId, type, fournId, fournNom, famille, categorie, unite, uniteAliasT, article, search)
        val w = buildString {
            append(clauseCorpsTypeFourn())
            append(" ").append(clauseFournNom())
            append(clauseFamille())
            append(clauseCategorie())
            append(" ").append(clauseUnite())
            append(" ").append(clauseArticle())
            append(clauseSearch())
        }
        val sql = "SELECT COUNT(l.id) ${fromJoin()}WHERE $w"
        return jdbc.queryForObject(sql, p, Long::class.java) ?: 0L
    }

    fun findArticleIdsFiltered(
        corpsId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        uniteAliasT: Boolean,
        article: String?,
        search: String?,
        pageable: Pageable,
    ): List<Long> {
        val p = MapSqlParameterSource()
        addCommonFilterParams(p, corpsId, type, fournId, fournNom, famille, categorie, unite, uniteAliasT, article, search)
        p.addValue("limit", pageable.pageSize)
        p.addValue("offset", pageable.offset)
        val w = buildString {
            append(clauseCorpsTypeFourn())
            append(" ").append(clauseFournNom())
            append(clauseFamille())
            append(clauseCategorie())
            append(" ").append(clauseUnite())
            append(" ").append(clauseArticle())
            append(clauseSearch())
        }
        val order = pgOrderBy(pageable)
        val sql =
            "SELECT l.id ${fromJoin()}WHERE $w $order LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS bigint)"
        return jdbc.query(sql, p) { rs, _ -> rs.getLong(1) }
    }

    private fun pgOrderBy(pageable: Pageable): String {
        if (!pageable.sort.isSorted) {
            return "ORDER BY l.reference::text ASC NULLS LAST"
        }
        val parts = pageable.sort.map { o ->
            val col = when (o.property) {
                "reference" -> "l.reference::text"
                "libelle" -> "l.libelle::text"
                "famille" -> "l.famille::text"
                "categorie" -> "l.categorie::text"
                "updatedAt", "updated_at" -> "l.updated_at"
                "id" -> "l.id"
                else -> "l.reference::text"
            }
            "$col ${if (o.isAscending) "ASC" else "DESC"} NULLS LAST"
        }
        return "ORDER BY ${parts.joinToString(", ")}"
    }

    fun findDistinctCategories(
        corpsId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        famille: String?,
        unite: String?,
        uniteAliasT: Boolean,
        article: String?,
        search: String?,
    ): List<String> {
        val p = MapSqlParameterSource()
        addCommonFilterParams(p, corpsId, type, fournId, fournNom, famille, null, unite, uniteAliasT, article, search)
        val w = buildString {
            append(clauseCorpsTypeFourn())
            append(" ").append(clauseFournNom())
            append(clauseFamille())
            append(" ").append(clauseUnite())
            append(" ").append(clauseArticle())
            append(clauseSearch())
            append("AND l.categorie IS NOT NULL AND btrim(l.categorie::text) <> '' ")
        }
        val sql = "SELECT DISTINCT l.categorie::text AS v ${fromJoin()}WHERE $w ORDER BY 1"
        return jdbc.query(sql, p) { rs, _ -> rs.getString("v") }.filterNotNull()
    }

    fun findDistinctFamilles(
        corpsId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        categorie: String?,
        unite: String?,
        uniteAliasT: Boolean,
        article: String?,
        search: String?,
    ): List<String> {
        val p = MapSqlParameterSource()
        addCommonFilterParams(p, corpsId, type, fournId, fournNom, null, categorie, unite, uniteAliasT, article, search)
        val w = buildString {
            append(clauseCorpsTypeFourn())
            append(" ").append(clauseFournNom())
            append(clauseCategorie())
            append(" ").append(clauseUnite())
            append(" ").append(clauseArticle())
            append(clauseSearch())
            append("AND l.famille IS NOT NULL AND btrim(l.famille::text) <> '' ")
        }
        val sql = "SELECT DISTINCT l.famille::text AS v ${fromJoin()}WHERE $w ORDER BY 1"
        return jdbc.query(sql, p) { rs, _ -> rs.getString("v") }.filterNotNull()
    }

    fun findDistinctUnites(
        corpsId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        famille: String?,
        categorie: String?,
        article: String?,
        search: String?,
    ): List<String> {
        val p = MapSqlParameterSource()
        addCommonFilterParams(p, corpsId, type, fournId, fournNom, famille, categorie, null, false, article, search)
        val w = buildString {
            append(clauseCorpsTypeFourn())
            append(" ").append(clauseFournNom())
            append(clauseFamille())
            append(clauseCategorie())
            append(" ").append(clauseArticle())
            append(clauseSearch())
            append("AND COALESCE(l.unite::text, l.unite_prestation::text, '') <> '' ")
        }
        val sql =
            "SELECT DISTINCT COALESCE(l.unite::text, l.unite_prestation::text, '') AS v ${fromJoin()}WHERE $w ORDER BY 1"
        return jdbc.query(sql, p) { rs, _ -> rs.getString("v") }.filterNotNull()
    }

    fun findDistinctFournisseurNoms(
        corpsId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        uniteAliasT: Boolean,
        article: String?,
        search: String?,
    ): List<String> {
        val p = MapSqlParameterSource()
        addCommonFilterParams(p, corpsId, type, fournId, fournNom, famille, categorie, unite, uniteAliasT, article, search)
        val w = buildString {
            append(clauseCorpsTypeFourn())
            append(" ").append(clauseFournNom())
            append(clauseFamille())
            append(clauseCategorie())
            append(" ").append(clauseUnite())
            append(" ").append(clauseArticle())
            append(clauseSearch())
        }
        val sql = "SELECT DISTINCT fb.nom::text AS v ${fromJoin()}WHERE $w ORDER BY 1"
        return jdbc.query(sql, p) { rs, _ -> rs.getString("v") }.filterNotNull()
    }

    fun findDistinctArticleLibelles(
        corpsId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        uniteAliasT: Boolean,
        search: String?,
    ): List<String> {
        val p = MapSqlParameterSource()
        addCommonFilterParams(p, corpsId, type, fournId, fournNom, famille, categorie, unite, uniteAliasT, null, search)
        val w = buildString {
            append(clauseCorpsTypeFourn())
            append(" ").append(clauseFournNom())
            append(clauseFamille())
            append(clauseCategorie())
            append(" ").append(clauseUnite())
            append(clauseSearch())
            append("AND COALESCE(l.libelle::text, l.reference::text, '') <> '' ")
        }
        val sql =
            "SELECT DISTINCT COALESCE(l.libelle::text, l.reference::text, '') AS v ${fromJoin()}WHERE $w ORDER BY 1"
        return jdbc.query(sql, p) { rs, _ -> rs.getString("v") }.filterNotNull()
    }

    fun findDistinctDepots(
        corpsId: Long?,
        type: TypeLigneBareme?,
        fournId: Long?,
        fournNom: String?,
        famille: String?,
        categorie: String?,
        unite: String?,
        uniteAliasT: Boolean,
        article: String?,
        search: String?,
    ): List<String> {
        val p = MapSqlParameterSource()
        addCommonFilterParams(p, corpsId, type, fournId, fournNom, famille, categorie, unite, uniteAliasT, article, search)
        val w = buildString {
            append(clauseCorpsTypeFourn())
            append(" ").append(clauseFournNom())
            append(clauseFamille())
            append(clauseCategorie())
            append(" ").append(clauseUnite())
            append(" ").append(clauseArticle())
            append(clauseSearch())
            append("AND l.depot IS NOT NULL AND btrim(l.depot::text) <> '' ")
        }
        val sql = "SELECT DISTINCT l.depot::text AS v ${fromJoin()}WHERE $w ORDER BY 1"
        return jdbc.query(sql, p) { rs, _ -> rs.getString("v") }.filterNotNull()
    }
}
