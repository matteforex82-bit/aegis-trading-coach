import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        await handleCustomerCreated(customer)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancellation(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Find user by Stripe customer ID
  const user = await db.user.findUnique({
    where: { stripeCustomerId: customerId },
    include: { organization: true }
  })

  if (!user) {
    console.error('User not found for customer:', customerId)
    return
  }

  // Update organization subscription
  if (user.organization) {
    await db.organization.update({
      where: { id: user.organization.id },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      }
    })
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  const user = await db.user.findUnique({
    where: { stripeCustomerId: customerId },
    include: { organization: true }
  })

  if (!user?.organization) return

  await db.organization.update({
    where: { id: user.organization.id },
    data: {
      subscriptionStatus: 'canceled',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    }
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded for invoice:', invoice.id)
  // Add any additional logic for successful payments
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed for invoice:', invoice.id)
  // Add logic to handle failed payments (e.g., send notification)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed for session:', session.id)
  
  if (session.mode === 'subscription' && session.subscription) {
    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    
    // Update organization with subscription info
    const customerId = session.customer as string
    const organization = await db.organization.findFirst({
      where: { stripeCustomerId: customerId }
    })
    
    if (organization) {
      await db.organization.update({
        where: { id: organization.id },
        data: {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          subscriptionPlan: session.metadata?.planId || 'starter'
        }
      })
    }
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id)
  
  // Update user/organization with Stripe customer ID if not already set
  if (customer.email) {
    const user = await db.user.findUnique({
      where: { email: customer.email },
      include: { organization: true }
    })
    
    if (user?.organization && !user.organization.stripeCustomerId) {
      await db.organization.update({
        where: { id: user.organization.id },
        data: { stripeCustomerId: customer.id }
      })
    }
  }
}