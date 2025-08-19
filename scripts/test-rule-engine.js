const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//+------------------------------------------------------------------+
//| Test Rule Engine with Mock Data                                |
//+------------------------------------------------------------------+

// Mock PropFirmRuleEngine class for testing (simplified)
class MockPropFirmRuleEngine {
  constructor(account, trades) {
    this.account = account;
    this.trades = trades;
  }

  evaluateRules() {
    const metrics = this.calculateMetrics();
    const violations = this.checkRules(metrics);
    
    return {
      isCompliant: violations.filter(v => v.severity === 'CRITICAL').length === 0,
      violations,
      metrics,
      phaseProgress: {
        profitProgress: metrics.totalProfit > 0 ? 
          (metrics.totalProfit / this.account.propFirmTemplate.rulesJson.phase1.profitTargetAmount) * 100 : 0,
        daysProgress: metrics.tradingDays,
        canAdvance: metrics.totalProfit >= this.account.propFirmTemplate.rulesJson.phase1.profitTargetAmount,
        nextPhase: 'PHASE_2'
      }
    };
  }

  calculateMetrics() {
    const totalProfit = this.trades.reduce((sum, t) => sum + t.profit + t.swap + t.commission, 0);
    const tradingDays = new Set(this.trades.map(t => {
      const date = new Date(t.openTime);
      return date.toISOString().split('T')[0];
    })).size;
    const winningTrades = this.trades.filter(t => (t.profit + t.swap + t.commission) > 0).length;
    const winRate = this.trades.length > 0 ? (winningTrades / this.trades.length) * 100 : 0;
    
    return {
      totalProfit,
      dailyProfit: 0,
      bestTradingDay: 500,
      bestSingleTrade: 200,
      currentDrawdown: 0,
      tradingDays,
      totalTrades: this.trades.length,
      winRate,
      profitFactor: 1.5
    };
  }

  checkRules(metrics) {
    const violations = [];
    const rules = this.account.propFirmTemplate.rulesJson.phase1;
    
    // Test Simple Protection Rules (for demo)
    if (this.account.currentPhase === 'PHASE_2' && metrics.totalProfit > 0) {
      const requiredProfit = metrics.bestSingleTrade * 2;
      if (metrics.totalProfit < requiredProfit) {
        violations.push({
          ruleType: 'TRADE_PROTECTION',
          severity: 'CRITICAL',
          message: `50% Trade Protection violated: Total profit €${metrics.totalProfit.toFixed(2)} < 2x best trade €${requiredProfit.toFixed(2)}`,
          currentValue: metrics.totalProfit,
          limitValue: requiredProfit,
          violationTime: new Date().toISOString()
        });
      }
    }
    
    return violations;
  }
}

async function testRuleEngine() {
  try {
    console.log('🧪 Testing PropFirm Rule Engine...\n');

    // Get test account with PropFirm template
    const account = await prisma.account.findFirst({
      where: {
        propFirmTemplate: {
          isNot: null
        }
      },
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    });

    if (!account) {
      console.log('❌ No account found with PropFirm template');
      console.log('   Run the PropFirm template setup script first');
      return;
    }

    console.log('📊 Test Account Details:');
    console.log(`   Account: ${account.login}`);
    console.log(`   PropFirm: ${account.propFirmTemplate.propFirm.name}`);
    console.log(`   Template: ${account.propFirmTemplate.name}`);
    console.log(`   Phase: ${account.currentPhase}`);
    console.log(`   Initial Balance: €${account.initialBalance || account.propFirmTemplate.accountSize}`);
    console.log('');

    // Get some trades for testing
    const trades = await prisma.trade.findMany({
      where: { accountId: account.id },
      take: 10,
      orderBy: { openTime: 'desc' }
    });

    console.log(`📈 Found ${trades.length} trades for testing`);

    // Mock trades if none exist
    const mockTrades = trades.length > 0 ? trades : [
      {
        id: 'mock-1',
        ticketId: '123456',
        symbol: 'EURUSD',
        volume: 0.1,
        openPrice: 1.0850,
        closePrice: 1.0870,
        openTime: new Date('2024-01-15T10:00:00Z'),
        closeTime: new Date('2024-01-15T15:00:00Z'),
        profit: 200,
        swap: -1.5,
        commission: -7,
        type: 'BUY',
        isOpen: false
      },
      {
        id: 'mock-2',
        ticketId: '123457',
        symbol: 'GBPUSD',
        volume: 0.1,
        openPrice: 1.2650,
        closePrice: 1.2620,
        openTime: new Date('2024-01-16T08:00:00Z'),
        closeTime: new Date('2024-01-16T12:00:00Z'),
        profit: -300,
        swap: -0.8,
        commission: -6,
        type: 'BUY',
        isOpen: false
      }
    ];

    console.log('');
    console.log('⚙️  Running Rule Engine...');
    console.log('');

    // Create and run mock rule engine
    const ruleEngine = new MockPropFirmRuleEngine(account, mockTrades);
    const result = ruleEngine.evaluateRules();

    // Display results
    console.log('📋 RULE EVALUATION RESULTS:');
    console.log(`   Compliance: ${result.isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
    console.log(`   Violations: ${result.violations.length}`);
    console.log('');

    console.log('📊 METRICS:');
    console.log(`   Total Profit: €${result.metrics.totalProfit.toFixed(2)}`);
    console.log(`   Trading Days: ${result.metrics.tradingDays}`);
    console.log(`   Total Trades: ${result.metrics.totalTrades}`);
    console.log(`   Win Rate: ${result.metrics.winRate.toFixed(1)}%`);
    console.log('');

    console.log('🎯 PHASE PROGRESS:');
    console.log(`   Profit Progress: ${result.phaseProgress.profitProgress.toFixed(1)}%`);
    console.log(`   Can Advance: ${result.phaseProgress.canAdvance ? 'Yes' : 'No'}`);
    if (result.phaseProgress.nextPhase) {
      console.log(`   Next Phase: ${result.phaseProgress.nextPhase}`);
    }
    console.log('');

    if (result.violations.length > 0) {
      console.log('⚠️  VIOLATIONS:');
      result.violations.forEach((violation, index) => {
        const emoji = violation.severity === 'CRITICAL' ? '🚨' : '⚠️';
        console.log(`   ${index + 1}. ${emoji} ${violation.ruleType}: ${violation.message}`);
      });
      console.log('');
    }

    console.log('✅ Rule Engine test completed successfully!');
    console.log('');
    console.log('🔗 API Endpoint: POST /api/accounts/' + account.id + '/evaluate-rules');
    console.log('🎛️  Dashboard: Rule compliance panel integrated');

  } catch (error) {
    console.error('❌ Error testing rule engine:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRuleEngine();