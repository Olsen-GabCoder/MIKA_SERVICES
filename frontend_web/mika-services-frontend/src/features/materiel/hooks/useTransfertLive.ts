import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { getAccessToken } from '@/utils/tokenStorage'
import type { SuiviPoint } from '@/types/materiel'

function buildWsUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api'
  try {
    const url = new URL(apiBase, window.location.origin)
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProtocol}//${url.host}/ws/websocket`
  } catch {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/ws/websocket`
  }
}

export interface TransfertLiveState {
  position: SuiviPoint | null
  connected: boolean
}

/**
 * Abonnement STOMP temps réel aux positions GPS d'un transfert.
 * P2.3 : le token JWT est ré-injecté à chaque (re)connexion via beforeConnect,
 * pour éviter qu'une reconnexion après expiration porte un token périmé.
 */
export function useTransfertLive(transfertId: number | null, enabled: boolean): TransfertLiveState {
  const [position, setPosition] = useState<SuiviPoint | null>(null)
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!enabled || transfertId == null) {
      setConnected(false)
      return
    }

    const client = new Client({
      brokerURL: buildWsUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      // Token frais à chaque (re)connexion — pas figé à la construction.
      beforeConnect: () => {
        client.connectHeaders = { Authorization: `Bearer ${getAccessToken() ?? ''}` }
      },

      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/transfert/${transfertId}/position`, (message) => {
          try {
            setPosition(JSON.parse(message.body) as SuiviPoint)
          } catch {
            /* payload illisible : ignore */
          }
        })
      },

      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setConnected(false)
    }
  }, [transfertId, enabled])

  return { position, connected }
}
