import { useState, useRef, useCallback } from 'react'
import RecordRTC from 'recordrtc'

export const useAudioRecording = (backendBaseUrl = 'http://localhost:8000') => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordedText, setRecordedText] = useState('')
  const [audioError, setAudioError] = useState<string | null>(null)

  const recorderRef = useRef<RecordRTC | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  const initializeAudio = useCallback(async () => {
    try {
      setAudioError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream
      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        sampleRate: 16000,
      })
      recorderRef.current = recorder
      if (!audioElementRef.current) audioElementRef.current = new Audio()
      return true
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Failed to init audio'
      setAudioError(msg)
      return false
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!recorderRef.current) {
      const ok = await initializeAudio()
      if (!ok) return false
    }
    recorderRef.current?.startRecording()
    setIsRecording(true)
    return true
  }, [initializeAudio])

  const stopRecordingAndTranscribe = useCallback(
    (interviewId: string) => {
      return new Promise<{
        success: boolean
        text: string
        error: string | null
      }>((resolve) => {
        if (!recorderRef.current) {
          resolve({ success: false, text: '', error: 'No recorder' })
          return
        }
        setIsRecording(false)
        setIsProcessing(true)
        recorderRef.current.stopRecording(async () => {
          try {
            const blob = recorderRef.current?.getBlob()
            if (!blob) {
              resolve({ success: false, text: '', error: 'No audio' })
              return
            }
            const formData = new FormData()
            formData.append('interview_id', interviewId)
            formData.append('audio_file', blob, 'audio.wav')
            formData.append('language', 'en')
            const res = await fetch(
              `${backendBaseUrl}/api/speech/speech-to-text`,
              {
                method: 'POST',
                body: formData,
              },
            )
            const data = await res.json()
            setIsProcessing(false)
            resolve(
              data.success
                ? { success: true, text: data.text, error: null }
                : { success: false, text: '', error: data.error },
            )
          } catch (e) {
            setIsProcessing(false)
            resolve({
              success: false,
              text: '',
              error: e instanceof Error ? e.message : 'Error',
            })
          }
        })
      })
    },
    [backendBaseUrl],
  )

  const playTextToSpeech = useCallback(
    async (text: string, interviewId: string, voice = 'alloy') => {
      if (!text.trim()) {
        setAudioError('No text')
        return false
      }
      try {
        setIsProcessing(true)
        const formData = new FormData()
        formData.append('interview_id', interviewId)
        formData.append('text', text)
        formData.append('voice', voice)
        const res = await fetch(`${backendBaseUrl}/api/speech/text-to-speech`, {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) throw new Error('TTS error')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        if (audioElementRef.current) audioElementRef.current.src = url
        return new Promise<boolean>((resolve) => {
          if (!audioElementRef.current) {
            resolve(false)
            return
          }
          const el = audioElementRef.current
          el.onended = () => {
            URL.revokeObjectURL(url)
            setIsProcessing(false)
            resolve(true)
          }
          el.onerror = () => {
            URL.revokeObjectURL(url)
            setIsProcessing(false)
            resolve(false)
          }
          el.play().catch(() => {
            setIsProcessing(false)
            resolve(false)
          })
        })
      } catch (e) {
        setIsProcessing(false)
        return false
      }
    },
    [backendBaseUrl],
  )

  const cleanup = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.destroy()
      recorderRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }
    setIsRecording(false)
    setIsProcessing(false)
  }, [])

  return {
    isRecording,
    isProcessing,
    recordedText,
    audioError,
    initializeAudio,
    startRecording,
    stopRecordingAndTranscribe,
    playTextToSpeech,
    cleanup,
  }
}
