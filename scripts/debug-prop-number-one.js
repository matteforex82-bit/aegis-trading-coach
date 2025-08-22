const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function debugPropNumberOne() {
  try {
    console.log('🔍 Debugging PROP NUMBER ONE template data...')
    
    // Find PROP NUMBER ONE PropFirm and templates
    const propNumberOne = await db.propFirm.findFirst({
      where: { name: 'PROP NUMBER ONE' },
      include: { 
        templates: {
          orderBy: { accountSize: 'asc' }
        }
      }
    })
    
    if (!propNumberOne) {
      console.log('❌ PROP NUMBER ONE not found!')
      return
    }
    
    console.log(`✅ Found PROP NUMBER ONE with ${propNumberOne.templates.length} templates`)
    
    // Check each template's Phase 2 profit target
    console.log('\n📊 Phase 2 Profit Targets for all PROP NUMBER ONE templates:')
    
    propNumberOne.templates.forEach(template => {
      const rules = template.rulesJson
      const phase2Target = rules?.profitTargets?.PHASE_2
      
      console.log(`\n${template.name} (${template.accountSize}):`)
      if (phase2Target) {
        console.log(`  Phase 2 Target: ${phase2Target.percentage}% = $${phase2Target.amount}`)
        console.log(`  Description: ${phase2Target.description}`)
        
        // Check if it's correct (should be 8%)
        if (phase2Target.percentage === 8) {
          console.log(`  ✅ CORRECT: Shows 8%`)
        } else {
          console.log(`  ❌ WRONG: Shows ${phase2Target.percentage}%, expected 8%`)
        }
      } else {
        console.log('  ❌ No Phase 2 target found!')
      }
    })
    
    // Now check which account is using PROP NUMBER ONE
    console.log('\n🔍 Checking which accounts use PROP NUMBER ONE templates...')
    
    const accounts = await db.account.findMany({
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    })
    
    accounts.forEach(account => {
      if (account.propFirmTemplate?.propFirm?.name === 'PROP NUMBER ONE') {
        console.log(`\n📋 Account ${account.login} uses PROP NUMBER ONE:`)
        console.log(`  Template: ${account.propFirmTemplate.name}`)
        console.log(`  Current Phase: ${account.currentPhase}`)
        
        const rules = account.propFirmTemplate.rulesJson
        const phase2Target = rules?.profitTargets?.PHASE_2
        if (phase2Target) {
          console.log(`  Phase 2 shows: ${phase2Target.percentage}%`)
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

debugPropNumberOne()