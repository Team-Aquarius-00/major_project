'use client'
import Image from 'next/image'
import React, { useContext, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Info,
  Loader2Icon,
  NetworkIcon,
  Shield,
  Video,
  User,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Mic,
  Monitor,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'
import { toast } from 'sonner'
import { InterviewDataContext } from '../../../context/InterviewDataContext'

function Interview() {
  const { interview_id } = useParams()
  const router = useRouter()
  const [interviewData, setInterviewData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext)

  if (!interview_id) {
    toast.error('Missing interview ID')
    return null
  }

  useEffect(() => {
    interview_id && GetInterviewDetails()
  }, [interview_id])

  const GetInterviewDetails = async () => {
    setLoading(true)
    try {
      let { data: Interview, error } = await supabase
        .from('Interview')
        .select('job_position, job_description, type, duration')
        .eq('interview_id', interview_id)

      if (error) {
        toast.error('Failed to fetch interview details')
        return
      }

      if (!Interview || Interview.length === 0) {
        toast.error('Interview not found')
        return
      }

      console.log(Interview[0])
      setInterviewData(Interview[0])
      setInterviewInfo(Interview[0])
    } catch (error) {
      console.log(error)
      toast.error('Failed to load interview details')
    }
    setLoading(false)
  }

  const onJoinInterview = async () => {
    if (!userName.trim()) {
      toast.error('Please enter your name')
      return
    }

    setLoading(true)
    try {
      let { data: Interview, error } = await supabase
        .from('Interview')
        .select('*')
        .eq('interview_id', interview_id)

      if (error || !Interview || Interview.length === 0) {
        toast.error('Interview not found')
        return
      }

      console.log(Interview[0])
      setInterviewInfo({
        userName: userName.trim(),
        interviewData: Interview[0],
      })
      router.push('/interview/' + interview_id + '/start')
    } catch (error) {
      toast.error('Failed to join interview')
    }
    setLoading(false)
  }

  if (loading && !interviewData) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <Loader2Icon className='h-12 w-12 text-blue-600 animate-spin mx-auto mb-4' />
          <p className='text-gray-600'>Loading interview details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg shadow-blue-500/25'>
            <Video className='h-10 w-10 text-white' />
          </div>
          <h1 className='text-4xl font-bold text-gray-900 mb-3'>
            Interview Ready
          </h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Welcome to your AI-powered interview. Please review the details
            below and enter your information to begin.
          </p>
        </div>

        {/* Main Content */}
        <div className='bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden'>
          {/* Interview Details Section */}
          <div className='p-8 border-b border-gray-100'>
            <div className='flex items-center gap-3 mb-6'>
              <Briefcase className='h-6 w-6 text-blue-600' />
              <h2 className='text-2xl font-bold text-gray-900'>
                {interviewData?.jobPosition || 'Position Not Specified'}
              </h2>
            </div>

            {/* Interview Type Badge */}
            {interviewData?.type && (
              <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6'>
                <span className='w-2 h-2 bg-blue-600 rounded-full'></span>
                {Array.isArray(interviewData.type)
                  ? interviewData.type.join(', ')
                  : interviewData.type}
              </div>
            )}

            {/* Key Information Grid */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl mb-4 shadow-lg shadow-blue-500/25'>
                  <Clock className='h-6 w-6 text-white' />
                </div>
                <p className='font-semibold text-gray-900 mb-1'>Duration</p>
                <p className='text-2xl font-bold text-blue-600'>
                  {interviewData?.duration || '30'} min
                </p>
              </div>

              <div className='text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-xl mb-4 shadow-lg shadow-green-500/25'>
                  <Video className='h-6 w-6 text-white' />
                </div>
                <p className='font-semibold text-gray-900 mb-1'>Camera</p>
                <p className='text-lg font-medium text-green-600'>Required</p>
              </div>

              <div className='text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-purple-500 rounded-xl mb-4 shadow-lg shadow-purple-500/25'>
                  <Shield className='h-6 w-6 text-white' />
                </div>
                <p className='font-semibold text-gray-900 mb-1'>Security</p>
                <p className='text-lg font-medium text-purple-600'>
                  AI Monitored
                </p>
              </div>
            </div>
          </div>

          {/* Requirements Section */}
          <div className='p-8 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50'>
            <div className='flex items-center gap-3 mb-4'>
              <AlertTriangle className='h-6 w-6 text-amber-600' />
              <h3 className='text-xl font-semibold text-amber-900'>
                Before You Begin
              </h3>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-3'>
                <div className='flex items-center gap-3'>
                  <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                  <span className='text-amber-800'>
                    Stable internet connection
                  </span>
                </div>
                <div className='flex items-center gap-3'>
                  <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                  <span className='text-amber-800'>
                    Quiet, well-lit environment
                  </span>
                </div>
                <div className='flex items-center gap-3'>
                  <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                  <span className='text-amber-800'>
                    Camera and microphone access
                  </span>
                </div>
              </div>
              <div className='space-y-3'>
                <div className='flex items-center gap-3'>
                  <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                  <span className='text-amber-800'>Close unnecessary tabs</span>
                </div>
                <div className='flex items-center gap-3'>
                  <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                  <span className='text-amber-800'>Disable notifications</span>
                </div>
                <div className='flex items-center gap-3'>
                  <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                  <span className='text-amber-800'>
                    Full-screen mode recommended
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Input Section */}
          <div className='p-8'>
            <div className='max-w-md mx-auto'>
              <div className='mb-6'>
                <label className='block text-lg font-semibold text-gray-900 mb-3 text-center'>
                  Enter Your Full Name
                </label>
                <Input
                  placeholder='e.g., John Smith'
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className='h-14 text-lg text-center border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-200'
                  autoFocus
                />
              </div>

              {/* Info Box */}
              <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6'>
                <div className='flex items-start gap-3'>
                  <Info className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
                  <div className='text-sm text-blue-800'>
                    <p className='font-medium mb-1'>Important Notes:</p>
                    <ul className='space-y-1 text-blue-700'>
                      <li>• Your interview will be recorded for evaluation</li>
                      <li>• AI monitoring ensures fair assessment</li>
                      <li>• Please answer all questions honestly</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Join Button */}
              <Button
                onClick={onJoinInterview}
                disabled={loading || !userName.trim()}
                className='w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
              >
                {loading ? (
                  <>
                    <Loader2Icon className='h-5 w-5 mr-2 animate-spin' />
                    Preparing Interview...
                  </>
                ) : (
                  <>
                    <Video className='h-5 w-5 mr-2' />
                    Start Interview
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className='text-center mt-8'>
          <p className='text-gray-500 text-sm'>
            Need help? Contact support at{' '}
            <a
              href='mailto:support@airecruitment.com'
              className='text-blue-600 hover:text-blue-700 font-medium'
            >
              support@airecruitment.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Interview
