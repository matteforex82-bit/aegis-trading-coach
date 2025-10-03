import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Please configure it in your Vercel dashboard under Environment Variables. ' +
    'Format: postgresql://username:password@host:port/database?schema=public'
  )
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Add connection retry logic for production
if (process.env.NODE_ENV === 'production') {
  // Test connection on startup with retry
  const testConnection = async (retries = 3) => {
    try {
      await db.$connect()
      console.log('✅ Database connected successfully')
    } catch (error) {
      console.error(`❌ Database connection failed (${retries} retries left):`, error)
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        return testConnection(retries - 1)
      }
      throw error
    }
  }
  
  // Test connection on startup (non-blocking)
  testConnection().catch(console.error)
}