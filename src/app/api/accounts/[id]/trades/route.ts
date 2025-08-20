import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const symbol = searchParams.get('symbol')
    const side = searchParams.get('side')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = { accountId: id }
    
    if (symbol) {
      where.symbol = { contains: symbol, mode: 'insensitive' }
    }
    
    if (side) {
      where.side = side
    }

    // Get trades with pagination
    const [trades, total] = await Promise.all([
      db.trade.findMany({
        where,
        orderBy: { openTime: 'desc' },
        skip: offset,
        take: limit,
        include: {
          account: {
            select: { name: true, login: true }
          }
        }
      }),
      db.trade.count({ where })
    ])

    return NextResponse.json({
      trades,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}