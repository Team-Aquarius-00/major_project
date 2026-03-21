import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { interviewId, candidateId, tabData, timestamp } = await request.json()

    // Log the tab switch event
    console.log('Tab switch event received:', {
      interviewId,
      candidateId,
      eventType: tabData.eventType,
      timeSpent: tabData.timeSpent,
      timestamp,
    })

    // Here you could store the tab switch data in a database
    // For now, we'll just acknowledge receipt

    return NextResponse.json({
      success: true,
      message: 'Tab switch data recorded',
      processedData: {
        isDistraction: tabData.eventType === 'switch_away' || tabData.eventType === 'window_blur',
        timeSpent: tabData.timeSpent,
      }
    })
  } catch (error) {
    console.error('Error processing tab monitoring data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process tab data' },
      { status: 500 }
    )
  }
}