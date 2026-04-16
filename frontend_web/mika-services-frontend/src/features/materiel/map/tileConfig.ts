/**
 * Configuration cartographique — tuiles Mapbox + limites Gabon.
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

/* ------------------------------------------------------------------ */
/*  Tuiles Mapbox                                                       */
/* ------------------------------------------------------------------ */

export const TILE_LIGHT = {
  url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
  attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
}

export const TILE_DARK = {
  url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
  attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
}

/* ------------------------------------------------------------------ */
/*  Limites du Gabon — la carte ne sort jamais de ce rectangle          */
/* ------------------------------------------------------------------ */

/** SW / NE bounds serrés — uniquement le territoire gabonais. */
export const GABON_BOUNDS: [[number, number], [number, number]] = [
  [-3.95, 8.65],  // Sud-Ouest (Mayumba / côte)
  [2.32, 14.55],  // Nord-Est (Bitam / Mékambo)
]

export const GABON_CENTER: [number, number] = [-0.8, 11.6]
export const GABON_ZOOM = 7

export const MIN_ZOOM = 7
export const MAX_ZOOM = 18
