import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ interview_id: string }> },
) {
  try {
    const { interview_id } = await params
    // Keep endpoint for backward compatibility; Interview model no longer stores tracking JSON.
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interview_id },
      select: { id: true },
    })

    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tracking payload received',
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
