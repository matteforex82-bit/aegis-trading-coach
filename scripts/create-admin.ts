import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🚀 Creazione utente amministratore...')
    
    // Parametri per l'admin (puoi modificarli)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dashboard.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'
    const adminName = process.env.ADMIN_NAME || 'Administrator'
    
    // Verifica se l'admin esiste già
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (existingAdmin) {
      console.log('⚠️  Un utente con questa email esiste già:', adminEmail)
      
      // Se esiste ma non è admin, lo promuoviamo
      if (existingAdmin.role !== UserRole.ADMIN) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: UserRole.ADMIN }
        })
        console.log('✅ Utente promosso ad amministratore!')
      } else {
        console.log('✅ L\'utente è già un amministratore')
      }
      return
    }
    
    // Hash della password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    // Crea l'utente admin
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: UserRole.ADMIN
      }
    })
    
    console.log('✅ Utente amministratore creato con successo!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Password:', adminPassword)
    console.log('👤 ID:', adminUser.id)
    console.log('')
    console.log('⚠️  IMPORTANTE: Cambia la password dopo il primo accesso!')
    console.log('🔐 L\'amministratore ha accesso completo a tutte le risorse senza limitazioni.')
    
  } catch (error) {
    console.error('❌ Errore durante la creazione dell\'amministratore:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui lo script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('🎉 Script completato!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script fallito:', error)
      process.exit(1)
    })
}

export { createAdminUser }