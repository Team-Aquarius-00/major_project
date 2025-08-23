'use client'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import FormContainer from './_components/FormContainer'
import QuestionList from './_components/QuestionList'
import { toast } from 'sonner'
import InterviewLink from './_components/InterviewLink'

function CreateInterview() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState()
  const [interviewId, setInterviewId] = useState()
  const onHandleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    console.log('Formdata', formData)
  }
  const resetInterview = () => {
    setStep(1)
    setFormData(undefined)
    setInterviewId(undefined)
    setIsFormReady(false)
  }

  const [isFormReady, setIsFormReady] = useState(false)

  const onGotoNext = () => {
    if (
      !formData?.jobPosition ||
      !formData?.jobDescription ||
      !formData?.duration ||
      !formData?.type
    ) {
      toast('Please fill all the details')
      return
    }
    setFormData(formData)
    setIsFormReady(true)
    setStep(step + 1)
  }

  const onFinishCreatingLink = () => {
    setStep(step - 2)
  }

  const onCreateLink = (interview_id) => {
    setInterviewId(interview_id)
    setStep(step + 1)
  }
  return (
    <div className=' px-10 md:px-15 lg:px-44 xl:px-56'>
      <div className='flex gap-5 items-center  '>
        <ArrowLeft
          onClick={() => router.back()}
          className='cursor-pointer text-primary'
        />
        <h2 className='font-bold text-2xl'>Create New Interview</h2>
      </div>
      <Progress value={step * (100 / 3)} className='my-5' />
      {step === 1 ? (
        <FormContainer
          onHandleInputChange={onHandleInputChange}
          GoToNext={() => onGotoNext()}
        />
      ) : step === 2 && formData && isFormReady ? (
        <QuestionList
          formData={formData}
          onCreateLink={(interview_id) => onCreateLink(interview_id)}
        />
      ) : step === 3 ? (
        <InterviewLink
          formData={formData}
          interview_id={interviewId}
          // FinishCreatingLink={() => onFinishCreatingLink()}
          onCreateNewInterview={resetInterview}
        />
      ) : null}
    </div>
  )
}
export default CreateInterview
