import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const incomingFormData = await request.formData()
    const file = incomingFormData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing image file in form-data' },
        { status: 400 },
      )
    }

    const backendFormData = new FormData()
    backendFormData.append('file', file, 'frame.jpg')

    // Forward frame to FastAPI object detection endpoint.
    const response = await fetch(`${BACKEND_URL}/detect`, {
      method: 'POST',
      body: backendFormData,
    })

    if (!response.ok) {
      const backendError = await response.text().catch(() => '')
      throw new Error(`Backend error: ${response.status} ${backendError}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Error running object detection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to run object detection' },
      { status: 500 },
    )
  }
}
