import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/api/axios'

export type NetworkLevel = 'excellent' | 'good' | 'limited' | 'measuring'

interface NetworkQuality {
  level: NetworkLevel
  latencyMs: number | null
}

async function measureLatency(): Promise<number> {
  const times: number[] = []
  for (let i = 0; i < 3; i++) {
    const start = performance.now()
    try {
      await apiClient.get('/health', { timeout: 5000 })
    } catch {
      return 9999
    }
    times.push(performance.now() - start)
  }
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length)
}

function levelFromLatency(ms: number): NetworkLevel {
  if (ms < 150) return 'excellent'
  if (ms < 400) return 'good'
  return 'limited'
}

const REMEASURE_INTERVAL = 30_000

export function useNetworkQuality(enabled: boolean): NetworkQuality {
  const [quality, setQuality] = useState<NetworkQuality>({ level: 'measuring', latencyMs: null })

  const measure = useCallback(async () => {
    const latency = await measureLatency()
    setQuality({ level: levelFromLatency(latency), latencyMs: latency })
  }, [])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    async function run() {
      const latency = await measureLatency()
      if (!cancelled) {
        setQuality({ level: levelFromLatency(latency), latencyMs: latency })
      }
    }

    run()

    const id = setInterval(() => {
      if (!cancelled) measure()
    }, REMEASURE_INTERVAL)

    return () => { cancelled = true; clearInterval(id) }
  }, [enabled, measure])

  return quality
}
