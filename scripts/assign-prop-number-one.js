const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function assignPropNumberOne() {
  try {
    console.log('🔄 Assigning PROP NUMBER ONE template to account for testing...')
    
    // Find PROP NUMBER ONE 50K template
    const propNumberOneTemplate = await db.propFirmTemplate.findFirst({
      where: {
        name: 'PROP NUMBER ONE 50K',
        propFirm: {
          name: 'PROP NUMBER ONE'
        }
      }
    })
    
    if (!propNumberOneTemplate) {
      console.log('❌ PROP NUMBER ONE 50K template not found!')
      return
    }
    
    console.log(`✅ Found template: ${propNumberOneTemplate.name} (ID: ${propNumberOneTemplate.id})`)
    
    // Update account 2958 to use PROP NUMBER ONE
    const updatedAccount = await db.account.update({
      where: { login: '2958' },
      data: {
        propFirmTemplateId: propNumberOneTemplate.id,
        name: 'PROP NUMBER ONE Test' // Update name to reflect the change
      },
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    })
    
    console.log('\n✅ Account updated successfully!')
    console.log(`Account: ${updatedAccount.login}`)
    console.log(`New Name: ${updatedAccount.name}`)
    console.log(`Template: ${updatedAccount.propFirmTemplate?.name}`)
    console.log(`PropFirm: ${updatedAccount.propFirmTemplate?.propFirm?.name}`)
    
    // Verify Phase 2 target
    const rules = updatedAccount.propFirmTemplate?.rulesJson
    if (rules?.profitTargets?.PHASE_2) {
      const phase2 = rules.profitTargets.PHASE_2
      console.log(`Phase 2 Target: ${phase2.percentage}% = $${phase2.amount}`)
      
      if (phase2.percentage === 8) {
        console.log('🎉 SUCCESS! PROP NUMBER ONE now shows 8% for Phase 2!')
      } else {
        console.log(`❌ ERROR: Expected 8%, got ${phase2.percentage}%`)
      }
    }
    
    console.log('\n📋 Now you can test PROP NUMBER ONE by navigating to:')
    console.log('http://localhost:3020/account/[accountId] (replace with actual account ID)')
    console.log('\nThe dashboard should show:')
    console.log('- PropFirm: PROP NUMBER ONE')
    console.log('- Template: PROP NUMBER ONE 50K') 
    console.log('- Phase 2 Target: 8% (not 5%)')
    console.log('- Consistency Rules enabled for Phase 2')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

assignPropNumberOne()