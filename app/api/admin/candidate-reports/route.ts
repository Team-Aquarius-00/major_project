import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Get all candidate reports for interviews created by an admin
 * Query params:
 *  - admin_email: Email of the admin
 *  - interview_id: Optional - filter by specific interview
 *  - sort_by: final_score, created_at (default: created_at)
 *  - order: asc, desc (default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const admin_email = searchParams.get('admin_email')
    const interview_id_filter = searchParams.get('interview_id')
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const order = (searchParams.get('order') || 'desc').toLowerCase() as
      | 'asc'
      | 'desc'

    if (!admin_email) {
      return NextResponse.json(
        { error: 'Missing required parameter: admin_email' },
        { status: 400 },
      )
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email: admin_email },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Find all interviews created by this admin
    const interviews = await prisma.interview.findMany({
      where: {
        admin_id: admin.id,
        ...(interview_id_filter && { interview_id: interview_id_filter }),
      },
      select: {
        id: true,
        interview_id: true,
        job_position: true,
        created_at: true,
      },
    })

    if (interviews.length === 0) {
      return NextResponse.json({
        success: true,
        admin_id: admin.id,
        interviews: [],
        candidates: [],
        message: 'No interviews found for this admin',
      })
    }

    const interviewIds = interviews.map((i) => i.id)

    // Get all candidates for these interviews
    const candidates = await prisma.interviewCandidate.findMany({
      where: {
        interview_id: {
          in: interviewIds,
        },
      },
      include: {
        interview: {
          select: {
            interview_id: true,
            job_position: true,
          },
        },
      },
      orderBy:
        sort_by === 'final_score'
          ? { final_score: order }
          : { created_at: order },
    })

    return NextResponse.json({
      success: true,
      admin_id: admin.id,
      admin_email: admin.email,
      interviews_count: interviews.length,
      candidates_count: candidates.length,
      interviews: interviews,
      candidates: candidates.map((c) => ({
        id: c.id,
        interview_id: c.interview.interview_id,
        job_position: c.interview.job_position,
        candidate_name: c.name,
        candidate_email: c.email,
        candidate_phone: c.phone,
        final_score: c.final_score,
        answer_quality_score: c.answer_quality_score,
        tracking_score: c.tracking_score,
        status: c.status,
        duration_seconds: c.duration,
        completed_at: c.completed_at,
        created_at: c.created_at,
        feedback: c.feedback,
        scoring: c.scoring,
      })),
    })
  } catch (error: unknown) {
    console.error('Error fetching candidate reports:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch candidate reports',
      },
      { status: 500 },
    )
  }
}
