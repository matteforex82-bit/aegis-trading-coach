import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Get accounts for specific user
      const accounts = await db.account.findMany({
        where: { userId },
        include: {
          _count: {
            select: { trades: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(accounts)
    } else {
      // Get all accounts
      const accounts = await db.account.findMany({
        include: {
          _count: {
            select: { trades: true }
          },
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(accounts)
    }
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}