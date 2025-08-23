import { Phone, Video } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function CreateOptions() {
  return (
    <div className='space-y-6'>
      <div className='text-center mb-8'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Get Started</h2>
        <p className='text-gray-600 max-w-md mx-auto'>
          Choose how you'd like to begin your hiring process
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
        <Link
          href={'/dashboard/create-interview'}
          className='group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1 hover:border-blue-300/70'
        >
          <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full -translate-y-16 translate-x-16'></div>
          <div className='relative z-10'>
            <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl mb-6 shadow-lg shadow-blue-500/25'>
              <Video className='h-8 w-8' />
            </div>
            <h3 className='text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors'>
              Create New Interview
            </h3>
            <p className='text-gray-600 leading-relaxed mb-6'>
              Create AI-powered interviews with behavioral analysis, automated
              scoring, and comprehensive monitoring
            </p>
            <div className='flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors'>
              <span>Get Started</span>
              <svg
                className='w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </div>
          </div>
        </Link>

        <div className='group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/50 hover:-translate-y-1 hover:border-emerald-300/70'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-400/10 to-transparent rounded-full -translate-y-16 translate-x-16'></div>
          <div className='relative z-10'>
            <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl mb-6 shadow-lg shadow-emerald-500/25'>
              <Phone className='h-8 w-8' />
            </div>
            <h3 className='text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors'>
              Phone Screening
            </h3>
            <p className='text-gray-600 leading-relaxed mb-6'>
              Conduct initial phone screenings to assess candidate fit before
              scheduling full interviews
            </p>
            <div className='flex items-center text-emerald-600 font-medium group-hover:text-emerald-700 transition-colors'>
              <span>Coming Soon</span>
              <svg
                className='w-4 h-4 ml-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className='text-center mt-8'>
        <p className='text-sm text-gray-500'>
          Need help?{' '}
          <a
            href='#'
            className='text-blue-600 hover:text-blue-700 font-medium underline'
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}

export default CreateOptions
