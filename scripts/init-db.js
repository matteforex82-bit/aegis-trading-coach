const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Inizializzazione database...')

  // Create a test user
  const user = await prisma.user.create({
    data: {
      email: 'test@propcontrol.local',
      name: 'Demo User'
    }
  })

  // Create a test account
  const account = await prisma.account.create({
    data: {
      login: '12345678',
      name: 'Demo Account',
      broker: 'Demo Broker',
      server: 'Demo Server',
      currency: 'USD',
      timezone: 'Europe/Rome',
      userId: user.id
    }
  })

  console.log('✅ Database inizializzato con successo!')
  console.log('User:', user.email)
  console.log('Account:', account.login)
  console.log('')
  console.log('Ora puoi testare il sistema con:')
  console.log('1. Avvia il server: npm run dev')
  console.log('2. Apri http://localhost:3000')
  console.log('3. Configura il MT5 EA con il tuo URL locale')
}

main()
  .catch((e) => {
    console.error('❌ Errore durante l\'inizializzazione:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })