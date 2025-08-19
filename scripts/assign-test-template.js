const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignTestTemplate() {
  try {
    console.log('🔧 Assigning PropFirm template for testing...\n');

    // Get first account
    const account = await prisma.account.findFirst();
    if (!account) {
      console.log('❌ No account found');
      return;
    }

    // Get PropNumberOne template (preferred for testing)
    let template = await prisma.propFirmTemplate.findFirst({
      where: {
        propFirm: {
          name: 'PropNumberOne'
        }
      },
      include: {
        propFirm: true
      }
    });

    // Fallback to any template
    if (!template) {
      template = await prisma.propFirmTemplate.findFirst({
        include: {
          propFirm: true
        }
      });
    }

    if (!template) {
      console.log('❌ No PropFirm template found');
      return;
    }

    console.log('📊 Assignment Details:');
    console.log(`   Account: ${account.login}`);
    console.log(`   PropFirm: ${template.propFirm.name}`);
    console.log(`   Template: ${template.name}`);
    console.log(`   Account Size: €${template.accountSize.toLocaleString()}`);
    console.log('');

    // Update account with template assignment
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: {
        propFirmTemplateId: template.id,
        propFirmId: template.propFirmId,
        initialBalance: template.accountSize, // Set initial balance to account size
        currentPhase: 'PHASE_1', // Start in Phase 1
        accountType: 'CHALLENGE',
        isChallenge: true,
        updatedAt: new Date()
      }
    });

    console.log('✅ Template assigned successfully!');
    console.log(`   Account ID: ${updatedAccount.id}`);
    console.log(`   Initial Balance: €${updatedAccount.initialBalance?.toLocaleString()}`);
    console.log(`   Current Phase: ${updatedAccount.currentPhase}`);
    console.log('');

    // Show rules summary
    const rules = template.rulesJson;
    if (rules && rules.phase1) {
      console.log('📋 Phase 1 Rules Summary:');
      console.log(`   Profit Target: ${rules.phase1.profitTarget}% (€${rules.phase1.profitTargetAmount?.toLocaleString()})`);
      console.log(`   Max Daily Loss: ${rules.phase1.maxDailyLoss}%`);
      console.log(`   Max Overall Loss: ${rules.phase1.maxOverallLoss}%`);
      if (rules.phase1.minTradingDays) {
        console.log(`   Min Trading Days: ${rules.phase1.minTradingDays}`);
      }
      console.log('');
    }

    console.log('🎯 Ready to test Rule Engine!');
    console.log('   Run: node scripts/test-rule-engine.js');

  } catch (error) {
    console.error('❌ Error assigning template:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

assignTestTemplate();