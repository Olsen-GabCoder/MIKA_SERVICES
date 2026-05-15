import { useState, useEffect, useCallback, useRef } from 'react'

interface MediaDeviceInfo {
  deviceId: string
  label: string
}

interface UseMediaDevicesReturn {
  stream: MediaStream | null
  videoEnabled: boolean
  audioEnabled: boolean
  toggleVideo: () => void
  toggleAudio: () => void
  videoDevices: MediaDeviceInfo[]
  audioDevices: MediaDeviceInfo[]
  selectedVideoId: string
  selectedAudioId: string
  setSelectedVideoId: (id: string) => void
  setSelectedAudioId: (id: string) => void
  error: string | null
  cleanup: () => void
}

export function useMediaDevices(): UseMediaDevicesReturn {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState('')
  const [selectedAudioId, setSelectedAudioId] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Refs pour éviter les closures stales dans les callbacks
  const streamRef = useRef<MediaStream | null>(null)
  const videoEnabledRef = useRef(true)
  const audioEnabledRef = useRef(true)
  const selectedVideoIdRef = useRef('')
  const selectedAudioIdRef = useRef('')

  // Sync refs
  videoEnabledRef.current = videoEnabled
  audioEnabledRef.current = audioEnabled
  selectedVideoIdRef.current = selectedVideoId
  selectedAudioIdRef.current = selectedAudioId

  const stopAllTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setStream(null)
  }, [])

  const acquireStream = useCallback(async (videoId?: string, audioId?: string) => {
    stopAllTracks()
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: videoId ? { deviceId: { exact: videoId } } : true,
        audio: audioId ? { deviceId: { exact: audioId } } : true,
      })
      streamRef.current = s
      setStream(s)
      setVideoEnabled(true)
      setAudioEnabled(true)
      setError(null)

      const devices = await navigator.mediaDevices.enumerateDevices()
      setVideoDevices(devices.filter(d => d.kind === 'videoinput').map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}` })))
      setAudioDevices(devices.filter(d => d.kind === 'audioinput').map(d => ({ deviceId: d.deviceId, label: d.label || `Micro ${d.deviceId.slice(0, 5)}` })))

      const vt = s.getVideoTracks()[0]
      const at = s.getAudioTracks()[0]
      if (vt?.getSettings().deviceId && !videoId) setSelectedVideoId(vt.getSettings().deviceId!)
      if (at?.getSettings().deviceId && !audioId) setSelectedAudioId(at.getSettings().deviceId!)
    } catch {
      setError('camera_denied')
    }
  }, [stopAllTracks])

  useEffect(() => {
    acquireStream()
    return () => { stopAllTracks() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleVideoDeviceChange = useCallback((id: string) => {
    setSelectedVideoId(id)
    acquireStream(id, selectedAudioIdRef.current || undefined)
  }, [acquireStream])

  const handleAudioDeviceChange = useCallback((id: string) => {
    setSelectedAudioId(id)
    acquireStream(selectedVideoIdRef.current || undefined, id)
  }, [acquireStream])

  const toggleVideo = useCallback(async () => {
    const s = streamRef.current
    if (!s) return

    if (videoEnabledRef.current) {
      // OFF : stopper vraiment la piste vidéo
      s.getVideoTracks().forEach(t => { t.stop(); s.removeTrack(t) })
      setVideoEnabled(false)
    } else {
      // ON : ré-acquérir la piste vidéo
      try {
        const c = selectedVideoIdRef.current ? { deviceId: { exact: selectedVideoIdRef.current } } : true
        const fresh = await navigator.mediaDevices.getUserMedia({ video: c, audio: false })
        const newTrack = fresh.getVideoTracks()[0]
        if (newTrack) {
          s.addTrack(newTrack)
          // Nouveau MediaStream pour forcer le re-render du <video>
          const updated = new MediaStream(s.getTracks())
          streamRef.current = updated
          setStream(updated)
        }
        setVideoEnabled(true)
      } catch {
        setVideoEnabled(false)
      }
    }
  }, [])

  const toggleAudio = useCallback(async () => {
    const s = streamRef.current
    if (!s) return

    if (audioEnabledRef.current) {
      // OFF : stopper vraiment la piste audio
      s.getAudioTracks().forEach(t => { t.stop(); s.removeTrack(t) })
      setAudioEnabled(false)
    } else {
      // ON : ré-acquérir la piste audio
      try {
        const c = selectedAudioIdRef.current ? { deviceId: { exact: selectedAudioIdRef.current } } : true
        const fresh = await navigator.mediaDevices.getUserMedia({ video: false, audio: c })
        const newTrack = fresh.getAudioTracks()[0]
        if (newTrack) {
          s.addTrack(newTrack)
          const updated = new MediaStream(s.getTracks())
          streamRef.current = updated
          setStream(updated)
        }
        setAudioEnabled(true)
      } catch {
        setAudioEnabled(false)
      }
    }
  }, [])

  return {
    stream,
    videoEnabled,
    audioEnabled,
    toggleVideo,
    toggleAudio,
    videoDevices,
    audioDevices,
    selectedVideoId,
    selectedAudioId,
    setSelectedVideoId: handleVideoDeviceChange,
    setSelectedAudioId: handleAudioDeviceChange,
    error,
    cleanup: stopAllTracks,
  }
}
