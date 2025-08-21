// Script per rimuovere le linee orfane dal file
const fs = require('fs')

const filePath = 'C:/Users/matte/Desktop/PCdash/new2dash/src/app/account/[accountId]/page.tsx'
const content = fs.readFileSync(filePath, 'utf8')
const lines = content.split('\n')

// Trova le linee da rimuovere (da Performance Summary Cards all'indietro)
const performanceLineIndex = lines.findIndex(line => line.includes('Performance Summary Cards'))
const newComponentLineIndex = lines.findIndex(line => line.includes('<OpenPositionsSection'))

console.log('Performance Summary Cards line:', performanceLineIndex)
console.log('OpenPositionsSection line:', newComponentLineIndex)

// Rimuovi le linee orfane tra newComponentLineIndex+1 e performanceLineIndex-1
if (performanceLineIndex > 0 && newComponentLineIndex > 0) {
  const newLines = [
    ...lines.slice(0, newComponentLineIndex + 1),
    '',
    ...lines.slice(performanceLineIndex)
  ]
  
  fs.writeFileSync(filePath, newLines.join('\n'))
  console.log('✅ File pulito! Rimosse linee orfane.')
}