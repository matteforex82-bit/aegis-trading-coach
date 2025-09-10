import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.subscriptionStatus = status
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
        { stripeCustomerId: { contains: search, mode: 'insensitive' as const } }
      ]
    }
    
    // Get organizations with subscription info
    const [organizations, total] = await Promise.all([
      db.organization.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              tradingAccounts: true,
              users: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.organization.count({ where })
    ])
    
    // Enrich with Stripe subscription data
    const enrichedOrganizations = await Promise.all(
      organizations.map(async (org) => {
        let stripeSubscription = null
        
        if (org.stripeSubscriptionId) {
          try {
            stripeSubscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId)
          } catch (error) {
            console.warn(`Could not fetch Stripe subscription for org ${org.id}:`, error)
          }
        }
        
        return {
          ...org,
          stripeSubscription: stripeSubscription ? {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            items: stripeSubscription.items.data.map(item => ({
              priceId: item.price.id,
              productId: item.price.product as string,
              quantity: item.quantity
            }))
          } : null
        }
      })
    )
    
    return NextResponse.json({
      organizations: enrichedOrganizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin subscriptions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, action, subscriptionId } = await req.json()
    
    if (!organizationId || !action) {
      return NextResponse.json({ error: 'Organization ID and action required' }, { status: 400 })
    }
    
    const organization = await db.organization.findUnique({
      where: { id: organizationId }
    })
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    
    let result = null
    
    switch (action) {
      case 'cancel_subscription':
        if (organization.stripeSubscriptionId) {
          try {
            result = await stripe.subscriptions.update(organization.stripeSubscriptionId, {
              cancel_at_period_end: true
            })
            
            await db.organization.update({
              where: { id: organizationId },
              data: {
                subscriptionStatus: 'canceled'
              }
            })
          } catch (error) {
            console.error('Error canceling subscription:', error)
            return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
          }
        }
        break
        
      case 'reactivate_subscription':
        if (organization.stripeSubscriptionId) {
          try {
            result = await stripe.subscriptions.update(organization.stripeSubscriptionId, {
              cancel_at_period_end: false
            })
            
            await db.organization.update({
              where: { id: organizationId },
              data: {
                subscriptionStatus: 'active'
              }
            })
          } catch (error) {
            console.error('Error reactivating subscription:', error)
            return NextResponse.json({ error: 'Failed to reactivate subscription' }, { status: 500 })
          }
        }
        break
        
      case 'update_status':
        const { status } = await req.json()
        if (!status) {
          return NextResponse.json({ error: 'Status required' }, { status: 400 })
        }
        
        await db.organization.update({
          where: { id: organizationId },
          data: {
            subscriptionStatus: status
          }
        })
        
        result = { status: 'updated' }
        break
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Admin subscription action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    )
  }
}