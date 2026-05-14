/**
 * TEMPORARY MOCK DATA - D3.9
 * Données fictives en attente d'endpoints backend dédiés.
 * TODO: Remplacer par les vrais hooks React Query / Redux selectors
 *       quand les endpoints suivants seront disponibles :
 *       - GET /api/financial/tresorerie-historique
 *       - GET /api/operations/productivite-chantiers
 *       - GET /api/materiaux/cout-historique
 *       - GET /api/rh/heures-travaillees
 *
 * Valeurs choisies pour être crédibles dans le contexte BTP Gabon :
 *       ordres de grandeur réalistes (FCFA, m³, heures)
 *       cohérence avec les vraies données affichées ailleurs
 */

export const MOCK_TRESORERIE = {
  value: 185,
  unit: 'M FCFA',
  delta: '+8,2%',
  encaissements: 612,
  decaissements: 427,
  series: [120, 128, 135, 130, 142, 155, 148, 160, 168, 162, 175, 182, 178, 185],
}

export const MOCK_PRODUCTIVITE = {
  moyenne: 312,
  unit: 'm³ / jour',
  delta: '+6%',
  chantiers: [
    { nom: 'Pont PK12', value: 468, pct: 92 },
    { nom: 'Route Ndjolé', value: 385, pct: 76 },
    { nom: 'Stade Mouila', value: 241, pct: 48 },
    { nom: 'Lycée Tchibanga', value: 152, pct: 30 },
  ],
}

export const MOCK_COUT_CIMENT = {
  value: 82500,
  unit: 'FCFA / T',
  delta: '+4,1%',
  deltaDir: 'down' as const,
  label: 'CPA 32,5',
  current: [76, 77, 78, 79, 80, 82.5],
  previous: [74, 75, 75, 76, 77, 78],
  months: ['DÉC', 'JAN', 'FÉV', 'MAR', 'AVR', 'MAI'],
}

export const MOCK_HEURES = {
  total: 14280,
  delta: '+3,4%',
  regulieres: 12540,
  supplementaires: 1740,
  days: [
    { label: 'L', reg: 1820, sup: 220 },
    { label: 'M', reg: 1880, sup: 260 },
    { label: 'M', reg: 1740, sup: 180 },
    { label: 'J', reg: 1920, sup: 310 },
    { label: 'V', reg: 1880, sup: 290 },
    { label: 'S', reg: 1640, sup: 180 },
    { label: 'D', reg: 1660, sup: 300 },
  ],
}
