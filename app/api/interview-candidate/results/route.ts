import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface CandidateResults {
  interview_id: string
  email: string
  final_score: number
  answer_quality_score: number
  tracking_score: number
  answers: string[]
  evaluation: Record<string, unknown>
  feedback: Record<string, unknown>
  scoring: Record<string, unknown>
  tracking: Record<string, unknown>
  duration: number
}

/**
 * Save interview results for a candidate
 * Called when interview is completed
 */
export async function POST(request: NextRequest) {
  try {
    const body: CandidateResults = await request.json()
    const {
      interview_id: interview_id_str,
      email,
      final_score,
      answer_quality_score,
      tracking_score,
      answers,
      evaluation,
      feedback,
      scoring,
      tracking,
      duration,
    } = body

    // Validate input
    if (!interview_id_str || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: interview_id, email' },
        { status: 400 },
      )
    }

    // Find the interview
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interview_id_str },
    })

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 },
      )
    }

    // Find and update candidate record
    const candidate = await prisma.interviewCandidate.findUnique({
      where: {
        interview_id_email: {
          interview_id: interview.id,
          email,
        },
      },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found for this interview' },
        { status: 404 },
      )
    }

    // Update candidate with results
    const updatedCandidate = await prisma.interviewCandidate.update({
      where: { id: candidate.id },
      data: {
        final_score: final_score || 0,
        answer_quality_score: answer_quality_score || 0,
        tracking_score: tracking_score || 0,
        answers: answers ? JSON.parse(JSON.stringify(answers)) : null,
        evaluation: evaluation ? JSON.parse(JSON.stringify(evaluation)) : null,
        feedback: feedback ? JSON.parse(JSON.stringify(feedback)) : null,
        scoring: scoring ? JSON.parse(JSON.stringify(scoring)) : null,
        tracking: tracking ? JSON.parse(JSON.stringify(tracking)) : null,
        duration: duration || 0,
        status: 'completed',
        completed_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Interview results saved successfully',
      candidate_id: updatedCandidate.id,
      final_score: updatedCandidate.final_score,
    })
  } catch (error: unknown) {
    console.error('Error saving candidate results:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save interview results',
      },
      { status: 500 },
    )
  }
}
