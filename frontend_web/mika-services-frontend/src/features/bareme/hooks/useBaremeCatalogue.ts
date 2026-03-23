/**
 * @deprecated Les filtres du barème utilisent désormais `useBaremeFilterFacets` + GET `/bareme/facets`
 * (valeurs distinctes sur toute la base). Ce hook ne voyait que la page courante.
 */
import { useMemo } from 'react'
import type { BaremeArticleCompare } from '../types'
import { normalizeArticle, normalizeSupplierName, normalizeUnit } from '../types'

export interface BaremeCatalogueFilterOptions {
  articles: string[]
  fournisseurs: string[]
  unites: string[]
  familles: string[]
  categories: string[]
}

interface UseBaremeCatalogueFilterOptionsParams {
  article?: string
  fournisseur?: string
  unite?: string
  famille?: string
  categorie?: string
}

export function useBaremeCatalogueFilterOptions(
  rows: BaremeArticleCompare[],
  selected: UseBaremeCatalogueFilterOptionsParams = {}
): BaremeCatalogueFilterOptions {
  return useMemo(() => {
    const selectedArticle = selected.article?.trim() ?? ''
    const selectedFournisseur = selected.fournisseur?.trim() ?? ''
    const selectedUnite = selected.unite?.trim() ?? ''
    const selectedFamille = selected.famille?.trim() ?? ''
    const selectedCategorie = selected.categorie?.trim() ?? ''

    const normalizedRows = rows.map((row) => {
      const rowArticle = normalizeArticle(row.libelle ?? row.reference ?? '')
      const rowUnite = normalizeUnit(row.unite ?? row.unitePrestation ?? '')
      const rowSuppliers = (row.prixParFournisseur ?? []).map((pf) =>
        normalizeSupplierName(pf.fournisseurNom)
      )
      const rowFamille = (row.famille ?? '').trim()
      const rowCategorie = (row.categorie ?? '').trim()
      return { rowArticle, rowUnite, rowSuppliers, rowFamille, rowCategorie }
    })

    const candidateArticles = normalizedRows.filter((row) => {
      if (selectedUnite && row.rowUnite !== selectedUnite) return false
      if (selectedFournisseur && !row.rowSuppliers.includes(selectedFournisseur)) return false
      if (selectedFamille && row.rowFamille !== selectedFamille) return false
      if (selectedCategorie && row.rowCategorie !== selectedCategorie) return false
      return true
    })

    const candidateUnites = normalizedRows.filter((row) => {
      if (selectedArticle && row.rowArticle !== selectedArticle) return false
      if (selectedFournisseur && !row.rowSuppliers.includes(selectedFournisseur)) return false
      if (selectedFamille && row.rowFamille !== selectedFamille) return false
      if (selectedCategorie && row.rowCategorie !== selectedCategorie) return false
      return true
    })

    const candidateFournisseurs = normalizedRows.filter((row) => {
      if (selectedArticle && row.rowArticle !== selectedArticle) return false
      if (selectedUnite && row.rowUnite !== selectedUnite) return false
      if (selectedFamille && row.rowFamille !== selectedFamille) return false
      if (selectedCategorie && row.rowCategorie !== selectedCategorie) return false
      return true
    })

    const candidateFamilles = normalizedRows.filter((row) => {
      if (selectedArticle && row.rowArticle !== selectedArticle) return false
      if (selectedFournisseur && !row.rowSuppliers.includes(selectedFournisseur)) return false
      if (selectedUnite && row.rowUnite !== selectedUnite) return false
      if (selectedCategorie && row.rowCategorie !== selectedCategorie) return false
      return true
    })

    const candidateCategories = normalizedRows.filter((row) => {
      if (selectedArticle && row.rowArticle !== selectedArticle) return false
      if (selectedFournisseur && !row.rowSuppliers.includes(selectedFournisseur)) return false
      if (selectedUnite && row.rowUnite !== selectedUnite) return false
      if (selectedFamille && row.rowFamille !== selectedFamille) return false
      return true
    })

    const articleSet = new Set<string>()
    const supplierSet = new Set<string>()
    const unitSet = new Set<string>()
    const familleSet = new Set<string>()
    const categorieSet = new Set<string>()

    for (const row of candidateArticles) {
      articleSet.add(row.rowArticle)
    }

    for (const row of candidateUnites) {
      unitSet.add(row.rowUnite)
    }

    for (const row of candidateFournisseurs) {
      for (const supplier of row.rowSuppliers) {
        supplierSet.add(supplier)
      }
    }
    for (const row of candidateFamilles) {
      if (row.rowFamille) familleSet.add(row.rowFamille)
    }
    for (const row of candidateCategories) {
      if (row.rowCategorie) categorieSet.add(row.rowCategorie)
    }

    return {
      articles: Array.from(articleSet).filter(Boolean).sort(),
      fournisseurs: Array.from(supplierSet).filter(Boolean).sort(),
      unites: Array.from(unitSet).filter(Boolean).sort(),
      familles: Array.from(familleSet).sort(),
      categories: Array.from(categorieSet).sort(),
    }
  }, [
    rows,
    selected.article,
    selected.fournisseur,
    selected.unite,
    selected.famille,
    selected.categorie,
  ])
}
