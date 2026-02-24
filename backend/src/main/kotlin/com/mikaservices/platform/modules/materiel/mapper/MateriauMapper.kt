package com.mikaservices.platform.modules.materiel.mapper

import com.mikaservices.platform.modules.materiel.dto.response.AffectationMateriauResponse
import com.mikaservices.platform.modules.materiel.dto.response.MateriauResponse
import com.mikaservices.platform.modules.materiel.dto.response.MateriauSummaryResponse
import com.mikaservices.platform.modules.materiel.entity.AffectationMateriauChantier
import com.mikaservices.platform.modules.materiel.entity.Materiau

object MateriauMapper {

    fun toResponse(entity: Materiau): MateriauResponse = MateriauResponse(
        id = entity.id!!, code = entity.code, nom = entity.nom, type = entity.type,
        unite = entity.unite, description = entity.description,
        prixUnitaire = entity.prixUnitaire, stockActuel = entity.stockActuel,
        stockMinimum = entity.stockMinimum, stockBas = entity.isStockBas(),
        fournisseur = entity.fournisseur, actif = entity.actif,
        createdAt = entity.createdAt, updatedAt = entity.updatedAt
    )

    fun toSummaryResponse(entity: Materiau): MateriauSummaryResponse = MateriauSummaryResponse(
        id = entity.id!!, code = entity.code, nom = entity.nom, type = entity.type,
        unite = entity.unite, stockActuel = entity.stockActuel,
        stockMinimum = entity.stockMinimum, stockBas = entity.isStockBas(),
        fournisseur = entity.fournisseur
    )

    fun toAffectationResponse(entity: AffectationMateriauChantier): AffectationMateriauResponse = AffectationMateriauResponse(
        id = entity.id!!, projetId = entity.projet.id!!, projetNom = entity.projet.nom,
        materiauId = entity.materiau.id!!, materiauNom = entity.materiau.nom,
        materiauCode = entity.materiau.code, quantiteAffectee = entity.quantiteAffectee,
        unite = entity.unite, dateAffectation = entity.dateAffectation,
        observations = entity.observations, createdAt = entity.createdAt
    )
}
