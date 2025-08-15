import { NextResponse } from 'next/server'
import { supabase } from '@/services/supabaseClient'

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      interviewId, 
      candidateId, 
      tabData, 
      timestamp 
    } = body

    if (!interviewId || !candidateId || !tabData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Process tab switch data
    const processedData = processTabData(tabData)
    
    // Save to database
    const trackingData = {
      interview_id: interviewId,
      candidate_id: candidateId,
      event_type: 'tab_switch',
      timestamp: timestamp || new Date().toISOString(),
      data: {
        ...tabData,
        processed: processedData
      }
    }

    const { data: result, error } = await supabase
      .from('InterviewTracking')
      .insert([trackingData])
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save tab monitoring data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trackingId: result[0].id,
      processedData
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function processTabData(tabData) {
  const {
    eventType,
    timeSpent,
    url,
    title
  } = tabData

  // Determine if this is a distraction
  let isDistraction = false
  let distractionLevel = 'none'
  
  if (eventType === 'switch_away' || eventType === 'window_blur') {
    isDistraction = true
    distractionLevel = 'high'
  } else if (eventType === 'switch_back' || eventType === 'window_focus') {
    isDistraction = false
    distractionLevel = 'none'
  } else if (eventType === 'new_tab') {
    isDistraction = true
    distractionLevel = 'medium'
  }

  // Calculate focus penalty based on time spent away
  let focusPenalty = 0
  if (isDistraction && timeSpent > 0) {
    // Higher penalty for longer distractions
    const secondsAway = timeSpent / 1000
    if (secondsAway > 30) {
      focusPenalty = 0.5 // High penalty for very long distractions
    } else if (secondsAway > 10) {
      focusPenalty = 0.3 // Medium penalty for moderate distractions
    } else {
      focusPenalty = 0.1 // Low penalty for short distractions
    }
  }

  // Determine if URL is interview-related
  const isInterviewRelated = url && (
    url.includes('interview') || 
    url.includes('recruitment') || 
    url.includes('hire') ||
    url.includes('job')
  )

  return {
    isDistraction,
    distractionLevel,
    focusPenalty,
    isInterviewRelated,
    timeSpent: timeSpent || 0,
    url: url || '',
    title: title || '',
    timestamp: Date.now()
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interviewId')
    const candidateId = searchParams.get('candidateId')
    const timeRange = searchParams.get('timeRange') || '5m'

    if (!interviewId || !candidateId) {
      return NextResponse.json(
        { error: 'Missing interviewId or candidateId' },
        { status: 400 }
      )
    }

    // Calculate time range
    const now = new Date()
    let startTime
    switch (timeRange) {
      case '1m':
        startTime = new Date(now.getTime() - 60 * 1000)
        break
      case '5m':
        startTime = new Date(now.getTime() - 5 * 60 * 1000)
        break
      case '15m':
        startTime = new Date(now.getTime() - 15 * 60 * 1000)
        break
      case '30m':
        startTime = new Date(now.getTime() - 30 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 5 * 60 * 1000)
    }

    // Get tab monitoring data within time range
    const { data: trackingData, error } = await supabase
      .from('InterviewTracking')
      .select('*')
      .eq('interview_id', interviewId)
      .eq('candidate_id', candidateId)
      .eq('event_type', 'tab_switch')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tab monitoring data' },
        { status: 500 }
      )
    }

    // Calculate aggregate metrics
    const aggregateMetrics = calculateTabAggregateMetrics(trackingData)

    return NextResponse.json({
      trackingData,
      aggregateMetrics,
      timeRange: {
        start: startTime.toISOString(),
        end: now.toISOString()
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateTabAggregateMetrics(trackingData) {
  if (!trackingData || trackingData.length === 0) {
    return {
      totalSwitches: 0,
      distractionCount: 0,
      totalFocusPenalty: 0,
      averageTimeAway: 0,
      interviewRelatedSwitches: 0,
      focusScore: 100
    }
  }

  let totalSwitches = trackingData.length
  let distractionCount = 0
  let totalFocusPenalty = 0
  let totalTimeAway = 0
  let interviewRelatedSwitches = 0

  trackingData.forEach(record => {
    const data = record.data
    if (data.processed) {
      if (data.processed.isDistraction) {
        distractionCount++
        totalFocusPenalty += data.processed.focusPenalty
        totalTimeAway += data.processed.timeSpent
      }
      
      if (data.processed.isInterviewRelated) {
        interviewRelatedSwitches++
      }
    }
  })

  const averageTimeAway = distractionCount > 0 ? totalTimeAway / distractionCount : 0
  const focusScore = Math.max(0, 100 - (totalFocusPenalty * 100))

  return {
    totalSwitches,
    distractionCount,
    totalFocusPenalty: Math.round(totalFocusPenalty * 100) / 100,
    averageTimeAway: Math.round(averageTimeAway * 100) / 100,
    interviewRelatedSwitches,
    focusScore: Math.round(focusScore * 100) / 100
  }
}
