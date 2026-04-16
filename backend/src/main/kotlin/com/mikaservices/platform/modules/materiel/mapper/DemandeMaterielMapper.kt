package com.mikaservices.platform.modules.materiel.mapper

import com.mikaservices.platform.modules.materiel.dto.response.DemandeMaterielHistoriqueResponse
import com.mikaservices.platform.modules.materiel.dto.response.DemandeMaterielLigneResponse
import com.mikaservices.platform.modules.materiel.dto.response.DemandeMaterielResponse
import com.mikaservices.platform.modules.materiel.entity.DemandeMateriel
import com.mikaservices.platform.modules.materiel.entity.DemandeMaterielHistorique
import com.mikaservices.platform.modules.materiel.entity.DemandeMaterielLigne

object DemandeMaterielMapper {

    fun toLigneResponse(entity: DemandeMaterielLigne): DemandeMaterielLigneResponse =
        DemandeMaterielLigneResponse(
            id = entity.id!!,
            designation = entity.designation,
            materiauId = entity.materiau?.id,
            materiauCode = entity.materiau?.code,
            quantite = entity.quantite,
            unite = entity.unite,
            prixUnitaireEst = entity.prixUnitaireEst,
            fournisseurSuggere = entity.fournisseurSuggere,
        )

    fun toHistoriqueResponse(entity: DemandeMaterielHistorique): DemandeMaterielHistoriqueResponse {
        val u = entity.user
        return DemandeMaterielHistoriqueResponse(
            id = entity.id!!,
            deStatut = entity.deStatut,
            versStatut = entity.versStatut,
            userId = u.id!!,
            userNom = "${u.prenom} ${u.nom}".trim(),
            dateTransition = entity.dateTransition,
            commentaire = entity.commentaire,
        )
    }

    fun toResponse(entity: DemandeMateriel): DemandeMaterielResponse {
        val c = entity.createur
        val sortedLignes = entity.lignes.sortedBy { it.id }
        return DemandeMaterielResponse(
            id = entity.id!!,
            reference = entity.reference,
            projetId = entity.projet.id!!,
            projetNom = entity.projet.nom,
            createurUserId = c.id!!,
            createurNom = "${c.prenom} ${c.nom}".trim(),
            statut = entity.statut,
            priorite = entity.priorite,
            dateSouhaitee = entity.dateSouhaitee,
            commentaire = entity.commentaire,
            montantEstime = entity.montantEstime,
            commandeId = entity.commande?.id,
            commandeReference = entity.commande?.reference,
            lignes = sortedLignes.map { toLigneResponse(it) },
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt,
        )
    }
}
