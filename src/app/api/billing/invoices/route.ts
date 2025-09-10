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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ invoices: [] })
    }

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50,
      expand: ['data.subscription']
    })

    // Format invoices for frontend
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      created: invoice.created,
      dueDate: invoice.due_date,
      paidAt: invoice.status_transitions.paid_at,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      description: invoice.description,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end
    }))

    return NextResponse.json({ invoices: formattedInvoices })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}