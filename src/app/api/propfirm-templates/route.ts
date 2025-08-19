import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

//+------------------------------------------------------------------+
//| GET /api/propfirm-templates - Get all PropFirm templates        |
//+------------------------------------------------------------------+
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching PropFirm templates...')
    
    const propFirms = await db.propFirm.findMany({
      where: { isActive: true },
      include: {
        templates: {
          where: { isActive: true },
          orderBy: { accountSize: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log(`✅ Found ${propFirms.length} PropFirms with templates`)

    return NextResponse.json({
      success: true,
      propFirms: propFirms.map(firm => ({
        id: firm.id,
        name: firm.name,
        description: firm.description,
        website: firm.website,
        logo: firm.logo,
        isActive: firm.isActive,
        templates: firm.templates.map(template => ({
          id: template.id,
          name: template.name,
          accountSize: template.accountSize,
          currency: template.currency,
          isActive: template.isActive,
          rulesJson: template.rulesJson,
          createdAt: template.createdAt
        }))
      }))
    })

  } catch (error: any) {
    console.error('❌ Error fetching PropFirm templates:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch PropFirm templates',
        details: error.message 
      },
      { status: 500 }
    )
  }
}