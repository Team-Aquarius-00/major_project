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

  return (
    <div className='flex flex-col justify-center items-center w-full'>
      <Image
        src={'/check.png'}
        alt='check'
        height={200}
        width={200}
        className='h-[50px] w-[50px]'
      />
      <h2 className='font-bold text-lg mt-4'>Your AI interview is ready</h2>
      <p className='mt-3'>
        Share this link with your candidates to start the interview process
      </p>
      <div className='w-full bg-white p-7 rounded-xl mt-5'>
        <div className='flex justify-between items-center'>
          <h2 className='font-bold'>Interview Link</h2>
          <h2 className='p-1 px-2 text-primary bg-blue-50 rounded'>
            Valid for 1 day
          </h2>
        </div>
        <div className='mt-5 flex gap-3 items-center'>
          <Input defaultValue={GetInterviewUrl()} disabled={true} />
          <Button onClick={() => onCopyLink()} className='cursor-pointer'>
            <Copy />
            Copy Link
          </Button>
        </div>
        <hr className='my-7' />
        <div className='flex gap-8'>
          <h2 className='text-sm text-black flex items-center gap-2'>
            <Clock className='h-4 w-4' /> {formData?.duration || '30 Min'} Min
          </h2>
          <h2 className='text-sm text-black flex items-center gap-2'>
            <Calendar className='h-4 w-4' /> {formData?.date || '5th july'}
          </h2>
          <h2 className='text-sm text-black flex items-center gap-2'>
            <List className='h-4 w-4' /> {formData?.questions || '10 Questions'}
          </h2>
        </div>
      </div>
      <div className='mt-7 bg-white p-5 rounded-lg w-full'>
        <h2 className='font-bold'>Share Via</h2>
        <div className='flex gap-7'>
          <Button variant={'outline'}>
            <Mail />
            Email{' '}
          </Button>
          <Button variant={'outline'}>
            <SlackIcon />
            Slack{' '}
          </Button>
          <Button variant={'outline'}>
            <MessageCircle /> Whatsapp
          </Button>
        </div>
      </div>
      <div className='flex items-center gap-2 p-4 mt-1 justify-between w-full'>
        <Link href={'/dashboard'}>
          <Button variant={'outline'}>
            {' '}
            <ArrowLeft /> Back to Dashboard
          </Button>
        </Link>

        <Button onClick={onCreateNewInterview}>
          {' '}
          <Plus /> Create New Interview
        </Button>
      </div>
    </div>
  )
}

export default InterviewLink
