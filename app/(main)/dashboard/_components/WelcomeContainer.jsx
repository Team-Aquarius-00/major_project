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
    <div className='m-5 bg-white p-5 rounded-xl flex items-center justify-between'>
      <div>
        <h2 className='text-lg font-bold'>
          {greeting}, {displayName}
        </h2>
        <h2 className='text-gray-500'>Ai based hiring </h2>
      </div>

     
    </div>
  )
}
export default WelcomeContainer
