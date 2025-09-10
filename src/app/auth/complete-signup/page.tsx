'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe'

type SignupData = {
  planId: keyof typeof SUBSCRIPTION_PLANS
  organizationName: string
}

export default function CompleteSignupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupData, setSignupData] = useState<SignupData | null>(null)

  useEffect(() => {
    // Get signup data from sessionStorage
    const storedData = sessionStorage.getItem('signupData')
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as SignupData
        setSignupData(data)
      } catch (error) {
        console.error('Failed to parse signup data:', error)
        router.push('/auth/signup')
      }
    } else {
      router.push('/auth/signup')
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleCreateSubscription = async () => {
    if (!signupData || !session?.user?.email) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: signupData.planId,
          organizationName: signupData.organizationName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      // Clear signup data from sessionStorage
      sessionStorage.removeItem('signupData')

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Subscription creation error:', error)
      setError(error instanceof Error ? error.message : 'Si è verificato un errore')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipForNow = () => {
    // Clear signup data and redirect to dashboard
    sessionStorage.removeItem('signupData')
    router.push('/dashboard')
  }

  if (status === 'loading' || !signupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const plan = SUBSCRIPTION_PLANS[signupData.planId]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Success Message */}
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Benvenuto!</h1>
          <p className="text-slate-400">
            Il tuo account è stato creato con successo.
          </p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Completa la configurazione</CardTitle>
            <CardDescription className="text-center text-slate-400">
              Configura il tuo abbonamento per iniziare
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Plan Summary */}
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Piano selezionato:</span>
                <span className="text-white font-semibold">{plan.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Organizzazione:</span>
                <span className="text-white font-semibold">{signupData.organizationName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Prezzo:</span>
                <span className="text-white font-semibold">€{(plan.price / 100).toFixed(0)}/mese</span>
              </div>
              <div className="pt-2 border-t border-slate-600">
                <p className="text-sm text-slate-400">
                  ✨ <strong>Prova gratuita di 14 giorni</strong> - Nessun addebito fino alla fine del periodo di prova
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleCreateSubscription}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Inizia prova gratuita
              </Button>
              
              <Button
                onClick={handleSkipForNow}
                variant="ghost"
                className="w-full text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
              >
                Salta per ora (accesso limitato)
              </Button>
            </div>

            {/* Features Reminder */}
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Il tuo piano include:</p>
              <div className="text-sm text-slate-300 space-y-1">
                {plan.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                    {feature}
                  </div>
                ))}
                {plan.features.length > 3 && (
                  <p className="text-slate-400">e altro ancora...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-slate-500">
          Puoi cancellare in qualsiasi momento dalle impostazioni del tuo account
        </div>
      </div>
    </div>
  )
}