import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { interview_id: string } }
) {
  try {
    const interview = await prisma.interview.findUnique({
      where: { interview_id: params.interview_id },
    })

    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: interview,
    })
  } catch (error: unknown) {
    console.error('Error fetching interview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interview' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { interview_id: string } }
) {
  try {
    const body = await request.json()
    const { feedback, scoring, tracking, completed, job_position, duration } =
      body

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {}
    if (feedback !== undefined) updateData.feedback = feedback
    if (scoring !== undefined) updateData.scoring = scoring
    if (tracking !== undefined) updateData.tracking = tracking
    if (completed !== undefined) updateData.completed = completed
    if (job_position !== undefined) updateData.job_position = job_position
    if (duration !== undefined) updateData.duration = duration

    const interview = await prisma.interview.update({
      where: { interview_id: params.interview_id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Interview updated successfully',
      data: interview,
    })
  } catch (error: unknown) {
    console.error('Error updating interview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update interview' },
      { status: 500 }
    )
  }
}
