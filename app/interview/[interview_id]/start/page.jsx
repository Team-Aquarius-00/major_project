'use client'
import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react'
import { useParams, useRouter } from 'next/navigation'
import { InterviewDataContext } from '../../../../context/InterviewDataContext'
import {
  Mic,
  MicOff,
  PhoneOff,
  Timer,
  Volume2,
  VolumeX,
  AlertTriangle,
  Play,
  Bot,
  MessageCircle,
  Video,
  VideoOff,
  Camera,
  Eye,
  Monitor,
  Activity,
} from 'lucide-react'
import Vapi from '@vapi-ai/web'
import AlertConfirmation from './_components/AlertConfirmation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import InterviewTrackingService from '@/services/interviewTrackingService'
import InterviewFeedback from './_components/InterviewFeedback'
import { useInterviewAlerts } from '@/hooks/useInterviewAlerts'

function StartInterview() {
  const { interviewInfo } = useContext(InterviewDataContext)
  const { interview_id } = useParams()
  const router = useRouter()
  const [vapi, setVapi] = useState(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [activeUser, setActiveUser] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [interviewProgress, setInterviewProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Video states
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [videoStream, setVideoStream] = useState(null)
  const [videoError, setVideoError] = useState(null)
  const [isVideoLoading, setIsVideoLoading] = useState(false)

  // Tracking states
  const [trackingService, setTrackingService] = useState(null)
  const [focusMetrics, setFocusMetrics] = useState({
    eyeMovement: { distractions: 0, totalSamples: 0, distractionRate: 0 },
    tabSwitches: {
      count: 0,
      uiSwitchCount: 0,
      totalTimeAway: 0,
      focusScore: 100,
    },
    screenFocus: { percentage: 100 },
  })
  const [trackingStatus, setTrackingStatus] = useState('inactive')
  const [maxTabSwitches] = useState(5)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [conversationLog, setConversationLog] = useState([])
  const [qaPairs, setQaPairs] = useState([])
  const [answerAnalyses, setAnswerAnalyses] = useState({})
  const [showFeedback, setShowFeedback] = useState(false)
  const [detectedClasses, setDetectedClasses] = useState([])
  const [detectionViolations, setDetectionViolations] = useState([])
  const [detectionScore, setDetectionScore] = useState(0)
  const [detectionTotalScore, setDetectionTotalScore] = useState(0)
  const [detectionSampleCount, setDetectionSampleCount] = useState(0)
  const [detectionMaxScore, setDetectionMaxScore] = useState(0)
  const [isDetectionRunning, setIsDetectionRunning] = useState(false)

  // Interview Alerts (Real-time monitoring)
  const { alerts, isConnected } = useInterviewAlerts(
    String(interview_id),
    isCallActive,
  )

  const durationRef = useRef(null)
  const progressRef = useRef(null)
  const videoRef = useRef(null)
  const detectionCanvasRef = useRef(null)
  const trackingIntervalRef = useRef(null)
  const detectionIntervalRef = useRef(null)
  const callDurationRef = useRef(0)
  const currentQuestionRef = useRef(0)
  const totalQuestionsRef = useRef(0)
  const alertsRef = useRef([])
  const trackingServiceRef = useRef(null)
  const qaPairsRef = useRef([])
  const conversationLogRef = useRef([])
  const answerAnalysesRef = useRef({})
  const detectionClassCountsRef = useRef({})
  const detectionNonPersonClassesRef = useRef([])
  const detectionSnapshotEventsRef = useRef([])
  const autoStoppedByTabLimitRef = useRef(false)
  const lastAssistantQuestionRef = useRef('')
  const lastAssistantQuestionAtRef = useRef(0)
  const lastAssistantMessageAtRef = useRef(0)
  const answerAnalysisDebounceRef = useRef(null)

  const clampPercent = (value) =>
    Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))

  const computeAnswerScore = (analyses) => {
    const scores = Object.values(analyses || {})
      .map((item) => Number(item?.score || 0))
      .filter((value) => Number.isFinite(value))

    if (!scores.length) {
      return { answerScore: 0, analyzedAnswerCount: 0 }
    }

    const average =
      scores.reduce((sum, value) => sum + value, 0) / scores.length

    return {
      answerScore: Math.round(average),
      analyzedAnswerCount: scores.length,
    }
  }

  const computeIntegrityScore = ({
    detectionRiskPercent,
    screenFocusPercent,
    eyeFocusPercent,
    tabSwitchRiskPercent,
  }) => {
    const D = 100 - clampPercent(detectionRiskPercent)
    const S = clampPercent(screenFocusPercent)
    const E = clampPercent(eyeFocusPercent)
    const T = 100 - clampPercent(tabSwitchRiskPercent)

    return Math.round(0.35 * D + 0.25 * S + 0.25 * E + 0.15 * T)
  }

  const computeFinalManagerScore = (answerScore, integrityScore) =>
    Math.round(
      0.8 * Number(answerScore || 0) + 0.2 * Number(integrityScore || 0),
    )

  const resetDetectionMetrics = () => {
    setDetectionScore(0)
    setDetectionTotalScore(0)
    setDetectionSampleCount(0)
    setDetectionMaxScore(0)
    setDetectedClasses([])
    setDetectionViolations([])
    detectionClassCountsRef.current = {}
    detectionNonPersonClassesRef.current = []
    detectionSnapshotEventsRef.current = []
  }

  useEffect(() => {
    if (interviewInfo) {
      initializeInterview()
      initializeVideo()
      initializeTracking()
    } else {
      // If user opened the start URL directly (no context), redirect them
      // back to the interview join page so they can enter their name.
      if (interview_id) {
        router.replace('/interview/' + interview_id)
      } else {
        setError(
          'Interview information not found. Please go back and try again.',
        )
      }
    }
  }, [interviewInfo])

  // Manage tracking when call status changes
  useEffect(() => {
    if (trackingService) {
      if (isCallActive) {
        // Ensure tracking is active when call starts
        if (!trackingService.isTracking) {
          trackingService.startTracking()
          setTrackingStatus('active')
          console.log('Tracking resumed due to call activation')
        }
      } else {
        // Pause tracking when call is not active
        if (trackingService.isTracking) {
          trackingService.stopTracking()
          setTrackingStatus('paused')
          console.log('Tracking paused due to call deactivation')
        }
      }
    }
  }, [isCallActive, trackingService])

  // Debug tracking service status
  useEffect(() => {
    if (trackingService) {
      console.log('Tracking service status:', {
        isTracking: trackingService.isTracking,
        focusMetrics: trackingService.getFocusMetrics(),
        trackingStatus,
      })
    }
  }, [trackingService, trackingStatus])

  useEffect(() => {
    if (isCallActive) {
      durationRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (durationRef.current) clearInterval(durationRef.current)
    }
  }, [isCallActive])

  useEffect(() => {
    callDurationRef.current = callDuration
  }, [callDuration])

  useEffect(() => {
    currentQuestionRef.current = currentQuestion
  }, [currentQuestion])

  useEffect(() => {
    totalQuestionsRef.current = totalQuestions
  }, [totalQuestions])

  useEffect(() => {
    alertsRef.current = alerts || []
  }, [alerts])

  useEffect(() => {
    trackingServiceRef.current = trackingService
  }, [trackingService])

  useEffect(() => {
    qaPairsRef.current = qaPairs
  }, [qaPairs])

  useEffect(() => {
    conversationLogRef.current = conversationLog
  }, [conversationLog])

  useEffect(() => {
    answerAnalysesRef.current = answerAnalyses
  }, [answerAnalyses])

  useEffect(() => {
    return () => {
      if (answerAnalysisDebounceRef.current) {
        clearTimeout(answerAnalysisDebounceRef.current)
      }
    }
  }, [])

  const stopLiveDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    setIsDetectionRunning(false)
  }

  const captureDetectionFrame = async () => {
    if (!videoRef.current || !detectionCanvasRef.current || !isVideoOn) return

    const videoElement = videoRef.current
    if (videoElement.readyState < 2) return

    const canvas = detectionCanvasRef.current
    const width = videoElement.videoWidth || 640
    const height = videoElement.videoHeight || 480
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return

    context.drawImage(videoElement, 0, 0, width, height)

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    })

    if (!blob) return

    const formData = new FormData()
    formData.append('file', blob, 'frame.jpg')

    try {
      const response = await fetch('/api/object-detection', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Detection request failed: ${response.status}`)
      }

      const data = await response.json()
      const frameClasses = Array.isArray(data?.classes) ? data.classes : []
      setDetectedClasses(frameClasses)
      setDetectionViolations(
        Array.isArray(data?.violations) ? data.violations : [],
      )

      // Keep aggregate object-detection class stats for persistence/reporting.
      const updatedClassCounts = { ...(detectionClassCountsRef.current || {}) }
      frameClasses.forEach((detectedClass) => {
        const label = String(detectedClass || '')
          .trim()
          .toLowerCase()
        if (!label) return
        updatedClassCounts[label] = (updatedClassCounts[label] || 0) + 1
      })
      detectionClassCountsRef.current = updatedClassCounts

      const nonPersonClassSet = new Set(detectionNonPersonClassesRef.current)
      frameClasses.forEach((detectedClass) => {
        const label = String(detectedClass || '')
          .trim()
          .toLowerCase()
        if (!label || label === 'person') return
        nonPersonClassSet.add(label)
      })
      detectionNonPersonClassesRef.current = Array.from(nonPersonClassSet)

      const snapshotUrl = String(data?.snapshot_full_url || '').trim()
      const snapshotClasses = Array.isArray(data?.snapshot_classes)
        ? data.snapshot_classes
        : []
      if (snapshotUrl) {
        const previous = detectionSnapshotEventsRef.current || []
        const exists = previous.some((item) => item?.url === snapshotUrl)

        if (!exists) {
          detectionSnapshotEventsRef.current = [
            ...previous,
            {
              url: snapshotUrl,
              classes: snapshotClasses,
              capturedAt: new Date().toISOString(),
            },
          ]
        }
      }

      const frameDetectionScore =
        typeof data?.score === 'number' ? Math.max(0, data.score) : 0
      setDetectionScore(frameDetectionScore)
      setDetectionTotalScore((prev) => prev + frameDetectionScore)
      setDetectionSampleCount((prev) => prev + 1)
      setDetectionMaxScore((prev) => Math.max(prev, frameDetectionScore))

      const tracking = trackingServiceRef.current
      if (tracking) {
        tracking.updateGazeObservation({
          facePresent: Boolean(data?.face_present),
          personCount: Number(data?.person_count ?? 0),
        })
        setFocusMetrics(tracking.getFocusMetrics())
      }
    } catch (detectionError) {
      console.debug('Live detection skipped:', detectionError)
    }
  }

  const startLiveDetection = () => {
    if (detectionIntervalRef.current) return

    setIsDetectionRunning(true)
    captureDetectionFrame()
    detectionIntervalRef.current = setInterval(captureDetectionFrame, 5000)
  }

  useEffect(() => {
    if (isCallActive) {
      startLiveDetection()
    } else {
      stopLiveDetection()
    }

    return () => {
      stopLiveDetection()
    }
  }, [isCallActive, isVideoOn])

  // Initialize tracking service
  const initializeTracking = () => {
    if (!interviewInfo?.interview_id || !interviewInfo?.userName) {
      console.warn('Cannot initialize tracking: missing interview info')
      return
    }

    try {
      const service = new InterviewTrackingService(
        interviewInfo.interview_id,
        interviewInfo.userName,
      )
      setTrackingService(service)

      // Override the handleTabSwitch method to add UI notifications
      const originalHandleTabSwitch = service.handleTabSwitch.bind(service)
      service.handleTabSwitch = async (eventType) => {
        const beforeMetrics = service.getFocusMetrics()
        const previousSwitchCount = beforeMetrics.tabSwitches.uiSwitchCount

        // Call original method to handle the actual tracking logic
        await originalHandleTabSwitch(eventType)

        // Update UI with latest metrics
        const updatedMetrics = service.getFocusMetrics()
        setFocusMetrics(updatedMetrics)

        const updatedSwitchCount = updatedMetrics.tabSwitches.uiSwitchCount
        const isAwayEvent =
          eventType === 'switch_away' || eventType === 'window_blur'

        // Show notifications only when a new away transition is actually counted.
        if (isAwayEvent && updatedSwitchCount > previousSwitchCount) {
          if (updatedSwitchCount <= maxTabSwitches) {
            toast.warning(
              `New tab added! (${updatedSwitchCount}/${maxTabSwitches})`,
              {
                description: 'Please stay focused on the interview.',
                duration: 3000,
              },
            )
          } else {
            toast.error(
              `Maximum tab switches exceeded! (${updatedSwitchCount}/${maxTabSwitches})`,
              {
                description: 'This may affect your interview score.',
                duration: 5000,
              },
            )
          }
        }
      }

      // Add global reference for debugging (development only)
      if (process.env.NODE_ENV === 'development') {
        window.trackingService = service
        console.log(
          'Tracking service available globally as window.trackingService',
        )
      }

      // Keep service ready, but start tracking only after interview starts.
      setTrackingStatus('inactive')

      // Update focus metrics every 2 seconds for more responsive updates
      trackingIntervalRef.current = setInterval(() => {
        if (service && service.isTracking) {
          const metrics = service.getFocusMetrics()
          setFocusMetrics(metrics)
        }
      }, 2000)

      console.log(
        'Tracking service initialized and waiting for interview start',
      )
    } catch (error) {
      console.error('Failed to initialize tracking service:', error)
      setTrackingStatus('error')
      toast.error('Failed to initialize focus tracking')
    }
  }

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      if (trackingService) {
        trackingService.stopTracking()
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
      }
    }
  }, [trackingService])

  // Initialize video camera
  const initializeVideo = async () => {
    if (isVideoLoading) return // Prevent multiple initialization attempts

    try {
      setIsVideoLoading(true)
      setVideoError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })

      setVideoStream(stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      console.log('Video stream initialized successfully')
    } catch (err) {
      console.error('Failed to access camera:', err)
      let errorMessage =
        'Camera access denied. Please allow camera permissions.'

      if (err.name === 'NotAllowedError') {
        errorMessage =
          'Camera permission denied. Please enable camera access in your browser settings.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.'
      } else if (err.name === 'NotReadableError') {
        errorMessage =
          'Camera is being used by another application. Please close other apps using the camera.'
      }

      setVideoError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsVideoLoading(false)
    }
  }

  // Cleanup video stream
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [videoStream])

  const toggleVideo = () => {
    if (videoStream) {
      const videoTrack = videoStream.getVideoTracks()[0]
      if (videoTrack) {
        if (isVideoOn) {
          videoTrack.enabled = false
          setIsVideoOn(false)
          toast.info('Camera turned off')
        } else {
          videoTrack.enabled = true
          setIsVideoOn(true)
          toast.success('Camera turned on')
        }
      }
    }
  }

  const initializeInterview = () => {
    setIsLoading(true)

    if (!interview_id) {
      setError('Invalid interview session. Please start over.')
      setIsLoading(false)
      return
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY

      // Debug logging
      console.log('Vapi initialization:', {
        apiKeyExists: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
      })

      if (!apiKey) {
        setError(
          'Vapi API key is missing. Please check your environment variables.',
        )
        setIsLoading(false)
        return
      }

      const vapiInstance = new Vapi(apiKey)

      // Test connection
      console.log('Vapi instance created:', vapiInstance)
      setVapi(vapiInstance)

      // Set up event listeners
      setupVapiEventListeners(vapiInstance)

      // Calculate total questions
      const questions = interviewInfo?.interviewData?.questionList || []
      setTotalQuestions(questions.length)
      setError(null)

      console.log('Interview initialized successfully')
    } catch (err) {
      console.error('Vapi initialization error:', {
        message: err.message,
        stack: err.stack,
        error: err,
      })
      setError(
        `Failed to initialize Vapi: ${
          err.message || 'Unknown error'
        }. Please refresh the page.`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const normalizeText = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')

  const mergeTranscriptText = (currentText, incomingText) => {
    const existing = String(currentText || '').trim()
    const incoming = String(incomingText || '').trim()

    if (!incoming) return existing
    if (!existing) return incoming
    if (existing.includes(incoming)) return existing
    if (incoming.includes(existing)) return incoming

    return `${existing} ${incoming}`.trim()
  }

  const extractMessageText = (message) => {
    if (!message) return ''

    if (typeof message === 'string') return message
    if (typeof message.transcript === 'string') return message.transcript
    if (typeof message.text === 'string') return message.text
    if (typeof message.message === 'string') return message.message
    if (typeof message.content === 'string') return message.content

    if (Array.isArray(message.content)) {
      return message.content
        .map((item) => item?.text || item?.content || '')
        .filter(Boolean)
        .join(' ')
    }

    return ''
  }

  const extractMessageRole = (message) => {
    const role = String(message?.role || message?.speaker || '').toLowerCase()

    if (
      role.includes('assistant') ||
      role.includes('bot') ||
      role.includes('ai')
    ) {
      return 'assistant'
    }

    if (
      role.includes('user') ||
      role.includes('human') ||
      role.includes('candidate')
    ) {
      return 'user'
    }

    return null
  }

  const appendConversationEntry = (role, text, message) => {
    const entry = {
      role,
      text,
      timestamp: new Date().toISOString(),
      type: message?.type || null,
    }

    setConversationLog((prev) => [...prev, entry])
  }

  const isLikelyQuestion = (text) => {
    const lower = normalizeText(text)
    if (!lower) return false

    return (
      lower.includes('?') ||
      /^(what|why|how|when|where|tell|describe|explain|walk|can you|could you)/.test(
        lower,
      )
    )
  }

  const isPotentialDuplicateQuestion = (previousText, nextText) => {
    const previous = normalizeText(previousText)
    const next = normalizeText(nextText)

    if (!previous || !next) return false
    if (previous === next) return true
    if (previous.includes(next) || next.includes(previous)) return true

    return false
  }

  const assignAssistantQuestion = (text) => {
    const normalizedIncoming = normalizeText(text)
    const questions = interviewInfo?.interviewData?.questionList || []

    if (!isLikelyQuestion(text)) {
      return
    }

    // Vapi emits multiple assistant message chunks for the same utterance.
    // Ignore near-duplicate question messages to prevent progress jumps.
    const now = Date.now()
    if (
      isPotentialDuplicateQuestion(
        lastAssistantQuestionRef.current,
        normalizedIncoming,
      ) &&
      now - lastAssistantQuestionAtRef.current < 10000
    ) {
      return
    }

    const existingPairs = qaPairsRef.current || []
    const askedPairs = existingPairs.filter((pair) => pair?.askedByAssistant)
    const nextQuestionIndex = askedPairs.length

    if (nextQuestionIndex >= questions.length) {
      return
    }

    const configuredQuestion =
      questions[nextQuestionIndex]?.question ||
      `Question ${nextQuestionIndex + 1}`

    const updated = [
      ...existingPairs,
      {
        questionNumber: nextQuestionIndex + 1,
        configuredQuestion,
        askedByAssistant: text,
        answer: '',
        askedAt: new Date().toISOString(),
      },
    ]

    qaPairsRef.current = updated
    setQaPairs(updated)

    const newQuestionCount = Math.min(nextQuestionIndex + 1, questions.length)
    setCurrentQuestion(newQuestionCount)
    setInterviewProgress(
      (newQuestionCount / Math.max(questions.length, 1)) * 100,
    )

    lastAssistantQuestionRef.current = normalizedIncoming
    lastAssistantQuestionAtRef.current = now
  }

  const assignUserAnswer = (text) => {
    if (!text.trim()) return

    setCurrentAnswer(text)
    const questions = interviewInfo?.interviewData?.questionList || []
    const existingPairs = [...(qaPairsRef.current || [])]

    // If assistant-question detection misses the first turn, seed Q1 automatically.
    if (!existingPairs.length) {
      existingPairs.push({
        questionNumber: 1,
        configuredQuestion: questions[0]?.question || 'Question 1',
        askedByAssistant: '(auto-detected)',
        answer: '',
        askedAt: new Date().toISOString(),
      })
    }

    let lastAskedIndex = [...existingPairs]
      .map((pair, index) => ({ pair, index }))
      .reverse()
      .find((entry) => entry?.pair?.askedByAssistant)?.index

    if (typeof lastAskedIndex !== 'number') {
      lastAskedIndex = existingPairs.length - 1
    }

    const updated = [...existingPairs]

    const currentPair = updated[lastAskedIndex]
    const currentAnsweredAtMs = currentPair?.answeredAt
      ? Date.parse(String(currentPair.answeredAt))
      : 0
    const hasCurrentAnswer = String(currentPair?.answer || '').trim().length > 0

    // If assistant spoke after the current answer, treat this as the next question's answer,
    // even when strict question detection did not fire.
    const shouldCreateNextPair =
      hasCurrentAnswer &&
      currentAnsweredAtMs > 0 &&
      lastAssistantMessageAtRef.current > currentAnsweredAtMs + 250

    if (shouldCreateNextPair) {
      const nextQuestionIndex = updated.length
      if (
        nextQuestionIndex < Math.max(questions.length, nextQuestionIndex + 1)
      ) {
        updated.push({
          questionNumber: nextQuestionIndex + 1,
          configuredQuestion:
            questions[nextQuestionIndex]?.question ||
            `Question ${nextQuestionIndex + 1}`,
          askedByAssistant: '(auto-detected)',
          answer: '',
          askedAt: new Date().toISOString(),
        })

        const newQuestionCount = Math.min(
          nextQuestionIndex + 1,
          questions.length || nextQuestionIndex + 1,
        )
        setCurrentQuestion(newQuestionCount)
        setInterviewProgress(
          (newQuestionCount /
            Math.max(questions.length || newQuestionCount, 1)) *
            100,
        )
        lastAskedIndex = updated.length - 1
      }
    }

    updated[lastAskedIndex] = {
      ...updated[lastAskedIndex],
      answer: mergeTranscriptText(updated[lastAskedIndex]?.answer, text),
      answeredAt: new Date().toISOString(),
    }

    qaPairsRef.current = updated
    setQaPairs(updated)

    const pairForAnalysis = updated[lastAskedIndex]
    queueAnswerAnalysis(pairForAnalysis)
  }

  const upsertAnswerAnalysis = (analysis) => {
    const questionNumber = Number(analysis?.questionNumber || 0)
    if (!questionNumber) return

    setAnswerAnalyses((prev) => {
      const next = {
        ...prev,
        [questionNumber]: {
          questionNumber,
          score: Number(analysis?.score || 0),
          summary: String(analysis?.summary || ''),
          strengths: Array.isArray(analysis?.strengths)
            ? analysis.strengths
            : [],
          improvements: Array.isArray(analysis?.improvements)
            ? analysis.improvements
            : [],
          updatedAt: new Date().toISOString(),
        },
      }

      // Keep ref in sync immediately so call-end scoring does not read stale state.
      answerAnalysesRef.current = next
      return next
    })
  }

  const analyzeSingleAnswer = async (pair) => {
    const answer = String(pair?.answer || '').trim()
    if (!answer) {
      return
    }

    try {
      const response = await fetch(
        `/api/interview/${interview_id}/analyze-answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionNumber: pair?.questionNumber,
            question: pair?.configuredQuestion || pair?.askedByAssistant || '',
            answer,
            jobPosition:
              interviewInfo?.interviewData?.job_position ||
              interviewInfo?.interviewData?.jobPosition ||
              '',
          }),
        },
      )

      if (!response.ok) {
        return
      }

      const analysis = await response.json()
      upsertAnswerAnalysis(analysis)
    } catch (analysisError) {
      console.debug('Single answer analysis skipped:', analysisError)
    }
  }

  const analyzePendingAnswers = async () => {
    const allPairs = qaPairsRef.current || []

    for (const pair of allPairs) {
      const questionNumber = Number(pair?.questionNumber || 0)
      const answer = String(pair?.answer || '').trim()

      if (!questionNumber || !answer) {
        continue
      }

      const existing = answerAnalysesRef.current?.[questionNumber]
      const alreadyAnalyzed =
        existing && Number.isFinite(Number(existing?.score))

      if (!alreadyAnalyzed) {
        await analyzeSingleAnswer(pair)
      }
    }
  }

  const backfillMissingAnalyses = () => {
    const allPairs = qaPairsRef.current || []

    allPairs.forEach((pair) => {
      const questionNumber = Number(pair?.questionNumber || 0)
      const answer = String(pair?.answer || '').trim()

      if (!questionNumber || !answer) {
        return
      }

      const existing = answerAnalysesRef.current?.[questionNumber]
      const alreadyAnalyzed =
        existing && Number.isFinite(Number(existing?.score))

      if (!alreadyAnalyzed) {
        upsertAnswerAnalysis({
          questionNumber,
          score: 0,
          summary: 'Automatic analysis could not be completed for this answer.',
          strengths: [],
          improvements: ['Review this answer manually.'],
        })
      }
    })
  }

  const queueAnswerAnalysis = (pair) => {
    if (!pair?.questionNumber) return

    if (answerAnalysisDebounceRef.current) {
      clearTimeout(answerAnalysisDebounceRef.current)
    }

    answerAnalysisDebounceRef.current = setTimeout(() => {
      analyzeSingleAnswer(pair)
    }, 1200)
  }

  const setupVapiEventListeners = (vapiInstance) => {
    vapiInstance.on('error', (e) => {
      console.error('Vapi error event:', e)
      toast.error('Vapi error occurred. Please try again.')
    })

    vapiInstance.on('call-start-failed', (e) => {
      console.error('Vapi call start failed:', e)
      toast.error('Failed to start interview call.')
    })
    vapiInstance.on('call-start', async () => {
      console.log('Call has started')
      setIsCallActive(true)

      toast.success('Interview started successfully!')

      // Notify backend that interview session has started
      try {
        await fetch('/api/interview/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interview_id: interview_id,
            candidate_name: interviewInfo?.userName,
            job_position: interviewInfo?.interviewData?.job_position,
            start_time: new Date().toISOString(),
          }),
        })
        console.log('Session start notified to backend')
      } catch (error) {
        console.error('Failed to notify backend of session start:', error)
      }
    })

    vapiInstance.on('call-end', async () => {
      console.log('Call has ended')
      setIsCallActive(false)

      toast.info('Interview session ended')

      const service = trackingServiceRef.current
      const finalMetrics = service ? service.getFocusMetrics() : null

      if (service) {
        service.stopTracking()
      }

      let llmAnalysis = null
      try {
        const analysisResponse = await fetch(
          `/api/interview/${interview_id}/analyze`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              interviewId: String(interview_id),
              candidateName: interviewInfo?.userName,
              jobPosition:
                interviewInfo?.interviewData?.job_position ||
                interviewInfo?.interviewData?.jobPosition ||
                '',
              questionList: interviewInfo?.interviewData?.questionList || [],
              qaPairs: qaPairsRef.current,
              transcript: conversationLogRef.current,
            }),
          },
        )

        if (analysisResponse.ok) {
          llmAnalysis = await analysisResponse.json()
        } else {
          const failurePayload = await analysisResponse.json().catch(() => ({}))
          console.error('Analysis API failed:', failurePayload)
        }
      } catch (analysisError) {
        console.error('Error analyzing interview transcript:', analysisError)
      }

      // Run any pending per-answer analysis before final save.
      if (answerAnalysisDebounceRef.current) {
        clearTimeout(answerAnalysisDebounceRef.current)
        answerAnalysisDebounceRef.current = null
      }
      await analyzePendingAnswers()
      backfillMissingAnalyses()

      const perAnswerScores = answerAnalysesRef.current
      const { answerScore, analyzedAnswerCount } =
        computeAnswerScore(perAnswerScores)

      // Save interview results with transcript and LLM score
      try {
        const duration = callDurationRef.current
        const answeredQuestions = currentQuestionRef.current
        const configuredQuestions = totalQuestionsRef.current
        const safeAnsweredQuestions = Math.max(answeredQuestions, 1)
        const averageDetectionScore =
          detectionSampleCount > 0
            ? Number((detectionTotalScore / detectionSampleCount).toFixed(2))
            : 0

        // Detection score can reach up to 125 per frame in the backend logic.
        const detectionRiskPercent = clampPercent(
          (averageDetectionScore / 125) * 100,
        )
        const screenFocusPercent = clampPercent(
          Number(finalMetrics?.screenFocus?.percentage ?? 0),
        )
        const finalDistractionRate = Number(
          finalMetrics?.eyeMovement?.distractionRate ?? 0,
        )
        const eyeFocusPercentFinal = clampPercent(
          (1 - finalDistractionRate) * 100,
        )
        const tabSwitchCount = Number(
          finalMetrics?.tabSwitches?.uiSwitchCount || 0,
        )
        const tabSwitchRiskPercent = clampPercent(
          (tabSwitchCount / Math.max(maxTabSwitches, 1)) * 100,
        )

        const finalIntegrityScore = computeIntegrityScore({
          detectionRiskPercent,
          screenFocusPercent,
          eyeFocusPercent: eyeFocusPercentFinal,
          tabSwitchRiskPercent,
        })

        const integrityComponentD = Math.round(100 - detectionRiskPercent)
        const integrityComponentS = Math.round(screenFocusPercent)
        const integrityComponentE = Math.round(eyeFocusPercentFinal)
        const integrityComponentT = Math.round(100 - tabSwitchRiskPercent)

        const detectedObjectClassCounts = {
          ...(detectionClassCountsRef.current || {}),
        }
        const nonPersonDetectedClasses = [
          ...(detectionNonPersonClassesRef.current || []),
        ]

        const finalManagerScore = computeFinalManagerScore(
          answerScore,
          finalIntegrityScore,
        )
        const finalCheatingRiskScore = 100 - finalIntegrityScore

        const response = await fetch(`/api/interview/${interview_id}/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration,
            completed: true,
          }),
        })

        if (response.ok) {
          console.log('Interview results saved successfully')

          // Save results per candidate attempt for InterviewAttempt history.
          if (interviewInfo?.interviewAttemptId) {
            await fetch('/api/interview-attempt', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                attempt_id: interviewInfo.interviewAttemptId,
                completed: true,
                feedback: {
                  tab_switches: finalMetrics?.tabSwitches?.uiSwitchCount || 0,
                  gaze_alerts: finalMetrics?.eyeMovement?.distractions || 0,
                  focus_score: finalMetrics?.tabSwitches?.focusScore || 0,
                  detection_score_latest: detectionScore,
                  detection_score_total: detectionTotalScore,
                  detection_score_average: averageDetectionScore,
                  detection_score_max: detectionMaxScore,
                  detection_samples: detectionSampleCount,
                  transcript: conversationLogRef.current,
                  qa_pairs: qaPairsRef.current,
                  llm_summary: llmAnalysis?.summary || null,
                  recommendation: llmAnalysis?.recommendation || null,
                  strengths: llmAnalysis?.strengths || [],
                  improvement_areas: llmAnalysis?.improvementAreas || [],
                  detected_classes_non_person: nonPersonDetectedClasses,
                },
                scoring: {
                  questions_answered: answeredQuestions,
                  total_questions: configuredQuestions,
                  time_per_question: duration / safeAnsweredQuestions,
                  analyzed_answers_count: analyzedAnswerCount,
                  answer_score: answerScore,
                  integrity_score: finalIntegrityScore,
                  final_manager_score: finalManagerScore,
                  llm_overall_score: llmAnalysis?.overallScore ?? null,
                  llm_category_scores: llmAnalysis?.categoryScores || null,
                  answer_scores: perAnswerScores,
                  question_scores: llmAnalysis?.questionEvaluations || [],
                  proctoring_metrics: {
                    detection_score_total: detectionTotalScore,
                    detection_score_average: averageDetectionScore,
                    detection_score_max: detectionMaxScore,
                    detection_samples: detectionSampleCount,
                    screen_focus_percentage: screenFocusPercent,
                    eye_focus_percentage: eyeFocusPercentFinal,
                    tab_switches: tabSwitchCount,
                    detection_risk_percentage: Math.round(detectionRiskPercent),
                    tab_switch_risk_percentage:
                      Math.round(tabSwitchRiskPercent),
                    integrity_components: {
                      D: integrityComponentD,
                      S: integrityComponentS,
                      E: integrityComponentE,
                      T: integrityComponentT,
                    },
                    detected_object_classes_non_person:
                      nonPersonDetectedClasses,
                    detected_object_class_counts: detectedObjectClassCounts,
                    final_integrity_score: finalIntegrityScore,
                    final_cheating_risk_score: finalCheatingRiskScore,
                  },
                },
                tracking: {
                  final_metrics: finalMetrics,
                  alerts: alertsRef.current,
                  detection: {
                    latest_score: detectionScore,
                    total_score: detectionTotalScore,
                    average_score: averageDetectionScore,
                    max_score: detectionMaxScore,
                    samples: detectionSampleCount,
                    classes_latest: detectedClasses,
                    class_counts: detectedObjectClassCounts,
                    non_person_classes_seen: nonPersonDetectedClasses,
                    evidence_snapshots: detectionSnapshotEventsRef.current,
                  },
                },
                answer_score: answerScore,
                integrity_score: finalIntegrityScore,
                final_manager_score: finalManagerScore,
                analyzed_answers_count: analyzedAnswerCount,
              }),
            })
          }

          setShowFeedback(true)
        } else {
          console.error(
            'Failed to save interview results:',
            response.statusText,
          )
        }
      } catch (saveError) {
        console.error('Error saving interview results:', saveError)
        toast.error('Failed to save interview results')
      }
    })

    vapiInstance.on('speech-start', () => {
      console.log('AI speech has started')
      setActiveUser(false)
    })

    vapiInstance.on('speech-end', () => {
      console.log('AI speech has ended')
      setActiveUser(true)
    })

    vapiInstance.on('message', (message) => {
      const role = extractMessageRole(message)
      const text = extractMessageText(message)

      if (!role || !text) {
        return
      }

      appendConversationEntry(role, text, message)

      if (role === 'assistant') {
        lastAssistantMessageAtRef.current = Date.now()
        assignAssistantQuestion(text)
      }

      if (role === 'user') {
        assignUserAnswer(text)
      }
    })
  }

  const startCall = async () => {
    if (!vapi || !interviewInfo) {
      console.error('Cannot start call:', {
        vapiExists: !!vapi,
        infoExists: !!interviewInfo,
      })
      toast.error('Vapi not initialized. Please refresh the page.')
      return
    }

    try {
      const jobPosition =
        interviewInfo?.interviewData?.job_position ||
        interviewInfo?.interviewData?.jobPosition ||
        'this role'

      const questionList = interviewInfo?.interviewData?.questionList
        ?.map((item) => item?.question)
        .join(', ')

      if (!questionList) {
        toast.error('No questions found for this interview')
        return
      }

      console.log('Starting Vapi call with:', {
        userName: interviewInfo?.userName,
        jobPosition,
        questionsCount: interviewInfo?.interviewData?.questionList?.length,
      })

      const assistantOptions = {
        name: 'AI Recruiter',
        firstMessage: `Hi ${interviewInfo?.userName}, welcome to your ${jobPosition} interview! I'm excited to chat with you today. Let's begin with a few questions to get to know you better.`,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `
You are an AI voice assistant conducting a professional interview for the position of ${jobPosition}. Your role is to:

1. Begin with a warm, professional greeting
2. Ask one question at a time from this list: ${questionList}
3. Listen carefully to responses.
4. Keep the conversation natural.

Guidelines:
- Be friendly but professional
- End with: "Great work today! Thanks for your time."

`,
            },
          ],
        },
      }

      console.log('Calling vapi.start() with assistant options')
      resetDetectionMetrics()
      startLiveDetection()
      await vapi.start(assistantOptions)
    } catch (error) {
      stopLiveDetection()
      console.error('Failed to start call:', {
        message: error.message,
        stack: error.stack,
        error: error,
      })
      toast.error(`Failed to start interview: ${error.message}`)
    }
  }

  const stopInterview = useCallback(() => {
    if (vapi) {
      vapi.stop()
      setIsCallActive(false)
    }
  }, [vapi])

  useEffect(() => {
    if (!isCallActive) {
      autoStoppedByTabLimitRef.current = false
      return
    }

    const uiSwitchCount = Number(focusMetrics?.tabSwitches?.uiSwitchCount || 0)

    if (uiSwitchCount > maxTabSwitches && !autoStoppedByTabLimitRef.current) {
      autoStoppedByTabLimitRef.current = true
      toast.error(
        `Interview stopped: tab switches exceeded (${uiSwitchCount}/${maxTabSwitches}).`,
        {
          description: 'Maximum allowed tab switches reached.',
          duration: 5000,
        },
      )
      stopInterview({ suppressToast: true })
    }
  }, [isCallActive, focusMetrics, maxTabSwitches, stopInterview])

  const toggleMute = () => {
    if (vapi) {
      if (isMuted) {
        if (typeof vapi.unmute === 'function') {
          vapi.unmute()
        }
        setIsMuted(false)
        toast.success('Microphone unmuted')
      } else {
        if (typeof vapi.mute === 'function') {
          vapi.mute()
        }
        setIsMuted(true)
        toast.info('Microphone muted')
      }
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    toast.info(isSpeakerOn ? 'Speaker turned off' : 'Speaker turned on')
  }

  const togglePause = () => {
    if (vapi) {
      if (isPaused) {
        if (typeof vapi.resume === 'function') {
          vapi.resume()
        }
        setIsPaused(false)
        toast.success('Interview resumed')
      } else {
        if (typeof vapi.pause === 'function') {
          vapi.pause()
        }
        setIsPaused(true)
        toast.info('Interview paused')
      }
    }
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const distractionRate = focusMetrics.eyeMovement.distractionRate || 0
  const eyeFocusPercent = Math.max(0, Math.round((1 - distractionRate) * 100))
  const detectionAverageScore =
    detectionSampleCount > 0
      ? Math.round((detectionTotalScore / detectionSampleCount) * 100) / 100
      : 0
  const { answerScore: liveAnswerScore, analyzedAnswerCount } =
    computeAnswerScore(answerAnalyses)
  const liveDetectionRiskPercent = clampPercent(
    (detectionAverageScore / 125) * 100,
  )
  const liveTabSwitchRiskPercent = clampPercent(
    (Number(focusMetrics.tabSwitches.uiSwitchCount || 0) /
      Math.max(maxTabSwitches, 1)) *
      100,
  )
  const liveIntegrityScore = computeIntegrityScore({
    detectionRiskPercent: liveDetectionRiskPercent,
    screenFocusPercent: Number(focusMetrics.screenFocus.percentage || 0),
    eyeFocusPercent,
    tabSwitchRiskPercent: liveTabSwitchRiskPercent,
  })
  const liveFinalManagerScore = computeFinalManagerScore(
    liveAnswerScore,
    liveIntegrityScore,
  )
  const candidateFocusStatus = focusMetrics.tabSwitches.isCurrentlyAway
    ? 'Away from interview tab'
    : focusMetrics.eyeMovement.totalSamples === 0
      ? 'Calibrating focus detection'
      : eyeFocusPercent >= 80
        ? 'Focused'
        : eyeFocusPercent >= 55
          ? 'Needs attention'
          : 'Distracted'

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg shadow-blue-500/25 animate-pulse'>
            <Bot className='h-10 w-10 text-white' />
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Preparing Interview
          </h2>
          <p className='text-gray-600'>Setting up your AI interviewer...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4'>
        <div className='text-center max-w-md'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6'>
            <AlertTriangle className='h-10 w-10 text-red-600' />
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Interview Error
          </h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <Button
            onClick={() => window.history.back()}
            className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#dbeafe,_#f8fafc_42%,_#eef2ff_72%,_#e0f2fe)]'>
      <div className='pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl' />
      <div className='pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl' />

      {/* Header */}
      <div className='sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-4'>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-11 h-11 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25'>
                <Bot className='h-6 w-6 text-white' />
              </div>
              <div>
                <h1 className='text-xl font-bold text-slate-900 tracking-tight'>
                  Interview Studio
                </h1>
                <p className='text-sm text-slate-600'>
                  {interviewInfo?.interviewData?.job_position ||
                    'Interview Session'}
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
              <div className='inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-full shadow-sm'>
                <Timer className='h-4 w-4 text-sky-300' />
                <span className='font-mono text-sm font-semibold tracking-wide'>
                  {formatTime(callDuration)}
                </span>
              </div>

              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                  candidateFocusStatus === 'Focused'
                    ? 'bg-emerald-100 text-emerald-800'
                    : candidateFocusStatus === 'Needs attention'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                }`}
              >
                <Eye className='h-4 w-4' />
                {candidateFocusStatus}
              </div>

              {trackingStatus !== 'inactive' && (
                <div
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold ${
                    focusMetrics.tabSwitches.uiSwitchCount >= maxTabSwitches
                      ? 'bg-red-100 text-red-700'
                      : focusMetrics.tabSwitches.uiSwitchCount > 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  <Monitor className='h-4 w-4' />
                  Tabs {focusMetrics.tabSwitches.uiSwitchCount}/{maxTabSwitches}
                </div>
              )}

              {isCallActive && (
                <div className='inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold'>
                  <span className='w-2 h-2 bg-emerald-500 rounded-full animate-pulse' />
                  Live
                </div>
              )}

              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                  isConnected
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Activity className='h-4 w-4' />
                {isConnected ? 'Alerts Online' : 'Alerts Offline'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 py-8'>
        <div className='mb-6 rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm px-5 py-4 shadow-sm'>
          <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h2 className='text-lg sm:text-xl font-semibold text-slate-900'>
                Live Interview Workspace
              </h2>
              <p className='text-sm text-slate-600'>
                Monitor candidate behavior, response progress, and session
                integrity in real time.
              </p>
            </div>
            <div className='text-xs sm:text-sm text-slate-600 font-medium'>
              Interview ID: {String(interview_id)}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
          {/* Candidate Panel with Video */}
          <div className='lg:col-span-8 lg:order-1 bg-white/95 rounded-3xl shadow-xl border border-white/60 ring-1 ring-slate-200/70 p-5 sm:p-7'>
            <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h2 className='text-2xl font-bold text-slate-900 tracking-tight'>
                  {interviewInfo?.userName || 'Candidate'}
                </h2>
                <p className='text-sm text-slate-600'>Live candidate stage</p>
              </div>
            </div>

            <div className='text-center'>
              {/* Video Display */}
              <div className='relative mb-6'>
                <div className='relative w-full max-w-3xl mx-auto'>
                  {videoError ? (
                    <div className='w-full h-80 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300'>
                      <div className='text-center'>
                        <Camera className='h-12 w-12 text-slate-400 mx-auto mb-2' />
                        <p className='text-sm text-slate-500'>{videoError}</p>
                        <Button
                          onClick={initializeVideo}
                          variant='outline'
                          size='sm'
                          className='mt-2'
                        >
                          Retry Camera
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className='relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden ring-1 ring-slate-800/30 shadow-2xl'>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className='w-full h-full object-cover'
                      />

                      {/* Video Controls Overlay */}
                      <div className='absolute bottom-3 right-3 flex items-center gap-2'>
                        <div className='hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 text-white text-xs font-medium'>
                          <Eye className='h-3.5 w-3.5' />
                          {candidateFocusStatus}
                        </div>
                        <Button
                          onClick={toggleVideo}
                          size='sm'
                          variant={isVideoOn ? 'default' : 'destructive'}
                          className='h-9 w-9 rounded-full p-0 shadow-md'
                        >
                          {isVideoOn ? (
                            <Video className='h-4 w-4' />
                          ) : (
                            <VideoOff className='h-4 w-4' />
                          )}
                        </Button>
                      </div>

                      {/* Speaking Indicator */}
                      {activeUser && (
                        <div className='absolute top-3 left-3 flex items-center gap-2 bg-blue-500/95 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm'>
                          <Mic className='h-3 w-3' />
                          Speaking
                        </div>
                      )}

                      {isCallActive && (
                        <div className='absolute top-3 right-3 bg-black/55 text-white text-xs px-2.5 py-1 rounded-full font-semibold'>
                          Live Camera
                        </div>
                      )}
                    </div>
                  )}

                  <canvas ref={detectionCanvasRef} className='hidden' />
                </div>
              </div>

              {/* Progress Bar */}
              {isCallActive && (
                <div className='w-full bg-slate-200 rounded-full h-3 mb-4'>
                  <div
                    ref={progressRef}
                    className='bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300'
                    style={{ width: `${interviewProgress}%` }}
                  ></div>
                </div>
              )}

              {isCallActive && (
                <div className='mt-5 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 text-left'>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                    <div>
                      <h3 className='font-semibold text-slate-900 mb-2'>
                        Live Detection Feed
                      </h3>
                      {detectedClasses.length > 0 ? (
                        <div className='flex flex-wrap gap-2 mb-2'>
                          {detectedClasses.map((detectedClass) => (
                            <span
                              key={detectedClass}
                              className='px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full'
                            >
                              {detectedClass}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className='text-sm text-slate-600 mb-2'>
                          No objects detected
                        </p>
                      )}

                      {detectionViolations.length > 0 && (
                        <p className='text-xs text-rose-600 mb-1'>
                          {detectionViolations.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className='rounded-xl bg-white border border-slate-200 px-3 py-2 min-w-44'>
                      <p className='text-xs text-slate-500'>
                        {isDetectionRunning ? 'Monitoring' : 'Stopped'}
                      </p>
                      <p className='text-xs text-slate-700 mt-2'>
                        Focus: <strong>{candidateFocusStatus}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Interviewer Panel */}
          <div className='lg:col-span-4 lg:order-2 space-y-5'>
            <div className='bg-white/95 rounded-3xl shadow-lg border border-white/60 ring-1 ring-slate-200/70 p-6'>
              <div className='text-center'>
                <div className='relative inline-block mb-4'>
                  {!activeUser && (
                    <div className='absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping'></div>
                  )}
                  <div className='relative w-24 h-24 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md shadow-blue-500/20'>
                    <Bot className='h-12 w-12 text-white' />
                  </div>
                  {!activeUser && (
                    <div className='absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center'>
                      <Volume2 className='h-3.5 w-3.5 text-white' />
                    </div>
                  )}
                </div>

                <h2 className='text-xl font-bold text-slate-900 mb-1'>
                  AI Recruiter
                </h2>
                <p className='text-sm text-slate-600 mb-4'>
                  {activeUser
                    ? 'Listening to your response'
                    : 'Asking the next interview question'}
                </p>

                {!isCallActive && (
                  <Button
                    onClick={startCall}
                    className='bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white px-6 py-2.5 text-base font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5'
                  >
                    <Play className='h-5 w-5 mr-2' />
                    Start Interview
                  </Button>
                )}
              </div>
            </div>

            <div className='bg-white/95 rounded-3xl shadow-lg border border-white/60 ring-1 ring-slate-200/70 p-5'>
              <h3 className='font-semibold text-slate-900 mb-4'>
                Integrity Dashboard
              </h3>
              <div className='space-y-3'>
                <div className='rounded-xl border border-slate-200 p-3 bg-slate-50'>
                  <div className='flex items-center justify-between text-sm mb-2'>
                    <span className='text-slate-600 flex items-center gap-2'>
                      <Eye className='h-4 w-4 text-sky-600' />
                      Eye Focus
                    </span>
                    <span className='font-bold text-slate-900'>
                      {eyeFocusPercent}%
                    </span>
                  </div>
                  <div className='h-2 rounded-full bg-slate-200 overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-cyan-500 to-blue-600'
                      style={{ width: `${eyeFocusPercent}%` }}
                    />
                  </div>
                </div>

                <div className='rounded-xl border border-slate-200 p-3 bg-slate-50'>
                  <div className='flex items-center justify-between text-sm mb-2'>
                    <span className='text-slate-600 flex items-center gap-2'>
                      <Monitor className='h-4 w-4 text-violet-600' />
                      Tab Switches
                    </span>
                    <span className='font-bold text-slate-900'>
                      {focusMetrics.tabSwitches.uiSwitchCount}/{maxTabSwitches}
                    </span>
                  </div>
                  <div className='h-2 rounded-full bg-slate-200 overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-violet-500 to-fuchsia-500'
                      style={{
                        width: `${Math.min((focusMetrics.tabSwitches.uiSwitchCount / maxTabSwitches) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className='rounded-xl border border-slate-200 p-3 bg-slate-50'>
                  <div className='flex items-center justify-between text-sm mb-2'>
                    <span className='text-slate-600 flex items-center gap-2'>
                      <Activity className='h-4 w-4 text-amber-600' />
                      Screen Focus
                    </span>
                    <span className='font-bold text-slate-900'>
                      {focusMetrics.screenFocus.percentage}%
                    </span>
                  </div>
                  <div className='h-2 rounded-full bg-slate-200 overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-amber-400 to-orange-500'
                      style={{
                        width: `${focusMetrics.screenFocus.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className='mt-4 text-xs text-slate-500'>
                Tracking status:{' '}
                <span className='font-medium text-slate-700'>
                  {trackingStatus}
                </span>
              </div>
            </div>

            <div className='bg-slate-900 text-white rounded-3xl shadow-lg p-5'>
              <h3 className='font-semibold mb-3'>Session Snapshot</h3>
              <div className='grid grid-cols-2 gap-3 text-sm'>
                <div className='rounded-xl bg-white/10 p-3'>
                  <p className='text-white/70 text-xs'>Duration</p>
                  <p className='font-semibold'>{formatTime(callDuration)}</p>
                </div>
                <div className='rounded-xl bg-white/10 p-3'>
                  <p className='text-white/70 text-xs'>Status</p>
                  <p className='font-semibold'>
                    {isCallActive ? 'Live interview' : 'Waiting to start'}
                  </p>
                </div>
                <div className='rounded-xl bg-white/10 p-3'>
                  <p className='text-white/70 text-xs'>Focus</p>
                  <p className='font-semibold'>{candidateFocusStatus}</p>
                </div>
                <div className='rounded-xl bg-white/10 p-3'>
                  <p className='text-white/70 text-xs'>Switches</p>
                  <p className='font-semibold'>
                    {focusMetrics.tabSwitches.uiSwitchCount}/{maxTabSwitches}
                  </p>
                </div>
              </div>

              <div className='mt-4 rounded-xl bg-white/10 p-4'>
                <p className='text-[11px] uppercase tracking-wide text-white/60'>
                  Candidate
                </p>
                <p className='mt-1 text-base font-semibold'>
                  {interviewInfo?.userName || 'Candidate'}
                </p>

                <div className='mt-3 space-y-2 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-white/70'>Answer Score</span>
                    <span className='font-semibold'>{liveAnswerScore}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-white/70'>Integrity Score</span>
                    <span className='font-semibold'>{liveIntegrityScore}</span>
                  </div>
                  <div className='flex items-center justify-between border-t border-white/15 pt-2'>
                    <span className='text-white/80'>Final Manager Score</span>
                    <span className='text-lg font-bold'>
                      {liveFinalManagerScore}
                    </span>
                  </div>
                </div>

                <p className='mt-3 text-[11px] text-white/60'>
                  Analyzed answers: {analyzedAnswerCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className='mt-7 bg-white/95 rounded-2xl shadow-lg border border-white/60 ring-1 ring-slate-200/70 p-6'>
          <div className='grid grid-cols-3 sm:grid-cols-4 gap-4 place-items-center'>
            {/* Mute/Unmute */}
            <div className='text-center'>
              <Button
                onClick={toggleMute}
                variant={isMuted ? 'destructive' : 'outline'}
                size='lg'
                className={`h-16 w-16 rounded-full ${
                  isMuted
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                {isMuted ? (
                  <MicOff className='h-6 w-6' />
                ) : (
                  <Mic className='h-6 w-6' />
                )}
              </Button>
              <p className='text-xs text-slate-600 mt-2'>Mic</p>
            </div>

            {/* Video Toggle */}
            <div className='text-center'>
              <Button
                onClick={toggleVideo}
                variant={isVideoOn ? 'outline' : 'destructive'}
                size='lg'
                className={`h-16 w-16 rounded-full ${
                  isVideoOn
                    ? 'border-slate-300 hover:bg-slate-50'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isVideoOn ? (
                  <Video className='h-6 w-6' />
                ) : (
                  <VideoOff className='h-6 w-6' />
                )}
              </Button>
              <p className='text-xs text-slate-600 mt-2'>Camera</p>
            </div>

            {/* Speaker Toggle */}
            <div className='text-center'>
              <Button
                onClick={toggleSpeaker}
                variant='outline'
                size='lg'
                className={`h-16 w-16 rounded-full border-slate-300 hover:bg-slate-50 ${
                  !isSpeakerOn ? 'bg-slate-100' : ''
                }`}
              >
                {isSpeakerOn ? (
                  <Volume2 className='h-6 w-6' />
                ) : (
                  <VolumeX className='h-6 w-6' />
                )}
              </Button>
              <p className='text-xs text-slate-600 mt-2'>Speaker</p>
            </div>

            {/* End Call */}
            {isCallActive && (
              <div className='text-center'>
                <AlertConfirmation stopInterview={stopInterview}>
                  <Button
                    variant='destructive'
                    size='lg'
                    className='h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white'
                  >
                    <PhoneOff className='h-6 w-6' />
                  </Button>
                </AlertConfirmation>
                <p className='text-xs text-slate-600 mt-2'>End</p>
              </div>
            )}
          </div>

          {/* Status Messages */}
          <div className='text-center mt-6'>
            {!isCallActive && (
              <p className='text-slate-500'>
                Click "Start Interview" to begin your AI-powered interview
                session
              </p>
            )}
            {isCallActive && (
              <p className='text-emerald-600 font-medium'>
                Interview is in progress - Speak clearly and naturally
              </p>
            )}
            {isPaused && (
              <p className='text-amber-600 font-medium'>
                Interview paused - Click resume to continue
              </p>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className='mt-7 bg-gradient-to-r from-cyan-50 to-indigo-50 border border-cyan-200/70 rounded-2xl p-6 shadow-sm'>
          <div className='flex items-start gap-3'>
            <MessageCircle className='h-6 w-6 text-cyan-700 mt-1 flex-shrink-0' />
            <div>
              <h3 className='font-semibold text-slate-900 mb-2'>
                Interview Best Practices
              </h3>
              <ul className='text-sm text-slate-700 space-y-1'>
                <li>• Speak clearly and at a moderate pace</li>
                <li>• Take your time to think before answering</li>
                <li>• Provide specific examples when possible</li>
                <li>• Ask for clarification if needed</li>
                <li>• Stay calm and confident throughout</li>
                <li>• Ensure good lighting and camera positioning</li>
                <li>• Look directly at the camera when speaking</li>
                <li>
                  •{' '}
                  <strong>
                    Stay focused on the interview - avoid tab switching (max 5
                    allowed)
                  </strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StartInterview
