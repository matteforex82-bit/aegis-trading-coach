const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function updateCurrentBalance() {
  try {
    console.log('🔧 Updating current balance with real P&L...');
    
    // Find the account
    const account = await db.account.findFirst({
      where: { login: '20045652' }
    });
    
    if (!account) {
      console.log('❌ Account not found!');
      return;
    }
    
    // Calculate total P&L from trades
    const totalPnL = await db.trade.aggregate({
      where: { accountId: account.id },
      _sum: {
        pnlGross: true,
        swap: true,
        commission: true
      }
    });
    
    const totalProfit = (totalPnL._sum.pnlGross || 0) + (totalPnL._sum.swap || 0) + (totalPnL._sum.commission || 0);
    const startBalance = account.startBalance || 50000;
    const newCurrentBalance = startBalance + totalProfit;
    
    console.log('\n📊 Balance Calculation:');
    console.log(`- Start Balance: $${startBalance.toFixed(2)}`);
    console.log(`- Total P&L from trades: $${totalProfit.toFixed(2)}`);
    console.log(`- New Current Balance: $${newCurrentBalance.toFixed(2)}`);
    
    // Update the account
    const updatedAccount = await db.account.update({
      where: { id: account.id },
      data: {
        currentBalance: newCurrentBalance
      }
    });
    
    console.log('\n✅ Current balance updated successfully!');
    console.log(`- Updated Current Balance: $${updatedAccount.currentBalance}`);
    
    // Test the calculations again
    console.log('\n🧪 Testing profit target calculation...');
    const profitTarget = 2500; // 5% of 50000
    const currentPnL = newCurrentBalance - startBalance;
    const progress = (currentPnL / profitTarget) * 100;
    
    console.log(`- Current P&L: $${currentPnL.toFixed(2)}`);
    console.log(`- Profit Target: $${profitTarget.toFixed(2)}`);
    console.log(`- Progress: ${progress.toFixed(1)}%`);
    
    console.log('\n🎉 Balance update completed!');
    
  } catch (error) {
    console.error('❌ Error updating balance:', error);
  } finally {
    await db.$disconnect();
  }
}

updateCurrentBalance();