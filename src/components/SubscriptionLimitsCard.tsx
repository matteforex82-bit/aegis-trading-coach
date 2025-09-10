'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'
import { Users, Activity, Crown, Zap, Shield, Database, AlertTriangle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SubscriptionLimitsCardProps {
  showUpgradeButton?: boolean
  compact?: boolean
}

export function SubscriptionLimitsCard({ showUpgradeButton = true, compact = false }: SubscriptionLimitsCardProps) {
  const { subscriptionStatus, loading, error } = useSubscriptionLimits()
  const router = useRouter()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Errore nel caricamento dei limiti dell'abbonamento: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!subscriptionStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nessun abbonamento attivo. Attiva un piano per accedere alle funzionalità.
            </AlertDescription>
          </Alert>
          {showUpgradeButton && (
            <Button 
              onClick={() => router.push('/auth/signup')} 
              className="mt-4 w-full"
            >
              Attiva Abbonamento
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const { plan, status, limits, usage } = subscriptionStatus

  const getPlanIcon = () => {
    switch (plan) {
      case 'starter': return <Zap className="h-4 w-4" />
      case 'professional': return <Shield className="h-4 w-4" />
      case 'enterprise': return <Crown className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const getPlanColor = () => {
    switch (plan) {
      case 'starter': return 'bg-blue-500'
      case 'professional': return 'bg-purple-500'
      case 'enterprise': return 'bg-gold-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'canceled': return 'bg-red-500'
      case 'past_due': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Illimitato' : limit.toString()
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getPlanIcon()}
              <Badge className={getPlanColor()}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </Badge>
              <Badge className={getStatusColor()}>
                {status}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Account Trading</span>
              </div>
              <div className="text-sm font-medium">
                {usage.currentTradingAccounts}/{formatLimit(limits.maxTradingAccounts)}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Utenti</span>
              </div>
              <div className="text-sm font-medium">
                {usage.currentUsers}/{formatLimit(limits.maxUsers)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPlanIcon()}
            <CardTitle>Piano {plan.charAt(0).toUpperCase() + plan.slice(1)}</CardTitle>
          </div>
          <Badge className={getStatusColor()}>
            {status === 'active' ? 'Attivo' : status}
          </Badge>
        </div>
        <CardDescription>
          Utilizzo delle risorse e limiti del tuo piano
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Usage Metrics */}
        <div className="space-y-4">
          {/* Trading Accounts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Account Trading</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usage.currentTradingAccounts}/{formatLimit(limits.maxTradingAccounts)}
              </span>
            </div>
            {limits.maxTradingAccounts !== -1 && (
              <Progress 
                value={(usage.currentTradingAccounts / limits.maxTradingAccounts) * 100} 
                className="h-2"
              />
            )}
          </div>
          
          {/* Users */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Utenti</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usage.currentUsers}/{formatLimit(limits.maxUsers)}
              </span>
            </div>
            {limits.maxUsers !== -1 && (
              <Progress 
                value={(usage.currentUsers / limits.maxUsers) * 100} 
                className="h-2"
              />
            )}
          </div>
        </div>

        {/* Features */}
        <div>
          <h4 className="text-sm font-medium mb-3">Funzionalità Incluse</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              {limits.hasAdvancedAnalytics ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-gray-300" />
              )}
              <span className="text-xs">Analytics Avanzate</span>
            </div>
            
            <div className="flex items-center gap-2">
              {limits.hasCustomRules ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-gray-300" />
              )}
              <span className="text-xs">Regole Personalizzate</span>
            </div>
            
            <div className="flex items-center gap-2">
              {limits.hasPrioritySupport ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-gray-300" />
              )}
              <span className="text-xs">Supporto Prioritario</span>
            </div>
            
            <div className="flex items-center gap-2">
              {limits.hasAPIAccess ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-gray-300" />
              )}
              <span className="text-xs">Accesso API</span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Conservazione dati: {limits.maxDataRetentionDays} giorni
            </span>
          </div>
        </div>

        {/* Warnings */}
        {!subscriptionStatus.canAddTradingAccount && limits.maxTradingAccounts !== -1 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Hai raggiunto il limite di account trading ({limits.maxTradingAccounts}). 
              Aggiorna il piano per aggiungerne altri.
            </AlertDescription>
          </Alert>
        )}
        
        {!subscriptionStatus.canAddUser && limits.maxUsers !== -1 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Hai raggiunto il limite di utenti ({limits.maxUsers}). 
              Aggiorna il piano per aggiungerne altri.
            </AlertDescription>
          </Alert>
        )}

        {/* Upgrade Button */}
        {showUpgradeButton && plan !== 'enterprise' && (
          <Button 
            onClick={() => router.push('/auth/signup')} 
            className="w-full"
            variant="outline"
          >
            Aggiorna Piano
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default SubscriptionLimitsCard