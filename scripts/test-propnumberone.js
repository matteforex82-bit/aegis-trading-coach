const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function testPropNumberOneTemplates() {
  try {
    console.log('🔍 Testing PropNumberOne templates...\n');

    // Find PropNumberOne PropFirm
    const propFirm = await db.propFirm.findFirst({
      where: { name: 'PropNumberOne' },
      include: {
        templates: {
          orderBy: { accountSize: 'asc' }
        }
      }
    });

    if (!propFirm) {
      console.log('❌ PropNumberOne PropFirm not found!');
      return;
    }

    console.log(`✅ Found PropFirm: ${propFirm.name}`);
    console.log(`📋 Description: ${propFirm.description}`);
    console.log(`🌐 Website: ${propFirm.website}`);
    console.log(`📊 Templates Count: ${propFirm.templates.length}\n`);

    // Test each template
    propFirm.templates.forEach((template, index) => {
      console.log(`📋 Template ${index + 1}: ${template.name}`);
      console.log(`💰 Account Size: $${template.accountSize.toLocaleString()} ${template.currency}`);
      
      const rules = template.rulesJson;
      
      // Profit Targets
      console.log('\n🎯 PROFIT TARGETS:');
      console.log(`   Phase 1: ${rules.profitTargets.PHASE_1.percentage}% ($${rules.profitTargets.PHASE_1.amount.toLocaleString()})`);
      console.log(`   Phase 2: ${rules.profitTargets.PHASE_2.percentage}% ($${rules.profitTargets.PHASE_2.amount.toLocaleString()})`);
      console.log(`   Funded: ${rules.profitTargets.FUNDED.description}`);
      
      // Loss Limits
      console.log('\n🚫 LOSS LIMITS:');
      console.log(`   Max Daily Loss: ${rules.dailyLossLimits.PHASE_1.percentage}% (${rules.dailyLossLimits.PHASE_1.calculationMethod})`);
      console.log(`   Max Overall Loss: ${rules.overallLossLimits.PHASE_1.percentage}% ($${rules.overallLossLimits.PHASE_1.amount.toLocaleString()})`);
      
      // Trading Days
      console.log('\n📅 TRADING DAYS:');
      console.log(`   Phase 1: ${rules.minimumTradingDays.PHASE_1.days} giorni minimi`);
      console.log(`   Phase 2: ${rules.minimumTradingDays.PHASE_2.days} giorni minimi`);
      console.log(`   Funded: ${rules.minimumTradingDays.FUNDED.description}`);
      
      // Consistency Rules (50% Protection)
      console.log('\n⚖️  REGOLE DI PROTEZIONE 50%:');
      console.log(`   Phase 1: ${rules.consistencyRules.PHASE_1.enabled ? 'ATTIVE' : 'NON ATTIVE'}`);
      console.log(`   Phase 2: ${rules.consistencyRules.PHASE_2.enabled ? 'ATTIVE' : 'NON ATTIVE'}`);
      if (rules.consistencyRules.PHASE_2.enabled) {
        rules.consistencyRules.PHASE_2.rules.forEach(rule => {
          console.log(`     - ${rule.name}: ${rule.formula}`);
        });
      }
      console.log(`   Funded: ${rules.consistencyRules.FUNDED.enabled ? 'ATTIVE' : 'NON ATTIVE'}`);
      
      // Payout Info
      console.log('\n💰 INFORMAZIONI PRELIEVI:');
      console.log(`   Profit Split: ${rules.payoutInfo.profitSplit.trader}% trader / ${rules.payoutInfo.profitSplit.propFirm}% prop firm`);
      console.log(`   Primo prelievo: dopo ${rules.payoutInfo.firstPayoutAfterDays} giorni`);
      console.log(`   Frequenza prelievi: ogni ${rules.payoutInfo.payoutFrequencyDays} giorni`);
      
      // Trading Restrictions
      console.log('\n🔧 RESTRIZIONI DI TRADING:');
      console.log(`   News Trading: ${rules.tradingRestrictions.newsTrading ? 'CONSENTITO' : 'NON CONSENTITO'}`);
      console.log(`   Expert Advisors: ${rules.tradingRestrictions.expertAdvisors ? 'CONSENTITI' : 'NON CONSENTITI'}`);
      console.log(`   Weekend Holding: ${rules.tradingRestrictions.weekendHolding ? 'CONSENTITO' : 'NON CONSENTITO'}`);
      
      // Special Features
      console.log('\n🌟 CARATTERISTICHE SPECIALI:');
      rules.specialFeatures.forEach(feature => {
        console.log(`   ✅ ${feature}`);
      });
      
      console.log('\n' + '='.repeat(80) + '\n');
    });

    // Summary of all PropFirms
    console.log('📊 RIEPILOGO GENERALE:');
    const allPropFirms = await db.propFirm.findMany({
      include: {
        _count: {
          select: { templates: true }
        }
      }
    });
    
    allPropFirms.forEach(firm => {
      console.log(`   ${firm.name}: ${firm._count.templates} templates`);
    });

    console.log('\n✅ Test PropNumberOne completato con successo!');
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  } finally {
    await db.$disconnect();
  }
}

testPropNumberOneTemplates();