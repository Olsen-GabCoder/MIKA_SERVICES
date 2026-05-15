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
  const streamRef = useRef<MediaStream | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    setStream(null)
  }, [])

  const startStream = useCallback(async (videoId?: string, audioId?: string) => {
    stopStream()
    try {
      const constraints: MediaStreamConstraints = {
        video: videoId ? { deviceId: { exact: videoId } } : true,
        audio: audioId ? { deviceId: { exact: audioId } } : true,
      }
      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = newStream
      setStream(newStream)
      setError(null)

      // Enumerate devices (labels available after permission granted)
      const devices = await navigator.mediaDevices.enumerateDevices()
      setVideoDevices(
        devices
          .filter(d => d.kind === 'videoinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}` }))
      )
      setAudioDevices(
        devices
          .filter(d => d.kind === 'audioinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Micro ${d.deviceId.slice(0, 5)}` }))
      )

      // Store selected device IDs from the actual tracks
      const videoTrack = newStream.getVideoTracks()[0]
      const audioTrack = newStream.getAudioTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        if (settings.deviceId && !videoId) setSelectedVideoId(settings.deviceId)
      }
      if (audioTrack) {
        const settings = audioTrack.getSettings()
        if (settings.deviceId && !audioId) setSelectedAudioId(settings.deviceId)
      }
    } catch {
      setError('camera_denied')
    }
  }, [stopStream])

  // Initial mount
  useEffect(() => {
    startStream()
    return () => { stopStream() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-acquire on device change
  const handleVideoDeviceChange = useCallback((id: string) => {
    setSelectedVideoId(id)
    startStream(id, selectedAudioId || undefined)
  }, [selectedAudioId, startStream])

  const handleAudioDeviceChange = useCallback((id: string) => {
    setSelectedAudioId(id)
    startStream(selectedVideoId || undefined, id)
  }, [selectedVideoId, startStream])

  const toggleVideo = useCallback(() => {
    if (!streamRef.current) return
    streamRef.current.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled
    })
    setVideoEnabled(prev => !prev)
  }, [])

  const toggleAudio = useCallback(() => {
    if (!streamRef.current) return
    streamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled
    })
    setAudioEnabled(prev => !prev)
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
    cleanup: stopStream,
  }
}
