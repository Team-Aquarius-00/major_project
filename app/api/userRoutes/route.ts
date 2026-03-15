// backend/routes/users.ts (example)
// import { PrismaClient } from '@prisma/client'

import { NextRequest, NextResponse } from 'next/server'
import { createOrFetchUser } from '@/lib/userUtils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, picture } = body

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const user = await createOrFetchUser(email, name, picture)

    return NextResponse.json(user)
  } catch (error: unknown) {
    console.error('Error creating/fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to create/fetch user' },
      { status: 500 },
    )
  }
}
