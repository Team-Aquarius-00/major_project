'use client'

import React, { useContext, useEffect, useState } from 'react'
import { useUser as useClerkUser } from '@clerk/nextjs'
import { UserDetailContext } from '../context/UserDetailContext'

function Provider({ children }) {
  const { user: clerkUser, isLoaded } = useClerkUser()
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!clerkUser) return

    createOrFetchUser()
  }, [clerkUser, isLoaded])

  const createOrFetchUser = async () => {
    try {
      const res = await fetch('/api/userRoutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clerkUser.primaryEmailAddress?.emailAddress,
          name: clerkUser.fullName,
          picture: clerkUser.imageUrl,
        }),
      })

      if (!res.ok) throw new Error('Failed to fetch/create user')

      const data = await res.json()
      setUser(data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <UserDetailContext.Provider value={{ user, setUser }}>
      {children}
    </UserDetailContext.Provider>
  )
}

export default Provider

export const useUser = () => useContext(UserDetailContext)
