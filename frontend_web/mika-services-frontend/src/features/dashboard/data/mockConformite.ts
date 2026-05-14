/**
 * TEMPORARY MOCK DATA - D3.9
 * Données fictives en attente d'endpoints backend dédiés.
 * TODO: Remplacer par les vrais hooks React Query / Redux selectors
 *       quand les endpoints suivants seront disponibles :
 *       - GET /api/qshe/top-risques
 *       - GET /api/financial/delais-paiement
 *       - GET /api/qualite/conformite-documentaire
 *       - GET /api/operations/approvisionnement-status
 *
 * Valeurs choisies pour être crédibles dans le contexte BTP Gabon :
 *       ordres de grandeur réalistes (jours, %, quantités)
 *       cohérence avec les vraies données affichées ailleurs
 */

export const MOCK_RISQUES = [
  { nom: 'Travaux en hauteur · PK12', niveau: 'Critique' as const, pct: 92 },
  { nom: 'Manutention engins · Ndjolé', niveau: 'Élevé' as const, pct: 74 },
  { nom: 'Exposition poussière · Stade', niveau: 'Modéré' as const, pct: 55 },
  { nom: 'Bruit prolongé · Oyem', niveau: 'Modéré' as const, pct: 42 },
  { nom: 'Stockage carburant · Mouila', niveau: 'Faible' as const, pct: 28 },
]

export const MOCK_PAIEMENTS = {
  moyenne: 38,
  delta: '+3j',
  factures: 76,
  enRetard: 14,
  bins: [
    { label: '<15', value: 8, color: 'var(--db-teal)' },
    { label: '15-30', value: 14, color: 'var(--db-teal)' },
    { label: '31-45', value: 22, color: 'var(--db-teal)' },
    { label: '46-60', value: 17, color: 'var(--db-warn)' },
    { label: '61-90', value: 9, color: 'var(--db-warn)' },
    { label: '91-120', value: 4, color: 'var(--db-danger)' },
    { label: '120+', value: 2, color: 'var(--db-danger)' },
  ],
}

export const MOCK_CONFORMITE_DOC = {
  pct: 86,
  aJour: 312,
  expirent30j: 34,
  expires: 17,
}

export const MOCK_APPROVISIONNEMENT = {
  pctATemps: 78,
  commandes: 128,
  aTemps: 100,
  retard: 22,
  litige: 6,
}
