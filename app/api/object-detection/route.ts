import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      interview_id,
      candidate_id,
      gaze_x,
      gaze_y,
      gaze_direction,
      confidence,
      is_looking_at_screen,
      timestamp,
    } = body

    // Forward to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/gaze-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interview_id,
        candidate_id,
        gaze_x,
        gaze_y,
        gaze_direction,
        confidence,
        is_looking_at_screen,
        timestamp: timestamp || new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Gaze data recorded',
      backend_response: result,
    })
  } catch (error: unknown) {
    console.error('Error recording gaze data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record gaze data' },
      { status: 500 },
    )
  }
}
