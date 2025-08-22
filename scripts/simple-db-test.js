const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testDb() {
  try {
    console.log('🔍 Testing direct database access...')
    
    // Test 1: Get all accounts
    const allAccounts = await db.account.findMany({
      select: {
        login: true,
        name: true,
        currentPhase: true,
        startBalance: true
      }
    })
    
    console.log(`✅ Found ${allAccounts.length} accounts:`)
    allAccounts.forEach(acc => {
      console.log(`- ${acc.login}: ${acc.name} (${acc.currentPhase})`)
    })
    
    // Test 2: Get template info
    const templates = await db.propFirmTemplate.findMany({
      select: {
        name: true,
        accountSize: true
      }
    })
    
    console.log(`\n✅ Found ${templates.length} templates:`)
    templates.forEach(tmpl => {
      console.log(`- ${tmpl.name}: ${tmpl.accountSize}`)
    })
    
    // Test 3: Try account with template
    const accountWithTemplate = await db.account.findFirst({
      where: { login: '31284471' },
      include: {
        propFirmTemplate: true
      }
    })
    
    if (accountWithTemplate) {
      console.log(`\n🎯 Account 31284471:`)
      console.log(`- Phase: ${accountWithTemplate.currentPhase}`)
      console.log(`- Template: ${accountWithTemplate.propFirmTemplate?.name || 'NONE'}`)
    } else {
      console.log('\n❌ Account 31284471 not found')
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

testDb()