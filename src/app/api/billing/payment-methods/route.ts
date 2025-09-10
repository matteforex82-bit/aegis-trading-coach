import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia'
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and organization
    const user = await db.user.findUnique({
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

    const customerId = user.organization.stripeCustomerId
    
    if (!customerId) {
      return NextResponse.json({ paymentMethods: [] })
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    })

    // Get customer to check default payment method
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
    const defaultPaymentMethodId = customer.invoice_settings.default_payment_method

    // Format payment methods for frontend
    const formattedPaymentMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: {
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '0000',
        expMonth: pm.card?.exp_month || 0,
        expYear: pm.card?.exp_year || 0
      },
      isDefault: pm.id === defaultPaymentMethodId
    }))

    return NextResponse.json({ paymentMethods: formattedPaymentMethods })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId, setAsDefault } = await request.json()

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
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
      await db.organization.update({
        where: { id: user.organization.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    })

    // Set as default if requested
    if (setAsDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Payment method added successfully'
    })
  } catch (error) {
    console.error('Error adding payment method:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to add payment method' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentMethodId = searchParams.get('id')

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ 
      success: true,
      message: 'Payment method deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = await request.json()

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
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

    const customerId = user.organization.stripeCustomerId
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'No customer found' },
        { status: 404 }
      )
    }

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Default payment method updated successfully'
    })
  } catch (error) {
    console.error('Error updating default payment method:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update default payment method' },
      { status: 500 }
    )
  }
}