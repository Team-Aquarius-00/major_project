'use client'
import React from 'react'
// Removed app Provider user; Clerk is the single source of truth for auth
import Image from 'next/image'
import { useUser as useClerkUser } from '@clerk/nextjs'
function WelcomeContainer() {
  const { isSignedIn, user: clerkUser } = useClerkUser()

  const displayName =
    clerkUser?.fullName ||
    clerkUser?.username ||
    clerkUser?.firstName ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    'there'

  const avatarUrl = isSignedIn ? clerkUser?.imageUrl : undefined
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  return (
    <div className='m-5 bg-white p-6 rounded-lg flex items-center justify-between shadow-sm'>
      <div className='flex-1'>
        <h2 className='text-2xl font-bold text-gray-900 mb-1'>
          {greeting}, {displayName}
        </h2>
        <p className='text-gray-600 font-medium'>AI-powered hiring platform</p>
      </div>
      {/* {avatarUrl && (
        <div className='ml-6 flex-shrink-0'>
          <div className='relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-gray-200'>
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className='object-cover'
              priority
            />
          </div>
        </div>
      )} */}
    </div>
  )
}
export default WelcomeContainer
