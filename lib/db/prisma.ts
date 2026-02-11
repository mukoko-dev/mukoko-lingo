/**
 * Prisma Client Singleton
 * Server-side only - used by API routes / Vercel serverless functions
 *
 * Provides type-safe database access via Prisma ORM connected to MongoDB.
 */

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma
