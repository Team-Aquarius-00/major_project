import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import React, { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SideBarOptions, InterviewType } from '@/services/Constants'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

function FormContainer({ onHandleInputChange }) {
  const [interviewType, setInterviewType] = useState([])
  useEffect(() => {
    if (interviewType) {
      onHandleInputChange('type', interviewType)
    }
  }, [interviewType])

  const AddInterviewType = (type) => {
    const data = interviewType.includes(type)
    if (!data) {
      setInterviewType((prev) => [...prev, type])
    } else {
      const result = interviewType.filter((item) => item != type)
      setInterviewType(result)
    }
  }
  return (
    <div className='bg-white p-5 rounded-xl'>
      <div>
        <h2 className='text-sm font-medium'>Job Postion</h2>
        <Input
          placeholder='eg. Full stack Developer'
          className='mt-2'
          onChange={(event) =>
            onHandleInputChange('jobposition', event.target.value)
          }
        />
      </div>

      <div className='mt-5'>
        <h2 className='text-sm font-medium'>Job Postion</h2>
        <Textarea
          placeholder='Enter the description of Job Postion'
          className='mt-2 h-[150px]'
          onChange={(event) =>
            onHandleInputChange('jobDescription', event.target.value)
          }
        />
      </div>
      <div className='mt-5'>
        <h2 className='text-sm font-medium'>Duration</h2>
        <Select
          onValueChange={(value) => onHandleInputChange('duration', value)}
        >
          <SelectTrigger className='w-full mt-2'>
            <SelectValue placeholder='Interview Duration' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='5'>5 Minute</SelectItem>
            <SelectItem value='15'>15 Minute</SelectItem>
            <SelectItem value='30'>30 Minute</SelectItem>
            <SelectItem value='45'>45 Minute</SelectItem>
            <SelectItem value='60'>60 Minute</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='mt-5'>
        <h2 className='text-sm font-medium'>Interview Type</h2>
        <div className='flex gap-3 flex-wrap mt-2'>
          {InterviewType.map((type, index) => (
            <div
              key={index}
              className={`hover:bg-secondary flex gap-2 items-center cursor-pointer p-1 px-2 bg-white border border-gray-300 rounded-2xl ${
                interviewType.includes(type.title) && 'bg-blue text-primary'
              }`}
              onClick={() => AddInterviewType(type.title)}
            >
              <type.icon className='h-6 w-6' />
              <span>{type.title}</span>
            </div>
          ))}
        </div>
      </div>
      <div className='mt-7 flex justify-end'>
        <Button>
          <ArrowRight />
          Generate Questions
        </Button>
      </div>
    </div>
  )
}

export default FormContainer
