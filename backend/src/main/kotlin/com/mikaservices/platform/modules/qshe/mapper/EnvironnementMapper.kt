package com.mikaservices.platform.modules.qshe.mapper

import com.mikaservices.platform.modules.qshe.dto.response.DechetResponse
import com.mikaservices.platform.modules.qshe.dto.response.ProduitChimiqueResponse
import com.mikaservices.platform.modules.qshe.dto.response.SuiviEnvResponse
import com.mikaservices.platform.modules.qshe.entity.DechetRecord
import com.mikaservices.platform.modules.qshe.entity.ProduitChimique
import com.mikaservices.platform.modules.qshe.entity.SuiviEnvironnemental

object EnvironnementMapper {
    fun toSuiviResponse(e: SuiviEnvironnemental) = SuiviEnvResponse(
        id = e.id!!, projetId = e.projet.id!!, projetNom = e.projet.nom,
        typeMesure = e.typeMesure, parametre = e.parametre, valeur = e.valeur, unite = e.unite,
        limiteReglementaire = e.limiteReglementaire, dateMesure = e.dateMesure,
        localisation = e.localisation, observations = e.observations,
        conforme = e.conforme, depassement = e.depassement,
        createdAt = e.createdAt, updatedAt = e.updatedAt
    )

    fun toDechetResponse(e: DechetRecord) = DechetResponse(
        id = e.id!!, projetId = e.projet.id!!, projetNom = e.projet.nom,
        typeDechet = e.typeDechet, designation = e.designation, quantite = e.quantite, unite = e.unite,
        filiereElimination = e.filiereElimination, transporteur = e.transporteur,
        destination = e.destination, numeroBsd = e.numeroBsd, dateEnlevement = e.dateEnlevement,
        observations = e.observations, createdAt = e.createdAt, updatedAt = e.updatedAt
    )

    fun toProduitResponse(e: ProduitChimique) = ProduitChimiqueResponse(
        id = e.id!!, code = e.code, nomCommercial = e.nomCommercial, nomChimique = e.nomChimique,
        fournisseur = e.fournisseur, pictogrammesGhs = e.pictogrammesGhs,
        mentionsDanger = e.mentionsDanger, epiRequis = e.epiRequis,
        conditionsStockage = e.conditionsStockage, premiersSecours = e.premiersSecours,
        mesuresIncendie = e.mesuresIncendie, fdsUrl = e.fdsUrl, dateFds = e.dateFds,
        localisationStockage = e.localisationStockage, quantiteStock = e.quantiteStock,
        actif = e.actif, fdsObsolete = e.fdsObsolete,
        createdAt = e.createdAt, updatedAt = e.updatedAt
    )
}
