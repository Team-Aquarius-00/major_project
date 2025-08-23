import { NextResponse } from 'next/server'
import { supabase } from '@/services/supabaseClient'

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      interviewId, 
      candidateId, 
      eyeData, 
      timestamp 
    } = body

    if (!interviewId || !candidateId || !eyeData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Process eye tracking data
    const processedData = processEyeData(eyeData)
    
    // Save to database
    const trackingData = {
      interview_id: interviewId,
      candidate_id: candidateId,
      event_type: 'eye_tracking',
      timestamp: timestamp || new Date().toISOString(),
      data: {
        ...eyeData,
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
        { error: 'Failed to save eye tracking data' },
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

function processEyeData(eyeData) {
  const {
    gazeX,
    gazeY,
    screenWidth,
    screenHeight,
    timestamp,
    confidence
  } = eyeData

  // Calculate if gaze is within screen bounds
  const isOnScreen = gazeX >= 0 && gazeX <= screenWidth && 
                    gazeY >= 0 && gazeY <= screenHeight

  // Calculate distance from screen center (focus indicator)
  const centerX = screenWidth / 2
  const centerY = screenHeight / 2
  const distanceFromCenter = Math.sqrt(
    Math.pow(gazeX - centerX, 2) + Math.pow(gazeY - centerY, 2)
  )

  // Normalize distance (0 = center, 1 = corner)
  const maxDistance = Math.sqrt(Math.pow(screenWidth, 2) + Math.pow(screenHeight, 2)) / 2
  const normalizedDistance = distanceFromCenter / maxDistance

  // Focus score (0-1, higher = more focused)
  const focusScore = Math.max(0, 1 - normalizedDistance)

  // Determine focus zone
  let focusZone = 'center'
  if (normalizedDistance > 0.7) focusZone = 'peripheral'
  else if (normalizedDistance > 0.3) focusZone = 'medium'

  return {
    isOnScreen,
    distanceFromCenter,
    normalizedDistance,
    focusScore,
    focusZone,
    confidence: confidence || 0,
    timestamp: timestamp || Date.now()
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interviewId')
    const candidateId = searchParams.get('candidateId')
    const timeRange = searchParams.get('timeRange') || '5m' // Default to last 5 minutes

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

    // Get eye tracking data within time range
    const { data: trackingData, error } = await supabase
      .from('InterviewTracking')
      .select('*')
      .eq('interview_id', interviewId)
      .eq('candidate_id', candidateId)
      .eq('event_type', 'eye_tracking')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch eye tracking data' },
        { status: 500 }
      )
    }

    // Calculate aggregate metrics
    const aggregateMetrics = calculateAggregateMetrics(trackingData)

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

function calculateAggregateMetrics(trackingData) {
  if (!trackingData || trackingData.length === 0) {
    return {
      totalSamples: 0,
      averageFocusScore: 0,
      focusZoneDistribution: {},
      confidence: 0,
      onScreenPercentage: 0
    }
  }

  let totalFocusScore = 0
  let onScreenCount = 0
  const focusZoneCounts = {}

  trackingData.forEach(record => {
    const data = record.data
    if (data.processed) {
      totalFocusScore += data.processed.focusScore
      if (data.processed.isOnScreen) onScreenCount++
      
      const zone = data.processed.focusZone
      focusZoneCounts[zone] = (focusZoneCounts[zone] || 0) + 1
    }
  })

  const totalSamples = trackingData.length
  const averageFocusScore = totalFocusScore / totalSamples
  const onScreenPercentage = (onScreenCount / totalSamples) * 100

  // Calculate confidence (average of all confidence values)
  const totalConfidence = trackingData.reduce((sum, record) => {
    return sum + (record.data.processed?.confidence || 0)
  }, 0)
  const averageConfidence = totalConfidence / totalSamples

  return {
    totalSamples,
    averageFocusScore: Math.round(averageFocusScore * 100) / 100,
    focusZoneDistribution: focusZoneCounts,
    confidence: Math.round(averageConfidence * 100) / 100,
    onScreenPercentage: Math.round(onScreenPercentage * 100) / 100
  }
}
