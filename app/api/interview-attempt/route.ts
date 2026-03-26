import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { interview_id, name, email } = body

    if (!interview_id || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: interview_id, name',
        },
        { status: 400 },
      )
    }

    const interview = await prisma.interview.findUnique({
      where: { interview_id: String(interview_id) },
      select: { id: true },
    })

    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 },
      )
    }

    const normalizedEmail = String(email || '').trim() || null
    const normalizedName = String(name).trim()

    let taker
    if (normalizedEmail) {
      taker = await prisma.interviewTaker.upsert({
        where: { email: normalizedEmail },
        update: { name: normalizedName },
        create: {
          name: normalizedName,
          email: normalizedEmail,
        },
      })
    } else {
      taker = await prisma.interviewTaker.create({
        data: {
          name: normalizedName,
          email: null,
        },
      })
    }

    const attempt = await prisma.interviewAttempt.create({
      data: {
        interview_id: interview.id,
        interview_taker_id: taker.id,
        completed: false,
      },
    })

    return NextResponse.json({
      success: true,
      data: attempt,
    })
  } catch (error: unknown) {
    console.error('Error creating interview attempt:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create interview attempt',
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { attempt_id, completed, feedback, scoring, tracking } = body

    if (!attempt_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: attempt_id' },
        { status: 400 },
      )
    }

    const attempt = await prisma.interviewAttempt.update({
      where: { id: Number(attempt_id) },
      data: {
        completed: Boolean(completed),
        completed_at: completed ? new Date() : null,
        feedback: feedback || null,
        scoring: scoring || null,
        tracking: tracking || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: attempt,
    })
  } catch (error: unknown) {
    console.error('Error updating interview attempt:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update interview attempt',
      },
      { status: 500 },
    )
  }
}
