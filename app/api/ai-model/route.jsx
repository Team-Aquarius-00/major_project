import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { QUESTIONS_PROMPT } from '@/services/Constants'

// Constants for API configuration
const AI_CONFIG = {
  MODEL: 'arcee-ai/trinity-large-preview:free',
  INITIAL_MAX_TOKENS: 1500,
  RETRY_MAX_TOKENS: 512,
  TEMPERATURE: 0.2,
  PROMPT_TRUNCATE_LENGTH: 2000,
  TIMEOUT_MS: 30000,
}

/**
 * Validates required input fields
 */
const validateInput = (data) => {
  const required = ['jobPosition', 'jobDescription', 'duration', 'type']
  const missing = required.filter((field) => !data[field])
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }
}

/**
 * Builds the final prompt with validations
 */
const buildPrompt = (jobPosition, jobDescription, duration, type) => {
  const prompt = QUESTIONS_PROMPT.replace('{{jobTitle}}', jobPosition || '')
    .replace('{{jobDescription}}', jobDescription || '')
    .replace('{{duration}}', duration || '')
    .replace('{{type}}', type || '')
  return prompt
}

/**
 * Creates OpenAI client with error handling
 */
const createOpenAIClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY_ABCD
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured')
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    timeout: AI_CONFIG.TIMEOUT_MS,
  })
}

/**
 * Attempts to get completion from AI model with retries
 */
const getCompletion = async (openai, prompt) => {
  const baseParams = {
    model: AI_CONFIG.MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: AI_CONFIG.TEMPERATURE,
  }

  try {
    return await openai.chat.completions.create({
      ...baseParams,
      max_tokens: AI_CONFIG.INITIAL_MAX_TOKENS,
    })
  } catch (err) {
    // Check for billing/credit limit errors
    const errorMessage = String(err?.message || '').toLowerCase()
    const isCreditError =
      errorMessage.includes('402') ||
      errorMessage.includes('credit') ||
      errorMessage.includes('billing')

    if (isCreditError && prompt.length > AI_CONFIG.PROMPT_TRUNCATE_LENGTH) {
      console.warn(
        'Initial request failed due to credits, attempting retry with truncated prompt',
      )

      try {
        const truncatedPrompt = prompt.slice(
          0,
          AI_CONFIG.PROMPT_TRUNCATE_LENGTH,
        )
        return await openai.chat.completions.create({
          ...baseParams,
          messages: [{ role: 'user', content: truncatedPrompt }],
          max_tokens: AI_CONFIG.RETRY_MAX_TOKENS,
        })
      } catch (retryErr) {
        throw retryErr
      }
    }

    throw err
  }
}

/**
 * Main API handler
 */
export async function POST(req) {
  try {
    const body = await req.json()

    // Validate input
    validateInput(body)
    const { jobPosition, jobDescription, duration, type } = body

    // Build and log prompt
    const prompt = buildPrompt(jobPosition, jobDescription, duration, type)
    console.log('Generated prompt for:', { jobPosition, type, duration })

    // Create OpenAI client
    const openai = createOpenAIClient()

    // Get completion with retry logic
    const completion = await getCompletion(openai, prompt)

    // Validate response structure
    if (!completion?.choices?.[0]?.message) {
      throw new Error('Invalid response structure from AI model')
    }

    const responseMessage = completion.choices[0].message

    return NextResponse.json(responseMessage)
  } catch (error) {
    console.error('API Error:', {
      message: error?.message || 'Unknown error',
      status: error?.status,
      type: error?.type,
    })

    const statusCode = error?.status === 402 ? 402 : 500
    const message =
      error?.message ||
      'Failed to generate interview questions. Please try again.'

    return NextResponse.json(
      { error: message, timestamp: new Date().toISOString() },
      { status: statusCode },
    )
  }
}
