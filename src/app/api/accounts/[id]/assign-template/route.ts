import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

//+------------------------------------------------------------------+
//| POST /api/accounts/[id]/assign-template - Assign template to account |
//+------------------------------------------------------------------+
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
    const body = await request.json()
    
    console.log('🔧 Assigning template to account:', accountId)
    console.log('📋 Request body:', body)
    
    const { propFirmTemplateId, initialBalance, currentPhase } = body
    
    // Validate required fields
    if (!propFirmTemplateId) {
      return NextResponse.json(
        { success: false, error: 'PropFirm template ID is required' },
        { status: 400 }
      )
    }
    
    if (!initialBalance || initialBalance <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid initial balance is required' },
        { status: 400 }
      )
    }

    // Get account and template info
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: { propFirmTemplate: true }
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    const template = await db.propFirmTemplate.findUnique({
      where: { id: propFirmTemplateId },
      include: { propFirm: true }
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'PropFirm template not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Found template: ${template.name} (${template.propFirm.name})`)
    
    // Update account with template assignment
    const updatedAccount = await db.account.update({
      where: { id: accountId },
      data: {
        propFirmTemplateId,
        propFirmId: template.propFirmId, // Also link to PropFirm
        initialBalance: parseFloat(initialBalance.toString()),
        currentPhase: currentPhase || 'PHASE_1', // Default to Phase 1
        accountType: 'CHALLENGE', // Set as challenge account
        isChallenge: true,
        updatedAt: new Date()
      },
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    })

    console.log('✅ Template assigned successfully')
    console.log(`   Account: ${updatedAccount.login}`)
    console.log(`   Template: ${updatedAccount.propFirmTemplate?.name}`)
    console.log(`   PropFirm: ${updatedAccount.propFirmTemplate?.propFirm.name}`)
    console.log(`   Initial Balance: ${updatedAccount.initialBalance}`)
    console.log(`   Phase: ${updatedAccount.currentPhase}`)

    return NextResponse.json({
      success: true,
      message: 'Template assigned successfully',
      account: {
        id: updatedAccount.id,
        login: updatedAccount.login,
        name: updatedAccount.name,
        initialBalance: updatedAccount.initialBalance,
        currentPhase: updatedAccount.currentPhase,
        accountType: updatedAccount.accountType,
        isChallenge: updatedAccount.isChallenge,
        propFirmTemplate: {
          id: updatedAccount.propFirmTemplate?.id,
          name: updatedAccount.propFirmTemplate?.name,
          accountSize: updatedAccount.propFirmTemplate?.accountSize,
          currency: updatedAccount.propFirmTemplate?.currency,
          propFirm: {
            id: updatedAccount.propFirmTemplate?.propFirm.id,
            name: updatedAccount.propFirmTemplate?.propFirm.name
          }
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Error assigning template to account:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to assign template to account',
        details: error.message 
      },
      { status: 500 }
    )
  }
}