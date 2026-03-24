import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface CandidateRegistration {
  interview_id: string
  name: string
  email: string
  phone?: string
}

/**
 * Register a candidate for an interview
 * Called when candidate starts the interview
 */
export async function POST(request: NextRequest) {
  try {
    const body: CandidateRegistration = await request.json()
    const { interview_id, name, email, phone } = body

    // Validate input
    if (!interview_id || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: interview_id, name, email' },
        { status: 400 },
      )
    }

    // Find the interview by interview_id
    const interview = await prisma.interview.findUnique({
      where: { interview_id },
    })

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 },
      )
    }

    // Create or update candidate record
    const candidate = await prisma.interviewCandidate.upsert({
      where: {
        interview_id_email: {
          interview_id: interview.id,
          email: email,
        },
      },
      update: {
        name,
        phone: phone || undefined,
        status: 'in_progress',
      },
      create: {
        interview_id: interview.id,
        name,
        email,
        phone: phone || undefined,
        status: 'in_progress',
      },
    })

    return NextResponse.json({
      success: true,
      candidate_id: candidate.id,
      message: 'Candidate registered successfully',
    })
  } catch (error: unknown) {
    console.error('Candidate registration error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to register candidate',
      },
      { status: 500 },
    )
  }
}
