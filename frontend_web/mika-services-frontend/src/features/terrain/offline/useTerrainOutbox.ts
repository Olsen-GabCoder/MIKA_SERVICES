/**
 * Hook React : contenu de l'outbox terrain, mis à jour à chaque mutation de la file.
 */
import { useEffect, useState } from 'react'
import { getOutbox, subscribe, type TerrainOutboxItem } from './terrainOutbox'

export function useTerrainOutbox(): TerrainOutboxItem[] {
  const [items, setItems] = useState<TerrainOutboxItem[]>(getOutbox)
  useEffect(() => subscribe(() => setItems(getOutbox())), [])
  return items
}
