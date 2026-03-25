import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ interview_id: string }> },
) {
  try {
    const { interview_id } = await params
    const body = await request.json()
    const { tracking } = body

    // Fetch current interview to get existing tracking data
    const currentInterview = await prisma.interview.findUnique({
      where: { interview_id: interview_id },
      select: { tracking: true },
    })

    if (!currentInterview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 },
      )
    }

    // Merge new tracking data with existing data (if any)
    let mergedTracking = tracking
    if (
      currentInterview.tracking &&
      typeof currentInterview.tracking === 'object'
    ) {
      mergedTracking = {
        ...currentInterview.tracking,
        ...tracking,
      }
    }

    // Update interview with merged tracking data
    const interview = await prisma.interview.update({
      where: { interview_id: interview_id },
      data: {
        tracking: mergedTracking,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Interview tracking updated',
      data: interview,
    })
  } catch (error: unknown) {
    console.error('Error updating interview tracking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update tracking' },
      { status: 500 },
    )
  }
}
