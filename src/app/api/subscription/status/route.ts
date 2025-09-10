import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import Stripe from 'stripe'
import { SubscriptionLimits, SubscriptionUsage, SubscriptionStatus } from '@/hooks/useSubscriptionLimits'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia'
})

const DEFAULT_LIMITS: Record<string, SubscriptionLimits> = {
  starter: {
    tradingAccounts: 3,
    users: 1,
    dataRetentionDays: 30,
    apiCallsPerMonth: 1000,
    features: {
      advancedAnalytics: false,
      customRules: false,
      apiAccess: false,
      prioritySupport: false
    }
  },
  professional: {
    tradingAccounts: 10,
    users: 5,
    dataRetentionDays: 90,
    apiCallsPerMonth: 10000,
    features: {
      advancedAnalytics: true,
      customRules: true,
      apiAccess: true,
      prioritySupport: false
    }
  },
  enterprise: {
    tradingAccounts: -1, // unlimited
    users: -1, // unlimited
    dataRetentionDays: 365,
    apiCallsPerMonth: -1, // unlimited
    features: {
      advancedAnalytics: true,
      customRules: true,
      apiAccess: true,
      prioritySupport: true
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and organization with related data
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

    if (!user || !user.organization) {
      return NextResponse.json(
        { error: 'User or organization not found' },
        { status: 404 }
      )
    }

    const organization = user.organization
    let subscriptionStatus: SubscriptionStatus = {
      plan: organization.subscriptionPlan || 'starter',
      status: 'inactive',
      limits: DEFAULT_LIMITS[organization.subscriptionPlan || 'starter'],
      usage: {
        tradingAccounts: organization.tradingAccounts.length,
        users: organization.users.length,
        apiCallsThisMonth: 0 // TODO: Implement API call tracking
      },
      currentPeriodEnd: null,
      customerPortalUrl: null
    }

    // If there's a Stripe subscription, get detailed info
    if (organization.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          organization.stripeSubscriptionId,
          {
            expand: ['customer']
          }
        )

        // Create customer portal session for billing management
        let customerPortalUrl = null
        if (organization.stripeCustomerId) {
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: organization.stripeCustomerId,
            return_url: `${process.env.NEXTAUTH_URL}/billing`
          })
          customerPortalUrl = portalSession.url
        }

        subscriptionStatus = {
          ...subscriptionStatus,
          status: subscription.status as any,
          currentPeriodEnd: subscription.current_period_end,
          customerPortalUrl
        }

        // Update organization status if it differs
        if (organization.subscriptionStatus !== subscription.status) {
          await db.organization.update({
            where: { id: organization.id },
            data: {
              subscriptionStatus: subscription.status,
              subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
            }
          })
        }
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError)
        // Continue with database info if Stripe fails
      }
    }

    return NextResponse.json(subscriptionStatus)
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}