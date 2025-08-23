'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Building,
  Plus,
  CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ScheduleInterview() {
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    company: '',
    position: '',
    date: '',
    time: '',
    duration: '30',
    notes: '',
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would typically save to your database
    toast.success('Interview scheduled successfully!')
    console.log('Scheduled interview:', formData)
  }

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Schedule Interview
        </h1>
        <p className='text-gray-600'>
          Schedule a new interview with your candidate
        </p>
      </div>

      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Candidate Information */}
          <div className='space-y-4'>
            <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
              <User className='h-5 w-5 text-blue-600' />
              Candidate Information
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Full Name *
                </label>
                <Input
                  value={formData.candidateName}
                  onChange={(e) =>
                    handleInputChange('candidateName', e.target.value)
                  }
                  placeholder="Enter candidate's full name"
                  required
                  className='h-11'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Email *
                </label>
                <Input
                  type='email'
                  value={formData.candidateEmail}
                  onChange={(e) =>
                    handleInputChange('candidateEmail', e.target.value)
                  }
                  placeholder='candidate@email.com'
                  required
                  className='h-11'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Phone Number
                </label>
                <Input
                  type='tel'
                  value={formData.candidatePhone}
                  onChange={(e) =>
                    handleInputChange('candidatePhone', e.target.value)
                  }
                  placeholder='+1 (555) 123-4567'
                  className='h-11'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Company
                </label>
                <Input
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder='Company name'
                  className='h-11'
                />
              </div>
            </div>
          </div>

          {/* Interview Details */}
          <div className='space-y-4'>
            <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
              <Calendar className='h-5 w-5 text-green-600' />
              Interview Details
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Position *
                </label>
                <Input
                  value={formData.position}
                  onChange={(e) =>
                    handleInputChange('position', e.target.value)
                  }
                  placeholder='e.g., Senior Developer'
                  required
                  className='h-11'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Date *
                </label>
                <Input
                  type='date'
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                  className='h-11'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Time *
                </label>
                <Input
                  type='time'
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                  className='h-11'
                />
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Duration
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange('duration', e.target.value)
                  }
                  className='w-full h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value='15'>15 minutes</option>
                  <option value='30'>30 minutes</option>
                  <option value='45'>45 minutes</option>
                  <option value='60'>1 hour</option>
                  <option value='90'>1.5 hours</option>
                  <option value='120'>2 hours</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Interview Type
                </label>
                <select className='w-full h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
                  <option value='technical'>Technical</option>
                  <option value='behavioral'>Behavioral</option>
                  <option value='experience'>Experience</option>
                  <option value='problem-solving'>Problem Solving</option>
                  <option value='leadership'>Leadership</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className='space-y-4'>
            <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
              <Building className='h-5 w-5 text-purple-600' />
              Additional Information
            </h2>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder='Add any additional notes, requirements, or special instructions...'
                rows={4}
                className='resize-none'
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center justify-end gap-4 pt-6 border-t border-gray-100'>
            <Button
              type='button'
              variant='outline'
              className='px-6 py-3 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200'
            >
              Save as Draft
            </Button>
            <Button
              type='submit'
              className='px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5'
            >
              <CalendarDays className='h-4 w-4 mr-2' />
              Schedule Interview
            </Button>
          </div>
        </form>
      </div>

      {/* Quick Stats */}
      <div className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-blue-100 rounded-lg'>
              <Calendar className='h-6 w-6 text-blue-600' />
            </div>
            <div>
              <p className='text-2xl font-bold text-gray-900'>12</p>
              <p className='text-sm text-gray-600'>Scheduled Today</p>
            </div>
          </div>
        </div>
        <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-green-100 rounded-lg'>
              <Clock className='h-6 w-6 text-green-600' />
            </div>
            <div>
              <p className='text-2xl font-bold text-gray-900'>8</p>
              <p className='text-sm text-gray-600'>Completed Today</p>
            </div>
          </div>
        </div>
        <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-purple-100 rounded-lg'>
              <User className='h-6 w-6 text-purple-600' />
            </div>
            <div>
              <p className='text-2xl font-bold text-gray-900'>45</p>
              <p className='text-sm text-gray-600'>Total Candidates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
