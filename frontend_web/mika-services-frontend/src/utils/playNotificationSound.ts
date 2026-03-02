/**
 * Joue un court son de notification (sans fichier externe).
 * Utilise la Web Audio API ; ignoré si non supportée ou en erreur.
 */
export function playNotificationSound(): void {
  try {
    if (typeof window === 'undefined') return
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
  } catch {
    // Ignorer si AudioContext non disponible ou politique autoplay
  }
}
