const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import the fixed rule engine (we'll simulate it since it's TypeScript)
class FixedPropFirmRuleEngine {
  constructor(account, trades) {
    this.account = account;
    this.trades = trades;
  }

  evaluateRules() {
    const metrics = this.calculateMetrics();
    const violations = this.checkAllRules(this.getCurrentPhaseRules(), metrics);
    const phaseProgress = this.calculatePhaseProgress(this.getCurrentPhaseRules(), metrics);

    return {
      isCompliant: violations.filter(v => v.severity === 'CRITICAL').length === 0,
      violations,
      metrics,
      phaseProgress
    };
  }

  getCurrentPhaseRules() {
    const rules = this.account.propFirmTemplate.rulesJson;
    switch (this.account.currentPhase) {
      case 'PHASE_1': return rules.phase1;
      case 'PHASE_2': return rules.phase2;
      case 'FUNDED': return rules.funded;
      default: return rules.phase1;
    }
  }

  calculateMetrics() {
    const closedTrades = this.trades.filter(t => t.closeTime !== null);
    const openTrades = this.trades.filter(t => t.closeTime === null);
    
    // Total P&L (closed + unrealized)
    const closedProfit = closedTrades.reduce((sum, t) => sum + (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0), 0);
    const unrealizedProfit = openTrades.reduce((sum, t) => sum + (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0), 0);
    const totalProfit = closedProfit + unrealizedProfit;

    // Daily metrics
    const dailyProfits = this.calculateDailyProfits();
    const todayProfit = dailyProfits[this.formatDate(new Date())] || 0;
    const bestTradingDay = Math.max(...Object.values(dailyProfits), 0);

    // Best single trade
    const bestSingleTrade = Math.max(...closedTrades.map(t => (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0)), 0);

    // Trading days (days with at least one trade)
    const tradingDays = Object.keys(dailyProfits).length;

    // Win rate
    const winningTrades = closedTrades.filter(t => {
      const pnl = (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0);
      return pnl > 0;
    }).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

    return {
      totalProfit,
      dailyProfit: todayProfit,
      bestTradingDay,
      bestSingleTrade,
      currentDrawdown: this.calculateDrawdown(),
      tradingDays,
      totalTrades: this.trades.length,
      winRate,
      profitFactor: this.calculateProfitFactor(closedTrades)
    };
  }

  calculateDailyProfits() {
    const dailyProfits = {};
    this.trades.forEach(trade => {
      const date = this.formatDate(new Date(trade.openTime));
      const profit = (trade.pnlGross || 0) + (trade.swap || 0) + (trade.commission || 0);
      
      if (!dailyProfits[date]) {
        dailyProfits[date] = 0;
      }
      dailyProfits[date] += profit;
    });
    return dailyProfits;
  }

  calculateDrawdown() {
    let highWaterMark = this.account.initialBalance;
    let currentDrawdown = 0;
    let runningBalance = this.account.initialBalance;

    const sortedTrades = [...this.trades].sort((a, b) => 
      new Date(a.openTime).getTime() - new Date(b.openTime).getTime()
    );

    sortedTrades.forEach(trade => {
      const profit = (trade.pnlGross || 0) + (trade.swap || 0) + (trade.commission || 0);
      runningBalance += profit;

      if (runningBalance > highWaterMark) {
        highWaterMark = runningBalance;
      }

      const drawdown = ((highWaterMark - runningBalance) / this.account.initialBalance) * 100;
      currentDrawdown = Math.max(currentDrawdown, drawdown);
    });

    return currentDrawdown;
  }

  calculateProfitFactor(closedTrades) {
    const grossProfit = closedTrades
      .filter(t => {
        const pnl = (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0);
        return pnl > 0;
      })
      .reduce((sum, t) => sum + (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0), 0);
    
    const grossLoss = Math.abs(closedTrades
      .filter(t => {
        const pnl = (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0);
        return pnl < 0;
      })
      .reduce((sum, t) => sum + (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0), 0));

    return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
  }

  checkAllRules(rules, metrics) {
    const violations = [];

    // Daily Loss Rule
    if (metrics.dailyProfit < 0) {
      const dailyLossPercent = Math.abs(metrics.dailyProfit / this.account.initialBalance) * 100;
      if (dailyLossPercent > rules.maxDailyLoss) {
        violations.push({
          ruleType: 'DAILY_LOSS',
          severity: 'CRITICAL',
          message: `Daily loss limit exceeded: ${dailyLossPercent.toFixed(2)}% > ${rules.maxDailyLoss}%`,
          currentValue: dailyLossPercent,
          limitValue: rules.maxDailyLoss,
          violationTime: new Date().toISOString()
        });
      }
    }

    // Overall Loss Rule
    if (metrics.totalProfit < 0) {
      const overallLossPercent = Math.abs(metrics.totalProfit / this.account.initialBalance) * 100;
      if (overallLossPercent > rules.maxOverallLoss) {
        violations.push({
          ruleType: 'OVERALL_LOSS',
          severity: 'CRITICAL',
          message: `Overall loss limit exceeded: ${overallLossPercent.toFixed(2)}% > ${rules.maxOverallLoss}%`,
          currentValue: overallLossPercent,
          limitValue: rules.maxOverallLoss,
          violationTime: new Date().toISOString()
        });
      }
    }

    return violations;
  }

