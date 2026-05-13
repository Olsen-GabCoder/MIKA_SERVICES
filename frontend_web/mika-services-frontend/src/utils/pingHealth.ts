import { API_BASE_URL } from '@/constants/api'

export async function pingHealth(externalSignal?: AbortSignal): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    // Relayer l'annulation externe vers le controller interne (fallback pour navigateurs < AbortSignal.any)
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort()
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
      }
    }

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    })
    clearTimeout(timeoutId)

    if (!response.ok) return false

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) return false

    const data = await response.json()
    return data?.status === 'ok'
  } catch {
    return false
  }
}
