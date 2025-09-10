'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Crown, Zap, Users, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SubscriptionLimitModalProps {
  isOpen: boolean
  onClose: () => void
  limitType: 'tradingAccounts' | 'users' | 'feature'
  currentUsage?: number
  limit?: number
  plan?: string
  featureName?: string
}

export function SubscriptionLimitModal({
  isOpen,
  onClose,
  limitType,
  currentUsage,
  limit,
  plan = 'starter',
  featureName
}: SubscriptionLimitModalProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const getIcon = () => {
    switch (limitType) {
      case 'tradingAccounts':
        return <TrendingUp className="h-12 w-12 text-blue-500" />
      case 'users':
        return <Users className="h-12 w-12 text-green-500" />
      case 'feature':
        return <Crown className="h-12 w-12 text-purple-500" />
      default:
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />
    }
  }

  const getTitle = () => {
    switch (limitType) {
      case 'tradingAccounts':
        return 'Trading Account Limit Reached'
      case 'users':
        return 'Team Member Limit Reached'
      case 'feature':
        return `${featureName} Not Available`
      default:
        return 'Subscription Limit Reached'
    }
  }

  const getDescription = () => {
    switch (limitType) {
      case 'tradingAccounts':
        return `You've reached the maximum number of trading accounts (${currentUsage}/${limit}) allowed in your ${plan} plan. Upgrade to add more accounts.`
      case 'users':
        return `You've reached the maximum number of team members (${currentUsage}/${limit}) allowed in your ${plan} plan. Upgrade to invite more users.`
      case 'feature':
        return `${featureName} is not available in your ${plan} plan. Upgrade to access this feature.`
      default:
        return `You've reached a limit in your ${plan} plan. Please upgrade to continue.`
    }
  }

  const getPlanRecommendation = () => {
    if (plan === 'starter') {
      return {
        recommended: 'Professional',
        benefits: ['Up to 10 trading accounts', 'Up to 5 team members', 'Advanced analytics', 'Custom rules', 'API access']
      }
    } else if (plan === 'professional') {
      return {
        recommended: 'Enterprise',
        benefits: ['Unlimited trading accounts', 'Unlimited team members', 'Priority support', 'Custom integrations', 'Dedicated account manager']
      }
    }
    return {
      recommended: 'Professional',
      benefits: ['More resources', 'Advanced features', 'Better support']
    }
  }

  const recommendation = getPlanRecommendation()

  const handleUpgrade = () => {
    onClose()
    router.push('/billing')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-gray-100 rounded-full">
              {getIcon()}
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {getTitle()}
              </DialogTitle>
              <DialogDescription className="mt-2 text-gray-600">
                {getDescription()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Plan */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Current Plan</span>
            <Badge variant="outline" className="capitalize">
              {plan}
            </Badge>
          </div>

          {/* Recommended Plan */}
          <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-900">Recommended</span>
              <Badge className="bg-blue-600 text-white">
                <Crown className="h-3 w-3 mr-1" />
                {recommendation.recommended}
              </Badge>
            </div>
            <ul className="space-y-1">
              {recommendation.benefits.map((benefit, index) => (
                <li key={index} className="text-xs text-blue-800 flex items-center">
                  <div className="w-1 h-1 bg-blue-600 rounded-full mr-2" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            <Zap className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}