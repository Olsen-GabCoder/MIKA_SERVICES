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

    fun findByParentIsNullAndCorpsEtatIdAndType(corpsEtatId: Long, type: TypeLigneBareme, pageable: Pageable): Page<LignePrixBareme>

    fun findByCorpsEtatIdAndTypeAndParentIsNull(corpsEtatId: Long, type: TypeLigneBareme, pageable: Pageable): Page<LignePrixBareme>

    @Query("""
        SELECT l FROM LignePrixBareme l
        LEFT JOIN FETCH l.corpsEtat
        LEFT JOIN FETCH l.fournisseurBareme
        WHERE l.parent IS NULL
        AND (:corpsId IS NULL OR l.corpsEtat.id = :corpsId)
        AND (:type IS NULL OR l.type = :type)
        AND (:fournId IS NULL OR l.fournisseurBareme.id = :fournId)
        AND (:search IS NULL OR :search = '' OR LOWER(l.libelle) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    fun findArticlesFiltered(
        @Param("corpsId") corpsId: Long?,
        @Param("type") type: TypeLigneBareme?,
        @Param("fournId") fournId: Long?,
        @Param("search") search: String?,
        pageable: Pageable
    ): Page<LignePrixBareme>

    @Query("""
        SELECT l FROM LignePrixBareme l
        LEFT JOIN FETCH l.fournisseurBareme
        WHERE l.corpsEtat.id = :corpsId AND l.type = :type
        AND (COALESCE(l.libelle, '') = COALESCE(:libelle, ''))
        AND (COALESCE(l.unite, '') = COALESCE(:unite, ''))
    """)
    fun findSameArticle(
        @Param("corpsId") corpsId: Long,
        @Param("libelle") libelle: String?,
        @Param("unite") unite: String?,
        @Param("type") type: TypeLigneBareme
    ): List<LignePrixBareme>

    @Query("SELECT MAX(l.updatedAt) FROM LignePrixBareme l")
    fun findLastUpdatedAt(): LocalDateTime?
}
