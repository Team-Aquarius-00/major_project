'use client'
import { Camera, Plus, Clock, Trash2 } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'

function LatestInterviesList() {
  const router = useRouter()
  const [interviewList, setInterviewList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInterviews()
  }, [])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('Interview')
        .select('job_position, type,created_at, duration')
      console.log(data)

      if (error) {
        console.error('Error fetching interviews:', error)
        setInterviewList([])
        return
      }

      if (data && data.length > 0) {
        setInterviewList(data)
      } else {
        setInterviewList([])
      }
    } catch (err) {
      console.error('Error:', err)
      setInterviewList([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    router.push('/dashboard/create-interview')
  }

  const handleDelete = async (interviewId) => {
    if (!confirm('Are you sure you want to delete this interview?')) return

    try {
      await supabase.from('Interview').delete().eq('id', interviewId)

      setInterviewList((prev) => prev.filter((i) => i.id !== interviewId))
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const getRecommendationColor = (recommendation) => {
    if (!recommendation) return 'bg-gray-100 text-gray-700'
    const rec = recommendation.recommendation || 'maybe'
    switch (rec) {
      case 'strong_hire':
        return 'bg-emerald-100 text-emerald-700'
      case 'hire':
        return 'bg-blue-100 text-blue-700'
      case 'maybe':
        return 'bg-amber-100 text-amber-700'
      case 'no_hire':
        return 'bg-orange-100 text-orange-700'
      case 'strong_no_hire':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const parseAndDisplayTypes = (typeData) => {
    try {
      let types = []
      if (typeof typeData === 'string') {
        types = JSON.parse(typeData)
      } else if (Array.isArray(typeData)) {
        types = typeData
      }

      if (!Array.isArray(types) || types.length === 0) {
        return <span className='text-gray-500'>No types</span>
      }

      return (
        <div className='flex flex-wrap gap-2'>
          {types.map((type, index) => (
            <span
              key={index}
              className='px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200'
            >
              {type}
            </span>
          ))}
        </div>
      )
    } catch (err) {
      return <span className='text-gray-500'>N/A</span>
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className='my-5'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-bold text-lg'>Previously Created Interviews</h2>
      </div>

      {loading && (
        <div className='p-8 flex items-center justify-center bg-white rounded-lg border border-gray-200'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      )}

      {!loading && interviewList?.length === 0 && (
        <div className='p-8 flex flex-col items-center gap-3 bg-white rounded-lg border border-gray-200'>
          <Camera className='h-12 w-12 text-gray-400' />
          <h3 className='font-semibold text-gray-900'>No interviews yet</h3>
          <p className='text-gray-600 text-sm'>
            Create your first interview to get started
          </p>
          <Button
            onClick={handleCreateNew}
            className='mt-2 bg-blue-600 hover:bg-blue-700'
          >
            <Plus className='h-4 w-4 mr-1' /> Create New Interview
          </Button>
        </div>
      )}

      {!loading && interviewList?.length > 0 && (
        <div className='space-y-3'>
          {interviewList.map((interview) => (
            <div
              key={interview.id}
              className='p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow'
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-3'>
                    <h3 className='font-semibold text-gray-900'>
                      {interview.job_position || 'Interview'}
                    </h3>
                    <span className='text-xs text-gray-500 flex items-center gap-1'>
                      <Clock className='h-3 w-3' />
                      {formatDate(interview.created_at)}
                    </span>
                  </div>

                  <p className='text-sm text-gray-600 mb-3'>
                    <span className='block text-gray-700 font-medium mb-2'>
                      Types:
                    </span>
                    {parseAndDisplayTypes(interview.type)}
                  </p>

                  <p className='text-sm text-gray-600 mb-3'>
                    Duration:{' '}
                    <span className='font-medium'>
                      {interview.duration || 'N/A'}
                    </span>
                  </p>
                </div>

                <Button
                  onClick={() => handleDelete(interview.id)}
                  variant='ghost'
                  size='sm'
                  className='text-red-600 hover:bg-red-50'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LatestInterviesList
