"use client"
import Image from 'next/image'
import React, { useContext, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Clock, Info, Loader2Icon, NetworkIcon, Video } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'
import { toast } from 'sonner'
import { InterviewDataContext } from '../../../context/InterviewDataContext'

function Interview() {
  const { interview_id } = useParams()

  if (!interview_id) {
    toast.error("Missing interview ID")
    return
  }
  console.log(interview_id)
  const router = useRouter()
  const [interviewData, setInterviewData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const {interviewInfo, setInterviewInfo} = useContext(InterviewDataContext)

  useEffect(() => {
    interview_id && GetInterviewDetails()
  }, [interview_id])


  const GetInterviewDetails = async () => {
    setLoading(true)
    try {

      let { data: Interview, error } = await supabase
        .from('Interview')
        .select('jobPosition, jobDescription, type, duration')
        .eq('interview_id', interview_id)

      console.log(Interview[0])
      setInterviewData(Interview[0])

      setInterviewInfo(Interview[0])
      if (!Interview.length === 0) {
        toast("Inteview not found")
        return
      }

    } catch (error) {
      console.log(error)
    }
    setLoading(false)
  }

  const onJoinInterview = async () => {
    setLoading(true)
    try {

      let { data: Interview, error } = await supabase
        .from('Interview')
        .select('*')
        .eq('interview_id', interview_id)

      console.log(Interview[0])
      setInterviewInfo({
        userName: userName,
        interviewData: Interview[0]
      })
      router.push('/interview/' + interview_id + "/start")
    } catch (error) {
      toast('interview not created')
    }
    setLoading(false)
  }
  return (
    <div className='px-10 md:px-28 lg:px-48 xl:px-64 mt-10'>
      <div className='flex flex-col p-7 items-center justify-center border rounded-xl bg-white lg:px-33 xl:px-52'>
        <Image
          src={'/logo.png'}
          alt='logo'
          width={200}
          height={100}
          className='w-[140px]'
        />
        <h2 className='mt-3 font-bold'>AI powered Interview Platform</h2>
        <Image
          src={'/interview.png'}
          alt='interview'
          height={500}
          width={500}
          className='w-[400px]'
        />
        <h2 className='font-bold text-lg mt-4'>{interviewData?.jobPosition}</h2>
        <h2 className='flex gap-2 items-center text-gray-500 '>
          <Clock className='h-4 w-4' />
          <p>{interviewData?.duration} Minutes</p>
        </h2>
        <div className='w-2/3'>
          <h2 className=''>Enter your name</h2>
          <Input placeholder="Eg. Elon Musk" autoFocus onChange={(e) => setUserName(e.target.value)} />
        </div>
        <div className='p-3 gap-4  bg-blue-50 rounded-lg flex mt-4 text-primary'>
          <Info className='' />
          <div className=''>
            <h2 className='font-bold'>Before you begin</h2>
            <ul className='items-center justify-between'>
              <li>-Test your camera and microphone</li>
              <li className='flex items-center gap-3'>-Ensure you have stable internet connection<NetworkIcon className='h-5 w-5' /> </li>
              <li>-Find a quite place for interview</li>
            </ul>
          </div>
        </div>
        <Button className="mt-4 font-bold text-lg " disabled={loading || !userName} onClick={onJoinInterview}><Video />{loading && <Loader2Icon />} Join interview</Button>
      </div>
    </div>
  )
}

export default Interview
