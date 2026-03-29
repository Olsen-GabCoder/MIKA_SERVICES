package com.mikaservices.platform.modules.bareme.service

import com.mikaservices.platform.common.enums.TypeLigneBareme
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.bareme.dto.request.BaremeArticleCreateRequest
import com.mikaservices.platform.modules.bareme.dto.request.BaremeMateriauOffreRequest
import com.mikaservices.platform.modules.bareme.dto.response.BaremeArticleDetailResponse
import com.mikaservices.platform.modules.bareme.entity.CorpsEtatBareme
import com.mikaservices.platform.modules.bareme.entity.FournisseurBareme
import com.mikaservices.platform.modules.bareme.entity.LignePrixBareme
import com.mikaservices.platform.modules.bareme.repository.CorpsEtatBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.FournisseurBaremeRepository
import com.mikaservices.platform.modules.bareme.repository.LignePrixBaremeRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Service
class BaremeEcritureService(
    private val corpsEtatBaremeRepository: CorpsEtatBaremeRepository,
    private val fournisseurBaremeRepository: FournisseurBaremeRepository,
    private val lignePrixBaremeRepository: LignePrixBaremeRepository,
    private val baremeLectureService: BaremeLectureService,
    private val baremeMatReferenceService: BaremeMatReferenceService
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

        if (type == TypeLigneBareme.MATERIAU) {
            if (!request.offresMateriau.isNullOrEmpty()) {
                validateMateriauCommonIdentity(request)
                validateMateriauOffres(request.offresMateriau)
                return createMateriauWithOffres(request, corpsEtat)
            }
            validateMateriauPayload(request)
        }

        val referenceInit = when (type) {
            TypeLigneBareme.MATERIAU -> baremeMatReferenceService.nextMatReference()
            else -> request.reference?.trim()?.takeIf { it.isNotEmpty() }?.take(50)
        }

        val base = LignePrixBareme(
            corpsEtat = corpsEtat,
            type = type,
            reference = referenceInit,
            libelle = libelle,
            unite = request.unite?.trim()?.takeIf { it.isNotEmpty() }?.take(20),
            famille = request.famille?.trim()?.takeIf { it.isNotEmpty() }?.take(120),
            categorie = request.categorie?.trim()?.takeIf { it.isNotEmpty() }?.take(120),
            depot = if (type == TypeLigneBareme.MATERIAU) {
                request.depot?.trim()?.takeIf { it.isNotEmpty() }?.take(20)
            } else {
                null
            },
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

    private fun createMateriauWithOffres(
        request: BaremeArticleCreateRequest,
        corpsEtat: CorpsEtatBareme
    ): BaremeArticleDetailResponse {
        val libelle = request.libelle!!.trim().take(2000)
        val unite = request.unite!!.trim().take(20)
        val famille = request.famille!!.trim().take(120)
        val categorie = request.categorie!!.trim().take(120)
        val depot = request.depot?.trim()?.takeIf { it.isNotEmpty() }?.take(20)
        val refReception = request.refReception?.trim()?.takeIf { it.isNotEmpty() }?.take(50)
        val codeFournisseur = request.codeFournisseur?.trim()?.takeIf { it.isNotEmpty() }?.take(30)
        val defaultDate = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
        var ordreLigne = lignePrixBaremeRepository.findMaxOrdreLigneByCorpsId(corpsEtat.id!!)
        val savedIds = mutableListOf<Long>()
        val offres = request.offresMateriau!!
        for (offre in offres) {
            ordreLigne += 1
            val fournisseur = resolveFournisseur(offre.fournisseurId, offre.fournisseurNom, offre.fournisseurContact)
            val line = LignePrixBareme(
                corpsEtat = corpsEtat,
                type = TypeLigneBareme.MATERIAU,
                reference = baremeMatReferenceService.nextMatReference(),
                libelle = libelle,
                unite = unite,
                prixTtc = offre.prixTtc,
                datePrix = offre.datePrix?.trim()?.takeIf { it.isNotEmpty() } ?: defaultDate,
                fournisseurBareme = fournisseur,
                contactTexte = (offre.fournisseurContact ?: fournisseur.contact)?.trim()?.takeIf { it.isNotEmpty() }?.take(100) ?: "—",
                famille = famille,
                categorie = categorie,
                depot = depot,
                refReception = refReception,
                codeFournisseur = codeFournisseur,
                ordreLigne = ordreLigne,
                prixEstime = offre.prixEstime
            )
            lignePrixBaremeRepository.save(line)
            savedIds.add(line.id!!)
        }
        val returnId = savedIds.minOrNull()!!
        return baremeLectureService.getArticleById(returnId)
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

        if (existing.type == TypeLigneBareme.MATERIAU) {
            val offres = request.offresMateriau
            if (!offres.isNullOrEmpty()) {
                val libelleCheck = request.libelle?.trim().orEmpty()
                if (libelleCheck.isEmpty()) throw BadRequestException("Le libellé est obligatoire.")
                validateMateriauCommonIdentity(request)
                validateMateriauOffres(offres)
                return updateMateriauGroup(id, request, offres)
            }
            validateMateriauPayload(request)
        }

        val corpsEtat = request.corpsEtatId?.let {
            corpsEtatBaremeRepository.findById(it).orElseThrow { ResourceNotFoundException("Corps d'état introuvable: $it") }
        } ?: existing.corpsEtat

        val libelle = request.libelle?.trim().orEmpty()
        if (libelle.isEmpty()) throw BadRequestException("Le libellé est obligatoire.")

        existing.corpsEtat = corpsEtat
        if (existing.type != TypeLigneBareme.MATERIAU) {
            existing.reference = request.reference?.trim()?.takeIf { it.isNotEmpty() }?.take(50)
        }
        existing.libelle = libelle.take(2000)
        existing.unite = request.unite?.trim()?.takeIf { it.isNotEmpty() }?.take(20)
        existing.famille = request.famille?.trim()?.takeIf { it.isNotEmpty() }?.take(120)
        existing.categorie = request.categorie?.trim()?.takeIf { it.isNotEmpty() }?.take(120)
        if (existing.type == TypeLigneBareme.MATERIAU) {
            existing.depot = request.depot?.trim()?.takeIf { it.isNotEmpty() }?.take(20)
        }
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

    private fun updateMateriauGroup(
        anchorId: Long,
        request: BaremeArticleCreateRequest,
        offres: List<BaremeMateriauOffreRequest>
    ): BaremeArticleDetailResponse {
        val existing = lignePrixBaremeRepository.findByIdWithCorpsEtatAndFournisseur(anchorId)
            ?: throw ResourceNotFoundException("Article barème introuvable: $anchorId")
        val corpsEtat = request.corpsEtatId?.let {
            corpsEtatBaremeRepository.findById(it).orElseThrow { ResourceNotFoundException("Corps d'état introuvable: $it") }
        } ?: existing.corpsEtat

        val libelle = request.libelle!!.trim().take(2000)
        val unite = request.unite!!.trim().take(20)
        val famille = request.famille!!.trim().take(120)
        val categorie = request.categorie!!.trim().take(120)
        val depot = request.depot?.trim()?.takeIf { it.isNotEmpty() }?.take(20)
        val refReception = request.refReception?.trim()?.takeIf { it.isNotEmpty() }?.take(50)
        val codeFournisseur = request.codeFournisseur?.trim()?.takeIf { it.isNotEmpty() }?.take(30)

        val groupe = lignePrixBaremeRepository.findLinesForArticleGroup(
            corpsId = existing.corpsEtat.id!!,
            libelle = existing.libelle,
            unite = existing.unite,
            type = TypeLigneBareme.MATERIAU
        )
        if (groupe.none { it.id == anchorId }) {
            throw BadRequestException("La ligne d'ancrage n'appartient pas au groupe article attendu.")
        }

        val remaining = offres.toMutableList()
        val toUpdate = mutableListOf<Pair<LignePrixBareme, BaremeMateriauOffreRequest>>()
        val toDelete = mutableListOf<LignePrixBareme>()
        for (line in groupe.sortedBy { it.id }) {
            val idx = remaining.indexOfFirst { offreMatches(it, line) }
            if (idx >= 0) {
                toUpdate.add(line to remaining.removeAt(idx))
            } else {
                toDelete.add(line)
            }
        }

        val defaultDate = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

        for ((line, offre) in toUpdate) {
            val fournisseur = resolveFournisseur(offre.fournisseurId, offre.fournisseurNom, offre.fournisseurContact)
            line.corpsEtat = corpsEtat
            line.libelle = libelle
            line.unite = unite
            line.famille = famille
            line.categorie = categorie
            line.depot = depot
            line.refReception = refReception
            line.codeFournisseur = codeFournisseur
            line.fournisseurBareme = fournisseur
            line.contactTexte = (offre.fournisseurContact ?: fournisseur.contact)?.trim()?.takeIf { it.isNotEmpty() }?.take(100) ?: "—"
            line.prixTtc = offre.prixTtc
            line.datePrix = offre.datePrix?.trim()?.takeIf { it.isNotEmpty() } ?: defaultDate
            line.prixEstime = offre.prixEstime
            lignePrixBaremeRepository.save(line)
        }

        var nextOrdre = lignePrixBaremeRepository.findMaxOrdreLigneByCorpsId(corpsEtat.id!!)
        for (offre in remaining) {
            nextOrdre += 1
            val fournisseur = resolveFournisseur(offre.fournisseurId, offre.fournisseurNom, offre.fournisseurContact)
            val newLine = LignePrixBareme(
                corpsEtat = corpsEtat,
                type = TypeLigneBareme.MATERIAU,
                reference = baremeMatReferenceService.nextMatReference(),
                libelle = libelle,
                unite = unite,
                prixTtc = offre.prixTtc,
                datePrix = offre.datePrix?.trim()?.takeIf { it.isNotEmpty() } ?: defaultDate,
                fournisseurBareme = fournisseur,
                contactTexte = (offre.fournisseurContact ?: fournisseur.contact)?.trim()?.takeIf { it.isNotEmpty() }?.take(100) ?: "—",
                famille = famille,
                categorie = categorie,
                depot = depot,
                refReception = refReception,
                codeFournisseur = codeFournisseur,
                ordreLigne = nextOrdre,
                prixEstime = offre.prixEstime,
            )
            lignePrixBaremeRepository.save(newLine)
        }

        for (line in toDelete) {
            lignePrixBaremeRepository.delete(line)
        }

        val finalGroup = lignePrixBaremeRepository.findLinesForArticleGroup(
            corpsId = corpsEtat.id!!,
            libelle = libelle,
            unite = unite,
            type = TypeLigneBareme.MATERIAU
        )
        val returnId = finalGroup.minOfOrNull { it.id!! }
            ?: throw IllegalStateException("Aucune ligne matériau après mise à jour du groupe.")
        return baremeLectureService.getArticleById(returnId)
    }

    private fun offreMatches(offre: BaremeMateriauOffreRequest, line: LignePrixBareme): Boolean {
        if (offre.fournisseurId != null) {
            return line.fournisseurBareme?.id == offre.fournisseurId
        }
        val nom = offre.fournisseurNom?.trim().orEmpty()
        if (nom.isEmpty()) return false
        return line.fournisseurBareme?.nom?.equals(nom, ignoreCase = true) == true
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

    private fun validateMateriauCommonIdentity(request: BaremeArticleCreateRequest) {
        val cat = request.categorie?.trim().orEmpty()
        val fam = request.famille?.trim().orEmpty()
        val u = request.unite?.trim().orEmpty()
        if (cat.isEmpty()) throw BadRequestException("La catégorie est obligatoire.")
        if (fam.isEmpty()) throw BadRequestException("La famille est obligatoire.")
        if (u.isEmpty()) throw BadRequestException("L'unité est obligatoire.")
    }

    private fun validateMateriauOffres(offres: List<BaremeMateriauOffreRequest>) {
        if (offres.isEmpty()) throw BadRequestException("offresMateriau doit contenir au moins une offre.")
        val keys = mutableSetOf<String>()
        for (o in offres) {
            val hasFourn = o.fournisseurId != null || !o.fournisseurNom.isNullOrBlank()
            if (!hasFourn) throw BadRequestException("Chaque offre doit avoir fournisseurId ou fournisseurNom.")
            val prix = o.prixTtc ?: throw BadRequestException("Chaque offre doit avoir un prix TTC.")
            if (prix <= BigDecimal.ZERO) throw BadRequestException("Le prix unitaire de chaque offre doit être strictement positif.")
            val k = when {
                o.fournisseurId != null -> "id:${o.fournisseurId}"
                else -> "nom:${o.fournisseurNom!!.trim().lowercase()}"
            }
            if (!keys.add(k)) throw BadRequestException("Fournisseur dupliqué dans offresMateriau.")
        }
    }

    private fun validateMateriauPayload(request: BaremeArticleCreateRequest) {
        validateMateriauCommonIdentity(request)
        val prix = request.prixTtc ?: throw BadRequestException("Le prix unitaire (TTC) est obligatoire.")
        if (prix <= BigDecimal.ZERO) throw BadRequestException("Le prix unitaire doit être strictement positif.")
        val hasFourn = request.fournisseurId != null || !request.fournisseurNom.isNullOrBlank()
        if (!hasFourn) throw BadRequestException("Le fournisseur est obligatoire.")
    }
}
