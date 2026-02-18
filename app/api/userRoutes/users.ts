// backend/routes/users.ts (example)
// import { PrismaClient } from '@prisma/client'

import { prisma } from "@/lib/prisma"



export async function createOrFetchUser(
  email: string,
  name?: string,
  picture?: string,
) {
  // Check if user exists
  let user = await prisma.users.findUnique({
    where: { email },
  })

  if (!user) {
    // Create user if not exists
    user = await prisma.users.create({
      data: {
        email,
        name,
        picture,
      },
    })
  }

  return user
}
