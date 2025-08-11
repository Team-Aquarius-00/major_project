import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  List,
  Mail,
  MessageCircle,
  Plus,
  SlackIcon,
  Play,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { toast } from 'sonner'

function InterviewLink({ interview_id, formData, onCreateNewInterview }) {
  const url = process.env.NEXT_PUBLIC_HOST_URL + '/' + interview_id
  const GetInterviewUrl = () => {
    return url
  }

  const onCopyLink = async () => {
    await navigator.clipboard.writeText(url)
    toast('Link copied to clipboard')
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent('AI Interview Invitation')
    const body = encodeURIComponent(
      `Hi there,\n\nYou've been invited to take an AI-powered interview.\n\nInterview Details:\n- Duration: ${
        formData?.duration || '30'
      } minutes\n- Type: ${
        formData?.type?.join(', ') || 'Technical'
      }\n- Position: ${
        formData?.jobPosition || 'Not specified'
      }\n\nPlease click the link below to start your interview:\n${url}\n\nGood luck!\n\nBest regards,\nAI Recruitment Team`
    )
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`
    window.open(mailtoLink)
    toast('Email client opened')
  }

  const shareViaSlack = () => {
    const text = encodeURIComponent(
      `🎯 *AI Interview Invitation*\n\n*Interview Details:*\n• Duration: ${
        formData?.duration || '30'
      } minutes\n• Type: ${
        formData?.type?.join(', ') || 'Technical'
      }\n• Position: ${
        formData?.jobPosition || 'Not specified'
      }\n\n*Interview Link:* ${url}\n\nShare this with your candidates! 🚀`
    )
    const slackLink = `https://slack.com/app_redirect?channel=general&text=${text}`
    window.open(slackLink, '_blank')
    toast('Slack sharing opened')
  }

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `🎯 *AI Interview Invitation*\n\n*Interview Details:*\n• Duration: ${
        formData?.duration || '30'
      } minutes\n• Type: ${
        formData?.type?.join(', ') || 'Technical'
      }\n• Position: ${
        formData?.jobPosition || 'Not specified'
      }\n\n*Interview Link:* ${url}\n\nShare this with your candidates! 🚀`
    )
    const whatsappLink = `https://wa.me/?text=${text}`
    window.open(whatsappLink, '_blank')
    toast('WhatsApp sharing opened')
  }

  const shareViaLinkedIn = () => {
    const text = encodeURIComponent(
      `🎯 AI Interview Invitation\n\nInterview Details:\n• Duration: ${
        formData?.duration || '30'
      } minutes\n• Type: ${
        formData?.type?.join(', ') || 'Technical'
      }\n• Position: ${
        formData?.jobPosition || 'Not specified'
      }\n\nInterview Link: ${url}\n\nShare this with your candidates! 🚀`
    )
    const linkedinLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}&title=${encodeURIComponent('AI Interview Invitation')}&summary=${text}`
    window.open(linkedinLink, '_blank')
    toast('LinkedIn sharing opened')
  }

  return (
    <div className='flex flex-col justify-center items-center w-full max-w-4xl mx-auto'>
      <div className='text-center mb-8'>
        <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4'>
          <Image
            src={'/check.png'}
            alt='check'
            height={200}
            width={200}
            className='h-10 w-10'
          />
        </div>
        <h2 className='font-bold text-2xl text-gray-900 mb-2'>
          Your AI Interview is Ready!
        </h2>
        <p className='text-gray-600 max-w-md mx-auto'>
          Share this link with your candidates to start the interview process
        </p>
      </div>

      <div className='w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-6'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='font-bold text-lg text-gray-900'>Interview Link</h2>
          <div className='px-3 py-1 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full'>
            Valid for 1 day
          </div>
        </div>
        <div className='flex gap-3 items-center'>
          <Input
            defaultValue={GetInterviewUrl()}
            disabled={true}
            className='flex-1 h-12 text-sm font-mono bg-gray-50 border-gray-200'
          />
          <Button
            onClick={() => onCopyLink()}
            variant='outline'
            className='h-12 px-6 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200'
          >
            <Copy className='h-4 w-4 mr-2' />
            Copy Link
          </Button>
          <Link href={`/interview/${interview_id}/start`}>
            <Button className='h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5'>
              <Play className='h-4 w-4 mr-2' />
              Take Interview
            </Button>
          </Link>
        </div>

        <hr className='my-8 border-gray-100' />

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Clock className='h-4 w-4 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500 font-medium'>Duration</p>
              <p className='text-sm font-semibold text-gray-900'>
                {formData?.duration || '30'} Min
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
            <div className='p-2 bg-green-100 rounded-lg'>
              <Calendar className='h-4 w-4 text-green-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500 font-medium'>Date</p>
              <p className='text-sm font-semibold text-gray-900'>
                {formData?.date || '5th July'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
            <div className='p-2 bg-purple-100 rounded-lg'>
              <List className='h-4 w-4 text-purple-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500 font-medium'>Questions</p>
              <p className='text-sm font-semibold text-gray-900'>
                {formData?.questions || '10'} Questions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6'>
        <h2 className='font-bold text-lg text-gray-900 mb-4'>Share Via</h2>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          <Button
            onClick={shareViaEmail}
            variant='outline'
            className='px-4 py-3 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-200'
          >
            <Mail className='h-4 w-4 mr-2' />
            Email
          </Button>
          <Button
            onClick={shareViaSlack}
            variant='outline'
            className='px-4 py-3 border-gray-300 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-200'
          >
            <SlackIcon className='h-4 w-4 mr-2' />
            Slack
          </Button>
          <Button
            onClick={shareViaWhatsApp}
            variant='outline'
            className='px-4 py-3 border-gray-300 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-all duration-200'
          >
            <MessageCircle className='h-4 w-4 mr-2' />
            WhatsApp
          </Button>
          <Button
            onClick={shareViaLinkedIn}
            variant='outline'
            className='px-4 py-3 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-200'
          >
            <svg
              className='h-4 w-4 mr-2'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
            </svg>
            LinkedIn
          </Button>
        </div>
      </div>

      <div className='flex items-center gap-4 p-6 justify-between w-full bg-white rounded-2xl shadow-sm border border-gray-100'>
        <Link href={'/dashboard'}>
          <Button
            variant='outline'
            className='px-6 py-3 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Dashboard
          </Button>
        </Link>

        <Button
          onClick={onCreateNewInterview}
          className='px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5'
        >
          <Plus className='h-4 w-4 mr-2' />
          Create New Interview
        </Button>
      </div>
    </div>
  )
}

export default InterviewLink
