const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function fixFuturaStartBalance() {
  try {
    console.log('🔧 Fixing FUTURA FUNDING account startBalance...');
    
    // Find the account
    const account = await db.account.findFirst({
      where: { login: '20045652' },
      include: {
        propFirmTemplate: true
      }
    });
    
    if (!account) {
      console.log('❌ Account not found!');
      return;
    }
    
    console.log('\n📊 Current Account State:');
    console.log(`- Login: ${account.login}`);
    console.log(`- Start Balance: ${account.startBalance}`);
    console.log(`- Initial Balance: ${account.initialBalance}`);
    console.log(`- Current Balance: ${account.currentBalance}`);
    console.log(`- Template Account Size: $${account.propFirmTemplate?.accountSize}`);
    
    // Determine the correct startBalance
    let correctStartBalance;
    
    if (account.initialBalance) {
      correctStartBalance = account.initialBalance;
      console.log(`\n💡 Using initialBalance: $${correctStartBalance}`);
    } else if (account.propFirmTemplate?.accountSize) {
      correctStartBalance = account.propFirmTemplate.accountSize;
      console.log(`\n💡 Using template accountSize: $${correctStartBalance}`);
    } else {
      console.log('❌ Cannot determine correct startBalance!');
      return;
    }
    
    // Update the account
    const updatedAccount = await db.account.update({
      where: { id: account.id },
      data: {
        startBalance: correctStartBalance,
        // Also set currentBalance if it's null
        currentBalance: account.currentBalance || correctStartBalance
      }
    });
    
    console.log('\n✅ Account updated successfully!');
    console.log(`- New Start Balance: $${updatedAccount.startBalance}`);
    console.log(`- New Current Balance: $${updatedAccount.currentBalance}`);
    
    // Verify the fix by testing calculations
    console.log('\n🧪 Testing calculations...');
    
    const template = account.propFirmTemplate;
    if (template?.rulesJson) {
      const rules = template.rulesJson;
      const currentPhase = account.currentPhase || 'PHASE_2';
      
      // Calculate profit target
      const profitTarget = rules.profitTargets?.[currentPhase];
      if (profitTarget) {
        const targetAmount = (correctStartBalance * profitTarget.percentage) / 100;
        console.log(`- Profit Target (${currentPhase}): ${profitTarget.percentage}% = $${targetAmount.toFixed(2)}`);
      }
      
      // Calculate daily loss limit
      const dailyLossLimit = rules.dailyLossLimits?.[currentPhase];
      if (dailyLossLimit) {
        const lossAmount = (correctStartBalance * dailyLossLimit.percentage) / 100;
        console.log(`- Daily Loss Limit (${currentPhase}): ${dailyLossLimit.percentage}% = $${lossAmount.toFixed(2)}`);
      }
      
      // Calculate overall loss limit
      const overallLossLimit = rules.overallLossLimits?.[currentPhase];
      if (overallLossLimit) {
        const lossAmount = (correctStartBalance * overallLossLimit.percentage) / 100;
        console.log(`- Overall Loss Limit (${currentPhase}): ${overallLossLimit.percentage}% = $${lossAmount.toFixed(2)}`);
      }
      
      // Calculate current P&L and progress
      const currentBalance = updatedAccount.currentBalance;
      const totalPnL = currentBalance - correctStartBalance;
      console.log(`- Current P&L: $${totalPnL.toFixed(2)}`);
      
      if (profitTarget) {
        const targetAmount = (correctStartBalance * profitTarget.percentage) / 100;
        const progress = (totalPnL / targetAmount) * 100;
        console.log(`- Profit Progress: ${progress.toFixed(1)}%`);
      }
    }
    
    console.log('\n🎉 Fix completed! The dashboard should now show correct values.');
    
  } catch (error) {
    console.error('❌ Error fixing account:', error);
  } finally {
    await db.$disconnect();
  }
}

fixFuturaStartBalance();