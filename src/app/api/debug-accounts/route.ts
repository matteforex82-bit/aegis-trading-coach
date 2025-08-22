import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug accounts endpoint...')
    
    // Simple query first
    const simpleAccounts = await db.account.findMany({
      select: {
        id: true,
        login: true,
        name: true,
        currentPhase: true,
        startBalance: true,
        initialBalance: true,
        propFirmTemplateId: true
      }
    })
    
    console.log('✅ Simple query success:', simpleAccounts.length, 'accounts')
    
    // Try with template
    const accountsWithTemplate = await db.account.findMany({
      where: { login: '31284471' },
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    })
    
    console.log('✅ Template query success:', accountsWithTemplate.length, 'accounts')
    
    const targetAccount = accountsWithTemplate[0]
    if (targetAccount?.propFirmTemplate) {
      const rules = targetAccount.propFirmTemplate.rulesJson
      const phase2Target = rules?.profitTargets?.PHASE_2
      
      return NextResponse.json({
        success: true,
        account: {
          login: targetAccount.login,
          currentPhase: targetAccount.currentPhase,
          startBalance: targetAccount.startBalance,
          initialBalance: targetAccount.initialBalance,
          templateName: targetAccount.propFirmTemplate.name,
          propFirmName: targetAccount.propFirmTemplate.propFirm?.name,
          phase2Target: phase2Target ? {
            percentage: phase2Target.percentage,
            amount: phase2Target.amount
          } : null
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Account or template not found'
    })
    
  } catch (error: any) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}