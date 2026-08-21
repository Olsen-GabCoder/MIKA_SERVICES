import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Client } from '@stomp/stompjs'
import { getAccessToken } from '@/utils/tokenStorage'
import type { SalleReunion } from '@/types/salleReunion'

function buildWsUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api'
  try {
    const url = new URL(apiBase, window.location.origin)
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    // Go up from /api to the root, then add /ws/websocket (raw WS, bypass SockJS)
    return `${wsProtocol}//${url.host}/ws/websocket`
  } catch {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/ws/websocket`
  }
}

export function useSalleWebSocket(enabled: boolean) {
  const qc = useQueryClient()
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!enabled) return

    const client = new Client({
      brokerURL: buildWsUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      // Token frais a chaque (re)connexion — evite un token perime apres expiration.
      beforeConnect: () => {
        client.connectHeaders = { Authorization: `Bearer ${getAccessToken() ?? ''}` }
      },

      onConnect: () => {
        client.subscribe('/topic/salle-reunion', (message) => {
          try {
            const salle: SalleReunion = JSON.parse(message.body)
            qc.setQueryData(['salle-reunion'], salle)
          } catch {
            qc.invalidateQueries({ queryKey: ['salle-reunion'] })
          }
        })
      },

      onStompError: () => {
        // Fallback on polling — no action needed, useSalleReunion polls already
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [enabled, qc])
}
