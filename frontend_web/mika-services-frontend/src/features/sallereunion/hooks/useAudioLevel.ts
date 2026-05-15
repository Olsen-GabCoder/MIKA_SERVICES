import { useState, useEffect, useRef } from 'react'

/**
 * Analyse le niveau audio d'un MediaStream en temps reel via Web Audio API.
 * Retourne un niveau normalise entre 0 et 1.
 */
export function useAudioLevel(stream: MediaStream | null, enabled: boolean): number {
  const [level, setLevel] = useState(0)
  const contextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafRef = useRef<number>(0)

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

    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.7

    const source = ctx.createMediaStreamSource(stream)
    source.connect(analyser)

    contextRef.current = ctx
    analyserRef.current = analyser
    sourceRef.current = source

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    function tick() {
      if (!analyserRef.current) return
      analyserRef.current.getByteFrequencyData(dataArray)
      // Average of frequencies as volume indicator
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }
      const avg = sum / dataArray.length / 255
      setLevel(avg)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      sourceRef.current?.disconnect()
      sourceRef.current = null
      analyserRef.current = null
      if (contextRef.current?.state !== 'closed') {
        contextRef.current?.close()
      }
      contextRef.current = null
      setLevel(0)
    }
  }, [stream, enabled])

  return level
}
