import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { QUESTIONS_PROMPT } from '@/services/Constants'

export async function POST(req) {
  try {
    const { jobDescription, jobPosition, duration, type } = await req.json()

    const FINAL_PROMPT = QUESTIONS_PROMPT.replace('{{jobTitle}}', jobPosition)
      .replace('{{jobDescription}}', jobDescription)
      .replace('{{duration}}', duration)
      .replace('{{type}}', type)

    console.log('FINAL_PROMPT:', FINAL_PROMPT)

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [{ role: 'user', content: FINAL_PROMPT }],
    })

    console.log('Response:', completion.choices[0].message)
    return NextResponse.json(completion.choices[0].message)
  } catch (e) {
    console.error('API Error:', e)
    return NextResponse.json(
      { error: e.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}
