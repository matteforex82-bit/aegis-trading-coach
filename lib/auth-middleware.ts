import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'

/**
 * Middleware per verificare se l'utente è un amministratore
 */
export async function requireAdmin(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (!token) {
    return NextResponse.json(
      { error: 'Non autenticato' },
      { status: 401 }
    )
  }
  
  if (token.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: 'Accesso negato. Sono richiesti privilegi di amministratore.' },
      { status: 403 }
    )
  }
  
  return null // Autorizzazione concessa
}

/**
 * Middleware per verificare se l'utente è autenticato
 */
export async function requireAuth(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (!token) {
    return NextResponse.json(
      { error: 'Non autenticato' },
      { status: 401 }
    )
  }
  
  return null // Autorizzazione concessa
}

/**
 * Utility per verificare se un utente è admin
 */
export function isAdmin(userRole: string | UserRole): boolean {
  return userRole === UserRole.ADMIN
}

/**
 * Utility per verificare se un utente può accedere a una risorsa
 * Gli admin possono accedere a tutto, gli utenti solo alle proprie risorse
 */
export function canAccessResource(
  userRole: string | UserRole,
  userId: string,
  resourceUserId?: string
): boolean {
  // Gli admin possono accedere a tutto
  if (userRole === UserRole.ADMIN) {
    return true
  }
  
  // Gli utenti possono accedere solo alle proprie risorse
  return userId === resourceUserId
}

/**
 * Utility per bypassare le limitazioni per gli admin
 */
export function shouldBypassLimits(userRole: string | UserRole): boolean {
  return userRole === UserRole.ADMIN
}