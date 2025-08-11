import { NextResponse } from 'next/server'
import { supabase } from '@/services/supabaseClient'

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      interviewId, 
      candidateId, 
      eventType, 
      data, 
      timestamp 
    } = body

    if (!interviewId || !candidateId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let trackingData = {
      interview_id: interviewId,
      candidate_id: candidateId,
      event_type: eventType,
      timestamp: timestamp || new Date().toISOString(),
      data: data || {}
    }

    // Insert tracking data
    const { data: result, error } = await supabase
      .from('InterviewTracking')
      .insert([trackingData])
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save tracking data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      trackingId: result[0].id 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interviewId')
    const candidateId = searchParams.get('candidateId')

    if (!interviewId || !candidateId) {
      return NextResponse.json(
        { error: 'Missing interviewId or candidateId' },
        { status: 400 }
      )
    }

    // Get tracking data for analysis
    const { data: trackingData, error } = await supabase
      .from('InterviewTracking')
      .select('*')
      .eq('interview_id', interviewId)
      .eq('candidate_id', candidateId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tracking data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ trackingData })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
