import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

//+------------------------------------------------------------------+
//| PUT /api/accounts/[id]/soft-delete - Soft delete account        |
//+------------------------------------------------------------------+
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
    
    console.log('🗑️ Soft deleting account:', accountId)
    
    // Check if account exists and is not already deleted
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: {
        propFirmTemplate: {
          select: {
            name: true,
            propFirm: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    if (account.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Account is already deleted' },
        { status: 400 }
      )
    }

    console.log('📊 Account to soft delete:')
    console.log(`   Login: ${account.login}`)
    console.log(`   Name: ${account.name || 'No name'}`)
    console.log(`   Broker: ${account.broker}`)
    if (account.propFirmTemplate) {
      console.log(`   PropFirm: ${account.propFirmTemplate.propFirm.name} - ${account.propFirmTemplate.name}`)
    }

    // Soft delete the account by setting deletedAt timestamp
    const deletedAccount = await db.account.update({
      where: { id: accountId },
      data: {
        deletedAt: new Date()
      },
      include: {
        propFirmTemplate: {
          select: {
            name: true,
            propFirm: {
              select: { name: true }
            }
          }
        }
      }
    })

    console.log('🎯 Account soft deletion completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Account moved to archive successfully',
      deletedAccount: {
        id: deletedAccount.id,
        login: deletedAccount.login,
        name: deletedAccount.name,
        deletedAt: deletedAccount.deletedAt,
        propFirm: deletedAccount.propFirmTemplate?.propFirm?.name,
        template: deletedAccount.propFirmTemplate?.name
      }
    })

  } catch (error: any) {
    console.error('❌ Error soft deleting account:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to archive account',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

//+------------------------------------------------------------------+
//| DELETE /api/accounts/[id]/soft-delete - Restore deleted account |
//+------------------------------------------------------------------+
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
    
    console.log('🔄 Restoring account:', accountId)
    
    // Check if account exists and is deleted
    const account = await db.account.findUnique({
      where: { id: accountId }
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    if (!account.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Account is not deleted' },
        { status: 400 }
      )
    }

    // Restore the account by removing deletedAt timestamp
    const restoredAccount = await db.account.update({
      where: { id: accountId },
      data: {
        deletedAt: null
      }
    })

    console.log('🎯 Account restoration completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Account restored successfully',
      restoredAccount: {
        id: restoredAccount.id,
        login: restoredAccount.login,
        name: restoredAccount.name
      }
    })

  } catch (error: any) {
    console.error('❌ Error restoring account:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to restore account',
        details: error.message 
      },
      { status: 500 }
    )
  }
}