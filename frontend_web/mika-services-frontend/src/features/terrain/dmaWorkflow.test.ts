/**
 * Verrou de non-régression : circuit DMA à UNE SEULE PORTE (réforme 2026-08-20).
 * Le chantier/projet soumet, la logistique arbitre (prendreEnCharge/rejeter),
 * puis le circuit s'exécute. Les statuts EN_VALIDATION_* (ancien circuit à 3
 * portes) restent lisibles dans l'historique mais n'ouvrent plus aucune action.
 */
import { describe, expect, it } from 'vitest'
import { TRANSITION_PAR_STATUT, actionsPour } from './dmaWorkflow'
import type { TerrainMe } from '@/api/terrainApi'

const meWith = (roles: string[], chantiers: { id: number }[] = [{ id: 47 }]): TerrainMe =>
  ({
    id: 12,
    nom: 'IBOUANA',
    prenom: 'Ulrich Landry',
    roles,
    permissions: [],
    chantiers: chantiers.map((c) => ({ id: c.id, nom: `Chantier ${c.id}` })),
  }) as unknown as TerrainMe

const dma = { projetId: 47, createurUserId: 2 } // créée par un autre, dans le périmètre

/** Transition réellement appelée par le bouton principal renvoyé par actionsPour. */
const transitionPrincipale = (statut: string, me: TerrainMe | null): string | null => {
  const a = actionsPour(statut as never, me, dma)[0]
  if (!a) return null
  if (a.kind === 'transition') return a.action
  return null
}

describe('TRANSITION_PAR_STATUT — miroir exact de DemandeMaterielService (circuit à une porte)', () => {
  it('fige le mapping statut → transition backend', () => {
    expect(TRANSITION_PAR_STATUT).toEqual({
      SOUMISE: 'prendre-en-charge',
      PRISE_EN_CHARGE: 'commander',
      EN_ATTENTE_COMPLEMENT: 'completer',
      EN_COMMANDE: 'livrer',
      LIVRE: 'cloturer',
      REJETEE: null,
      CLOTUREE: null,
      EN_VALIDATION_CHANTIER: null,
      EN_VALIDATION_PROJET: null,
    })
  })

  it('actionsPour appelle exactement la transition attendue pour un LOGISTIQUE (tous statuts)', () => {
    const logistique = meWith(['LOGISTIQUE'])
    for (const [statut, attendue] of Object.entries(TRANSITION_PAR_STATUT)) {
      // EN_ATTENTE_COMPLEMENT / EN_COMMANDE : trio inclus dans canCompleterOuLivrer
      expect(transitionPrincipale(statut, logistique), `statut ${statut}`).toBe(attendue)
    }
  })
})

describe('actionsPour — rôles et périmètre (nouveau circuit)', () => {
  it('SOUMISE : la logistique arbitre — prendre en charge OU rejeter', () => {
    const actions = actionsPour('SOUMISE', meWith(['LOGISTIQUE']), dma)
    expect(actions.map((a) => (a.kind === 'transition' ? a.action : a.kind)))
      .toEqual(['prendre-en-charge', 'rejeter'])
  })

  it('SOUMISE : aucun bouton pour les non-trio (créateur, chefs, USER)', () => {
    expect(actionsPour('SOUMISE', meWith(['CHEF_CHANTIER']), dma)).toEqual([])
    expect(actionsPour('SOUMISE', meWith(['CHEF_PROJET']), dma)).toEqual([])
    expect(actionsPour('SOUMISE', meWith(['USER']), dma)).toEqual([])
  })

  it('PRISE_EN_CHARGE : commander / demander complément / rejeter, trio uniquement', () => {
    const actions = actionsPour('PRISE_EN_CHARGE', meWith(['LOGISTIQUE']), dma)
    expect(actions.map((a) => (a.kind === 'transition' ? a.action : a.kind)))
      .toEqual(['commander', 'demander-complement', 'rejeter'])
    expect(actionsPour('PRISE_EN_CHARGE', meWith(['CHEF_PROJET']), dma)).toEqual([])
  })

  it('EN_ATTENTE_COMPLEMENT : le créateur peut compléter, un tiers non-trio non', () => {
    const createur = { ...meWith(['USER']), id: 2 } as TerrainMe
    expect(transitionPrincipale('EN_ATTENTE_COMPLEMENT', createur)).toBe('completer')
    expect(actionsPour('EN_ATTENTE_COMPLEMENT', meWith(['CHEF_CHANTIER']), dma)).toEqual([])
  })

  it('EN_COMMANDE : créateur ou trio confirment la réception', () => {
    const createur = { ...meWith(['USER']), id: 2 } as TerrainMe
    expect(transitionPrincipale('EN_COMMANDE', createur)).toBe('livrer')
    expect(transitionPrincipale('EN_COMMANDE', meWith(['ADMIN']))).toBe('livrer')
    expect(actionsPour('EN_COMMANDE', meWith(['CHEF_PROJET']), dma)).toEqual([])
  })

  it('LIVRE : clôture réservée au trio', () => {
    expect(transitionPrincipale('LIVRE', meWith(['SUPER_ADMIN']))).toBe('cloturer')
    expect(actionsPour('LIVRE', meWith(['CHEF_CHANTIER']), dma)).toEqual([])
  })

  it('ADMIN et SUPER_ADMIN alignés sur isLogistiqueOuAdmin', () => {
    for (const role of ['ADMIN', 'SUPER_ADMIN']) {
      expect(transitionPrincipale('SOUMISE', meWith([role]))).toBe('prendre-en-charge')
      expect(transitionPrincipale('PRISE_EN_CHARGE', meWith([role]))).toBe('commander')
    }
  })

  it('permissif quand me est null (le backend tranche)', () => {
    expect(transitionPrincipale('SOUMISE', null)).toBe('prendre-en-charge')
  })

  it('statuts terminaux et legacy : aucune action, même pour le trio', () => {
    const admin = meWith(['SUPER_ADMIN'])
    for (const statut of ['REJETEE', 'CLOTUREE', 'EN_VALIDATION_CHANTIER', 'EN_VALIDATION_PROJET']) {
      expect(actionsPour(statut as never, admin, dma), `statut ${statut}`).toEqual([])
    }
  })
})
