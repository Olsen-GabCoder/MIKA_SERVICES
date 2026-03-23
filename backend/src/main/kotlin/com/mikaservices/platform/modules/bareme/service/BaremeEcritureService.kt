package com.mikaservices.platform.modules.bareme.service

import com.mikaservices.platform.common.enums.TypeLigneBareme
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.bareme.dto.request.BaremeArticleCreateRequest
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleDetailResponse
import com.mikaservices.platform.modules.bareme.entity.FournisseurBareme
import com.mikaservices.platform.modules.bareme.entity.LignePrixBareme
import com.mikaservices.platform.modules.bareme.repository.CorpsEtatBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.FournisseurBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.LignePrixBaremeRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BaremeEcritureService(
    private val corpsEtatBaremeRepository: CorpsEtatBaremeRepository,
    private val fournisseurBaremeRepository: FournisseurBaremeRepository,
    private val lignePrixBaremeRepository: LignePrixBaremeRepository,
    private val baremeLectureService: BaremeLectureService
) {
    @Transactional
    fun createArticle(request: BaremeArticleCreateRequest): BaremeArticleDetailResponse {
        val corpsEtat = corpsEtatBaremeRepository.findById(request.corpsEtatId!!)
            .orElseThrow { ResourceNotFoundException("Corps d'état introuvable: ${request.corpsEtatId}") }
        val type = request.type ?: throw BadRequestException("Le type est obligatoire.")
        if (type != TypeLigneBareme.MATERIAU && type != TypeLigneBareme.PRESTATION_ENTETE) {
            throw BadRequestException("Seuls MATERIAU et PRESTATION_ENTETE peuvent être créés via cet endpoint.")
        }

        val nextOrdre = lignePrixBaremeRepository.findMaxOrdreLigneByCorpsId(corpsEtat.id!!) + 1
        val libelle = request.libelle?.trim().orEmpty()
        if (libelle.isEmpty()) throw BadRequestException("Le libellé est obligatoire.")

        val base = LignePrixBareme(
            corpsEtat = corpsEtat,
            type = type,
            reference = request.reference?.trim()?.takeIf { it.isNotEmpty() }?.take(50),
            libelle = libelle,
            unite = request.unite?.trim()?.takeIf { it.isNotEmpty() }?.take(20),
            famille = request.famille?.trim()?.takeIf { it.isNotEmpty() }?.take(120),
            categorie = request.categorie?.trim()?.takeIf { it.isNotEmpty() }?.take(120),
            refReception = request.refReception?.trim()?.takeIf { it.isNotEmpty() }?.take(50),
            codeFournisseur = request.codeFournisseur?.trim()?.takeIf { it.isNotEmpty() }?.take(30),
            ordreLigne = nextOrdre,
            prixEstime = request.prixEstime
        )

        when (type) {
            TypeLigneBareme.MATERIAU -> {
                val fournisseur = resolveFournisseur(
                    fournisseurId = request.fournisseurId,
                    fournisseurNom = request.fournisseurNom,
                    fournisseurContact = request.fournisseurContact
                )
                base.fournisseurBareme = fournisseur
                base.contactTexte = (request.fournisseurContact ?: fournisseur.contact)?.trim()?.takeIf { it.isNotEmpty() }?.take(100)
                base.prixTtc = request.prixTtc
                base.datePrix = request.datePrix?.trim()?.takeIf { it.isNotEmpty() }?.take(50)
            }

            TypeLigneBareme.PRESTATION_ENTETE -> {
                if (request.debourse == null || request.prixVente == null) {
                    throw BadRequestException("Pour une prestation, debourse et prixVente sont obligatoires.")
                }
            }

            else -> Unit
        }

        val savedParent = lignePrixBaremeRepository.save(base)

        if (type == TypeLigneBareme.PRESTATION_ENTETE) {
            var childOrdre = 1
            for (ligne in request.lignesPrestation) {
                val l = LignePrixBareme(
                    corpsEtat = corpsEtat,
                    type = TypeLigneBareme.PRESTATION_LIGNE,
                    libelle = ligne.libelle?.trim()?.takeIf { it.isNotEmpty() }?.take(2000),
                    quantite = ligne.quantite,
                    prixUnitaire = ligne.prixUnitaire,
                    unitePrestation = ligne.unite?.trim()?.takeIf { it.isNotEmpty() }?.take(20),
                    somme = ligne.somme,
                    parent = savedParent,
                    ordreLigne = childOrdre++,
                    prixEstime = ligne.prixEstime
                )
                lignePrixBaremeRepository.save(l)
            }

            val total = LignePrixBareme(
                corpsEtat = corpsEtat,
                type = TypeLigneBareme.PRESTATION_TOTAL,
                libelle = "TOTAL",
                debourse = request.debourse,
                prixVente = request.prixVente,
                coefficientPv = request.coefficientPv,
                unitePrestation = request.unitePrestation?.trim()?.takeIf { it.isNotEmpty() }?.take(20),
                parent = savedParent,
                ordreLigne = childOrdre,
                prixEstime = request.totauxEstimes
            )
            lignePrixBaremeRepository.save(total)
        }

        return baremeLectureService.getArticleById(savedParent.id!!)
    }

    @Transactional
    fun updateArticle(id: Long, request: BaremeArticleCreateRequest): BaremeArticleDetailResponse {
        val existing = lignePrixBaremeRepository.findByIdWithCorpsEtatAndFournisseur(id)
            ?: throw ResourceNotFoundException("Article barème introuvable: $id")
        if (existing.parent != null) {
            throw BadRequestException("Seules les lignes racines (article matériau / entête prestation) peuvent être modifiées.")
        }
        val requestedType = request.type ?: existing.type
        if (requestedType != existing.type) {
            throw BadRequestException("Le type d'un article existant ne peut pas être modifié.")
        }

        val corpsEtat = request.corpsEtatId?.let {
            corpsEtatBaremeRepository.findById(it).orElseThrow { ResourceNotFoundException("Corps d'état introuvable: $it") }
        } ?: existing.corpsEtat

        val libelle = request.libelle?.trim().orEmpty()
        if (libelle.isEmpty()) throw BadRequestException("Le libellé est obligatoire.")

        existing.corpsEtat = corpsEtat
        existing.reference = request.reference?.trim()?.takeIf { it.isNotEmpty() }?.take(50)
        existing.libelle = libelle.take(2000)
        existing.unite = request.unite?.trim()?.takeIf { it.isNotEmpty() }?.take(20)
        existing.famille = request.famille?.trim()?.takeIf { it.isNotEmpty() }?.take(120)
        existing.categorie = request.categorie?.trim()?.takeIf { it.isNotEmpty() }?.take(120)
        existing.refReception = request.refReception?.trim()?.takeIf { it.isNotEmpty() }?.take(50)
        existing.codeFournisseur = request.codeFournisseur?.trim()?.takeIf { it.isNotEmpty() }?.take(30)

        when (existing.type) {
            TypeLigneBareme.MATERIAU -> {
                val fournisseur = resolveFournisseur(
                    fournisseurId = request.fournisseurId,
                    fournisseurNom = request.fournisseurNom,
                    fournisseurContact = request.fournisseurContact
                )
                existing.fournisseurBareme = fournisseur
                existing.contactTexte = (request.fournisseurContact ?: fournisseur.contact)?.trim()?.takeIf { it.isNotEmpty() }?.take(100)
                existing.prixTtc = request.prixTtc
                existing.datePrix = request.datePrix?.trim()?.takeIf { it.isNotEmpty() }?.take(50)
                existing.prixEstime = request.prixEstime
            }

            TypeLigneBareme.PRESTATION_ENTETE -> {
                if (request.debourse == null || request.prixVente == null) {
                    throw BadRequestException("Pour une prestation, debourse et prixVente sont obligatoires.")
                }
                lignePrixBaremeRepository.deleteByParentId(existing.id!!)
                var childOrdre = 1
                for (ligne in request.lignesPrestation) {
                    val l = LignePrixBareme(
                        corpsEtat = corpsEtat,
                        type = TypeLigneBareme.PRESTATION_LIGNE,
                        libelle = ligne.libelle?.trim()?.takeIf { it.isNotEmpty() }?.take(2000),
                        quantite = ligne.quantite,
                        prixUnitaire = ligne.prixUnitaire,
                        unitePrestation = ligne.unite?.trim()?.takeIf { it.isNotEmpty() }?.take(20),
                        somme = ligne.somme,
                        parent = existing,
                        ordreLigne = childOrdre++,
                        prixEstime = ligne.prixEstime
                    )
                    lignePrixBaremeRepository.save(l)
                }
                val total = LignePrixBareme(
                    corpsEtat = corpsEtat,
                    type = TypeLigneBareme.PRESTATION_TOTAL,
                    libelle = "TOTAL",
                    debourse = request.debourse,
                    prixVente = request.prixVente,
                    coefficientPv = request.coefficientPv,
                    unitePrestation = request.unitePrestation?.trim()?.takeIf { it.isNotEmpty() }?.take(20),
                    parent = existing,
                    ordreLigne = childOrdre,
                    prixEstime = request.totauxEstimes
                )
                lignePrixBaremeRepository.save(total)
            }

            else -> throw BadRequestException("Type non supporté pour la modification.")
        }

        lignePrixBaremeRepository.save(existing)
        return baremeLectureService.getArticleById(existing.id!!)
    }

    @Transactional
    fun deleteArticle(id: Long) {
        val existing = lignePrixBaremeRepository.findByIdWithCorpsEtatAndFournisseur(id)
            ?: throw ResourceNotFoundException("Article barème introuvable: $id")
        if (existing.parent != null) {
            throw BadRequestException("Supprimez uniquement des lignes racines.")
        }
        lignePrixBaremeRepository.deleteByParentId(existing.id!!)
        lignePrixBaremeRepository.delete(existing)
    }

    private fun resolveFournisseur(
        fournisseurId: Long?,
        fournisseurNom: String?,
        fournisseurContact: String?
    ): FournisseurBareme {
        if (fournisseurId != null) {
            return fournisseurBaremeRepository.findById(fournisseurId)
                .orElseThrow { ResourceNotFoundException("Fournisseur introuvable: $fournisseurId") }
        }
        val nom = fournisseurNom?.trim().orEmpty()
        if (nom.isEmpty()) {
            throw BadRequestException("Pour un matériau, fournissez fournisseurId ou fournisseurNom.")
        }
        val existing = fournisseurBaremeRepository.findByNomIgnoreCase(nom)
        if (existing != null) return existing
        return fournisseurBaremeRepository.save(
            FournisseurBareme(
                nom = nom.take(200),
                contact = fournisseurContact?.trim()?.takeIf { it.isNotEmpty() }?.take(100)
            )
        )
    }
}
