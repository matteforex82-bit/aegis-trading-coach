import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, planId } = await request.json()

    if (!priceId || !planId) {
      return NextResponse.json(
        { error: 'Price ID and Plan ID are required' },
        { status: 400 }
      )
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: true
      }
    })

    if (!user || !user.organization) {
      return NextResponse.json(
        { error: 'User or organization not found' },
        { status: 404 }
      )
    }

    // Check if customer already exists in Stripe
    let customerId = user.organization.stripeCustomerId
    
    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
          organizationId: user.organization.id
        }
      })
      
      customerId = customer.id
      
      // Update organization with Stripe customer ID
      await prisma.organization.update({
        where: { id: user.organization.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
      metadata: {
        userId: user.id,
        organizationId: user.organization.id,
        planId: planId
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          organizationId: user.organization.id,
          planId: planId
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required'
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}