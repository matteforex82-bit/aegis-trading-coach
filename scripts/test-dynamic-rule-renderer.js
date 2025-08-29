const { PrismaClient } = require('@prisma/client');
const { TemplateBasedCalculator } = require('../src/lib/template-calculator');

const db = new PrismaClient();

async function testDynamicRuleRenderer() {
  try {
    console.log('🧪 Testing DynamicRuleRenderer calculations...');
    
    // Get account data
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
      console.log('❌ Account not found');
      return;
    }
    
    // Get stats (simulating API call)
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
    
    console.log('\n📊 Account Data:');
    console.log(`- Login: ${account.login}`);
    console.log(`- Start Balance: $${account.startBalance}`);
    console.log(`- Current Phase: ${account.currentPhase}`);
    console.log(`- Template: ${account.propFirmTemplate?.name}`);
    
    console.log('\n📈 Stats Data:');
    console.log(`- Total P&L (gross): $${stats.totalPnL.toFixed(2)}`);
    console.log(`- Total Commission: $${stats.totalCommission.toFixed(2)}`);
    console.log(`- Total Swap: $${stats.totalSwap.toFixed(2)}`);
    console.log(`- Net P&L: $${stats.netPnL.toFixed(2)}`);
    
    // Simulate DynamicRuleRenderer logic
    const currentBalance = (account.startBalance || 50000) + (stats.netPnL || stats.totalPnL || 0);
    const calculator = new TemplateBasedCalculator(
      account.propFirmTemplate || null,
      currentBalance,
      account.currentPhase
    );
    
    console.log('\n🎯 DynamicRuleRenderer Calculations:');
    console.log(`- Current Balance: $${currentBalance.toFixed(2)}`);
    
    // Test profit target calculations
    if (calculator.hasRule('profit')) {
      const targetAmount = calculator.getTargetAmount(0);
      const progress = calculator.getProfitTargetProgress(0);
      const templateInfo = calculator.getTemplateInfo();
      
      console.log('\n💰 Profit Target:');
      console.log(`- Account Size (from calculator): $${templateInfo.accountSize.toFixed(2)}`);
      console.log(`- Target Amount: $${targetAmount.toFixed(2)}`);
      console.log(`- Progress: ${progress.toFixed(1)}%`);
      
      if (progress < -1000) {
        console.log('\n❌ ISSUE DETECTED: Progress is extremely negative!');
        console.log('   This suggests a calculation error in the TemplateBasedCalculator.');
      } else {
        console.log('\n✅ Progress calculation looks reasonable.');
      }
    } else {
      console.log('\n❌ No profit target rule found');
    }
    
    // Test other rules
    console.log('\n🔍 Available Rules:');
    console.log(`- Has Profit Rule: ${calculator.hasRule('profit')}`);
    console.log(`- Has Daily Loss Rule: ${calculator.hasRule('dailyLoss')}`);
    console.log(`- Has Overall Loss Rule: ${calculator.hasRule('overallLoss')}`);
    console.log(`- Has Consistency Rules: ${calculator.hasConsistencyRules()}`);
    
  } catch (error) {
    console.error('❌ Error testing DynamicRuleRenderer:', error);
  } finally {
    await db.$disconnect();
  }
}

testDynamicRuleRenderer();