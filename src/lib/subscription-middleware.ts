import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export interface SubscriptionLimits {
  maxTradingAccounts: number
  maxUsers: number
  hasAdvancedAnalytics: boolean
  hasCustomRules: boolean
  hasPrioritySupport: boolean
  hasAPIAccess: boolean
  maxDataRetentionDays: number
}

const PLAN_LIMITS: Record<string, SubscriptionLimits> = {
  starter: {
    maxTradingAccounts: 3,
    maxUsers: 1,
    hasAdvancedAnalytics: false,
    hasCustomRules: false,
    hasPrioritySupport: false,
    hasAPIAccess: false,
    maxDataRetentionDays: 30
  },
  professional: {
    maxTradingAccounts: 10,
    maxUsers: 5,
    hasAdvancedAnalytics: true,
    hasCustomRules: true,
    hasPrioritySupport: false,
    hasAPIAccess: true,
    maxDataRetentionDays: 90
  },
  enterprise: {
    maxTradingAccounts: -1, // Unlimited
    maxUsers: -1, // Unlimited
    hasAdvancedAnalytics: true,
    hasCustomRules: true,
    hasPrioritySupport: true,
    hasAPIAccess: true,
    maxDataRetentionDays: 365
  }
}

export interface UserWithOrganization {
  id: string
  email: string
  organization: {
    id: string
    subscriptionPlan: string | null
    subscriptionStatus: string | null
    _count: {
      tradingAccounts: number
      users: number
    }
  } | null
}

export async function getUserWithOrganization(email: string): Promise<UserWithOrganization | null> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                tradingAccounts: true,
                users: true
              }
            }
          }
        }
      }
    })
    
    return user
  } catch (error) {
    console.error('Error fetching user with organization:', error)
    return null
  }
}

export function getSubscriptionLimits(plan: string | null): SubscriptionLimits {
  return PLAN_LIMITS[plan || 'starter'] || PLAN_LIMITS.starter
}

export interface LimitCheckResult {
  allowed: boolean
  message?: string
  currentUsage?: number
  limit?: number
}

export function checkTradingAccountLimit(
  user: UserWithOrganization,
  additionalAccounts: number = 1
): LimitCheckResult {
  if (!user.organization) {
    return {
      allowed: false,
      message: 'Nessuna organizzazione associata all\'utente'
    }
  }

  if (user.organization.subscriptionStatus !== 'active') {
    return {
      allowed: false,
      message: 'Abbonamento non attivo'
    }
  }

  const limits = getSubscriptionLimits(user.organization.subscriptionPlan)
  const currentCount = user.organization._count.tradingAccounts
  
  // Unlimited accounts
  if (limits.maxTradingAccounts === -1) {
    return { allowed: true }
  }
  
  const newTotal = currentCount + additionalAccounts
  
  if (newTotal > limits.maxTradingAccounts) {
    return {
      allowed: false,
      message: `Limite account trading raggiunto. Piano attuale: ${currentCount}/${limits.maxTradingAccounts}. Aggiorna il piano per aggiungerne altri.`,
      currentUsage: currentCount,
      limit: limits.maxTradingAccounts
    }
  }
  
  return {
    allowed: true,
    currentUsage: currentCount,
    limit: limits.maxTradingAccounts
  }
}

export function checkUserLimit(
  user: UserWithOrganization,
  additionalUsers: number = 1
): LimitCheckResult {
  if (!user.organization) {
    return {
      allowed: false,
      message: 'Nessuna organizzazione associata all\'utente'
    }
  }

  if (user.organization.subscriptionStatus !== 'active') {
    return {
      allowed: false,
      message: 'Abbonamento non attivo'
    }
  }

  const limits = getSubscriptionLimits(user.organization.subscriptionPlan)
  const currentCount = user.organization._count.users
  
  // Unlimited users
  if (limits.maxUsers === -1) {
    return { allowed: true }
  }
  
  const newTotal = currentCount + additionalUsers
  
  if (newTotal > limits.maxUsers) {
    return {
      allowed: false,
      message: `Limite utenti raggiunto. Piano attuale: ${currentCount}/${limits.maxUsers}. Aggiorna il piano per aggiungerne altri.`,
      currentUsage: currentCount,
      limit: limits.maxUsers
    }
  }
  
  return {
    allowed: true,
    currentUsage: currentCount,
    limit: limits.maxUsers
  }
}

export function checkFeatureAccess(
  user: UserWithOrganization,
  feature: keyof SubscriptionLimits
): LimitCheckResult {
  if (!user.organization) {
    return {
      allowed: false,
      message: 'Nessuna organizzazione associata all\'utente'
    }
  }

  if (user.organization.subscriptionStatus !== 'active') {
    return {
      allowed: false,
      message: 'Abbonamento non attivo'
    }
  }

  const limits = getSubscriptionLimits(user.organization.subscriptionPlan)
  const featureValue = limits[feature]
  
  // For boolean features
  if (typeof featureValue === 'boolean') {
    return {
      allowed: featureValue,
      message: featureValue ? undefined : `Funzionalità non disponibile nel piano ${user.organization.subscriptionPlan || 'starter'}`
    }
  }
  
  // For numeric features
  if (typeof featureValue === 'number') {
    return {
      allowed: featureValue > 0,
      message: featureValue > 0 ? undefined : `Funzionalità non disponibile nel piano ${user.organization.subscriptionPlan || 'starter'}`
    }
  }
  
  return {
    allowed: false,
    message: 'Tipo di funzionalità non riconosciuto'
  }
}

/**
 * Middleware function to check subscription limits before API operations
 */
export async function withSubscriptionCheck(
  req: NextRequest,
  limitType: 'tradingAccounts' | 'users' | keyof SubscriptionLimits,
  additionalCount: number = 1
): Promise<{ user: UserWithOrganization; error?: NextResponse }> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return {
      user: null as any,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  const user = await getUserWithOrganization(session.user.email)
  
  if (!user) {
    return {
      user: null as any,
      error: NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
  }
  
  let limitCheck: LimitCheckResult
  
  switch (limitType) {
    case 'tradingAccounts':
      limitCheck = checkTradingAccountLimit(user, additionalCount)
      break
    case 'users':
      limitCheck = checkUserLimit(user, additionalCount)
      break
    default:
      limitCheck = checkFeatureAccess(user, limitType as keyof SubscriptionLimits)
      break
  }
  
  if (!limitCheck.allowed) {
    return {
      user,
      error: NextResponse.json(
        { 
          error: limitCheck.message || 'Subscription limit exceeded',
          code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
          currentUsage: limitCheck.currentUsage,
          limit: limitCheck.limit
        }, 
        { status: 403 }
      )
    }
  }
  
  return { user }
}

/**
 * Helper function to create subscription limit error responses
 */
export function createLimitErrorResponse(limitCheck: LimitCheckResult): NextResponse {
  return NextResponse.json(
    {
      error: limitCheck.message || 'Subscription limit exceeded',
      code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
      currentUsage: limitCheck.currentUsage,
      limit: limitCheck.limit
    },
    { status: 403 }
  )
}