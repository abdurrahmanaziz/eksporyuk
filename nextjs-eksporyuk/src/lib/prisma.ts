import { PrismaClient } from '@prisma/client'

// Prisma client singleton for Next.js with optimized connection
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with connection pool optimization
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Optimize for serverless/Neon
  // @ts-ignore
  __internal: {
    engine: {
      // Reduce connection overhead for serverless
      cwd: process.cwd(),
    }
  }
})

// Keep connection alive in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Warm up the connection pool on startup
prisma.$connect().catch((e) => {
  console.error('Failed to connect to database:', e)
})
