import { PrismaClient } from '@prisma/client'

// Prisma client singleton for Next.js with optimized connection
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if DATABASE_URL is available (skip during build time)
const databaseUrl = process.env.DATABASE_URL

// Create Prisma client with connection pool optimization
// Only create if DATABASE_URL is available (not during build)
function createPrismaClient() {
  if (!databaseUrl) {
    // Return a mock during build time to prevent errors
    console.warn('[Prisma] DATABASE_URL not found, skipping client creation (build time)')
    return null as unknown as PrismaClient
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl
      }
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Keep connection alive in development
if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma
}

// Warm up the connection pool on startup (only if client exists)
if (prisma && databaseUrl) {
  prisma.$connect().catch((e) => {
    console.error('Failed to connect to database:', e)
  })
}
