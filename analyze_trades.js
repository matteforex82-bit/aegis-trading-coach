const fs = require('fs');
const data = JSON.parse(fs.readFileSync('trades_full.json', 'utf8'));
const trades = data.trades;

// Separa posizioni aperte e chiuse
const openTrades = trades.filter(t => !t.closeTime);
const closedTrades = trades.filter(t => t.closeTime);

console.log('=== ANALISI TRADES ===');
console.log('Totale trades:', trades.length);
console.log('Posizioni aperte:', openTrades.length);
console.log('Posizioni chiuse:', closedTrades.length);
console.log('');

// Calcola P&L solo trades chiusi
let totalPnL = 0;
let totalSwap = 0;
let totalCommission = 0;
let totalGross = 0;

closedTrades.forEach(t => {
  const gross = t.pnlGross || 0;
  const swap = t.swap || 0;
  const commission = t.commission || 0;
  const netPnL = gross + swap + commission;
  
  totalGross += gross;
  totalSwap += swap;
  totalCommission += commission;
  totalPnL += netPnL;
});

console.log('=== P&L SOLO POSIZIONI CHIUSE ===');
console.log('P&L Gross:', totalGross.toFixed(2));
console.log('Total Swap:', totalSwap.toFixed(2));
console.log('Total Commission:', totalCommission.toFixed(2));
console.log('P&L NETTO TOTALE:', totalPnL.toFixed(2));
console.log('');

// Posizioni aperte details
console.log('=== POSIZIONI APERTE ===');
openTrades.forEach(t => {
  console.log(`Ticket: ${t.ticketId}, Symbol: ${t.symbol}, Side: ${t.side}, Volume: ${t.volume}, P&L: ${t.pnlGross || 0}`);
});

console.log('');
console.log('=== VERIFICA DATI ===');
console.log('Primi 5 trades chiusi con dettagli:');
closedTrades.slice(0, 5).forEach(t => {
  const netPnL = (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0);
  console.log(`${t.ticketId}: Gross=${t.pnlGross}, Swap=${t.swap}, Comm=${t.commission}, Net=${netPnL.toFixed(2)}`);
});