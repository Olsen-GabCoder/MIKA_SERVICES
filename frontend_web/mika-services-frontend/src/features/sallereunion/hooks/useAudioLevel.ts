import { useState, useEffect } from 'react'

/**
 * Analyse le niveau audio du micro en temps reel via Web Audio API.
 * Acquiert son propre stream audio dedie pour eviter les conflits
 * avec le stream partage (video preview, StrictMode, etc.).
 * Retourne un niveau normalise entre 0 et 1.
 */
export function useAudioLevel(stream: MediaStream | null, enabled: boolean): number {
  const [level, setLevel] = useState(0)

  useEffect(() => {
    if (!stream || !enabled) {
      setLevel(0)
      return
    }

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setLevel(0)
      return
    }

    let cancelled = false
    let ctx: AudioContext | null = null
    let ownStream: MediaStream | null = null
    let rafId = 0

    // Stream audio dedie pour l'analyse — evite les conflits avec le stream partage
    // et le deviceId special Windows "communications" qui donne des streams silencieux.
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(s => {
        if (cancelled) {
          s.getTracks().forEach(t => t.stop())
          return
        }

        ownStream = s
        ctx = new AudioContext()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.5

        const source = ctx.createMediaStreamSource(s)
        source.connect(analyser)

        // Chrome exige un graph audio complet pour traiter les donnees
        const silentGain = ctx.createGain()
        silentGain.gain.value = 0
        analyser.connect(silentGain)
        silentGain.connect(ctx.destination)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        function tick() {
          if (cancelled) return
          analyser.getByteTimeDomainData(dataArray)
          let sumSquares = 0
          for (let i = 0; i < dataArray.length; i++) {
            const deviation = (dataArray[i] - 128) / 128
            sumSquares += deviation * deviation
          }
          setLevel(Math.sqrt(sumSquares / dataArray.length))
          rafId = requestAnimationFrame(tick)
        }

        rafId = requestAnimationFrame(tick)
      })
      .catch(() => {
        // Permission refusee ou erreur — le VU-metre reste a 0
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      ownStream?.getTracks().forEach(t => t.stop())
      if (ctx?.state !== 'closed') {
        ctx?.close()
      }
      setLevel(0)
    }
  }, [stream, enabled])

  return level
}
