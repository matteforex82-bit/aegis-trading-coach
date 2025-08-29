const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function testDashboardCalculations() {
  try {
    console.log('🎯 Testing Dashboard Profit Target Calculations...');
    
    // Find the FUTURA FUNDING account
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
    
    // Simulate API stats call (like the dashboard does)
    const allTrades = await db.trade.findMany({
      where: { accountId: account.id },
      select: {
        id: true,
        pnlGross: true,
        volume: true,
        closeTime: true,
        commission: true,
        swap: true
      }
    });
    
    const closedTrades = allTrades.filter(t => t.closeTime !== null);
    
    // Calculate stats like the API does
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnlGross || 0), 0);
    const totalCommission = closedTrades.reduce((sum, t) => sum + (t.commission || 0), 0);
    const totalSwap = closedTrades.reduce((sum, t) => sum + (t.swap || 0), 0);
    const netPnL = totalPnL + totalCommission + totalSwap;
    
    const stats = {
      totalPnL,
      netPnL,
      totalCommission,
      totalSwap
    };
    
    console.log('\n📊 Dashboard Data Simulation:');
    console.log(`- Account Login: ${account.login}`);
    console.log(`- Start Balance: $${account.startBalance}`);
    console.log(`- Stats totalPnL: $${stats.totalPnL.toFixed(2)}`);
    console.log(`- Stats netPnL: $${stats.netPnL.toFixed(2)}`);
    
    // Simulate DynamicRuleRenderer calculations (AFTER fix)
    const startBalance = account.startBalance || 50000;
    const currentBalance = startBalance + stats.netPnL; // Now using netPnL!
    
    console.log('\n🎯 PROFIT TARGET CALCULATIONS (Fixed):');
    console.log(`- Start Balance: $${startBalance.toFixed(2)}`);
    console.log(`- Current Balance: $${currentBalance.toFixed(2)}`);
    
    // Get profit target from rules
    const rules = account.propFirmTemplate?.rulesJson;
    const profitTarget = rules?.profitTargets?.PHASE_2;
    
    if (profitTarget) {
      const targetAmount = profitTarget.amount || 2500;
      const targetBalance = currentBalance + targetAmount;
      const currentPnL = currentBalance - startBalance;
      const progress = (currentPnL / targetAmount) * 100;
      const remainingToTarget = targetAmount - currentPnL;
      
      console.log(`- Profit Target Amount: $${targetAmount.toFixed(2)}`);
      console.log(`- Target Balance: $${targetBalance.toFixed(2)}`);
      console.log(`- Current P&L: $${currentPnL.toFixed(2)}`);
      console.log(`- Progress: ${progress.toFixed(1)}%`);
      console.log(`- Remaining to Target: $${remainingToTarget.toFixed(2)}`);
      
      // Status check
      if (progress >= 100) {
        console.log('\n🎉 STATUS: PROFIT TARGET REACHED!');
      } else if (progress >= 0) {
        console.log('\n📈 STATUS: Making progress towards target');
      } else {
        console.log('\n📉 STATUS: Currently at a loss, need to recover');
      }
      
      // Compare with old calculation (using totalPnL)
      console.log('\n🔍 COMPARISON WITH OLD CALCULATION:');
      const oldCurrentBalance = startBalance + stats.totalPnL;
      const oldCurrentPnL = oldCurrentBalance - startBalance;
      const oldProgress = (oldCurrentPnL / targetAmount) * 100;
      
      console.log(`- Old Current Balance: $${oldCurrentBalance.toFixed(2)}`);
      console.log(`- Old Progress: ${oldProgress.toFixed(1)}%`);
      console.log(`- Difference in Progress: ${(progress - oldProgress).toFixed(1)}%`);
      
      if (Math.abs(progress - oldProgress) > 1) {
        console.log('\n✅ SIGNIFICANT IMPROVEMENT!');
        console.log('   The fix has corrected the profit target calculations.');
        console.log('   Commission and swap are now properly included.');
      } else {
        console.log('\n⚠️  Small difference detected.');
        console.log('   The impact might be minimal for this account.');
      }
      
    } else {
      console.log('❌ No profit target rules found!');
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard calculations:', error);
  } finally {
    await db.$disconnect();
  }
}

testDashboardCalculations();