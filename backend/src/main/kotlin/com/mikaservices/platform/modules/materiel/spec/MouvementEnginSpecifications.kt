package com.mikaservices.platform.modules.materiel.spec

import com.mikaservices.platform.common.enums.StatutMouvementEngin
import com.mikaservices.platform.modules.materiel.entity.Engin
import com.mikaservices.platform.modules.materiel.entity.MouvementEngin
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.criteria.JoinType
import jakarta.persistence.criteria.Predicate
import org.springframework.data.jpa.domain.Specification
import java.time.LocalDateTime

object MouvementEnginSpecifications {

    fun withFilters(
        statut: StatutMouvementEngin?,
        enginId: Long?,
        projetId: Long?,
        dateFrom: LocalDateTime?,
        dateTo: LocalDateTime?,
    ): Specification<MouvementEngin> {
        return Specification { root, _, cb ->
            val preds = mutableListOf<Predicate>()
            statut?.let { preds.add(cb.equal(root.get<StatutMouvementEngin>("statut"), it)) }
            enginId?.let {
                preds.add(cb.equal(root.get<Engin>("engin").get<Long>("id"), it))
            }
            projetId?.let { pid ->
                val dest = root.get<Projet>("projetDestination")
                val orig = root.get<Projet>("projetOrigine")
                preds.add(
                    cb.or(
                        cb.equal(dest.get<Long>("id"), pid),
                        cb.equal(orig.get<Long>("id"), pid)
                    )
                )
            }
            dateFrom?.let { preds.add(cb.greaterThanOrEqualTo(root.get("dateDemande"), it)) }
            dateTo?.let { preds.add(cb.lessThanOrEqualTo(root.get("dateDemande"), it)) }
            if (preds.isEmpty()) cb.conjunction() else cb.and(*preds.toTypedArray())
        }
    }

    /**
     * Périmètre de visibilité des non-admin/logistique : transferts dont l'origine OU la
     * destination est un projet affecté EN_COURS de l'utilisateur, plus ceux qu'il a initiés.
     * LEFT JOIN sur l'origine (nullable : départ depuis dépôt).
     */
    fun visiblePar(projetIds: Collection<Long>, userId: Long): Specification<MouvementEngin> {
        return Specification { root, _, cb ->
            val preds = mutableListOf<Predicate>(
                cb.equal(root.get<User>("initiateur").get<Long>("id"), userId)
            )
            if (projetIds.isNotEmpty()) {
                preds.add(root.get<Projet>("projetDestination").get<Long>("id").`in`(projetIds))
                val origine = root.join<MouvementEngin, Projet>("projetOrigine", JoinType.LEFT)
                preds.add(origine.get<Long>("id").`in`(projetIds))
            }
            cb.or(*preds.toTypedArray())
        }
    }
}
