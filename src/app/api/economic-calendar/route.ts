import { NextRequest, NextResponse } from 'next/server'

interface EconomicEvent {
  country: string
  event: string
  impact: string
  date: string
  time: string
  actual: string | null
  estimate: string | null
  previous: string | null
}

interface FinnhubEvent {
  country: string
  event: string
  impact: string
  date: string
  time: string
  actual: number | null
  estimate: number | null
  previous: number | null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || new Date().toISOString().split('T')[0]
    const to = searchParams.get('to') || from
    
    // Finnhub API key
    const apiKey = process.env.FINNHUB_API_KEY
    
    if (!apiKey || apiKey === 'your-finnhub-api-key-here' || apiKey.includes('la-tua-chiave-api-qui')) {
      return NextResponse.json({
        success: false,
        message: 'Chiave API Finnhub non configurata. Registrati su https://finnhub.io/register per ottenere una chiave gratuita e configurala nel file .env'
      }, { status: 500 })
    }
    
    const response = await fetch(
      `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform Finnhub data to our format
    const events: EconomicEvent[] = (data.economicCalendar || []).map((event: FinnhubEvent) => ({
      country: event.country || 'N/A',
      event: event.event || 'Unknown Event',
      impact: mapImpact(event.impact),
      date: event.date || '',
      time: event.time || '',
      actual: event.actual !== null ? event.actual.toString() : null,
      estimate: event.estimate !== null ? event.estimate.toString() : null,
      previous: event.previous !== null ? event.previous.toString() : null,
    }))

    // Sort events by date and time
    events.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`)
      const dateB = new Date(`${b.date} ${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
      from,
      to
    })

  } catch (error) {
    console.error('Economic Calendar API Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch economic calendar data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Map impact levels to our standard format
function mapImpact(impact: string): string {
  if (!impact) return 'low'
  
  const impactLower = impact.toLowerCase()
  if (impactLower.includes('high') || impactLower.includes('3')) return 'high'
  if (impactLower.includes('medium') || impactLower.includes('2')) return 'medium'
  return 'low'
}

// Fallback data for demo purposes
function getFallbackData(): EconomicEvent[] {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return [
    {
      country: 'US',
      event: 'Non-Farm Payrolls',
      impact: 'high',
      date: today.toISOString().split('T')[0],
      time: '14:30',
      actual: null,
      estimate: '200K',
      previous: '180K'
    },
    {
      country: 'EUR',
      event: 'ECB Interest Rate Decision',
      impact: 'high',
      date: tomorrow.toISOString().split('T')[0],
      time: '13:45',
      actual: null,
      estimate: '4.25%',
      previous: '4.25%'
    },
    {
      country: 'GB',
      event: 'GDP Growth Rate',
      impact: 'medium',
      date: today.toISOString().split('T')[0],
      time: '10:30',
      actual: '0.2%',
      estimate: '0.1%',
      previous: '0.0%'
    }
  ]
}