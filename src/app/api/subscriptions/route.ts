import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe, SUBSCRIPTION_PLANS } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, organizationName } = await req.json()
    
    if (!planId || !SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]

    // Find or create user
    let user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user) {
      user = await db.user.create({
        data: {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        },
        include: { organization: true }
      })
    }

    // Create Stripe customer if doesn't exist
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
      })
      customerId = customer.id
      
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create organization if doesn't exist
    let organization = user.organization
    if (!organization) {
      const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      organization = await db.organization.create({
        data: {
          name: organizationName,
          slug: `${slug}-${Date.now()}`, // Ensure uniqueness
          maxAccounts: plan.maxAccounts === -1 ? 999999 : plan.maxAccounts,
          maxUsers: plan.maxUsers === -1 ? 999999 : plan.maxUsers,
          users: {
            connect: { id: user.id }
          }
        }
      })

      await db.user.update({
        where: { id: user.id },
        data: { 
          organizationId: organization.id,
          role: 'admin'
        }
      })
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.price,
            recurring: {
              interval: plan.interval as 'month' | 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        organizationId: organization.id,
        planId,
      },
    })

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      organizationId: organization.id 
    })
  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { 
        organization: {
          include: {
            users: true,
            tradingAccounts: true
          }
        }
      }
    })

    if (!user?.organization) {
      return NextResponse.json({ subscription: null })
    }

    const org = user.organization
    let stripeSubscription = null

    if (org.subscriptionId && user.stripeCustomerId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(org.subscriptionId)
      } catch (error) {
        console.error('Failed to retrieve Stripe subscription:', error)
      }
    }

    return NextResponse.json({
      subscription: {
        id: org.subscriptionId,
        status: org.subscriptionStatus,
        currentPeriodEnd: org.currentPeriodEnd,
        maxAccounts: org.maxAccounts,
        maxUsers: org.maxUsers,
        currentAccounts: org.tradingAccounts.length,
        currentUsers: org.users.length,
        stripeSubscription
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug
      }
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}