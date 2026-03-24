import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ interview_id: string }> },
) {
  const { interview_id } = await params
  try {
    const body = await request.json()
    const {
      feedback,
      scoring,
      tracking,
      completed,
      final_score,
      answers,
      evaluation,
      duration,
    } = body

    // Prepare comprehensive results object
    const resultsData: Record<string, unknown> = {
      feedback: {
        ...feedback,
        final_score: final_score || 0,
      },
      scoring: {
        ...scoring,
        final_score: final_score || 0,
      },
      tracking: tracking || null,
      completed: completed || true,
      duration: duration || null,
    }

    // Store answers and evaluation if provided
    if (answers) {
      resultsData.answers = answers
    }
    if (evaluation) {
      resultsData.evaluation = evaluation
    }

    // Update interview with comprehensive results
    const interview = await prisma.interview.update({
      where: { interview_id: interview_id },
      data: {
        feedback: resultsData.feedback
          ? JSON.parse(
              JSON.stringify(resultsData.feedback as Record<string, unknown>),
            )
          : undefined,
        scoring: resultsData.scoring
          ? JSON.parse(
              JSON.stringify(resultsData.scoring as Record<string, unknown>),
            )
          : undefined,
        tracking: resultsData.tracking
          ? JSON.parse(
              JSON.stringify(resultsData.tracking as Record<string, unknown>),
            )
          : undefined,
        completed: resultsData.completed || true,
        duration: resultsData.duration || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Interview results saved successfully',
      data: interview,
      final_score: final_score || 0,
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
