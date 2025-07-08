'use client'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import FormContainer from './_components/FormContainer'
import QuestionList from './_components/QuestionList'
import { toast } from 'sonner'

function CreateInterview() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState()
  const onHandleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    console.log('Formdata', formData)
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
    setIsFormReady(true)
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
      <Progress value={step * 33} className='my-5' />
      {step === 1 ? (
        <FormContainer
          onHandleInputChange={onHandleInputChange}
          GoToNext={() => onGotoNext()}
        />
      ) : step === 2 && formData &&isFormReady ? (
        <QuestionList formData={formData} />
      ) : null}
    </div>
  )
}
export default CreateInterview
