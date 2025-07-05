'use client'
import React from 'react'
import { useUser } from '../../../provider'
import Image from 'next/image'
function WelcomeContainer() {
  const { user } = useUser()
  return (
    <div className='bg-white p-5 rounded-xl flex items-center justify-between'>
      <div >
        <h2 className='text-lg font-bold'>
          Welcome Back {user?.name ?? 'name'}
        </h2>
        <h2 className='text-gray-500'>Ai based hiring </h2>
      </div>

      {user &&
        <Image src={user?.picture} alt='userAvatar'
          width={40}
          height={40}
          className='rounded-full'
        />}
    </div>
  )
}
export default WelcomeContainer
