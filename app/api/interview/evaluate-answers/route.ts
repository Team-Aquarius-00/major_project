import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface EvaluationRequest {
  interview_id: string
  questions: Array<{ question: string; type: string }>
  answers: string[]
  job_position: string
}

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
})

/**
 * Evaluates interview answers using GPT-4 LLM
 * Returns individual scores and overall score
 */
export async function POST(request: NextRequest) {
  try {
    const body: EvaluationRequest = await request.json()
    const { interview_id, questions, answers, job_position } = body

    if (!interview_id || !questions || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Build Q&A pairs for evaluation
    const qaContent = questions
      .map((q, idx) => {
        const answer = answers[idx] || '[No answer provided]'
        return `Q${idx + 1} (${q.type}): ${q.question}\nA${idx + 1}: ${answer}`
      })
      .join('\n\n')

    // Create evaluation prompt
    const evaluationPrompt = `You are an expert technical interviewer evaluating interview responses for a ${job_position} position.

Evaluate each answer on a scale of 0-100, considering:
- Technical accuracy and depth
- Clarity of explanation
- Relevance to the question
- Professional communication
- Specific examples and evidence

Here are the interview Q&A pairs:

${qaContent}

Provide evaluation in JSON format:
{
  "evaluations": [
    {
      "question_index": 0,
      "question": "original question",
      "answer": "provided answer",
      "score": 0-100,
      "feedback": "brief feedback"
    },
    ...
  ],
  "overall_score": 0-100,
  "summary": "overall assessment"
}

Be fair but rigorous in scoring. Scores should reflect actual quality of responses.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: evaluationPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const responseText = completion.choices[0].message.content || '{}'

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const evaluationResult = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { overall_score: 0, evaluations: [] }

    // Build scores map
    const scores: Record<number, number> = {}
    evaluationResult.evaluations?.forEach(
      (evaluation: Record<string, unknown>, idx: number) => {
        scores[idx] = (evaluation.score as number) || 0
      },
    )

    return NextResponse.json({
      success: true,
      interview_id,
      overall_score: evaluationResult.overall_score || 0,
      scores,
      evaluations: evaluationResult.evaluations || [],
      summary: evaluationResult.summary || 'Interview evaluated',
    })
  } catch (error: unknown) {
    console.error('Answer evaluation error:', error)

    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json(
        {
          error: 'Failed to evaluate answers: API error',
          details: error.message,
        },
        { status: 502 },
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to evaluate answers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
