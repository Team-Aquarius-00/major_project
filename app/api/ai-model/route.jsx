import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { QUESTIONS_PROMPT } from '@/services/Constants'

export async function POST(req) {
  try {
    const { jobPosition, jobDescription, duration, type } = await req.json()

    const FINAL_PROMPT = QUESTIONS_PROMPT.replace('{{jobTitle}}', jobPosition)
      .replace('{{jobDescription}}', jobDescription)
      .replace('{{duration}}', duration)
      .replace('{{type}}', type)

    console.log('FINAL_PROMPT:', FINAL_PROMPT)

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY_ABCD,
    })

    // First attempt: limit max tokens to avoid huge/expensive requests
    const baseParams = {
      model: 'arcee-ai/trinity-large-preview:free',
      messages: [{ role: 'user', content: FINAL_PROMPT }],
      max_tokens: 1500, // explicit cap to avoid exhausting credits
      temperature: 0.2,
    }

    let completion
    try {
      completion = await openai.chat.completions.create(baseParams)
    } catch (err) {
      // If we hit a billing/credit limit (402) or similar, try a lower-token retry
      const message = String(err?.message || '')
      if (
        message.includes('402') ||
        message.toLowerCase().includes('requires more credits')
      ) {
        try {
          // Truncate prompt and reduce tokens for a cheap retry
          const truncatedPrompt = FINAL_PROMPT.slice(0, 2000)
          completion = await openai.chat.completions.create({
            ...baseParams,
            messages: [{ role: 'user', content: truncatedPrompt }],
            max_tokens: 512,
          })
        } catch (err2) {
          // propagate the original descriptive error if retry fails
          throw err2
        }
      } else {
        throw err
      }
    }

    // console.log('Response:', completion.choices[0].message)
    return NextResponse.json(completion.choices[0].message)
  } catch (e) {
    console.error('API Error:', e)
    return NextResponse.json(
      { error: e.message || 'Something went wrong' },
      { status: 500 },
    )
  }
}
