import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Trova l'utente nel database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user?.organization) {
      return NextResponse.json(
        { error: 'Organizzazione non trovata' },
        { status: 404 }
      )
    }

    let customerId = user.organization.stripeCustomerId

    // Crea un customer Stripe se non esiste
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: user.name || undefined,
        metadata: {
          organizationId: user.organization.id,
          userId: user.id
        }
      })

      customerId = customer.id

      // Aggiorna l'organizzazione con il customer ID
      await prisma.organization.update({
        where: { id: user.organization.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Crea il Setup Intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        organizationId: user.organization.id,
        userId: user.id
      }
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    })
  } catch (error) {
    console.error('Errore creazione Setup Intent:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// Endpoint per confermare il Setup Intent
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { setupIntentId } = await request.json()

    if (!setupIntentId) {
      return NextResponse.json(
        { error: 'Setup Intent ID richiesto' },
        { status: 400 }
      )
    }

    // Recupera il Setup Intent
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)

    if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
      // Il metodo di pagamento è stato aggiunto con successo
      return NextResponse.json({
        success: true,
        paymentMethodId: setupIntent.payment_method
      })
    } else {
      return NextResponse.json(
        { error: 'Setup Intent non completato' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Errore conferma Setup Intent:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}