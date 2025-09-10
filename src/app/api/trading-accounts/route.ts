import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withSubscriptionCheck } from '@/lib/subscription-middleware'

const createTradingAccountSchema = z.object({
  login: z.string().min(1, 'Login is required'),
  name: z.string().optional(),
  broker: z.string().min(1, 'Broker is required'),
  server: z.string().optional(),
  currency: z.string().default('USD'),
  timezone: z.string().default('Europe/Rome'),
  initialBalance: z.number().positive('Initial balance must be positive'),
  propFirmTemplateId: z.string().optional(),
  currentPhase: z.enum(['PHASE_1', 'PHASE_2', 'FUNDED']).default('PHASE_1')
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const where = {
      organizationId: user.organization.id,
      ...(search && {
        OR: [
          { login: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
          { broker: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }

    const [tradingAccounts, total] = await Promise.all([
      db.tradingAccount.findMany({
        where,
        skip,
        take: limit,
        include: {
          propFirmTemplate: {
            include: {
              propFirm: {
                select: { name: true }
              }
            }
          },
          _count: {
            select: {
              trades: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      db.tradingAccount.count({ where })
    ])

    return NextResponse.json({
      tradingAccounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching trading accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check subscription limits before creating trading account
    const { user, error } = await withSubscriptionCheck(req, 'tradingAccounts', 1)
    
    if (error) {
      return error
    }

    const body = await req.json()
    const validatedData = createTradingAccountSchema.parse(body)

    // Check if login already exists in this organization
    const existingAccount = await db.tradingAccount.findFirst({
      where: {
        login: validatedData.login,
        organizationId: user.organization!.id
      }
    })

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Trading account with this login already exists' },
        { status: 409 }
      )
    }

    // Validate PropFirm template if provided
    let propFirmTemplate = null
    if (validatedData.propFirmTemplateId) {
      propFirmTemplate = await db.propFirmTemplate.findUnique({
        where: { id: validatedData.propFirmTemplateId }
      })

      if (!propFirmTemplate) {
        return NextResponse.json(
          { error: 'PropFirm template not found' },
          { status: 404 }
        )
      }
    }

    // Create trading account
    const tradingAccount = await db.tradingAccount.create({
      data: {
        login: validatedData.login,
        name: validatedData.name || `${validatedData.broker} Account`,
        broker: validatedData.broker,
        server: validatedData.server,
        currency: validatedData.currency,
        timezone: validatedData.timezone,
        initialBalance: validatedData.initialBalance,
        startBalance: validatedData.initialBalance,
        currentBalance: validatedData.initialBalance,
        currentPhase: validatedData.currentPhase,
        organizationId: user.organization!.id,
        propFirmTemplateId: validatedData.propFirmTemplateId
      },
      include: {
        propFirmTemplate: {
          include: {
            propFirm: {
              select: { name: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      tradingAccount
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating trading account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}