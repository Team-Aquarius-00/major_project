import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

type AnalyzeAnswerBody = {
  questionNumber?: number
  question?: string
  answer?: string
  jobPosition?: string
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

function fallbackAnswerAnalysis(body: AnalyzeAnswerBody) {
  const answer = String(body.answer || '').trim()
  const wordCount = answer ? answer.split(/\s+/).length : 0

  let score = 0
  if (wordCount >= 40) score = 85
  else if (wordCount >= 25) score = 75
  else if (wordCount >= 15) score = 65
  else if (wordCount >= 8) score = 50
  else if (wordCount > 0) score = 35

  return {
    questionNumber: Number(body.questionNumber || 0),
    score: clampScore(score),
    summary:
      wordCount >= 15
        ? 'Answer contains enough detail for initial evaluation.'
        : 'Answer is short; more detail and concrete examples are needed.',
    strengths: wordCount >= 15 ? ['Provided a complete response'] : [],
    improvements:
      wordCount < 15 ? ['Add specific examples and clearer reasoning'] : [],
    analysisEngine: 'fallback',
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ interview_id: string }> },
) {
  try {
    await params
    const body = (await request.json()) as AnalyzeAnswerBody

    const question = String(body.question || '').trim()
    const answer = String(body.answer || '').trim()
    const questionNumber = Number(body.questionNumber || 0)
    const jobPosition = String(body.jobPosition || 'the role').trim()

    if (!answer) {
      return NextResponse.json({
        questionNumber,
        score: 0,
        summary: 'No answer captured for this question.',
        strengths: [],
        improvements: ['Provide a complete answer'],
        analysisEngine: 'fallback',
      })
    }

    const apiKey =
      process.env.OPENROUTER_API_KEY_ABCD || process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json(fallbackAnswerAnalysis(body))
    }

    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    })

    const prompt = `You are an interview evaluator for ${jobPosition}.

Question ${questionNumber || ''}: ${question}
Candidate answer: ${answer}

Return ONLY valid JSON in this exact shape:
{
  "score": number,
  "summary": string,
  "strengths": string[],
  "improvements": string[]
}

Rules:
- Score from 0 to 100.
- Be strict but fair.
- Reward specificity and clear reasoning.
- Penalize vague, incorrect, or very short answers.
`

    try {
      const completion = await client.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 350,
        messages: [{ role: 'user', content: prompt }],
      })

      const content = completion.choices?.[0]?.message?.content || '{}'
      const start = content.indexOf('{')
      const end = content.lastIndexOf('}')
      const jsonText =
        start >= 0 && end > start ? content.slice(start, end + 1) : '{}'
      const parsed = JSON.parse(jsonText)

      return NextResponse.json({
        questionNumber,
        score: clampScore(Number(parsed?.score || 0)),
        summary: String(parsed?.summary || ''),
        strengths: Array.isArray(parsed?.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed?.improvements)
          ? parsed.improvements
          : [],
        analysisEngine: 'llm',
      })
    } catch (error) {
      console.error('Analyze-answer LLM failed, using fallback:', error)
      return NextResponse.json(fallbackAnswerAnalysis(body))
    }
  } catch (error: unknown) {
    console.error('Analyze-answer route error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to analyze answer',
      },
      { status: 500 },
    )
  }
}
