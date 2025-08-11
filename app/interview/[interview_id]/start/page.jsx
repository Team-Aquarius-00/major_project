'use client'
import React, { useContext, useEffect, useState, useRef } from 'react'
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
} from 'lucide-react'
import Image from 'next/image'
import Vapi from '@vapi-ai/web'
import AlertConfirmation from './_components/AlertConfirmation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

function StartInterview() {
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext)
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

  const durationRef = useRef(null)
  const progressRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    if (interviewInfo) {
      initializeInterview()
      initializeVideo()
    } else {
      setError('Interview information not found. Please go back and try again.')
    }
  }, [interviewInfo])

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

  // Initialize video camera
  const initializeVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })

      setVideoStream(stream)
      setVideoError(null)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Failed to access camera:', err)
      setVideoError('Camera access denied. Please allow camera permissions.')
      toast.error(
        'Camera access denied. Please check your browser permissions.'
      )
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
    try {
      const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)
      setVapi(vapiInstance)

      // Set up event listeners
      setupVapiEventListeners(vapiInstance)

      // Calculate total questions
      const questions = interviewInfo?.interviewData?.questionList || []
      setTotalQuestions(questions.length)

      setIsLoading(false)
    } catch (err) {
      setError('Failed to initialize interview. Please refresh the page.')
      setIsLoading(false)
    }
  }

  const setupVapiEventListeners = (vapiInstance) => {
    vapiInstance.on('call-start', () => {
      console.log('Call has started')
      setIsCallActive(true)
      toast.success('Interview started successfully!')
    })

    vapiInstance.on('call-end', () => {
      console.log('Call has ended')
      setIsCallActive(false)
      toast.info('Interview session ended')
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
        setCurrentQuestion((prev) => Math.min(prev + 1, totalQuestions))
        setInterviewProgress((currentQuestion / totalQuestions) * 100)
      }
    })
  }

  const startCall = async () => {
    if (!vapi || !interviewInfo) return

    try {
      const questionList = interviewInfo?.interviewData?.questionList
        ?.map((item) => item?.question)
        .join(', ')

      if (!questionList) {
        toast.error('No questions found for this interview')
        return
      }

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

      vapi.start(assistantOptions)
    } catch (error) {
      console.error('Failed to start call:', error)
      toast.error('Failed to start interview. Please try again.')
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
                {interviewInfo?.interviewData?.jobPosition}
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

            {isCallActive && (
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span className='text-sm text-green-600 font-medium'>Live</span>
              </div>
            )}
          </div>
        </div>
      </div>

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
                {activeUser ? 'Listening to your response...' : 'Speaking...'}
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
                {activeUser ? 'Your turn to speak' : 'AI is speaking...'}
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
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StartInterview
