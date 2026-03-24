'use client'
import React, { useContext, useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { InterviewDataContext } from '../../../../context/InterviewDataContext'
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Timer,
  Volume2,
  VolumeX,
  Settings,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  User,
  Bot,
  MessageCircle,
  Video,
  VideoOff,
  Camera,
  Eye,
  Monitor,
  Target,
  Activity,
  FileText,
} from 'lucide-react'
import Image from 'next/image'
import Vapi from '@vapi-ai/web'
import AlertConfirmation from './_components/AlertConfirmation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import InterviewTrackingService from '@/services/interviewTrackingService'
import InterviewFeedback from './_components/InterviewFeedback'
import { useInterviewAlerts } from '@/hooks/useInterviewAlerts'
import { InterviewAlerts } from '@/components/InterviewAlerts'

function StartInterview() {
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext)
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
  const [isLoading, setIsLoading] = useState(false)
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
  const [showFeedback, setShowFeedback] = useState(false)

  // Interview Alerts (Real-time monitoring)
  const { alerts, isConnected } = useInterviewAlerts(
    String(interview_id),
    isCallActive,
  )

  const durationRef = useRef(null)
  const progressRef = useRef(null)
  const videoRef = useRef(null)
  const trackingIntervalRef = useRef(null)

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

  // Manage real-time tracking updates to database
  useEffect(() => {
    if (!isCallActive || !alerts || alerts.length === 0) return

    // Send tracking updates to database every 10 seconds
    const trackingInterval = setInterval(async () => {
      try {
        const currentMetrics = trackingService?.getFocusMetrics()
        await fetch(`/api/interview/${interview_id}/tracking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            alerts: alerts,
            metrics: currentMetrics,
            duration: callDuration,
          }),
        }).catch((e) => console.debug('Tracking update skipped:', e.message))
      } catch (error) {
        console.debug('Failed to send tracking update:', error)
      }
    }, 10000)

    return () => clearInterval(trackingInterval)
  }, [isCallActive, alerts, callDuration, interview_id, trackingService])

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
        // Add UI notifications for tab switches
        if (eventType === 'switch_away' || eventType === 'window_blur') {
          const currentMetrics = service.getFocusMetrics()
          const currentSwitchCount = currentMetrics.tabSwitches.uiSwitchCount

          if (currentSwitchCount <= maxTabSwitches) {
            toast.warning(
              `New tab added! (${currentSwitchCount}/${maxTabSwitches})`,
              {
                description: 'Please stay focused on the interview.',
                duration: 3000,
              },
            )
          } else {
            toast.error(
              `Maximum tab switches exceeded! (${currentSwitchCount}/${maxTabSwitches})`,
              {
                description: 'This may affect your interview score.',
                duration: 5000,
              },
            )
          }
        }

        // Call original method to handle the actual tracking logic
        await originalHandleTabSwitch(eventType)

        // Update UI with latest metrics
        const updatedMetrics = service.getFocusMetrics()
        setFocusMetrics(updatedMetrics)
      }

      // Add global reference for debugging (development only)
      if (process.env.NODE_ENV === 'development') {
        window.trackingService = service
        console.log(
          'Tracking service available globally as window.trackingService',
        )
      }

      // Start tracking immediately - don't wait for isCallActive
      service.startTracking()
      setTrackingStatus('active')

      // Update focus metrics every 2 seconds for more responsive updates
      trackingIntervalRef.current = setInterval(() => {
        if (service && service.isTracking) {
          const metrics = service.getFocusMetrics()
          setFocusMetrics(metrics)
        }
      }, 2000)

      console.log('Tracking service initialized and started')
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
    // #region agent log
    const logInit = (message, data, hypothesisId) => {
      if (!interview_id) return // Safety check
      fetch(`http://127.0.0.1:7242/ingest/${interview_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'start/page.jsx:initializeInterview',
          message,
          data: data || {},
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId,
        }),
      }).catch((err) => {
        console.warn('Failed to send log:', err)
      })
    }
    // #endregion

    if (!interview_id) {
      setError('Invalid interview session. Please start over.')
      return
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY

      // #region agent log
      logInit(
        'apiKey checked',
        { apiKeyExists: !!apiKey, apiKeyLength: (apiKey || '').length },
        'A',
      )
      // #endregion

      // Debug logging
      console.log('Vapi initialization:', {
        apiKeyExists: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
      })

      if (!apiKey) {
        setError(
          'Vapi API key is missing. Please check your environment variables.',
        )
        return
      }

      const vapiInstance = new Vapi(apiKey)

      // #region agent log
      logInit('Vapi instance created', { hasInstance: !!vapiInstance }, 'D')
      // #endregion

      // Test connection
      console.log('Vapi instance created:', vapiInstance)
      setVapi(vapiInstance)

      // Set up event listeners
      setupVapiEventListeners(vapiInstance)

      // #region agent log
      logInit('setupVapiEventListeners completed', {}, 'D')
      // #endregion

      // Calculate total questions
      const questions = interviewInfo?.interviewData?.questionList || []
      setTotalQuestions(questions.length)

      console.log('Interview initialized successfully')
    } catch (err) {
      // #region agent log
      logInit(
        'initializeInterview catch',
        { message: err?.message, name: err?.name },
        'A',
      )
      // #endregion
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
    }
  }

  const setupVapiEventListeners = (vapiInstance) => {
    // #region agent log
    vapiInstance.on('error', (e) => {
      fetch(`http://127.0.0.1:7242/ingest/${interview_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'start/page.jsx:vapi-error',
          message: 'vapi error event',
          data: {
            type: e?.type,
            stage: e?.stage,
            error: String(e?.error ?? e),
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'C',
        }),
      }).catch(() => {})
    })
    vapiInstance.on('call-start-failed', (e) => {
      fetch(`http://127.0.0.1:7242/ingest/${interview_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'start/page.jsx:call-start-failed',
          message: 'call-start-failed',
          data: { stage: e?.stage, error: e?.error },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'C',
        }),
      }).catch(() => {})
    })
    // #endregion
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

      // Stop tracking service and get final metrics
      if (trackingService) {
        trackingService.stopTracking()
        const finalMetrics = trackingService.getFocusMetrics()

        // Save interview results with final metrics and alerts
        try {
          const response = await fetch(
            `/api/interview/${interview_id}/results`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                duration: callDuration,
                completed: true,
                feedback: {
                  tab_switches: finalMetrics.tabSwitches.uiSwitchCount,
                  gaze_alerts: finalMetrics.eyeMovement.distractions,
                  focus_score: finalMetrics.tabSwitches.focusScore,
                },
                scoring: {
                  questions_answered: currentQuestion,
                  total_questions: totalQuestions,
                  time_per_question: callDuration / currentQuestion,
                },
                tracking: {
                  final_metrics: finalMetrics,
                  alerts: alerts,
                },
              }),
            },
          )

          if (response.ok) {
            console.log('Interview results saved successfully')
            setShowFeedback(true)
          } else {
            console.error(
              'Failed to save interview results:',
              response.statusText,
            )
          }
        } catch (error) {
          console.error('Error saving interview results:', error)
          toast.error('Failed to save interview results')
        }
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
      if (message.role === 'assistant') {
        setCurrentQuestion((prev) => {
          const newQuestionCount = Math.min(prev + 1, totalQuestions)
          setInterviewProgress((newQuestionCount / totalQuestions) * 100)
          return newQuestionCount
        })
      }
    })
  }

  const startCall = async () => {
    // #region agent log
    fetch(`http://127.0.0.1:7242/ingest/${interview_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'start/page.jsx:startCall entry',
        message: 'startCall entry',
        data: { vapiExists: !!vapi, interviewInfoExists: !!interviewInfo },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        hypothesisId: 'B',
      }),
    }).catch(() => {})
    // #endregion
    if (!vapi || !interviewInfo) {
      console.error('Cannot start call:', {
        vapiExists: !!vapi,
        infoExists: !!interviewInfo,
      })
      toast.error('Vapi not initialized. Please refresh the page.')
      return
    }

    try {
      // #region agent log
      fetch(`http://127.0.0.1:7242/ingest/${interview_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'start/page.jsx:before vapi.start',
          message: 'before vapi.start',
          data: {},
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'C',
        }),
      }).catch(() => {})
      // #endregion
      const questionList = interviewInfo?.interviewData?.questionList
        ?.map((item) => item?.question)
        .join(', ')

      if (!questionList) {
        toast.error('No questions found for this interview')
        return
      }

      console.log('Starting Vapi call with:', {
        userName: interviewInfo?.userName,
        jobPosition: interviewInfo?.interviewData.job_position,
        questionsCount: interviewInfo?.interviewData?.questionList?.length,
      })

      const assistantOptions = {
        name: 'AI Recruiter',
        firstMessage: `Hi ${interviewInfo?.userName}, welcome to your ${interviewInfo?.interviewData.jobPosition} interview! I'm excited to chat with you today. Let's begin with a few questions to get to know you better.`,
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en',
        },
        voice: {
          provider: 'playht',
          voiceId: 'jennifer',
        },
        model: {
          provider: 'openai',
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `
You are an AI voice assistant conducting a professional interview for the position of ${interviewInfo?.interviewData.jobPosition}. Your role is to:

1. Begin with a warm, professional greeting
2. Ask one question at a time from this list: ${questionList}
3. Listen carefully to responses and provide encouraging feedback
4. If the candidate struggles, offer helpful hints without giving away answers
5. Keep the conversation natural and engaging
6. After 5-7 questions, provide a brief summary and end positively

Guidelines:
- Be friendly but professional
- Give specific, constructive feedback
- Offer hints when needed: "That's a good start! Think about..."
- Encourage elaboration: "Can you tell me more about that?"
- End with: "Great work today! You've shown strong knowledge in [specific areas]. Good luck with your application!"

Keep responses concise and natural. Focus on making the candidate comfortable while assessing their knowledge.
`,
            },
          ],
        },
      }

      console.log('Calling vapi.start() with assistant options')
      vapi.start(assistantOptions)
      // #region agent log
      fetch(`http://127.0.0.1:7242/ingest/${interview_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'start/page.jsx:after vapi.start called',
          message: 'vapi.start() invoked',
          data: {},
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'C',
        }),
      }).catch(() => {})
      // #endregion
    } catch (error) {
      // #region agent log
      fetch(`http://127.0.0.1:7242/ingest/${interview_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'start/page.jsx:startCall catch',
          message: 'startCall error',
          data: { message: error?.message, name: error?.name },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'C',
        }),
      }).catch(() => {})
      // #endregion
      console.error('Failed to start call:', {
        message: error.message,
        stack: error.stack,
        error: error,
      })
      toast.error(`Failed to start interview: ${error.message}`)
    }
  }

  const stopInterview = () => {
    if (vapi) {
      vapi.stop()
      setIsCallActive(false)
    }
  }

  const toggleMute = () => {
    if (vapi) {
      if (isMuted) {
        vapi.unmute()
        setIsMuted(false)
        toast.success('Microphone unmuted')
      } else {
        vapi.mute()
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
        vapi.resume()
        setIsPaused(false)
        toast.success('Interview resumed')
      } else {
        vapi.pause()
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
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-6 py-4'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
              <Bot className='h-6 w-6 text-white' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>
                AI Interview Session
              </h1>
              <p className='text-sm text-gray-600'>
                {interviewInfo?.interviewData?.job_position}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full'>
              <Timer className='h-4 w-4 text-gray-600' />
              <span className='font-mono font-semibold text-gray-900'>
                {formatTime(callDuration)}
              </span>
            </div>

            {trackingStatus !== 'inactive' && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  focusMetrics.tabSwitches.uiSwitchCount >= maxTabSwitches
                    ? 'bg-red-100 text-red-700'
                    : focusMetrics.tabSwitches.uiSwitchCount > 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                }`}
              >
                <Monitor className='h-4 w-4' />
                <span className='font-semibold text-sm'>
                  Tabs: {focusMetrics.tabSwitches.uiSwitchCount}/
                  {maxTabSwitches}
                </span>
              </div>
            )}

            {isCallActive && (
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span className='text-sm text-green-600 font-medium'>Live</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Alerts Section */}
      {isCallActive && (
        <div className='bg-white border-b border-gray-200 px-6 py-4'>
          <div className='max-w-7xl mx-auto'>
            <InterviewAlerts
              alerts={alerts}
              interviewId={String(interview_id)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* AI Interviewer Panel */}
          <div className='bg-white rounded-3xl shadow-xl border border-gray-100 p-8'>
            <div className='text-center'>
              <div className='relative inline-block mb-6'>
                {!activeUser && (
                  <div className='absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping'></div>
                )}
                <div className='relative w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25'>
                  <Bot className='h-16 w-16 text-white' />
                </div>
                {!activeUser && (
                  <div className='absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                    <Volume2 className='h-4 w-4 text-white' />
                  </div>
                )}
              </div>

              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                AI Recruiter
              </h2>
              <p className='text-gray-600 mb-4'>
                {/* {activeUser ? 'Listening to your response...' : 'Speaking...'} */}
              </p>

              {!isCallActive && (
                <Button
                  onClick={startCall}
                  className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5'
                >
                  <Play className='h-5 w-5 mr-2' />
                  Start Interview
                </Button>
              )}
            </div>
          </div>

          {/* Candidate Panel with Video */}
          <div className='bg-white rounded-3xl shadow-xl border border-gray-100 p-8'>
            <div className='text-center'>
              {/* Video Display */}
              <div className='relative mb-6'>
                <div className='relative w-full max-w-sm mx-auto'>
                  {videoError ? (
                    <div className='w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300'>
                      <div className='text-center'>
                        <Camera className='h-12 w-12 text-gray-400 mx-auto mb-2' />
                        <p className='text-sm text-gray-500'>{videoError}</p>
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
                    <div className='relative w-full h-64 bg-gray-900 rounded-2xl overflow-hidden'>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className='w-full h-full object-cover'
                      />

                      {/* Video Controls Overlay */}
                      <div className='absolute bottom-2 right-2'>
                        <Button
                          onClick={toggleVideo}
                          size='sm'
                          variant={isVideoOn ? 'default' : 'destructive'}
                          className='h-8 w-8 rounded-full p-0'
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
                        <div className='absolute top-2 left-2 flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium'>
                          <Mic className='h-3 w-3' />
                          Speaking
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                {interviewInfo?.userName || 'Candidate'}
              </h2>
              <p className='text-gray-600 mb-4'>
                {/* {activeUser ? 'Your turn to speak' : 'AI is speaking...'} */}
              </p>

              {/* Progress Bar */}
              {isCallActive && (
                <div className='w-full bg-gray-200 rounded-full h-3 mb-4'>
                  <div
                    ref={progressRef}
                    className='bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300'
                    style={{ width: `${interviewProgress}%` }}
                  ></div>
                </div>
              )}

              <div className='text-sm text-gray-500'>
                Question {currentQuestion} of {totalQuestions}
              </div>
            </div>
          </div>
        </div>

        {/* Focus Metrics Display */}
        {trackingStatus !== 'inactive' && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='text-center p-4 bg-blue-50 rounded-xl'>
              <div className='flex items-center justify-center gap-2 mb-2'>
                <Eye className='h-5 w-5 text-blue-600' />
                <span className='text-sm font-medium text-blue-600'>
                  Eye Focus
                </span>
              </div>
              <div className='text-2xl font-bold text-blue-600'>
                {Math.round(
                  (1 - focusMetrics.eyeMovement.distractionRate) * 100,
                )}
              </div>
              <div className='text-xs text-blue-600'>
                {focusMetrics.eyeMovement.totalSamples} samples
              </div>
            </div>

            <div className='text-center p-4 bg-purple-50 rounded-xl'>
              <div className='flex items-center justify-center gap-2 mb-2'>
                <Target className='h-5 w-5 text-purple-600' />
                <span className='text-sm font-medium text-purple-600'>
                  Tab Focus
                </span>
              </div>
              <div className='text-2xl font-bold text-purple-600'>
                {focusMetrics.tabSwitches.focusScore || 100}
              </div>
              <div
                className={`text-xs ${focusMetrics.tabSwitches.uiSwitchCount >= maxTabSwitches ? 'text-red-600 font-semibold' : 'text-purple-600'}`}
              >
                {focusMetrics.tabSwitches.uiSwitchCount}/{maxTabSwitches}{' '}
                switches
              </div>
            </div>

            <div className='text-center p-4 bg-orange-50 rounded-xl'>
              <div className='flex items-center justify-center gap-2 mb-2'>
                <Activity className='h-5 w-5 text-orange-600' />
                <span className='text-sm font-medium text-orange-600'>
                  Screen Focus
                </span>
              </div>
              <div className='text-lg font-bold text-orange-600'>
                {focusMetrics.screenFocus.percentage}%
              </div>
              <div className='text-xs text-orange-600'>
                {trackingStatus} tracking
              </div>
            </div>
          </div>
        )}

        {/* Test Controls for Development - DISABLED */}

        {/* Interview Progress */}
        {isCallActive && (
          <div className='mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 text-center'>
              Interview Progress
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-blue-50 rounded-xl'>
                <div className='text-2xl font-bold text-blue-600'>
                  {currentQuestion}
                </div>
                <div className='text-sm text-blue-600'>Questions Asked</div>
              </div>
              <div className='text-center p-4 bg-green-50 rounded-xl'>
                <div className='text-2xl font-bold text-green-600'>
                  {totalQuestions - currentQuestion}
                </div>
                <div className='text-sm text-green-600'>Remaining</div>
              </div>
              <div className='text-center p-4 bg-purple-50 rounded-xl'>
                <div className='text-2xl font-bold text-purple-600'>
                  {Math.round(interviewProgress)}%
                </div>
                <div className='text-sm text-purple-600'>Complete</div>
              </div>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className='mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6'>
          <div className='flex items-center justify-center gap-4'>
            {/* Mute/Unmute */}
            <Button
              onClick={toggleMute}
              variant={isMuted ? 'destructive' : 'outline'}
              size='lg'
              className={`h-16 w-16 rounded-full ${
                isMuted
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isMuted ? (
                <MicOff className='h-6 w-6' />
              ) : (
                <Mic className='h-6 w-6' />
              )}
            </Button>

            {/* Video Toggle */}
            <Button
              onClick={toggleVideo}
              variant={isVideoOn ? 'outline' : 'destructive'}
              size='lg'
              className={`h-16 w-16 rounded-full ${
                isVideoOn
                  ? 'border-gray-300 hover:bg-gray-50'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {isVideoOn ? (
                <Video className='h-6 w-6' />
              ) : (
                <VideoOff className='h-6 w-6' />
              )}
            </Button>

            {/* Speaker Toggle */}
            <Button
              onClick={toggleSpeaker}
              variant='outline'
              size='lg'
              className={`h-16 w-16 rounded-full border-gray-300 hover:bg-gray-50 ${
                !isSpeakerOn ? 'bg-gray-100' : ''
              }`}
            >
              {isSpeakerOn ? (
                <Volume2 className='h-6 w-6' />
              ) : (
                <VolumeX className='h-6 w-6' />
              )}
            </Button>

            {/* End Call */}
            {isCallActive && (
              <AlertConfirmation stopInterview={stopInterview}>
                <Button
                  variant='destructive'
                  size='lg'
                  className='h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white'
                >
                  <PhoneOff className='h-6 w-6' />
                </Button>
              </AlertConfirmation>
            )}
          </div>

          {/* Status Messages */}
          <div className='text-center mt-6'>
            {!isCallActive && (
              <p className='text-gray-500'>
                Click "Start Interview" to begin your AI-powered interview
                session
              </p>
            )}
            {isCallActive && (
              <p className='text-green-600 font-medium'>
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
        <div className='mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6'>
          <div className='flex items-start gap-3'>
            <MessageCircle className='h-6 w-6 text-blue-600 mt-1 flex-shrink-0' />
            <div>
              <h3 className='font-semibold text-blue-900 mb-2'>
                Interview Tips
              </h3>
              <ul className='text-sm text-blue-800 space-y-1'>
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
