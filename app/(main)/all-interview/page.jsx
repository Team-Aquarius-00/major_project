'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  Building,
  MoreHorizontal,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { useUser } from '@/app/provider'

export default function AllInterviews() {
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchInterviews()
    }
  }, [user])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      const url = user?.email
        ? `/api/interview?userEmail=${encodeURIComponent(user.email)}`
        : '/api/interview'
      const response = await axios.get(url)

      if (response.data.success && response.data.data) {
        // Transform the data to match the expected format
        const transformedData = response.data.data.map((interview) => ({
          id: interview.id,
          candidateName: 'Candidate', // Since we don't have candidate name in our schema
          position: interview.job_position || 'Not specified',
          company: 'Company', // Since we don't have company in our schema
          date: interview.created_at
            ? new Date(interview.created_at).toLocaleDateString()
            : 'N/A',
          time: interview.created_at
            ? new Date(interview.created_at).toLocaleTimeString()
            : 'N/A',
          duration: interview.duration || '30',
          status: interview.completed ? 'completed' : 'scheduled', // Map completed to status
          type: Array.isArray(interview.type)
            ? interview.type.join(', ')
            : interview.type || 'Technical',
          score: null, // We don't have score in our schema
        }))
        setInterviews(transformedData)
      } else {
        setInterviews([])
      }
    } catch (err) {
      console.error('Error fetching interviews:', err)
      setInterviews([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'scheduled':
        return 'Scheduled'
      case 'in-progress':
        return 'In Progress'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch =
      interview.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.id.toString().includes(searchTerm)
    const matchesFilter =
      filterStatus === 'all' || interview.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className='max-w-7xl mx-auto p-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          All Interviews
        </h1>
        <p className='text-gray-600'>
          Manage and track all your interview sessions
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6'>
        <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
          <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              placeholder='Search interviews...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 h-11'
            />
          </div>
          <div className='flex items-center gap-3'>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='h-11 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='all'>All Status</option>
              <option value='scheduled'>Scheduled</option>
              <option value='in-progress'>In Progress</option>
              <option value='completed'>Completed</option>
              <option value='cancelled'>Cancelled</option>
            </select>
            <Button
              variant='outline'
              className='h-11 px-4 border-gray-300 hover:bg-gray-50'
            >
              <Filter className='h-4 w-4 mr-2' />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Interviews List */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
            <span className='ml-2 text-gray-600'>Loading interviews...</span>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-100'>
                <tr>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Interview
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Position
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Created
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Duration
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {filteredInterviews.length === 0 ? (
                  <tr>
                    <td
                      colSpan='7'
                      className='px-6 py-12 text-center text-gray-500'
                    >
                      No interviews found
                    </td>
                  </tr>
                ) : (
                  filteredInterviews.map((interview) => (
                    <tr
                      key={interview.id}
                      className='hover:bg-gray-50 transition-colors'
                    >
                      <td className='px-6 py-4'>
                        <div className='flex items-center'>
                          <div className='h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold'>
                            I
                          </div>
                          <div className='ml-3'>
                            <p className='text-sm font-medium text-gray-900'>
                              Interview #{interview.id}
                            </p>
                            <p className='text-sm text-gray-500'>
                              ID: {interview.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <p className='text-sm font-medium text-gray-900'>
                          {interview.position}
                        </p>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          <Calendar className='h-4 w-4 text-gray-400' />
                          <div>
                            <p className='text-sm font-medium text-gray-900'>
                              {interview.date}
                            </p>
                            <p className='text-sm text-gray-500'>
                              {interview.time}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          <Clock className='h-4 w-4 text-gray-400' />
                          <span className='text-sm text-gray-900'>
                            {interview.duration} min
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <Badge variant='outline' className='text-xs'>
                          {interview.type}
                        </Badge>
                      </td>
                      <td className='px-6 py-4'>
                        <Badge
                          className={`text-xs border ${getStatusColor(interview.status)}`}
                        >
                          {getStatusText(interview.status)}
                        </Badge>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600'
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600'
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className='mt-8 grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-blue-100 rounded-lg'>
              <Calendar className='h-6 w-6 text-blue-600' />
            </div>
            <div>
              <p className='text-2xl font-bold text-gray-900'>
                {interviews.length}
              </p>
              <p className='text-sm text-gray-600'>Total Interviews</p>
            </div>
          </div>
        </div>
        <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-green-100 rounded-lg'>
              <Clock className='h-6 w-6 text-green-600' />
            </div>
            <div>
              <p className='text-2xl font-bold text-gray-900'>
                {interviews.filter((i) => i.status === 'scheduled').length}
              </p>
              <p className='text-sm text-gray-600'>Scheduled</p>
            </div>
          </div>
        </div>
        <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-yellow-100 rounded-lg'>
              <User className='h-6 w-6 text-yellow-600' />
            </div>
            <div>
              <p className='text-2xl font-bold text-gray-900'>
                {interviews.filter((i) => i.status === 'in-progress').length}
              </p>
              <p className='text-sm text-gray-600'>In Progress</p>
            </div>
          </div>
        </div>
        <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-purple-100 rounded-lg'>
              <Building className='h-6 w-6 text-purple-600' />
            </div>
            <div>
              <p className='text-2xl font-bold text-gray-900'>
                {interviews.filter((i) => i.status === 'completed').length}
              </p>
              <p className='text-sm text-gray-600'>Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
