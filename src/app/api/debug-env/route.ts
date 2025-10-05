import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NOT_SET'

  // Hide password for security
  const safeUrl = dbUrl.replace(/:([^@]+)@/, ':***@')

  return NextResponse.json({
    DATABASE_URL: safeUrl,
    NODE_ENV: process.env.NODE_ENV,
    hasUrl: !!process.env.DATABASE_URL
  })
}
