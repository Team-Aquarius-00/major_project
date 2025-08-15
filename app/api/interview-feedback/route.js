import { NextResponse } from 'next/server'
import { supabase } from '@/services/supabaseClient'

export async function POST(request) {
  try {
    const body = await request.json()
    const { interviewId, candidateId, focusMetrics, answerScores, finalScore } =
      body

    if (!interviewId || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate comprehensive feedback
    const feedback = generateInterviewFeedback({
      focusMetrics,
      answerScores,
      finalScore,
    })

    // Generate hiring recommendation
    const recommendation = generateHiringRecommendation(feedback)

    // Save feedback to database
    const feedbackData = {
      interview_id: interviewId,
      candidate_id: candidateId,
      final_score: finalScore,
      focus_metrics: focusMetrics,
      answer_scores: answerScores,
      feedback: feedback,
      recommendation: recommendation,
      created_at: new Date().toISOString(),
    }

    const { data: result, error } = await supabase
      .from('InterviewFeedback')
      .insert([feedbackData])
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save feedback data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      feedbackId: result[0].id,
      feedback,
      recommendation,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateInterviewFeedback(data) {
  const { focusMetrics, answerScores, finalScore } = data

  const feedback = {
    overall: {
      score: finalScore,
      grade: getGrade(finalScore),
      summary: generateOverallSummary(finalScore),
    },
    focus: {
      score: focusMetrics?.focusScore || 0,
      analysis: analyzeFocusMetrics(focusMetrics),
      strengths: identifyFocusStrengths(focusMetrics),
      concerns: identifyFocusConcerns(focusMetrics),
    },
    answers: {
      score: answerScores?.answerScore || 0,
      analysis: analyzeAnswerQuality(answerScores),
      strengths: identifyAnswerStrengths(answerScores),
      areas: identifyAnswerAreas(answerScores),
    },
    behavioral: {
      engagement: analyzeEngagement(focusMetrics),
      professionalism: analyzeProfessionalism(focusMetrics, answerScores),
      communication: analyzeCommunication(answerScores),
    },
    technical: {
      knowledge: assessTechnicalKnowledge(answerScores),
      problemSolving: assessProblemSolving(answerScores),
      adaptability: assessAdaptability(focusMetrics, answerScores),
    },
  }

  return feedback
}

function generateHiringRecommendation(feedback) {
  const { overall, focus, answers, technical } = feedback

  // Calculate recommendation score (0-100)
  let recommendationScore = 0

  // Weight different factors
  const weights = {
    overall: 0.3,
    focus: 0.2,
    answers: 0.25,
    behavioral: 0.15,
    technical: 0.1,
  }

  recommendationScore += overall.score * 100 * weights.overall
  recommendationScore += focus.score * 100 * weights.focus
  recommendationScore += answers.score * 100 * weights.answers
  recommendationScore += behavioral.engagement.score * 100 * weights.behavioral
  recommendationScore += technical.knowledge.score * 100 * weights.technical

  // Determine recommendation
  let recommendation = 'reject'
  let confidence = 'low'

  if (recommendationScore >= 80) {
    recommendation = 'strongly_recommend'
    confidence = 'high'
  } else if (recommendationScore >= 70) {
    recommendation = 'recommend'
    confidence = 'medium'
  } else if (recommendationScore >= 60) {
    recommendation = 'consider'
    confidence = 'medium'
  } else if (recommendationScore >= 50) {
    recommendation = 'weak_consider'
    confidence = 'low'
  }

  // Generate specific recommendations
  const specificRecommendations = generateSpecificRecommendations(feedback)

  return {
    score: Math.round(recommendationScore),
    recommendation,
    confidence,
    reasoning: generateRecommendationReasoning(feedback, recommendation),
    nextSteps: generateNextSteps(recommendation, feedback),
    specificRecommendations,
  }
}

function getGrade(score) {
  if (score >= 0.9) return 'A+'
  if (score >= 0.85) return 'A'
  if (score >= 0.8) return 'A-'
  if (score >= 0.75) return 'B+'
  if (score >= 0.7) return 'B'
  if (score >= 0.65) return 'B-'
  if (score >= 0.6) return 'C+'
  if (score >= 0.55) return 'C'
  if (score >= 0.5) return 'C-'
  return 'D'
}

function generateOverallSummary(score) {
  if (score >= 0.8) {
    return 'Exceptional candidate with outstanding performance across all metrics. Demonstrates strong technical skills, excellent focus, and professional communication.'
  } else if (score >= 0.7) {
    return 'Strong candidate with good performance. Shows solid technical knowledge and maintains good focus throughout the interview.'
  } else if (score >= 0.6) {
    return 'Competent candidate with adequate performance. Has basic technical knowledge but may need improvement in focus or communication.'
  } else {
    return 'Candidate needs significant improvement. Technical knowledge, focus, or communication skills require development before consideration.'
  }
}

function analyzeFocusMetrics(focusMetrics) {
  if (!focusMetrics) return { score: 0, level: 'unknown' }

  const { eyeMovement, tabSwitches, screenFocus } = focusMetrics

  let totalScore = 0
  let maxScore = 0

  // Eye movement analysis
  if (eyeMovement) {
    const eyeScore = Math.max(0, 100 - eyeMovement.distractions * 10)
    totalScore += eyeScore
    maxScore += 100
  }

  // Tab switch analysis
  if (tabSwitches) {
    const tabScore = Math.max(0, 100 - tabSwitches.count * 15)
    totalScore += tabScore
    maxScore += 100
  }

  // Screen focus analysis
  if (screenFocus) {
    totalScore += screenFocus.percentage
    maxScore += 100
  }

  const averageScore = maxScore > 0 ? totalScore / maxScore : 0

  let level = 'excellent'
  if (averageScore < 0.6) level = 'poor'
  else if (averageScore < 0.75) level = 'fair'
  else if (averageScore < 0.85) level = 'good'
  else if (averageScore < 0.95) level = 'very_good'

  return {
    score: averageScore,
    level,
    details: {
      eyeMovement: eyeMovement?.distractionRate || 0,
      tabSwitches: tabSwitches?.count || 0,
      screenFocus: screenFocus?.percentage || 0,
    },
  }
}

function analyzeAnswerQuality(answerScores) {
  if (!answerScores) return { score: 0, level: 'unknown' }

  const { relevance, technical, clarity, completeness } = answerScores

  let totalScore = 0
  let maxScore = 0

  if (relevance) {
    totalScore += relevance
    maxScore += 1
  }
  if (technical) {
    totalScore += technical
    maxScore += 1
  }
  if (clarity) {
    totalScore += clarity
    maxScore += 1
  }
  if (completeness) {
    totalScore += completeness
    maxScore += 1
  }

  const averageScore = maxScore > 0 ? totalScore / maxScore : 0

  let level = 'excellent'
  if (averageScore < 0.6) level = 'poor'
  else if (averageScore < 0.75) level = 'fair'
  else if (averageScore < 0.85) level = 'good'
  else if (averageScore < 0.95) level = 'very_good'

  return {
    score: averageScore,
    level,
    breakdown: { relevance, technical, clarity, completeness },
  }
}

function identifyFocusStrengths(focusMetrics) {
  const strengths = []

  if (focusMetrics?.eyeMovement?.distractionRate < 0.1) {
    strengths.push('Excellent eye focus and attention to screen')
  }

  if (focusMetrics?.tabSwitches?.count < 2) {
    strengths.push('Minimal tab switching, good interview focus')
  }

  if (focusMetrics?.screenFocus?.percentage > 90) {
    strengths.push('High screen engagement throughout interview')
  }

  return strengths.length > 0 ? strengths : ['Maintained basic interview focus']
}

function identifyFocusConcerns(focusMetrics) {
  const concerns = []

  if (focusMetrics?.eyeMovement?.distractionRate > 0.3) {
    concerns.push('Frequent eye movement away from screen')
  }

  if (focusMetrics?.tabSwitches?.count > 5) {
    concerns.push('Excessive tab switching during interview')
  }

  if (focusMetrics?.screenFocus?.percentage < 70) {
    concerns.push('Low screen engagement, potential distraction')
  }

  return concerns
}

function identifyAnswerStrengths(answerScores) {
  const strengths = []

  if (answerScores?.relevance > 0.8) {
    strengths.push('Highly relevant and on-topic responses')
  }

  if (answerScores?.technical > 0.8) {
    strengths.push('Strong technical knowledge and accuracy')
  }

  if (answerScores?.clarity > 0.8) {
    strengths.push('Clear and well-articulated communication')
  }

  if (answerScores?.completeness > 0.8) {
    strengths.push('Thorough and comprehensive answers')
  }

  return strengths.length > 0 ? strengths : ['Provided adequate responses']
}

function identifyAnswerAreas(answerScores) {
  const areas = []

  if (answerScores?.relevance < 0.6) {
    areas.push('Improve answer relevance to questions')
  }

  if (answerScores?.technical < 0.6) {
    areas.push('Enhance technical knowledge and accuracy')
  }

  if (answerScores?.clarity < 0.6) {
    areas.push('Work on communication clarity')
  }

  if (answerScores?.completeness < 0.6) {
    areas.push('Provide more comprehensive responses')
  }

  return areas
}

function analyzeEngagement(focusMetrics) {
  const engagementScore = focusMetrics?.screenFocus?.percentage / 100 || 0

  let level = 'excellent'
  if (engagementScore < 0.6) level = 'poor'
  else if (engagementScore < 0.75) level = 'fair'
  else if (engagementScore < 0.85) level = 'good'
  else if (engagementScore < 0.95) level = 'very_good'

  return {
    score: engagementScore,
    level,
    description: getEngagementDescription(level),
  }
}

function analyzeProfessionalism(focusMetrics, answerScores) {
  let professionalismScore = 0.5

  // Focus contributes to professionalism
  if (focusMetrics?.tabSwitches?.count < 3) {
    professionalismScore += 0.2
  }

  if (focusMetrics?.screenFocus?.percentage > 80) {
    professionalismScore += 0.2
  }

  // Answer quality contributes to professionalism
  if (answerScores?.clarity > 0.7) {
    professionalismScore += 0.1
  }

  return {
    score: Math.min(professionalismScore, 1),
    level:
      professionalismScore > 0.8
        ? 'excellent'
        : professionalismScore > 0.6
        ? 'good'
        : professionalismScore > 0.4
        ? 'fair'
        : 'poor',
  }
}

function analyzeCommunication(answerScores) {
  const communicationScore = answerScores?.clarity || 0.5

  return {
    score: communicationScore,
    level:
      communicationScore > 0.8
        ? 'excellent'
        : communicationScore > 0.6
        ? 'good'
        : communicationScore > 0.4
        ? 'fair'
        : 'poor',
    description: getCommunicationDescription(communicationScore),
  }
}

function assessTechnicalKnowledge(answerScores) {
  const technicalScore = answerScores?.technical || 0.5

  return {
    score: technicalScore,
    level:
      technicalScore > 0.8
        ? 'excellent'
        : technicalScore > 0.6
        ? 'good'
        : technicalScore > 0.4
        ? 'fair'
        : 'poor',
    description: getTechnicalDescription(technicalScore),
  }
}

function assessProblemSolving(answerScores) {
  const problemSolvingScore =
    (answerScores?.relevance + answerScores?.technical) / 2 || 0.5

  return {
    score: problemSolvingScore,
    level:
      problemSolvingScore > 0.8
        ? 'excellent'
        : problemSolvingScore > 0.6
        ? 'good'
        : problemSolvingScore > 0.4
        ? 'fair'
        : 'poor',
  }
}

function assessAdaptability(focusMetrics, answerScores) {
  let adaptabilityScore = 0.5

  // Focus under pressure indicates adaptability
  if (focusMetrics?.eyeMovement?.distractionRate < 0.2) {
    adaptabilityScore += 0.2
  }

  // Consistent answer quality indicates adaptability
  if (answerScores?.relevance > 0.7 && answerScores?.technical > 0.7) {
    adaptabilityScore += 0.3
  }

  return {
    score: Math.min(adaptabilityScore, 1),
    level:
      adaptabilityScore > 0.8
        ? 'excellent'
        : adaptabilityScore > 0.6
        ? 'good'
        : adaptabilityScore > 0.4
        ? 'fair'
        : 'poor',
  }
}

function generateRecommendationReasoning(feedback, recommendation) {
  const { overall, focus, answers } = feedback

  switch (recommendation) {
    case 'strongly_recommend':
      return `Candidate demonstrates exceptional performance with a ${Math.round(
        overall.score * 100
      )}% overall score. Strong focus (${Math.round(
        focus.score * 100
      )}%), excellent answers (${Math.round(
        answers.score * 100
      )}%), and professional behavior throughout.`

    case 'recommend':
      return `Candidate shows strong potential with a ${Math.round(
        overall.score * 100
      )}% overall score. Good focus (${Math.round(
        focus.score * 100
      )}%) and solid answers (${Math.round(
        answers.score * 100
      )}%). Minor areas for improvement identified.`

    case 'consider':
      return `Candidate meets basic requirements with a ${Math.round(
        overall.score * 100
      )}% overall score. Adequate focus (${Math.round(
        focus.score * 100
      )}%) and answers (${Math.round(
        answers.score * 100
      )}%). Several improvement areas noted.`

    case 'weak_consider':
      return `Candidate barely meets minimum standards with a ${Math.round(
        overall.score * 100
      )}% overall score. Limited focus (${Math.round(
        focus.score * 100
      )}%) and answer quality (${Math.round(
        answers.score * 100
      )}%). Significant development needed.`

    default:
      return `Candidate does not meet requirements with a ${Math.round(
        overall.score * 100
      )}% overall score. Poor focus (${Math.round(
        focus.score * 100
      )}%) and answer quality (${Math.round(
        answers.score * 100
      )}%). Not recommended for this position.`
  }
}

function generateNextSteps(recommendation) {
  switch (recommendation) {
    case 'strongly_recommend':
      return [
        'Schedule final interview with senior team members',
        'Prepare offer letter and benefits package',
        'Begin onboarding process planning',
      ]

    case 'recommend':
      return [
        'Schedule follow-up interview to address specific concerns',
        'Request additional technical assessment if needed',
        'Consider probationary period with clear expectations',
      ]

    case 'consider':
      return [
        'Schedule detailed technical interview',
        'Request portfolio or work samples',
        'Consider junior role or internship opportunity',
      ]

    case 'weak_consider':
      return [
        'Provide detailed feedback on improvement areas',
        'Suggest skill development programs',
        'Consider for future positions after growth',
      ]

    default:
      return [
        'Send polite rejection with constructive feedback',
        'Document decision for future reference',
        'Consider for different role if skills align',
      ]
  }
}

function generateSpecificRecommendations(feedback) {
  const recommendations = []

  // Focus recommendations
  if (feedback.focus.score < 0.7) {
    recommendations.push({
      category: 'Focus & Attention',
      priority: 'high',
      action: 'Improve interview environment and minimize distractions',
      impact: 'Will significantly improve overall performance',
    })
  }

  // Answer quality recommendations
  if (feedback.answers.score < 0.7) {
    recommendations.push({
      category: 'Answer Quality',
      priority: 'high',
      action: 'Enhance technical knowledge and communication skills',
      impact: 'Critical for role success and team collaboration',
    })
  }

  // Behavioral recommendations
  if (feedback.behavioral.professionalism.score < 0.6) {
    recommendations.push({
      category: 'Professionalism',
      priority: 'medium',
      action: 'Improve interview conduct and focus',
      impact: 'Important for team dynamics and client interactions',
    })
  }

  return recommendations
}

function getEngagementDescription(level) {
  const descriptions = {
    excellent: 'Maintained exceptional focus throughout the entire interview',
    very_good: 'Demonstrated strong engagement with minimal distractions',
    good: 'Showed good focus with occasional minor distractions',
    fair: 'Maintained basic focus but had noticeable distractions',
    poor: 'Struggled to maintain focus throughout the interview',
  }
  return descriptions[level] || 'Engagement level could not be determined'
}

function getCommunicationDescription(score) {
  if (score > 0.8) return 'Clear, articulate, and professional communication'
  if (score > 0.6)
    return 'Generally clear communication with room for improvement'
  if (score > 0.4) return 'Basic communication skills, needs development'
  return 'Communication skills require significant improvement'
}

function getTechnicalDescription(score) {
  if (score > 0.8)
    return 'Strong technical knowledge and problem-solving abilities'
  if (score > 0.6) return 'Solid technical foundation with some gaps'
  if (score > 0.4) return 'Basic technical knowledge, needs development'
  return 'Technical skills require substantial improvement'
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

    // Get feedback data
    const { data: feedbackData, error } = await supabase
      .from('InterviewFeedback')
      .select('*')
      .eq('interview_id', interviewId)
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feedback data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ feedbackData })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
