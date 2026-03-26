import 'dotenv/config'
import { prisma } from '@/lib/prisma'

type InterviewTakerInput = {
  email?: string
  name?: string
  picture?: string
}

export async function createOrFetchInterviewTaker({
  email,
  name,
  picture,
}: InterviewTakerInput) {
  const normalizedEmail = email?.trim().toLowerCase() || undefined
  const normalizedName = name?.trim() || undefined

  if (!normalizedEmail && !normalizedName) {
    throw new Error('Either email or name is required')
  }

  // If email is available, treat it as canonical identity and reuse records.
  if (normalizedEmail) {
    let taker = await prisma.interviewTaker.findUnique({
      where: { email: normalizedEmail },
    })

    if (!taker) {
      taker = await prisma.interviewTaker.create({
        data: {
          email: normalizedEmail,
          name: normalizedName,
          picture,
        },
      })
    }

    return taker
  }

  // Without email, create a record per attempt/session to avoid wrong identity merges.
  return prisma.interviewTaker.create({
    data: {
      name: normalizedName,
      picture,
    },
  })
}
