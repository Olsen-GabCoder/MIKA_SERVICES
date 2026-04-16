/**
 * Décalage visuel des markers trop proches.
 *
 * Détecte les groupes de projets dont les coordonnées sont
 * à moins de `threshold` degrés, puis les répartit en cercle
 * autour de leur barycentre pour éviter le chevauchement.
 */

interface HasCoords {
  coords: [number, number]
}

/**
 * Retourne de nouvelles coordonnées d'affichage pour chaque élément.
 * Les coordonnées originales ne sont pas modifiées.
 *
 * @param items   Tableau d'objets avec coords [lat, lng]
 * @param threshold  Distance en degrés en dessous de laquelle on considère un chevauchement (~0.012 ≈ 1.3km)
 * @param spreadRadius  Rayon du cercle de répartition en degrés (~0.025 ≈ 2.8km)
 */
export function spreadOverlappingMarkers<T extends HasCoords>(
  items: T[],
  threshold = 0.5,
  spreadRadius = 1.2,
): (T & { displayCoords: [number, number] })[] {
  if (items.length === 0) return []

  // 1) Construire les groupes de markers proches
  const visited = new Set<number>()
  const groups: number[][] = []

  for (let i = 0; i < items.length; i++) {
    if (visited.has(i)) continue
    const group = [i]
    visited.add(i)

    for (let j = i + 1; j < items.length; j++) {
      if (visited.has(j)) continue
      const dist = Math.sqrt(
        (items[i].coords[0] - items[j].coords[0]) ** 2 +
        (items[i].coords[1] - items[j].coords[1]) ** 2,
      )
      if (dist < threshold) {
        group.push(j)
        visited.add(j)
      }
    }
    groups.push(group)
  }

  // 2) Calculer les positions décalées
  const result = items.map((item) => ({ ...item, displayCoords: [...item.coords] as [number, number] }))

  for (const group of groups) {
    if (group.length <= 1) continue // pas de chevauchement

    // Barycentre du groupe
    const centerLat = group.reduce((s, idx) => s + items[idx].coords[0], 0) / group.length
    const centerLng = group.reduce((s, idx) => s + items[idx].coords[1], 0) / group.length

    // Rayon proportionnel au nombre de markers — couvrir tout le Gabon
    const radius = spreadRadius * Math.max(1, group.length / 8)

    // Répartir en cercle
    group.forEach((idx, i) => {
      const angle = (2 * Math.PI * i) / group.length - Math.PI / 2 // commence en haut
      result[idx].displayCoords = [
        centerLat + radius * Math.sin(angle),
        centerLng + radius * Math.cos(angle),
      ]
    })
  }

  return result
}
