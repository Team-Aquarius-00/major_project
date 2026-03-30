import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type InterviewResultRow = {
  attempt_id: number
  interview_id: string
  candidate_name: string
  answer_score: number | null
  integrity_score: number | null
  final_score: number | null
  analyzed_answers_count: number | null
  integrity_components: {
    D: number | null
    S: number | null
    E: number | null
    T: number | null
  }
  detected_non_person_classes: string[]
  detected_class_counts: Record<string, number>
  detection_snapshot_urls: string[]
  completed_at: Date | null
}

function parseOptionalNumber(value: unknown): number | null {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.round(numeric) : null
}

function getScoreValue(
  directValue: unknown,
  scoring: unknown,
  key: string,
): number | null {
  const fromColumn = parseOptionalNumber(directValue)
  if (fromColumn !== null) return fromColumn

  if (!scoring || typeof scoring !== 'object') return null
  const scoreObject = scoring as Record<string, unknown>
  return parseOptionalNumber(scoreObject[key])
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => String(item || '').trim())
    .filter((item) => item.length > 0)
}

function asNumericRecord(value: unknown): Record<string, number> {
  const source = asRecord(value)
  const out: Record<string, number> = {}

  Object.entries(source).forEach(([key, val]) => {
    const numeric = Number(val)
    if (!Number.isFinite(numeric)) return
    out[key] = Math.round(numeric)
  })

  return out
}

function asSnapshotUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return ''
      const url = (entry as Record<string, unknown>).url
      return String(url || '').trim()
    })
    .filter((url) => url.length > 0)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const interviewId = String(searchParams.get('interview_id') || '').trim()
    const userEmail = String(searchParams.get('userEmail') || '').trim()
    const jobPosition = String(searchParams.get('job_position') || '').trim()

    const attempts = await prisma.interviewAttempt.findMany({
      where: {
        completed: true,
        interview: {
          ...(interviewId ? { interview_id: interviewId } : {}),
          ...(userEmail ? { adminEmail: userEmail } : {}),
          ...(jobPosition ? { job_position: jobPosition } : {}),
        },
      },
      select: {
        id: true,
        answer_score: true,
        integrity_score: true,
        final_manager_score: true,
        analyzed_answers_count: true,
        scoring: true,
        feedback: true,
        tracking: true,
        completed_at: true,
        interview: {
          select: {
            interview_id: true,
          },
        },
        taker: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ completed_at: 'desc' }, { id: 'desc' }],
    })

    const rows: InterviewResultRow[] = attempts.map((item) => {
      const scoring = asRecord(item.scoring)
      const feedback = asRecord(item.feedback)
      const tracking = asRecord(item.tracking)
      const proctoring = asRecord(scoring.proctoring_metrics)
      const trackingDetection = asRecord(asRecord(tracking).detection)
      const integrityComponents = asRecord(proctoring.integrity_components)

      const nonPersonClasses = asStringArray(
        trackingDetection.non_person_classes_seen ||
          proctoring.detected_object_classes_non_person ||
          feedback.detected_classes_non_person,
      )

      const detectedClassCounts = asNumericRecord(
        trackingDetection.class_counts ||
          proctoring.detected_object_class_counts ||
          {},
      )

      const detectionSnapshotUrls = asSnapshotUrls(
        trackingDetection.evidence_snapshots,
      )

      return {
        attempt_id: item.id,
        interview_id: item.interview?.interview_id || '',
        candidate_name: item.taker?.name || 'Candidate',
        answer_score: getScoreValue(
          item.answer_score,
          item.scoring,
          'answer_score',
        ),
        integrity_score: getScoreValue(
          item.integrity_score,
          item.scoring,
          'integrity_score',
        ),
        final_score: getScoreValue(
          item.final_manager_score,
          item.scoring,
          'final_manager_score',
        ),
        analyzed_answers_count: getScoreValue(
          item.analyzed_answers_count,
          item.scoring,
          'analyzed_answers_count',
        ),
        integrity_components: {
          D: parseOptionalNumber(integrityComponents.D),
          S: parseOptionalNumber(integrityComponents.S),
          E: parseOptionalNumber(integrityComponents.E),
          T: parseOptionalNumber(integrityComponents.T),
        },
        detected_non_person_classes: nonPersonClasses,
        detected_class_counts: detectedClassCounts,
        detection_snapshot_urls: detectionSnapshotUrls,
        completed_at: item.completed_at,
      }
    })

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error: unknown) {
    console.error('Error fetching interview results:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch interview results',
      },
      { status: 500 },
    )
  }
}
