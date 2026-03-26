import 'dotenv/config'
import { prisma } from '@/lib/prisma'

export async function createOrFetchAdmin(
  email: string,
  name?: string,
  picture?: string,
) {
  // Check if admin exists
  let admin = await prisma.admin.findUnique({
    where: { email },
  })

  if (!admin) {
    // Create admin if not exists
    admin = await prisma.admin.create({
      data: {
        email,
        name,
        picture,
      },
    })
  }

  return admin
}

// Backward-compatible alias used by existing routes/components.
export const createOrFetchUser = createOrFetchAdmin
