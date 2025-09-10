'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Users, TrendingUp, Crown, Zap } from 'lucide-react'
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'

interface SubscriptionUsageWidgetProps {
  className?: string
}

export function SubscriptionUsageWidget({ className }: SubscriptionUsageWidgetProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const {
    subscriptionStatus,
    loading,
    error,
    checkLimit,
    getUsagePercentage,
    refreshData
  } = useSubscriptionLimits()

  useEffect(() => {
    if (session?.user) {
      refreshData()
    }
  }, [session, refreshData])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Subscription Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshData} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!subscriptionStatus) {
    return null
  }

  const { limits, usage, plan, status } = subscriptionStatus

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'professional':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'starter':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'canceled':
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const tradingAccountsUsage = getUsagePercentage('tradingAccounts')
  const usersUsage = getUsagePercentage('users')

  const isNearLimit = (percentage: number) => percentage >= 80
  const isAtLimit = (percentage: number) => percentage >= 100

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription Usage
          </div>
          <div className="flex gap-2">
            <Badge className={getPlanColor(plan)}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </Badge>
            <Badge className={getStatusColor(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trading Accounts Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Trading Accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {usage.tradingAccounts} / {limits.maxTradingAccounts === -1 ? '∞' : limits.maxTradingAccounts}
              </span>
              {isAtLimit(tradingAccountsUsage) && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          {limits.maxTradingAccounts !== -1 && (
            <Progress 
              value={tradingAccountsUsage} 
              className={`h-2 ${
                isAtLimit(tradingAccountsUsage) 
                  ? '[&>div]:bg-red-500' 
                  : isNearLimit(tradingAccountsUsage) 
                  ? '[&>div]:bg-yellow-500' 
                  : '[&>div]:bg-blue-500'
              }`}
            />
          )}
        </div>

        {/* Users Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Team Members</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {usage.users} / {limits.maxUsers === -1 ? '∞' : limits.maxUsers}
              </span>
              {isAtLimit(usersUsage) && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          {limits.maxUsers !== -1 && (
            <Progress 
              value={usersUsage} 
              className={`h-2 ${
                isAtLimit(usersUsage) 
                  ? '[&>div]:bg-red-500' 
                  : isNearLimit(usersUsage) 
                  ? '[&>div]:bg-yellow-500' 
                  : '[&>div]:bg-green-500'
              }`}
            />
          )}
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Available Features</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                limits.hasAdvancedAnalytics ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-xs text-gray-600">Advanced Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                limits.hasCustomRules ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-xs text-gray-600">Custom Rules</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                limits.hasAPIAccess ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-xs text-gray-600">API Access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                limits.hasPrioritySupport ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-xs text-gray-600">Priority Support</span>
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        {(isNearLimit(tradingAccountsUsage) || isNearLimit(usersUsage) || plan === 'starter') && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isAtLimit(tradingAccountsUsage) || isAtLimit(usersUsage) 
                    ? 'Limits Reached' 
                    : 'Approaching Limits'
                  }
                </p>
                <p className="text-xs text-gray-600">
                  Upgrade your plan for more resources
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={() => router.push('/billing')}
                className="flex items-center gap-1"
              >
                <Zap className="h-3 w-3" />
                Upgrade
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}