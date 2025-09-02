import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Interfaccia per i dati del webhook Finnhub
interface FinnhubWebhookData {
  symbol?: string
  price?: number
  timestamp?: number
  volume?: number
  event?: string
  data?: any
}

// Verifica l'autenticazione del webhook
function verifyWebhookSignature(request: NextRequest): boolean {
  const headersList = headers()
  const finnhubSecret = headersList.get('X-Finnhub-Secret')
  const expectedSecret = process.env.FINNHUB_WEBHOOK_SECRET || 'd2r7o31r01qlk22s2hcg'
  
  return finnhubSecret === expectedSecret
}

// Gestisce le notifiche webhook da Finnhub
export async function POST(request: NextRequest) {
  try {
    // Verifica l'autenticazione
    if (!verifyWebhookSignature(request)) {
      console.log('❌ Webhook authentication failed')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Leggi i dati del webhook
    const webhookData: FinnhubWebhookData = await request.json()
    
    console.log('📡 Finnhub Webhook ricevuto:', {
      timestamp: new Date().toISOString(),
      data: webhookData
    })

    // Processa i diversi tipi di eventi
    await processWebhookEvent(webhookData)

    // Risposta di successo (2xx richiesta da Finnhub)
    return NextResponse.json(
      { 
        success: true, 
        message: 'Webhook processed successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Errore nel processare webhook Finnhub:', error)
    
    // Anche in caso di errore, restituisci 200 per evitare che Finnhub disabiliti il webhook
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal processing error',
        message: 'Webhook acknowledged but processing failed'
      },
      { status: 200 }
    )
  }
}

// Processa i diversi tipi di eventi webhook
async function processWebhookEvent(data: FinnhubWebhookData) {
  try {
    // Log dell'evento per debugging
    console.log('🔄 Processing webhook event:', data)

    // Qui puoi aggiungere logica specifica per diversi tipi di eventi:
    // - Aggiornamenti di prezzo in tempo reale
    // - Notizie economiche
    // - Eventi del calendario economico
    // - Alert di mercato

    if (data.symbol) {
      console.log(`📈 Price update for ${data.symbol}: ${data.price}`)
      // Qui potresti salvare nel database o inviare via WebSocket ai client
    }

    if (data.event) {
      console.log(`📰 Economic event: ${data.event}`)
      // Qui potresti aggiornare il calendario economico in tempo reale
    }

    // Esempio: potresti inviare notifiche push ai client connessi
    // await notifyConnectedClients(data)

  } catch (error) {
    console.error('❌ Errore nel processare evento webhook:', error)
    throw error
  }
}

// Endpoint GET per verificare lo stato del webhook
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Finnhub webhook endpoint is running',
    timestamp: new Date().toISOString(),
    webhookSecret: process.env.FINNHUB_WEBHOOK_SECRET ? 'configured' : 'not configured'
  })
}

// Gestisce richieste non supportate
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}