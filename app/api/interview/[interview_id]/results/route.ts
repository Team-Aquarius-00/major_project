import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { interview_id: string } },
) {
  try {
    const body = await request.json()
    const { feedback, scoring, tracking, completed } = body

    // Update interview with results
    const interview = await prisma.interview.update({
      where: { interview_id: params.interview_id },
      data: {
        feedback: feedback || null,
        scoring: scoring || null,
        tracking: tracking || null,
        completed: completed || true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Interview results saved successfully',
      data: interview,
    })
  } catch (error: unknown) {
    console.error('Error saving interview results:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save interview results',
      },
      { status: 500 },
    )
  }
}