  calculatePhaseProgress(rules, metrics) {
    let profitProgress = 0;
    let canAdvance = false;
    let nextPhase;

    if (rules.profitTargetAmount && rules.profitTargetAmount > 0) {
      profitProgress = Math.max(0, (metrics.totalProfit / rules.profitTargetAmount) * 100);
      
      const hasMetProfitTarget = metrics.totalProfit >= rules.profitTargetAmount;
      const hasMetMinDays = !rules.minTradingDays || metrics.tradingDays >= rules.minTradingDays;
      const hasNoCriticalViolations = this.checkAllRules(rules, metrics)
        .filter(v => v.severity === 'CRITICAL').length === 0;

      canAdvance = hasMetProfitTarget && hasMetMinDays && hasNoCriticalViolations;

      if (canAdvance) {
        switch (this.account.currentPhase) {
          case 'PHASE_1': nextPhase = 'PHASE_2'; break;
          case 'PHASE_2': nextPhase = 'FUNDED'; break;
          case 'FUNDED': nextPhase = undefined; break;
        }
      }
    }

    return {
      profitProgress,
      daysProgress: metrics.tradingDays,
      canAdvance,
      nextPhase
    };
  }

  formatDate(date) {
    return date.toISOString().split('T')[0];
  }
}

async function testFixedRuleEngine() {
  try {
    console.log('🔧 Testing FIXED Rule Engine with Real Data...\n');

    const account = await prisma.account.findFirst({
      where: { propFirmTemplate: { isNot: null } },
      include: { propFirmTemplate: { include: { propFirm: true } } }
    });

    if (!account) {
      console.log('❌ No account found with PropFirm template');
      return;
    }

    const trades = await prisma.trade.findMany({
      where: { accountId: account.id },
      orderBy: { openTime: 'asc' }
    });

    console.log('📊 Test Account:', account.login);
    console.log('   Template:', account.propFirmTemplate.name);
    console.log('   Initial Balance:', account.initialBalance);
    console.log('   Found Trades:', trades.length);
    console.log('');

    // Create and run fixed rule engine
    const ruleEngine = new FixedPropFirmRuleEngine(account, trades);
    const result = ruleEngine.evaluateRules();

    console.log('🎯 FIXED RULE ENGINE RESULTS:');
    console.log(`   Compliance: ${result.isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
    console.log(`   Violations: ${result.violations.length}`);
    console.log('');

    console.log('📊 REAL METRICS:');
    console.log(`   Total P&L: €${result.metrics.totalProfit.toFixed(2)}`);
    console.log(`   Daily P&L: €${result.metrics.dailyProfit.toFixed(2)}`);
    console.log(`   Trading Days: ${result.metrics.tradingDays}`);
    console.log(`   Total Trades: ${result.metrics.totalTrades}`);
    console.log(`   Win Rate: ${result.metrics.winRate.toFixed(2)}%`);
    console.log(`   Best Single Trade: €${result.metrics.bestSingleTrade.toFixed(2)}`);
    console.log(`   Current Drawdown: ${result.metrics.currentDrawdown.toFixed(2)}%`);
    console.log('');

    console.log('🎯 PHASE PROGRESS:');
    console.log(`   Profit Progress: ${result.phaseProgress.profitProgress.toFixed(2)}%`);
    console.log(`   Can Advance: ${result.phaseProgress.canAdvance ? 'Yes' : 'No'}`);
    if (result.phaseProgress.nextPhase) {
      console.log(`   Next Phase: ${result.phaseProgress.nextPhase}`);
    }
    console.log('');

    if (result.violations.length > 0) {
      console.log('⚠️ VIOLATIONS:');
      result.violations.forEach((violation, index) => {
        const emoji = violation.severity === 'CRITICAL' ? '🚨' : '⚠️';
        console.log(`   ${index + 1}. ${emoji} ${violation.message}`);
      });
    } else {
      console.log('✅ No rule violations - All good!');
    }

    console.log('');
    console.log('🚀 This data should now show correctly in the dashboard!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFixedRuleEngine();