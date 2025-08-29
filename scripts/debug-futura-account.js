const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function debugFuturaAccount() {
  try {
    console.log('🔍 Debugging FUTURA FUNDING account 20045652...');
    
    const account = await db.account.findFirst({
      where: { login: '20045652' },
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    });
    
    if (!account) {
      console.log('❌ Account not found!');
      return;
    }
    
    console.log('\n📊 Account Details:');
    console.log(`- ID: ${account.id}`);
    console.log(`- Login: ${account.login}`);
    console.log(`- Name: ${account.name}`);
    console.log(`- Current Phase: ${account.currentPhase}`);
    console.log(`- Start Balance: ${account.startBalance}`);
    console.log(`- Initial Balance: ${account.initialBalance}`);
    console.log(`- Current Balance: ${account.currentBalance}`);
    console.log(`- Created At: ${account.createdAt}`);
    
    if (account.propFirmTemplate) {
      console.log('\n🏢 Template Details:');
      console.log(`- Template Name: ${account.propFirmTemplate.name}`);
      console.log(`- Account Size: $${account.propFirmTemplate.accountSize?.toLocaleString()}`);
      console.log(`- Currency: ${account.propFirmTemplate.currency}`);
      console.log(`- PropFirm: ${account.propFirmTemplate.propFirm?.name}`);
      
      if (account.propFirmTemplate.rulesJson) {
        console.log('\n🎯 Template Rules:');
        const rules = account.propFirmTemplate.rulesJson;
        
        console.log('\n📈 Profit Targets:');
        if (rules.profitTargets) {
          console.log(`- PHASE_1: ${rules.profitTargets.PHASE_1?.percentage}% = $${rules.profitTargets.PHASE_1?.amount?.toLocaleString()}`);
          console.log(`- PHASE_2: ${rules.profitTargets.PHASE_2?.percentage}% = $${rules.profitTargets.PHASE_2?.amount?.toLocaleString()}`);
          console.log(`- FUNDED: ${rules.profitTargets.FUNDED?.description}`);
        }
        
        console.log('\n🚫 Loss Limits:');
        if (rules.dailyLossLimits) {
          console.log(`- Daily Loss PHASE_1: ${rules.dailyLossLimits.PHASE_1?.percentage}% = $${rules.dailyLossLimits.PHASE_1?.amount?.toLocaleString()}`);
          console.log(`- Daily Loss PHASE_2: ${rules.dailyLossLimits.PHASE_2?.percentage}% = $${rules.dailyLossLimits.PHASE_2?.amount?.toLocaleString()}`);
        }
        
        if (rules.overallLossLimits) {
          console.log(`- Overall Loss PHASE_1: ${rules.overallLossLimits.PHASE_1?.percentage}% = $${rules.overallLossLimits.PHASE_1?.amount?.toLocaleString()}`);
          console.log(`- Overall Loss PHASE_2: ${rules.overallLossLimits.PHASE_2?.percentage}% = $${rules.overallLossLimits.PHASE_2?.amount?.toLocaleString()}`);
        }
        
        console.log('\n📅 Trading Days:');
        if (rules.minimumTradingDays) {
          console.log(`- PHASE_1: ${rules.minimumTradingDays.PHASE_1?.days} days`);
          console.log(`- PHASE_2: ${rules.minimumTradingDays.PHASE_2?.days} days`);
        }
        
        console.log('\n⚖️ Consistency Rules:');
        if (rules.consistencyRules) {
          console.log(`- PHASE_1: ${rules.consistencyRules.PHASE_1?.enabled ? 'ENABLED' : 'DISABLED'}`);
          console.log(`- PHASE_2: ${rules.consistencyRules.PHASE_2?.enabled ? 'ENABLED' : 'DISABLED'}`);
        }
      }
    }
    
    // Check trades
    const trades = await db.trade.findMany({
      where: { accountId: account.id },
      orderBy: { openTime: 'desc' },
      take: 5
    });
    
    console.log(`\n📊 Recent Trades: ${trades.length}`);
    trades.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.symbol} - P&L: $${trade.pnlGross} - Open: ${trade.openTime}`);
    });
    
    // Calculate total P&L
    const totalPnL = await db.trade.aggregate({
      where: { accountId: account.id },
      _sum: {
        pnlGross: true,
        swap: true,
        commission: true
      }
    });
    
    const totalProfit = (totalPnL._sum.pnlGross || 0) + (totalPnL._sum.swap || 0) + (totalPnL._sum.commission || 0);
    console.log(`\n💰 Total P&L: $${totalProfit.toFixed(2)}`);
    
    // Identify the problem
    console.log('\n🔍 PROBLEM ANALYSIS:');
    if (account.startBalance === null) {
      console.log('❌ ISSUE: startBalance is NULL - this breaks all calculations!');
      console.log('💡 SOLUTION: Set startBalance to template accountSize');
    }
    
    if (account.initialBalance === null) {
      console.log('❌ ISSUE: initialBalance is NULL');
    }
    
    if (!account.propFirmTemplate?.rulesJson) {
      console.log('❌ ISSUE: No rulesJson in template');
    }
    
  } catch (error) {
    console.error('❌ Error debugging account:', error);
  } finally {
    await db.$disconnect();
  }
}

debugFuturaAccount();