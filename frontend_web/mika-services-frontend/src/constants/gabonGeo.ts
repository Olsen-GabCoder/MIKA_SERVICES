/**
 * Géocodage des villes et localités du Gabon.
 *
 * Table de référence : nom de ville → { province, latitude, longitude }.
 * Utilisée pour remplir automatiquement les coordonnées GPS
 * quand l'utilisateur sélectionne une ville dans le formulaire projet.
 *
 * Sources : coordonnées OpenStreetMap / Wikipedia vérifiées.
 */

export interface GabonVille {
  nom: string
  province: string
  latitude: number
  longitude: number
}

/**
 * Liste des villes/localités du Gabon avec coordonnées GPS.
 * Triées par province puis par nom.
 */
export const GABON_VILLES: GabonVille[] = [
  // ── Estuaire ──────────────────────────────────────────
  { nom: 'Libreville',       province: 'Estuaire',       latitude:  0.3924, longitude:  9.4536 },
  { nom: 'Owendo',           province: 'Estuaire',       latitude:  0.2962, longitude:  9.5094 },
  { nom: 'Akanda',           province: 'Estuaire',       latitude:  0.4500, longitude:  9.4700 },
  { nom: 'Ntoum',            province: 'Estuaire',       latitude:  0.3900, longitude:  9.7600 },
  { nom: 'Nkoltang',         province: 'Estuaire',       latitude:  0.2851, longitude:  9.4423 },
  { nom: 'Donguila',         province: 'Estuaire',       latitude:  0.1847, longitude:  9.5781 },
  { nom: 'Kango',            province: 'Estuaire',       latitude:  0.1750, longitude: 10.0720 },
  { nom: 'Cocobeach',        province: 'Estuaire',       latitude:  1.0000, longitude:  9.5833 },

  // ── Haut-Ogooué ───────────────────────────────────────
  { nom: 'Franceville',      province: 'Haut-Ogooué',    latitude: -1.6333, longitude: 13.5833 },
  { nom: 'Moanda',           province: 'Haut-Ogooué',    latitude: -1.5667, longitude: 13.2000 },
  { nom: 'Mounana',          province: 'Haut-Ogooué',    latitude: -1.4167, longitude: 13.1500 },
  { nom: 'Okondja',          province: 'Haut-Ogooué',    latitude: -0.6553, longitude: 13.6781 },
  { nom: 'Bongoville',       province: 'Haut-Ogooué',    latitude: -1.6167, longitude: 13.9833 },
  { nom: 'Léconi',           province: 'Haut-Ogooué',    latitude: -1.5833, longitude: 14.2500 },

  // ── Moyen-Ogooué ──────────────────────────────────────
  { nom: 'Lambaréné',        province: 'Moyen-Ogooué',   latitude: -0.6875, longitude: 10.2405 },
  { nom: 'Ndjolé',           province: 'Moyen-Ogooué',   latitude: -0.1833, longitude: 10.7667 },

  // ── Ngounié ───────────────────────────────────────────
  { nom: 'Mouila',           province: 'Ngounié',        latitude: -1.8667, longitude: 11.0667 },
  { nom: 'Lebamba',          province: 'Ngounié',        latitude: -2.2000, longitude: 11.4500 },
  { nom: 'Ndendé',           province: 'Ngounié',        latitude: -2.4000, longitude: 11.3667 },
  { nom: 'Fougamou',         province: 'Ngounié',        latitude: -1.2167, longitude: 10.6000 },
  { nom: 'Mimongo',          province: 'Ngounié',        latitude: -1.6333, longitude: 11.6167 },

  // ── Nyanga ────────────────────────────────────────────
  { nom: 'Tchibanga',        province: 'Nyanga',         latitude: -2.8500, longitude: 11.0333 },
  { nom: 'Mayumba',          province: 'Nyanga',         latitude: -3.4333, longitude: 10.6500 },
  { nom: 'Moabi',            province: 'Nyanga',         latitude: -2.4333, longitude: 10.9333 },

  // ── Ogooué-Ivindo ─────────────────────────────────────
  { nom: 'Makokou',          province: 'Ogooué-Ivindo',  latitude:  0.5667, longitude: 12.8667 },
  { nom: 'Booué',            province: 'Ogooué-Ivindo',  latitude: -0.1000, longitude: 11.9333 },
  { nom: 'Mékambo',          province: 'Ogooué-Ivindo',  latitude:  1.0167, longitude: 13.9333 },

  // ── Ogooué-Lolo ───────────────────────────────────────
  { nom: 'Koulamoutou',      province: 'Ogooué-Lolo',    latitude: -1.1333, longitude: 12.4833 },
  { nom: 'Lastoursville',    province: 'Ogooué-Lolo',    latitude: -0.8167, longitude: 12.7167 },
  { nom: 'Pana',             province: 'Ogooué-Lolo',    latitude: -1.5833, longitude: 12.6833 },

  // ── Ogooué-Maritime ───────────────────────────────────
  { nom: 'Port-Gentil',      province: 'Ogooué-Maritime', latitude: -0.7167, longitude:  8.7833 },
  { nom: 'Gamba',            province: 'Ogooué-Maritime', latitude: -2.6500, longitude:  10.0000 },
  { nom: 'Omboué',           province: 'Ogooué-Maritime', latitude: -1.5667, longitude:  9.2500 },

  // ── Woleu-Ntem ────────────────────────────────────────
  { nom: 'Oyem',             province: 'Woleu-Ntem',     latitude:  1.6000, longitude: 11.5833 },
  { nom: 'Bitam',            province: 'Woleu-Ntem',     latitude:  2.0833, longitude: 11.5000 },
  { nom: 'Minvoul',          province: 'Woleu-Ntem',     latitude:  2.1500, longitude: 12.1333 },
  { nom: 'Mitzic',           province: 'Woleu-Ntem',     latitude:  0.7833, longitude: 11.5500 },
  { nom: 'Médouneu',         province: 'Woleu-Ntem',     latitude:  1.0000, longitude: 10.7833 },
]

/** Provinces du Gabon (triées). */
export const GABON_PROVINCES = [
  'Estuaire',
  'Haut-Ogooué',
  'Moyen-Ogooué',
  'Ngounié',
  'Nyanga',
  'Ogooué-Ivindo',
  'Ogooué-Lolo',
  'Ogooué-Maritime',
  'Woleu-Ntem',
] as const

export type GabonProvince = typeof GABON_PROVINCES[number]

/** Retourne les villes d'une province donnée. */
export function getVillesParProvince(province: string): GabonVille[] {
  return GABON_VILLES.filter((v) => v.province === province)
}

/** Recherche une ville par nom (insensible à la casse et aux accents). */
export function findVille(nom: string): GabonVille | undefined {
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const q = normalize(nom)
  return GABON_VILLES.find((v) => normalize(v.nom) === q)
}
