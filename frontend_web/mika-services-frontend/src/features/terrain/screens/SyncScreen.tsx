/**
 * Synchronisation — état de l'outbox offline : éléments en attente / en erreur,
 * réessai ou suppression par élément, synchronisation manuelle.
 */
import { useState } from 'react'
import { useIsOnline } from '@/hooks/useConnectivity'
import { AMBER, BORDER, F, FC, GREEN, INK, MUTED, RED, bigBtn, card } from '../theme'
import { SubHeader } from '../components/ui'
import { IconAlert, IconCheck, IconClock, IconCloudOff, IconSync, IconX } from '../components/icons'
import { ACTION_LABELS } from '../offline/terrainMutations'
import { remove, replayAll, retryOne, type TerrainOutboxItem } from '../offline/terrainOutbox'
import { useTerrainOutbox } from '../offline/useTerrainOutbox'

function heure(ts: number): string {
  return new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function ItemRow({ item, online, busy, onRetry, onDelete }: {
  item: TerrainOutboxItem
  online: boolean
  busy: boolean
  onRetry: (id: string) => void
  onDelete: (id: string) => void
}) {
  const enErreur = item.status === 'error'
  const statusColor = enErreur ? RED : item.status === 'sending' ? AMBER : MUTED
  return (
    <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: statusColor, display: 'flex' }}>
          {enErreur ? <IconAlert size={20} strokeWidth={2} /> : <IconClock size={20} strokeWidth={2} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>
            {ACTION_LABELS[item.action]}{item.contexte ? ` — ${item.contexte}` : ''}
          </div>
          <div style={{ fontSize: 12.5, color: MUTED }}>
            {heure(item.createdAt)} · {enErreur ? 'Refusée par le serveur' : item.status === 'sending' ? 'Envoi en cours…' : 'En attente de réseau'}
          </div>
        </div>
      </div>
      {enErreur && item.lastError && (
        <div style={{ fontSize: 12.5, color: RED, fontWeight: 600, background: '#FEF3F3', borderRadius: 8, padding: '8px 10px' }}>
          {item.lastError.message}
        </div>
      )}
      {enErreur && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onRetry(item.id)}
            disabled={busy || !online}
            className="tk-press"
            style={{
              appearance: 'none', cursor: 'pointer', fontFamily: F, fontSize: 14, fontWeight: 700,
              flex: 1, minHeight: 44, borderRadius: 10, border: `1.5px solid ${BORDER}`,
              background: '#fff', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              opacity: busy || !online ? 0.5 : 1,
            }}
          >
            <IconSync size={16} strokeWidth={2.2} /> Réessayer
          </button>
          <button
            onClick={() => onDelete(item.id)}
            disabled={busy}
            className="tk-press"
            style={{
              appearance: 'none', cursor: 'pointer', fontFamily: F, fontSize: 14, fontWeight: 700,
              flex: 1, minHeight: 44, borderRadius: 10, border: '1.5px solid #F0B7B7',
              background: '#FEF9F9', color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <IconX size={16} strokeWidth={2.2} /> Supprimer
          </button>
        </div>
      )}
    </div>
  )
}

export function SyncScreen({ onBack, onToast, onSynced }: {
  onBack: () => void
  onToast: (m: string, error?: boolean) => void
  onSynced: () => void
}) {
  const items = useTerrainOutbox()
  const online = useIsOnline()
  const [busy, setBusy] = useState(false)

  const pending = items.filter((i) => i.status !== 'error').length
  const errors = items.length - pending

  const syncNow = async () => {
    setBusy(true)
    try {
      const { done, failed } = await replayAll()
      if (done > 0) onSynced()
      if (failed > 0) onToast(`${failed} action${failed > 1 ? 's' : ''} refusée${failed > 1 ? 's' : ''} par le serveur`, true)
      else if (done > 0) onToast(`${done} action${done > 1 ? 's' : ''} synchronisée${done > 1 ? 's' : ''}`)
      else if (pending > 0) onToast('Synchronisation impossible — réseau indisponible', true)
    } finally {
      setBusy(false)
    }
  }

  const retry = async (id: string) => {
    setBusy(true)
    try { await retryOne(id) } finally { setBusy(false) }
  }

  return (
    <div>
      <SubHeader titre="Synchronisation" onBack={onBack} />
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* État réseau */}
        <div style={{ ...card, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: online ? GREEN : AMBER, display: 'flex' }}>
            {online ? <IconCheck size={22} strokeWidth={2.2} /> : <IconCloudOff size={22} strokeWidth={2} />}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FC, fontSize: 17, fontWeight: 700, color: INK }}>
              {online ? 'Connecté' : 'Hors ligne'}
            </div>
            <div style={{ fontSize: 13, color: MUTED }}>
              {items.length === 0
                ? 'Tout est synchronisé.'
                : `${pending} en attente${errors > 0 ? ` · ${errors} en erreur` : ''}`}
            </div>
          </div>
        </div>

        {items.map((item) => (
          <ItemRow key={item.id} item={item} online={online} busy={busy} onRetry={(id) => void retry(id)} onDelete={remove} />
        ))}

        {items.length > 0 && (
          <button
            onClick={() => void syncNow()}
            disabled={busy || !online || pending === 0}
            className="tk-press"
            style={{ ...bigBtn(GREEN), opacity: busy || !online || pending === 0 ? 0.5 : 1 }}
          >
            <IconSync size={20} strokeWidth={2} /> {busy ? 'Synchronisation…' : 'Synchroniser maintenant'}
          </button>
        )}
      </div>
    </div>
  )
}
