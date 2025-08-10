'use client'
import React, { useContext, useEffect, useState } from 'react'
import { InterviewDataContext } from '../../../../context/InterviewDataContext'
import { Mic, Phone, Timer } from 'lucide-react'
import Image from 'next/image'
import Vapi from '@vapi-ai/web'
import AlertConfirmation from './_components/AlertConfirmation'
import { toast } from 'sonner'
function StartInterview() {
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext)
  const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)
  const [activeUser, setActiveUser] = useState(false)

  useEffect(() => {
    interviewInfo && startCall()
  }, [interviewInfo])

  const startCall = () => {
    // Prepare questions as a single comma-separated string
    const questionList = interviewInfo?.interviewData?.questionList
      ?.map(item => item?.question)
      .join(', ');

    console.log(questionList)
    // Make sure we actually have questions before starting
    if (!questionList) {
      console.error("No questions found in interview data.");
      return;
    }

    const assistantOptions = {
      name: 'AI Recruiter',
      firstMessage: `Hi ${interviewInfo?.userName}, how are you? Ready for your interview on ${interviewInfo?.interviewData.jobPosition}?`,
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
You are an AI voice assistant conducting an interview. Your job is to ask candidates the provided interview questions and assess their responses.

Begin with a friendly introduction:
"Hey there! Welcome to your ${interviewInfo?.interviewData.jobPosition} interview. Let's get started with a few questions!"

Ask one question at a time from the list:
Questions: ${questionList}

If the candidate struggles, offer hints or rephrase without giving away the answer.
Example hint: "Need a hint? Think about how React tracks component updates!"

Give brief, encouraging feedback after each answer:
"Nice! That's a solid answer."
or
"Hmm, not quite! Want to try again?"

Keep the tone friendly, engaging, and natural. After 5–7 questions, summarize their performance and end on a positive note.
`
          }
        ]
      }
    };

    // Start the Vapi call
    vapi.start(assistantOptions);
  };
  const stopInterview = () => {
    vapi.stop()
  }

  vapi.on("call-start", () => {
    console.log("call has started")
    toast("call connected ...")
  })

  vapi.on("call-end", () => {
    console.log("call has ended")
    toast("Interview ended ...")
  })
  vapi.on("speech-start", () => {
    console.log("Assistand speech has started")
    setActiveUser(false)
  })

  vapi.on("speech-end", () => {
    console.log("Assistand speech has ended")
    setActiveUser(true)
  })
  return (
    <div className='p-20 lg:px48 xl:px-56'>
      <h2 className='font-bold flex justify-between text-xl'>
        Ai Interview session
        <span className='flex gap-2 items-center'>
          <Timer />
          00:00:00
        </span>
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-7 mt-5'>
        <div className='bg-white h-[400px] rounded-lg border flex flex-col gap-3 items-center p-10 '>
          <div className='relative'>

            {!activeUser && <span className='absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping' />}
            <Image
              src={'/ai.png'}
              alt='aI image'
              width={100}
              height={100}
              className='rounded-full object-cover h-[100px] w-[100px] items-center justify-between ml-10'
            />
          </div>
          <h2 className='font-bold mt-4 items-center text-center'>
            Ai recruiter
          </h2>
        </div>
        <div className='bg-white h-[400px] rounded-lg border flex flex-col gap-3 items-center p-10 '>
          {/* <Image src={'/ai.png'} alt="aI image" width={300} */}
          {/*   height={300} */}
          {/*   className="rounded-full object-cover h-[200px] w-[200px] items-center justify-between ml-10" */}
          {/* /> */}
          <div className='relative'>

            {activeUser && <span className='absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping' />}

            <h2 className='bg-white rounded-full px-5 font-bold mt-4 text-lg'>
              {interviewInfo?.userName[0]}
            </h2>
            <h2>{interviewInfo?.userName || 'Sainth Joseph'} </h2>
          </div>
        </div>
      </div>

      <div className='flex flex-col '>
        <div className=' flex flex-row gap-2 items-center justify-center w-full mt-5'>
          <Mic className='h-12 w-12 rounded-full p-3 bg-gray-200 cursor-pointer ' />
          <AlertConfirmation stopInterview={stopInterview}>
            <Phone className='h-12 w-12 rounded-full p-3 bg-red-500 text-black cursor-pointer' />
          </AlertConfirmation>
        </div>
        <div className='items-center justify-center  flex '>
          <h2 className='mt-5 text-gray-400 items-center '>
            Interview is in progress
          </h2>
        </div>
      </div>
    </div>
  )
}

export default StartInterview
