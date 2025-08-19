const XLSX = require('xlsx')

// Create a sample MT5 Excel report for testing
function createSampleMT5Excel() {
  const workbook = XLSX.utils.book_new()

  // Account Summary sheet
  const summaryData = [
    ['MetaTrader 5 Account Report'],
    [''],
    ['Name:', 'Test User'],
    ['Account:', '2958 (USD, Demo)'],
    ['Company:', 'Test Company Ltd'],
    ['Date:', '2025.08.19 21:00'],
    [''],
    ['Balance:', '50000.00'],
    ['Equity:', '50010.00'],
    ['Floating P/L:', '10.00'],
    ['Total Net Profit:', '98.00']
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Account Summary')

  // Closed Trades sheet
  const tradesData = [
    ['MetaTrader 5 Closed Positions Report'],
    [''],
    ['Open Time', 'Ticket', 'Symbol', 'Type', 'Volume', 'Open Price', 'S/L', 'T/P', 'Close Time', 'Close Price', 'Commission', 'Swap', 'Profit'],
    ['2025.08.19 10:00:00', '123456', 'EURUSD', 'buy', '1.00', '1.1000', '', '', '2025.08.19 11:00:00', '1.1010', '-2.00', '0.00', '100.00'],
    ['2025.08.19 14:00:00', '123457', 'GBPUSD', 'sell', '0.50', '1.2500', '', '', '2025.08.19 15:00:00', '1.2490', '-1.00', '0.00', '25.00'],
    ['', '', '', '', '', '', '', '', '', '', '', '', 'Total: 125.00']
  ]

  const tradesSheet = XLSX.utils.aoa_to_sheet(tradesData)
  XLSX.utils.book_append_sheet(workbook, tradesSheet, 'Closed Trades')

  // Open Positions sheet
  const openData = [
    ['MetaTrader 5 Open Positions Report'],
    [''],
    ['Open Time', 'Ticket', 'Symbol', 'Type', 'Volume', 'Open Price', 'Current Price', 'S/L', 'T/P', 'Swap', 'Profit'],
    ['2025.08.19 12:00:00', '789012', 'GBPUSD', 'sell', '0.50', '1.2500', '1.2480', '', '', '-1.00', '10.00']
  ]

  const openSheet = XLSX.utils.aoa_to_sheet(openData)
  XLSX.utils.book_append_sheet(workbook, openSheet, 'Open Positions')

  // Write the file
  XLSX.writeFile(workbook, 'test-sync.xlsx')
  console.log('✅ Sample MT5 Excel file created: test-sync.xlsx')
}

createSampleMT5Excel()