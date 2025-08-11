import { NextResponse } from 'next/server'
import { supabase } from '@/services/supabaseClient'

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      interviewId, 
      candidateId, 
      answers, 
      focusMetrics 
    } = body

    if (!interviewId || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate focus score based on eye movement and tab switches
    const focusScore = calculateFocusScore(focusMetrics)
    
    // Calculate answer score based on response quality
    const answerScore = calculateAnswerScore(answers)
    
    // Apply weights to calculate final score
    const focusWeight = 0.4  // 40% weight for focus
    const answerWeight = 0.6  // 60% weight for answers
    
    const finalScore = (focusWeight * focusScore) + (answerWeight * answerScore)
    
    // Save scoring results
    const scoringData = {
      interview_id: interviewId,
      candidate_id: candidateId,
      focus_score: focusScore,
      answer_score: answerScore,
      final_score: finalScore,
      focus_weight: focusWeight,
      answer_weight: answerWeight,
      focus_metrics: focusMetrics,
      answers: answers,
      created_at: new Date().toISOString()
    }

    const { data: result, error } = await supabase
      .from('InterviewScoring')
      .insert([scoringData])
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save scoring data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scoringId: result[0].id,
      focusScore: Math.round(focusScore * 100) / 100,
      answerScore: Math.round(answerScore * 100) / 100,
      finalScore: Math.round(finalScore * 100) / 100,
      breakdown: {
        focusContribution: Math.round((focusWeight * focusScore) * 100) / 100,
        answerContribution: Math.round((answerWeight * answerScore) * 100) / 100
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

function calculateFocusScore(focusMetrics) {
  if (!focusMetrics) return 0
  
  let totalScore = 0
  let maxScore = 0
  
  // Eye movement tracking (0-100 points)
  if (focusMetrics.eyeMovement) {
    const eyeScore = Math.max(0, 100 - (focusMetrics.eyeMovement.distractions * 10))
    totalScore += eyeScore
    maxScore += 100
  }
  
  // Tab switch tracking (0-100 points)
  if (focusMetrics.tabSwitches) {
    const tabScore = Math.max(0, 100 - (focusMetrics.tabSwitches.count * 15))
    totalScore += tabScore
    maxScore += 100
  }
  
  // Screen focus time (0-100 points)
  if (focusMetrics.screenFocus) {
    const focusTimeScore = (focusMetrics.screenFocus.percentage / 100) * 100
    totalScore += focusTimeScore
    maxScore += 100
  }
  
  // Return normalized score (0-1)
  return maxScore > 0 ? totalScore / maxScore : 0
}

function calculateAnswerScore(answers) {
  if (!answers || !Array.isArray(answers)) return 0
  
  let totalScore = 0
  let maxScore = 0
  
  answers.forEach(answer => {
    let questionScore = 0
    
    // Completeness (0-25 points)
    if (answer.response && answer.response.length > 10) {
      questionScore += Math.min(25, answer.response.length / 2)
    }
    
    // Relevance (0-25 points)
    if (answer.relevance_score) {
      questionScore += answer.relevance_score * 25
    }
    
    // Technical accuracy (0-25 points)
    if (answer.technical_score) {
      questionScore += answer.technical_score * 25
    }
    
    // Communication clarity (0-25 points)
    if (answer.clarity_score) {
      questionScore += answer.clarity_score * 25
    }
    
    totalScore += questionScore
    maxScore += 100
  })
  
  // Return normalized score (0-1)
  return maxScore > 0 ? totalScore / maxScore : 0
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

    // Get scoring data
    const { data: scoringData, error } = await supabase
      .from('InterviewScoring')
      .select('*')
      .eq('interview_id', interviewId)
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scoring data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ scoringData })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
