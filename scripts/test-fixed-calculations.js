const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function testFixedCalculations() {
  try {
    console.log('🧪 Testing fixed calculations...');
    
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
    
    // Get stats like the API does (only closed trades)
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
    
    // Calculate P&L like the API does
    const totalPnLGross = closedTrades.reduce((sum, t) => sum + (t.pnlGross || 0), 0);
    const totalCommission = closedTrades.reduce((sum, t) => sum + (t.commission || 0), 0);
    const totalSwap = closedTrades.reduce((sum, t) => sum + (t.swap || 0), 0);
    const netPnL = totalPnLGross + totalCommission + totalSwap; // This is what API returns as netPnL
    
    // Calculate using update-current-balance.js approach (aggregate ALL trades)
    const totalPnLAggregate = await db.trade.aggregate({
      where: { accountId: account.id },
      _sum: {
        pnlGross: true,
        swap: true,
        commission: true
      }
    });
    
    const totalPnLComplete = (totalPnLAggregate._sum.pnlGross || 0) + 
                            (totalPnLAggregate._sum.swap || 0) + 
                            (totalPnLAggregate._sum.commission || 0);
    
    console.log('\n📊 Account Data:');
    console.log(`- Login: ${account.login}`);
    console.log(`- Start Balance: $${account.startBalance}`);
    console.log(`- Current Balance (DB): $${account.currentBalance}`);
    console.log(`- Total P&L (pnlGross only): $${totalPnLGross.toFixed(2)}`);
    console.log(`- Net P&L (API - includes commission/swap): $${netPnL.toFixed(2)}`);
    console.log(`- Total P&L (update-script - all trades): $${totalPnLComplete.toFixed(2)}`);
    
    // Test with both approaches
    const startBalance = account.startBalance || 50000;
    
    console.log('\n🔍 COMPARISON:');
    console.log('API netPnL approach (closed trades with commission/swap):');
    const currentBalanceAPI = startBalance + netPnL;
    console.log(`- Current Balance: $${currentBalanceAPI.toFixed(2)}`);
    
    console.log('\nUpdate-script approach (all trades with commission/swap):');
    const currentBalanceComplete = startBalance + totalPnLComplete;
    console.log(`- Current Balance: $${currentBalanceComplete.toFixed(2)}`);
    
    console.log('\nDatabase Current Balance:');
    console.log(`- Current Balance: $${account.currentBalance}`);
    
    // Check which one matches
    const apiMatch = Math.abs(account.currentBalance - currentBalanceAPI) < 0.01;
    const completeMatch = Math.abs(account.currentBalance - currentBalanceComplete) < 0.01;
    
    console.log('\n✅ MATCH RESULTS:');
    console.log(`- API netPnL approach matches DB: ${apiMatch ? '✅ YES' : '❌ NO'}`);
    console.log(`- Update-script approach matches DB: ${completeMatch ? '✅ YES' : '❌ NO'}`);
    
    // Use the correct P&L for calculations (prefer API netPnL as it's what the component uses)
    const correctPnL = netPnL;
    const correctCurrentBalance = startBalance + correctPnL;
    
    console.log('\n🎯 CORRECTED CALCULATIONS:');
    const rules = account.propFirmTemplate?.rulesJson;
    const profitTargetAmount = rules?.profitTargets?.PHASE_2?.amount || 2500;
    const targetAmount = correctCurrentBalance + profitTargetAmount;
    const progress = ((correctCurrentBalance - startBalance) / profitTargetAmount) * 100;
    
    console.log(`- Start Balance: $${startBalance.toFixed(2)}`);
    console.log(`- Current Balance: $${correctCurrentBalance.toFixed(2)}`);
    console.log(`- Profit Target Amount: $${profitTargetAmount.toFixed(2)}`);
    console.log(`- Target Amount: $${targetAmount.toFixed(2)}`);
    console.log(`- Progress: ${progress.toFixed(1)}%`);
    
    // Test profit target calculation
    console.log('\n🏆 PROFIT TARGET STATUS:');
    const remainingToTarget = profitTargetAmount - (correctCurrentBalance - startBalance);
    console.log(`- Amount needed to reach target: $${remainingToTarget.toFixed(2)}`);
    
    if (remainingToTarget <= 0) {
      console.log('🎉 TARGET ALREADY REACHED!');
    } else {
      console.log(`💪 Need $${remainingToTarget.toFixed(2)} more to reach target`);
    }
    
    // Identify the issue
    console.log('\n🔧 ISSUE ANALYSIS:');
    if (apiMatch) {
      console.log('✅ The API netPnL calculation matches the database!');
      console.log('   DynamicRuleRenderer now uses stats.netPnL for accurate calculations.');
      console.log('   The profit target calculations should now be correct.');
    } else if (completeMatch) {
      console.log('✅ The update-script calculation matches the database.');
      console.log('   There might be open trades affecting the difference.');
    } else {
      console.log('❌ Neither calculation matches the database exactly.');
      console.log('   This could be due to manual balance adjustments or other factors.');
      console.log('   However, using API netPnL is still the most accurate approach.');
    }
    
  } catch (error) {
    console.error('❌ Error testing calculations:', error);
  } finally {
    await db.$disconnect();
  }
}

testFixedCalculations();