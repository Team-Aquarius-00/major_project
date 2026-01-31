'use client'
// import { Divide } from 'lucide-react'
import { Users, UserCheck } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const page = () => {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  // Show nothing while checking authentication
  if (!isLoaded) {
    return null
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'>
      {/* Hero Section */}
      <div className='relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10'></div>
        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24'>
          <div className='text-center'>
            <h1 className='text-5xl md:text-6xl font-bold text-gray-900 mb-6'>
              AI-Powered Interview
              <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                {' '}
                Platform
              </span>
            </h1>
            <p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'>
              Revolutionary interview screening with advanced AI monitoring,
              behavioral analysis, and automated scoring. Streamline your hiring
              process while ensuring integrity and fairness.
            </p>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12'>
              <div className='text-center'>
                <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Users className='text-blue-600' size={32} />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Smart Screening
                </h3>
                <p className='text-gray-600'>
                  AI-generated questions tailored to job requirements
                </p>
              </div>

              <div className='text-center'>
                <div className='w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <UserCheck className='text-teal-600' size={32} />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Behavioral Analysis
                </h3>
                <p className='text-gray-600'>
                  Real-time monitoring with focus and integrity tracking
                </p>
              </div>

              <div className='text-center'>
                <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <div className='w-8 h-8 bg-purple-600 rounded text-white flex items-center justify-center text-sm font-bold'>
                    AI
                  </div>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Automated Scoring
                </h3>
                <p className='text-gray-600'>
                  Comprehensive scoring based on performance metrics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Type Selection */}

      {/* Features Section */}
      <div className='bg-white py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Advanced Monitoring Features
            </h2>
            <p className='text-lg text-gray-600'>
              Ensuring interview integrity with cutting-edge technology
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[
              {
                title: 'Eye Tracking',
                desc: 'Monitor focus and attention patterns',
                icon: '👁️',
              },
              {
                title: 'Tab Detection',
                desc: 'Track browser activity and tab switching',
                icon: '📱',
              },
              {
                title: 'Camera Analysis',
                desc: 'Real-time facial recognition and presence',
                icon: '📹',
              },
              {
                title: 'Behavioral Scoring',
                desc: 'Comprehensive integrity assessment',
                icon: '📊',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className='bg-gray-50 rounded-xl p-6 text-center'
              >
                <div className='text-3xl mb-4'>{feature.icon}</div>
                <h3 className='font-semibold text-gray-900 mb-2'>
                  {feature.title}
                </h3>
                <p className='text-sm text-gray-600'>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='bg-gray-900 text-white py-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <p className='text-gray-400'>
            © 2025 AI Interview Platform. Revolutionizing hiring with
            intelligent automation.
          </p>
        </div>
      </div>
    </div>
  )
}

export default page
