'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// Temporarily disabled Progress due to React 19 compatibility
// import { Progress } from '@/components/ui/progress'
import { 
  Crown, 
  Zap, 
  TrendingUp, 
  Users, 
  Database, 
  ArrowRight,
  Check,
  AlertTriangle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UpgradePromptProps {
  currentPlan: string
  usage: {
    tradingAccounts: number
    users: number
    apiCallsThisMonth: number
  }
  limits: {
    tradingAccounts: number
    users: number
    apiCallsPerMonth: number
  }
  className?: string
}

const PLAN_BENEFITS = {
  professional: {
    name: 'Professional',
    price: 79,
    benefits: [
      'Up to 10 trading accounts',
      'Up to 5 team members',
      'Advanced analytics',
      'Custom rules',
      'API access',
      '90 days data retention'
    ],
    highlight: 'Most Popular'
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    benefits: [
      'Unlimited trading accounts',
      'Unlimited team members',
      'Advanced analytics',
      'Custom rules',
      'API access',
      'Priority support',
      '365 days data retention'
    ],
    highlight: 'Best Value'
  }
}

export function UpgradePrompt({ currentPlan, usage, limits, className }: UpgradePromptProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Calculate usage percentages
  const tradingAccountsUsage = limits.tradingAccounts === -1 ? 0 : (usage.tradingAccounts / limits.tradingAccounts) * 100
  const usersUsage = limits.users === -1 ? 0 : (usage.users / limits.users) * 100
  const apiUsage = limits.apiCallsPerMonth === -1 ? 0 : (usage.apiCallsThisMonth / limits.apiCallsPerMonth) * 100

  // Determine if upgrade is needed
  const needsUpgrade = tradingAccountsUsage >= 80 || usersUsage >= 80 || apiUsage >= 80
  
  // Get recommended plan
  const recommendedPlan = currentPlan === 'starter' ? 'professional' : 'enterprise'
  const planInfo = PLAN_BENEFITS[recommendedPlan as keyof typeof PLAN_BENEFITS]

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      // Navigate to billing page with plan selection
      router.push(`/billing?upgrade=${recommendedPlan}`)
    } catch (error) {
      console.error('Error navigating to billing:', error)
      toast.error('Failed to navigate to billing page')
    } finally {
      setLoading(false)
    }
  }

  if (!needsUpgrade && currentPlan !== 'starter') {
    return null
  }

  return (
    <Card className={`border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">
              {needsUpgrade ? 'Upgrade Recommended' : 'Unlock More Features'}
            </CardTitle>
          </div>
          {planInfo.highlight && (
            <Badge className="bg-blue-600 text-white">
              {planInfo.highlight}
            </Badge>
          )}
        </div>
        <CardDescription className="text-blue-700">
          {needsUpgrade 
            ? 'You\'re approaching your plan limits. Upgrade to continue growing.' 
            : 'Get more trading accounts, team members, and advanced features.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Usage */}
        {needsUpgrade && (
          <div className="space-y-3">
            <h4 className="font-medium text-blue-900">Current Usage</h4>
            
            {tradingAccountsUsage >= 80 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    Trading Accounts
                  </span>
                  <span className="font-medium">
                    {usage.tradingAccounts}/{limits.tradingAccounts === -1 ? '∞' : limits.tradingAccounts}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, tradingAccountsUsage)}%` }}
                  />
                </div>
              </div>
            )}
            
            {usersUsage >= 80 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Team Members
                  </span>
                  <span className="font-medium">
                    {usage.users}/{limits.users === -1 ? '∞' : limits.users}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, usersUsage)}%` }}
                  />
                </div>
              </div>
            )}
            
            {apiUsage >= 80 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    API Calls This Month
                  </span>
                  <span className="font-medium">
                    {usage.apiCallsThisMonth.toLocaleString()}/{limits.apiCallsPerMonth === -1 ? '∞' : limits.apiCallsPerMonth.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, apiUsage)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommended Plan Benefits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-blue-900">
              Upgrade to {planInfo.name}
            </h4>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                ${planInfo.price}
              </div>
              <div className="text-sm text-blue-600">per month</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {planInfo.benefits.slice(0, 4).map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                <span className="text-blue-800">{benefit}</span>
              </div>
            ))}
            {planInfo.benefits.length > 4 && (
              <div className="text-xs text-blue-600">
                +{planInfo.benefits.length - 4} more features
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Button */}
        <Button 
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Zap className="h-4 w-4 mr-2" />
          {loading ? 'Loading...' : `Upgrade to ${planInfo.name}`}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        
        <p className="text-xs text-blue-600 text-center">
          30-day money-back guarantee • Cancel anytime
        </p>
      </CardContent>
    </Card>
  )
}