package com.mikaservices.platform.modules.bareme.repository

import com.mikaservices.platform.modules.bareme.entity.LignePrixBareme
import com.mikaservices.platform.common.enums.TypeLigneBareme
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface LignePrixBaremeRepository : JpaRepository<LignePrixBareme, Long> {

    @Query("SELECT l FROM LignePrixBareme l LEFT JOIN FETCH l.corpsEtat LEFT JOIN FETCH l.fournisseurBareme WHERE l.id = :id")
    fun findByIdWithCorpsEtatAndFournisseur(@Param("id") id: Long): LignePrixBareme?

    fun findByCorpsEtatIdOrderByOrdreLigneAscNumeroLigneExcelAsc(corpsEtatId: Long, pageable: Pageable): Page<LignePrixBareme>

    fun findByCorpsEtatId(corpsEtatId: Long): List<LignePrixBareme>

    fun findByParentIdOrderByOrdreLigneAsc(parentId: Long): List<LignePrixBareme>
    fun deleteByParentId(parentId: Long): Long

    @Query("SELECT COALESCE(MAX(l.ordreLigne), 0) FROM LignePrixBareme l WHERE l.corpsEtat.id = :corpsId AND l.parent IS NULL")
    fun findMaxOrdreLigneByCorpsId(@Param("corpsId") corpsId: Long): Int

    fun findByParentIsNullAndCorpsEtatIdAndType(corpsEtatId: Long, type: TypeLigneBareme, pageable: Pageable): Page<LignePrixBareme>

    fun findByCorpsEtatIdAndTypeAndParentIsNull(corpsEtatId: Long, type: TypeLigneBareme, pageable: Pageable): Page<LignePrixBareme>

    /** Références pour reprise de séquence MAT-YYYY-NNNNN (pattern type [MAT-2025-%]). */
    @Query("SELECT l.reference FROM LignePrixBareme l WHERE l.reference IS NOT NULL AND l.reference LIKE :pattern")
    fun findReferencesStartingWith(@Param("pattern") pattern: String): List<String>

    /**
     * Liste paginée sans FETCH / EntityGraph : compatibilité PostgreSQL (count + données).
     * [org.hibernate.annotations.BatchSize] sur l'entité limite le N+1 sur corpsEtat / fournisseurBareme.
     */
    @Query("""
        SELECT l FROM LignePrixBareme l
        WHERE l.parent IS NULL
        AND (:corpsId IS NULL OR l.corpsEtat.id = :corpsId)
        AND (:type IS NULL OR l.type = :type)
        AND (:fournId IS NULL OR l.fournisseurBareme.id = :fournId)
        AND (:fournNom IS NULL OR LOWER(COALESCE(l.fournisseurBareme.nom, '')) = LOWER(:fournNom))
        AND (:famille IS NULL OR LOWER(COALESCE(l.famille, '')) = LOWER(:famille))
        AND (:categorie IS NULL OR LOWER(COALESCE(l.categorie, '')) = LOWER(:categorie))
        AND (
            :unite IS NULL
            OR LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) = LOWER(:unite)
            OR (:uniteAliasT = true AND LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) IN ('t', 'ton', 'tonne'))
        )
        AND (:article IS NULL OR LOWER(COALESCE(l.libelle, COALESCE(l.reference, ''))) = LOWER(:article))
        AND (:search IS NULL OR :search = '' OR LOWER(l.libelle) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    fun findArticlesFiltered(
        @Param("corpsId") corpsId: Long?,
        @Param("type") type: TypeLigneBareme?,
        @Param("fournId") fournId: Long?,
        @Param("fournNom") fournNom: String?,
        @Param("famille") famille: String?,
        @Param("categorie") categorie: String?,
        @Param("unite") unite: String?,
        @Param("uniteAliasT") uniteAliasT: Boolean,
        @Param("article") article: String?,
        @Param("search") search: String?,
        pageable: Pageable
    ): Page<LignePrixBareme>

    /** Toutes les lignes racine d’un même « article » comparaison (inclut toutes les lignes matériau / fournisseurs). */
    @Query(
        """
        SELECT l FROM LignePrixBareme l
        LEFT JOIN FETCH l.corpsEtat
        LEFT JOIN FETCH l.fournisseurBareme
        WHERE l.parent IS NULL
        AND l.corpsEtat.id = :corpsId
        AND COALESCE(l.libelle, '') = COALESCE(:libelle, '')
        AND COALESCE(l.unite, '') = COALESCE(:unite, '')
        AND l.type = :type
        """
    )
    fun findLinesForArticleGroup(
        @Param("corpsId") corpsId: Long,
        @Param("libelle") libelle: String?,
        @Param("unite") unite: String?,
        @Param("type") type: TypeLigneBareme
    ): List<LignePrixBareme>

    @Query("SELECT MAX(l.updatedAt) FROM LignePrixBareme l")
    fun findLastUpdatedAt(): LocalDateTime?

    /** Facettes catégorie : mêmes filtres que la liste sauf [categorie]. */
    @Query(
        """
        SELECT DISTINCT l.categorie FROM LignePrixBareme l
        WHERE l.parent IS NULL
        AND (:corpsId IS NULL OR l.corpsEtat.id = :corpsId)
        AND (:type IS NULL OR l.type = :type)
        AND (:fournId IS NULL OR l.fournisseurBareme.id = :fournId)
        AND (:fournNom IS NULL OR LOWER(COALESCE(l.fournisseurBareme.nom, '')) = LOWER(:fournNom))
        AND (:famille IS NULL OR LOWER(COALESCE(l.famille, '')) = LOWER(:famille))
        AND (
            :unite IS NULL
            OR LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) = LOWER(:unite)
            OR (:uniteAliasT = true AND LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) IN ('t', 'ton', 'tonne'))
        )
        AND (:article IS NULL OR LOWER(COALESCE(l.libelle, COALESCE(l.reference, ''))) = LOWER(:article))
        AND (:search IS NULL OR :search = '' OR LOWER(l.libelle) LIKE LOWER(CONCAT('%', :search, '%')))
        AND l.categorie IS NOT NULL AND l.categorie <> ''
        """
    )
    fun findDistinctCategories(
        @Param("corpsId") corpsId: Long?,
        @Param("type") type: TypeLigneBareme?,
        @Param("fournId") fournId: Long?,
        @Param("fournNom") fournNom: String?,
        @Param("famille") famille: String?,
        @Param("unite") unite: String?,
        @Param("uniteAliasT") uniteAliasT: Boolean,
        @Param("article") article: String?,
        @Param("search") search: String?
    ): List<String>

    /** Facettes famille : mêmes filtres sauf [famille]. */
    @Query(
        """
        SELECT DISTINCT l.famille FROM LignePrixBareme l
        WHERE l.parent IS NULL
        AND (:corpsId IS NULL OR l.corpsEtat.id = :corpsId)
        AND (:type IS NULL OR l.type = :type)
        AND (:fournId IS NULL OR l.fournisseurBareme.id = :fournId)
        AND (:fournNom IS NULL OR LOWER(COALESCE(l.fournisseurBareme.nom, '')) = LOWER(:fournNom))
        AND (:categorie IS NULL OR LOWER(COALESCE(l.categorie, '')) = LOWER(:categorie))
        AND (
            :unite IS NULL
            OR LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) = LOWER(:unite)
            OR (:uniteAliasT = true AND LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) IN ('t', 'ton', 'tonne'))
        )
        AND (:article IS NULL OR LOWER(COALESCE(l.libelle, COALESCE(l.reference, ''))) = LOWER(:article))
        AND (:search IS NULL OR :search = '' OR LOWER(l.libelle) LIKE LOWER(CONCAT('%', :search, '%')))
        AND l.famille IS NOT NULL AND l.famille <> ''
        """
    )
    fun findDistinctFamilles(
        @Param("corpsId") corpsId: Long?,
        @Param("type") type: TypeLigneBareme?,
        @Param("fournId") fournId: Long?,
        @Param("fournNom") fournNom: String?,
        @Param("categorie") categorie: String?,
        @Param("unite") unite: String?,
        @Param("uniteAliasT") uniteAliasT: Boolean,
        @Param("article") article: String?,
        @Param("search") search: String?
    ): List<String>

    /** Facettes unité : mêmes filtres sauf [unite]. */
    @Query(
        """
        SELECT DISTINCT COALESCE(l.unite, l.unitePrestation, '') FROM LignePrixBareme l
        WHERE l.parent IS NULL
        AND (:corpsId IS NULL OR l.corpsEtat.id = :corpsId)
        AND (:type IS NULL OR l.type = :type)
        AND (:fournId IS NULL OR l.fournisseurBareme.id = :fournId)
        AND (:fournNom IS NULL OR LOWER(COALESCE(l.fournisseurBareme.nom, '')) = LOWER(:fournNom))
        AND (:famille IS NULL OR LOWER(COALESCE(l.famille, '')) = LOWER(:famille))
        AND (:categorie IS NULL OR LOWER(COALESCE(l.categorie, '')) = LOWER(:categorie))
        AND (:article IS NULL OR LOWER(COALESCE(l.libelle, COALESCE(l.reference, ''))) = LOWER(:article))
        AND (:search IS NULL OR :search = '' OR LOWER(l.libelle) LIKE LOWER(CONCAT('%', :search, '%')))
        AND COALESCE(l.unite, l.unitePrestation, '') <> ''
        """
    )
    fun findDistinctUnites(
        @Param("corpsId") corpsId: Long?,
        @Param("type") type: TypeLigneBareme?,
        @Param("fournId") fournId: Long?,
        @Param("fournNom") fournNom: String?,
        @Param("famille") famille: String?,
        @Param("categorie") categorie: String?,
        @Param("article") article: String?,
        @Param("search") search: String?
    ): List<String>

    /** Noms de fournisseurs distincts (lignes avec fournisseur), tous filtres appliqués. */
    @Query(
        """
        SELECT DISTINCT f.nom FROM LignePrixBareme l
        JOIN l.fournisseurBareme f
        WHERE l.parent IS NULL
        AND (:corpsId IS NULL OR l.corpsEtat.id = :corpsId)
        AND (:type IS NULL OR l.type = :type)
        AND (:fournId IS NULL OR l.fournisseurBareme.id = :fournId)
        AND (:fournNom IS NULL OR LOWER(COALESCE(l.fournisseurBareme.nom, '')) = LOWER(:fournNom))
        AND (:famille IS NULL OR LOWER(COALESCE(l.famille, '')) = LOWER(:famille))
        AND (:categorie IS NULL OR LOWER(COALESCE(l.categorie, '')) = LOWER(:categorie))
        AND (
            :unite IS NULL
            OR LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) = LOWER(:unite)
            OR (:uniteAliasT = true AND LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) IN ('t', 'ton', 'tonne'))
        )
        AND (:article IS NULL OR LOWER(COALESCE(l.libelle, COALESCE(l.reference, ''))) = LOWER(:article))
        AND (:search IS NULL OR :search = '' OR LOWER(l.libelle) LIKE LOWER(CONCAT('%', :search, '%')))
        """
    )
    fun findDistinctFournisseurNoms(
        @Param("corpsId") corpsId: Long?,
        @Param("type") type: TypeLigneBareme?,
        @Param("fournId") fournId: Long?,
        @Param("fournNom") fournNom: String?,
        @Param("famille") famille: String?,
        @Param("categorie") categorie: String?,
        @Param("unite") unite: String?,
        @Param("uniteAliasT") uniteAliasT: Boolean,
        @Param("article") article: String?,
        @Param("search") search: String?
    ): List<String>

    /** Libellés / références distincts pour filtre « article canonique » (tous filtres API appliqués). */
    @Query(
        """
        SELECT DISTINCT COALESCE(l.libelle, l.reference, '') FROM LignePrixBareme l
        WHERE l.parent IS NULL
        AND (:corpsId IS NULL OR l.corpsEtat.id = :corpsId)
        AND (:type IS NULL OR l.type = :type)
        AND (:fournId IS NULL OR l.fournisseurBareme.id = :fournId)
        AND (:fournNom IS NULL OR LOWER(COALESCE(l.fournisseurBareme.nom, '')) = LOWER(:fournNom))
        AND (:famille IS NULL OR LOWER(COALESCE(l.famille, '')) = LOWER(:famille))
        AND (:categorie IS NULL OR LOWER(COALESCE(l.categorie, '')) = LOWER(:categorie))
        AND (
            :unite IS NULL
            OR LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) = LOWER(:unite)
            OR (:uniteAliasT = true AND LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) IN ('t', 'ton', 'tonne'))
        )
        AND (:search IS NULL OR :search = '' OR LOWER(l.libelle) LIKE LOWER(CONCAT('%', :search, '%')))
        AND COALESCE(l.libelle, l.reference, '') <> ''
        """
    )
    fun findDistinctArticleLibelles(
        @Param("corpsId") corpsId: Long?,
        @Param("type") type: TypeLigneBareme?,
        @Param("fournId") fournId: Long?,
        @Param("fournNom") fournNom: String?,
        @Param("famille") famille: String?,
        @Param("categorie") categorie: String?,
        @Param("unite") unite: String?,
        @Param("uniteAliasT") uniteAliasT: Boolean,
        @Param("search") search: String?
    ): List<String>

    /** Dépôts distincts (facettes), mêmes filtres que les catégories. */
    @Query(
        """
        SELECT DISTINCT l.depot FROM LignePrixBareme l
        WHERE l.parent IS NULL
        AND (:corpsId IS NULL OR l.corpsEtat.id = :corpsId)
        AND (:type IS NULL OR l.type = :type)
        AND (:fournId IS NULL OR l.fournisseurBareme.id = :fournId)
        AND (:fournNom IS NULL OR LOWER(COALESCE(l.fournisseurBareme.nom, '')) = LOWER(:fournNom))
        AND (:famille IS NULL OR LOWER(COALESCE(l.famille, '')) = LOWER(:famille))
        AND (:categorie IS NULL OR LOWER(COALESCE(l.categorie, '')) = LOWER(:categorie))
        AND (
            :unite IS NULL
            OR LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) = LOWER(:unite)
            OR (:uniteAliasT = true AND LOWER(COALESCE(l.unite, COALESCE(l.unitePrestation, ''))) IN ('t', 'ton', 'tonne'))
        )
        AND (:article IS NULL OR LOWER(COALESCE(l.libelle, COALESCE(l.reference, ''))) = LOWER(:article))
        AND (:search IS NULL OR :search = '' OR LOWER(l.libelle) LIKE LOWER(CONCAT('%', :search, '%')))
        AND l.depot IS NOT NULL AND l.depot <> ''
        """
    )
    fun findDistinctDepots(
        @Param("corpsId") corpsId: Long?,
        @Param("type") type: TypeLigneBareme?,
        @Param("fournId") fournId: Long?,
        @Param("fournNom") fournNom: String?,
        @Param("famille") famille: String?,
        @Param("categorie") categorie: String?,
        @Param("unite") unite: String?,
        @Param("uniteAliasT") uniteAliasT: Boolean,
        @Param("article") article: String?,
        @Param("search") search: String?
    ): List<String>
}
