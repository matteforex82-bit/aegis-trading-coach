'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, Chrome, Check, Star } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe'

type PlanKey = keyof typeof SUBSCRIPTION_PLANS

export default function SignUpPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('PROFESSIONAL')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<'plan' | 'details'>('plan')

  const handlePlanSelect = (planKey: PlanKey) => {
    setSelectedPlan(planKey)
    setStep('details')
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationName.trim()) {
      setMessage('Il nome dell\'organizzazione è obbligatorio')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      // Store signup data in sessionStorage for after authentication
      sessionStorage.setItem('signupData', JSON.stringify({
        planId: selectedPlan,
        organizationName: organizationName.trim()
      }))

      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/auth/complete-signup',
      })

      if (result?.error) {
        setMessage('Errore durante l\'invio dell\'email. Riprova.')
      } else {
        setMessage('Ti abbiamo inviato un link per completare la registrazione!')
      }
    } catch (error) {
      setMessage('Si è verificato un errore. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (!organizationName.trim()) {
      setMessage('Il nome dell\'organizzazione è obbligatorio')
      return
    }

    setIsGoogleLoading(true)
    
    // Store signup data for after authentication
    sessionStorage.setItem('signupData', JSON.stringify({
      planId: selectedPlan,
      organizationName: organizationName.trim()
    }))

    try {
      await signIn('google', { callbackUrl: '/auth/complete-signup' })
    } catch (error) {
      console.error('Google sign up error:', error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  if (step === 'plan') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-6xl mx-auto py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Scegli il tuo piano</h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Inizia la tua prova gratuita di 14 giorni. Nessuna carta di credito richiesta.
            </p>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
              const planKey = key as PlanKey
              const isPopular = planKey === 'PROFESSIONAL'
              
              return (
                <Card 
                  key={key} 
                  className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isPopular 
                      ? 'bg-gradient-to-b from-blue-900/50 to-slate-800/50 border-blue-500/50 ring-2 ring-blue-500/20' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  } backdrop-blur-sm`}
                  onClick={() => handlePlanSelect(planKey)}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-3 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        Più popolare
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">€{(plan.price / 100).toFixed(0)}</span>
                      <span className="text-slate-400">/mese</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-slate-300">
                          <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full mt-6 ${
                        isPopular 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                      onClick={() => handlePlanSelect(planKey)}
                    >
                      Scegli {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="text-center">
            <p className="text-slate-400 mb-4">
              Hai già un account?{' '}
              <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 underline">
                Accedi
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  const plan = SUBSCRIPTION_PLANS[selectedPlan]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Crea il tuo account</h1>
          <p className="text-slate-400">Piano selezionato: <span className="text-blue-400 font-semibold">{plan.name}</span></p>
          <Button 
            variant="ghost" 
            onClick={() => setStep('plan')}
            className="text-sm text-slate-400 hover:text-slate-300 mt-2"
          >
            Cambia piano
          </Button>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Registrati</CardTitle>
            <CardDescription className="text-center text-slate-400">
              Completa la registrazione per iniziare
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert className={message.includes('errore') || message.includes('Errore') ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}>
                <AlertDescription className={message.includes('errore') || message.includes('Errore') ? 'text-red-400' : 'text-green-400'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName" className="text-slate-200">Nome Organizzazione *</Label>
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="La mia azienda"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Continua con Email
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">Oppure</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
              variant="outline"
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continua con Google
            </Button>

            <div className="text-center text-sm text-slate-400">
              Hai già un account?{' '}
              <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 underline">
                Accedi
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-slate-500">
          Continuando, accetti i nostri{' '}
          <Link href="/terms" className="underline hover:text-slate-400">
            Termini di Servizio
          </Link>{' '}
          e la{' '}
          <Link href="/privacy" className="underline hover:text-slate-400">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}