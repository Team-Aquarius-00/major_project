import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      interview_id,
      job_position,
      job_description,
      duration,
      type,
      questionList,
      userEmail,
    } = body

    if (!interview_id) {
      return NextResponse.json(
        { error: 'Missing interview_id' },
        { status: 400 },
      )
    }

    const interview = await prisma.interview.create({
      data: {
        interview_id,
        job_position,
        job_description,
        duration,
        type,
        questionList,
        userEmail,
      },
    })

    return NextResponse.json({ success: true, data: interview })
  } catch (error: unknown) {
    console.error('Error creating interview:', error)
    return NextResponse.json(
      { error: error || 'Failed to create interview' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interview_id')

    if (interviewId) {
      // Fetch specific interview by interview_id
      const interview = await prisma.interview.findUnique({
        where: { interview_id: interviewId },
      })

      if (!interview) {
        return NextResponse.json(
          { error: 'Interview not found' },
          { status: 404 },
        )
      }

      return NextResponse.json({ success: true, data: interview })
    }

    // Fetch all interviews
    const interviews = await prisma.interview.findMany({
      select: {
        id: true,
        job_position: true,
        type: true,
        created_at: true,
        duration: true,
      },
    })

    return NextResponse.json({ success: true, data: interviews })
  } catch (error: unknown) {
    console.error('Error fetching interviews:', error)
    return NextResponse.json(
      { error: error || 'Failed to fetch interviews' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing interview id' },
        { status: 400 },
      )
    }

    await prisma.interview.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting interview:', error)
    return NextResponse.json(
      { error: error || 'Failed to delete interview' },
      { status: 500 },
    )
  }
}
