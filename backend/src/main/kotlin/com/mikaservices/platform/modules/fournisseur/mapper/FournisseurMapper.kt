package com.mikaservices.platform.modules.fournisseur.mapper

import com.mikaservices.platform.modules.fournisseur.dto.response.CommandeResponse
import com.mikaservices.platform.modules.fournisseur.dto.response.FournisseurResponse
import com.mikaservices.platform.modules.fournisseur.entity.Commande
import com.mikaservices.platform.modules.fournisseur.entity.Fournisseur

object FournisseurMapper {
    fun toFournisseurResponse(e: Fournisseur): FournisseurResponse = FournisseurResponse(
        id = e.id!!, code = e.code, nom = e.nom, adresse = e.adresse,
        telephone = e.telephone, email = e.email, contactNom = e.contactNom,
        specialite = e.specialite, noteEvaluation = e.noteEvaluation, actif = e.actif,
        nbCommandes = e.commandes.size, createdAt = e.createdAt, updatedAt = e.updatedAt
    )

    fun toCommandeResponse(e: Commande): CommandeResponse = CommandeResponse(
        id = e.id!!, reference = e.reference, fournisseurId = e.fournisseur.id!!,
        fournisseurNom = e.fournisseur.nom, projetId = e.projet?.id,
        projetNom = e.projet?.nom, designation = e.designation,
        montantTotal = e.montantTotal, statut = e.statut,
        dateCommande = e.dateCommande, dateLivraisonPrevue = e.dateLivraisonPrevue,
        dateLivraisonEffective = e.dateLivraisonEffective, notes = e.notes,
        createdAt = e.createdAt, updatedAt = e.updatedAt
    )
}
