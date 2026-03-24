import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      interview_id,
      candidate_id,
      tab_title,
      tab_url,
      time_spent,
      event_type,
      timestamp,
    } = body

    // Forward to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/tab-switch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interview_id,
        candidate_id,
        tab_title,
        tab_url,
        time_spent,
        event_type,
        timestamp: timestamp || new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    const result = await response.json()

    // Also save locally to database if needed
    return NextResponse.json({
      success: true,
      message: 'Tab switch recorded',
      backend_response: result,
    })
  } catch (error: unknown) {
    console.error('Error recording tab switch:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record tab switch' },
      { status: 500 },
    )
  }
}
