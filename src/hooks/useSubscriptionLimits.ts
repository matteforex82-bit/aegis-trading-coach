import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

export interface SubscriptionLimits {
  maxTradingAccounts: number
  maxUsers: number
  hasAdvancedAnalytics: boolean
  hasCustomRules: boolean
  hasPrioritySupport: boolean
  hasAPIAccess: boolean
  maxDataRetentionDays: number
}

export interface SubscriptionUsage {
  currentTradingAccounts: number
  currentUsers: number
}

export interface SubscriptionStatus {
  plan: string
  status: string
  limits: SubscriptionLimits
  usage: SubscriptionUsage
  canAddTradingAccount: boolean
  canAddUser: boolean
  isActive: boolean
}

const DEFAULT_LIMITS: Record<string, SubscriptionLimits> = {
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

export function useSubscriptionLimits() {
  const { data: session } = useSession()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    fetchSubscriptionStatus()
  }, [session])

  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/subscriptions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status')
      }
      
      const data = await response.json()
      
      // Get limits based on plan
      const plan = data.organization?.subscriptionPlan || 'starter'
      const limits = DEFAULT_LIMITS[plan] || DEFAULT_LIMITS.starter
      
      // Calculate usage
      const usage: SubscriptionUsage = {
        currentTradingAccounts: data.organization?._count?.tradingAccounts || 0,
        currentUsers: data.organization?._count?.users || 0
      }
      
      // Check if user can add more resources
      const canAddTradingAccount = limits.maxTradingAccounts === -1 || 
        usage.currentTradingAccounts < limits.maxTradingAccounts
      
      const canAddUser = limits.maxUsers === -1 || 
        usage.currentUsers < limits.maxUsers
      
      const isActive = data.organization?.subscriptionStatus === 'active'
      
      setSubscriptionStatus({
        plan,
        status: data.organization?.subscriptionStatus || 'none',
        limits,
        usage,
        canAddTradingAccount: isActive && canAddTradingAccount,
        canAddUser: isActive && canAddUser,
        isActive
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const showLimitReachedToast = useCallback((limitType: string, currentUsage?: number, limit?: number) => {
    const messages = {
      tradingAccounts: `Trading account limit reached (${currentUsage}/${limit}). Upgrade your plan to add more accounts.`,
      users: `Team member limit reached (${currentUsage}/${limit}). Upgrade your plan to invite more users.`,
      feature: 'This feature is not available in your current plan. Upgrade to access it.'
    }
    
    toast.error(messages[limitType as keyof typeof messages] || 'Subscription limit reached')
  }, [])

  const checkLimit = useCallback((resource: 'tradingAccounts' | 'users'): { allowed: boolean; message?: string } => {
    if (!subscriptionStatus) {
      return { allowed: false, message: 'Subscription status not loaded' }
    }

    if (!subscriptionStatus.isActive) {
      return { allowed: false, message: 'Subscription not active' }
    }

    const { limits, usage } = subscriptionStatus

    if (resource === 'tradingAccounts') {
      if (limits.maxTradingAccounts === -1) {
        return { allowed: true }
      }
      
      if (usage.currentTradingAccounts >= limits.maxTradingAccounts) {
        return {
          allowed: false,
          message: `Limite raggiunto: ${usage.currentTradingAccounts}/${limits.maxTradingAccounts} account trading. Aggiorna il piano per aggiungerne altri.`
        }
      }
      
      return { allowed: true }
    }

    if (resource === 'users') {
      if (limits.maxUsers === -1) {
        return { allowed: true }
      }
      
      if (usage.currentUsers >= limits.maxUsers) {
        return {
          allowed: false,
          message: `Limite raggiunto: ${usage.currentUsers}/${limits.maxUsers} utenti. Aggiorna il piano per aggiungerne altri.`
        }
      }
      
      return { allowed: true }
    }

    return { allowed: false, message: 'Unknown resource type' }
  }, [subscriptionStatus])

  const checkLimitWithToast = useCallback((resource: 'tradingAccounts' | 'users'): { allowed: boolean; message?: string } => {
    const result = checkLimit(resource)
    
    if (!result.allowed && result.message) {
      const { limits, usage } = subscriptionStatus || { limits: DEFAULT_LIMITS.starter, usage: { currentTradingAccounts: 0, currentUsers: 0 } }
      const currentUsage = resource === 'tradingAccounts' ? usage.currentTradingAccounts : usage.currentUsers
      const limit = resource === 'tradingAccounts' ? limits.maxTradingAccounts : limits.maxUsers
      showLimitReachedToast(resource, currentUsage, limit)
    }
    
    return result
  }, [checkLimit, subscriptionStatus, showLimitReachedToast])

  const hasFeature = (feature: keyof SubscriptionLimits): boolean => {
    if (!subscriptionStatus?.isActive) return false
    
    const featureValue = subscriptionStatus.limits[feature]
    
    // For boolean features
    if (typeof featureValue === 'boolean') {
      return featureValue
    }
    
    // For numeric features (like maxDataRetentionDays)
    if (typeof featureValue === 'number') {
      return featureValue > 0
    }
    
    return false
  }

  const getUsagePercentage = (resource: 'tradingAccounts' | 'users'): number => {
    if (!subscriptionStatus) return 0
    
    const { limits, usage } = subscriptionStatus
    
    if (resource === 'tradingAccounts') {
      if (limits.maxTradingAccounts === -1) return 0 // Unlimited
      return (usage.currentTradingAccounts / limits.maxTradingAccounts) * 100
    }
    
    if (resource === 'users') {
      if (limits.maxUsers === -1) return 0 // Unlimited
      return (usage.currentUsers / limits.maxUsers) * 100
    }
    
    return 0
  }

  const refresh = () => {
    fetchSubscriptionStatus()
  }

  return {
    subscriptionStatus,
    loading,
    error,
    checkLimit,
    checkLimitWithToast,
    hasFeature,
    getUsagePercentage,
    showLimitReachedToast,
    refresh
  }
}

export default useSubscriptionLimits