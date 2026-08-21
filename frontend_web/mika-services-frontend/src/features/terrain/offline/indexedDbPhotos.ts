/**
 * Stockage de photos (blobs) dans IndexedDB pour l'outbox offline.
 * localStorage ne supporte pas les blobs — IndexedDB est le seul moyen
 * de persister des fichiers binaires côté client pour un replay différé.
 *
 * Base : 'mika-terrain-photos', store : 'blobs', clé = string.
 */

const DB_NAME = 'mika-terrain-photos'
const STORE = 'blobs'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Stocke une liste de fichiers sous une clé (ex: `photos-{clientRequestId}`). */
export async function storePhotoBlobs(key: string, files: File[]): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  // Convertir les File en { name, type, buffer } pour sérialisation fiable
  const entries = await Promise.all(
    files.map(async (f) => ({
      name: f.name,
      type: f.type,
      buffer: await f.arrayBuffer(),
    })),
  )
  store.put(entries, key)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

/** Récupère les fichiers stockés sous une clé. Retourne [] si absent. */
export async function getPhotoBlobs(key: string): Promise<File[]> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readonly')
  const store = tx.objectStore(STORE)
  return new Promise((resolve, reject) => {
    const req = store.get(key)
    req.onsuccess = () => {
      db.close()
      const entries = req.result as { name: string; type: string; buffer: ArrayBuffer }[] | undefined
      if (!entries) { resolve([]); return }
      resolve(entries.map((e) => new File([e.buffer], e.name, { type: e.type })))
    }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

/** Supprime les photos stockées sous une clé. Silencieux si absent. */
export async function deletePhotoBlobs(key: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(key)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}
