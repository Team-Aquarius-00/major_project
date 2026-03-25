import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

type QuestionItem = {
  question?: string
}

type QAPair = {
  questionNumber?: number
  configuredQuestion?: string
  askedByAssistant?: string
  answer?: string
}

type TranscriptEntry = {
  role?: string
  text?: string
  timestamp?: string
}

function extractJson(text: string) {
  const trimmed = text.trim()

  if (!trimmed) {
    throw new Error('Empty analysis response')
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    // continue to fenced parsing
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim())
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error('No JSON object found in analysis response')
  }

  return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1))
}

function fallbackAnalysis(qaPairs: QAPair[]) {
  const answered = qaPairs.filter(
    (item) => (item.answer || '').trim().length > 0,
  )
  const completion = qaPairs.length > 0 ? answered.length / qaPairs.length : 0
  const averageAnswerLength =
    answered.length > 0
      ? answered.reduce(
          (acc, item) => acc + (item.answer || '').trim().length,
          0,
        ) / answered.length
      : 0

  const scoreFromLength = Math.min(
    Math.round((averageAnswerLength / 300) * 100),
    100,
  )
  const scoreFromCompletion = Math.round(completion * 100)
  const overallScore = Math.round(
    scoreFromLength * 0.4 + scoreFromCompletion * 0.6,
  )

  return {
    overallScore,
    recommendation:
      overallScore >= 80 ? 'hire' : overallScore >= 65 ? 'consider' : 'reject',
    summary:
      'Fallback scoring was used because LLM analysis was unavailable. Review transcript manually for final decision.',
    strengths: completion >= 0.7 ? ['Answered most questions'] : [],
    improvementAreas:
      averageAnswerLength < 100
        ? ['Provide more detailed and specific answers']
        : [],
    categoryScores: {
      technical: overallScore,
      communication: overallScore,
      problemSolving: overallScore,
      confidence: overallScore,
    },
    questionEvaluations: qaPairs.map((pair) => ({
      questionNumber: pair.questionNumber,
      question: pair.configuredQuestion || pair.askedByAssistant || '',
      answer: pair.answer || '',
      score: (pair.answer || '').trim().length > 0 ? overallScore : 0,
      strengths: [],
      improvements: [],
    })),
    analysisEngine: 'fallback',
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ interview_id: string }> },
) {
  try {
    const { interview_id } = await params
    const body = await request.json()

    const {
      questionList = [],
      qaPairs = [],
      transcript = [],
      candidateName = 'Candidate',
      jobPosition = 'the role',
    } = body as {
      questionList?: QuestionItem[]
      qaPairs?: QAPair[]
      transcript?: TranscriptEntry[]
      candidateName?: string
      jobPosition?: string
    }

    const normalizedQuestionList = (questionList || []).map((item, index) => ({
      questionNumber: index + 1,
      question: item?.question || `Question ${index + 1}`,
    }))

    const normalizedQAPairs = (qaPairs || []).map((item, index) => ({
      questionNumber: item?.questionNumber || index + 1,
      question:
        item?.configuredQuestion ||
        item?.askedByAssistant ||
        normalizedQuestionList[index]?.question ||
        `Question ${index + 1}`,
      answer: item?.answer || '',
    }))

    const transcriptText = (transcript || [])
      .map((entry) => `${entry?.role || 'unknown'}: ${entry?.text || ''}`)
      .join('\n')

    const prompt = `You are a senior interviewer evaluating a completed interview.

Candidate: ${candidateName}
Job Position: ${jobPosition}
Interview ID: ${interview_id}

Question List:\n${JSON.stringify(normalizedQuestionList, null, 2)}

Q/A Pairs:\n${JSON.stringify(normalizedQAPairs, null, 2)}

Transcript:\n${transcriptText}

Return ONLY a valid JSON object with this exact shape:
{
  "overallScore": number,
  "recommendation": "strong_hire" | "hire" | "consider" | "reject",
  "summary": string,
  "strengths": string[],
  "improvementAreas": string[],
  "categoryScores": {
    "technical": number,
    "communication": number,
    "problemSolving": number,
    "confidence": number
  },
  "questionEvaluations": [
    {
      "questionNumber": number,
      "question": string,
      "answer": string,
      "score": number,
      "strengths": string[],
      "improvements": string[]
    }
  ]
}

Scoring rules:
- Scores are from 0 to 100.
- Be strict but fair.
- If an answer is missing or too short, score it low.
- Keep feedback useful for hiring decisions.
`

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey:
        process.env.OPENROUTER_API_KEY_ABCD ||
        process.env.OPENROUTER_API_KEY ||
        '',
    })

    if (
      !process.env.OPENROUTER_API_KEY_ABCD &&
      !process.env.OPENROUTER_API_KEY
    ) {
      const fallback = fallbackAnalysis(normalizedQAPairs)
      return NextResponse.json(fallback)
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 1400,
        messages: [{ role: 'user', content: prompt }],
      })

      const rawContent = completion.choices?.[0]?.message?.content || '{}'
      const parsed = extractJson(rawContent)

      return NextResponse.json({
        ...parsed,
        analysisEngine: 'llm',
      })
    } catch (llmError) {
      console.error('LLM analysis failed, using fallback:', llmError)
      const fallback = fallbackAnalysis(normalizedQAPairs)
      return NextResponse.json(fallback)
    }
  } catch (error: unknown) {
    console.error('Interview analysis error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to analyze interview',
      },
      { status: 500 },
    )
  }
}
