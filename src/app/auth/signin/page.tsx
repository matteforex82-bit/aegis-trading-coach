'use client'

import { useState, Suspense, Component, ErrorInfo, ReactNode } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Chrome, User, AlertTriangle } from 'lucide-react'

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SignIn Error Boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
          <Card className="max-w-md w-full bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Errore di Caricamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-red-400">
                  Si è verificato un errore durante il caricamento della pagina di accesso.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Ricarica Pagina
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

function SignInForm() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCredentialsLoading(true)
    setMessage('')

    try {
      const result = await signIn('credentials', {
        email: username, // Use username as email for admin login
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setMessage('Credenziali non valide. Riprova.')
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (error) {
      setMessage('Si è verificato un errore. Riprova.')
    } finally {
      setIsCredentialsLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setMessage('Errore durante l\'invio dell\'email. Riprova.')
      } else {
        setMessage('Ti abbiamo inviato un link di accesso via email!')
      }
    } catch (error) {
      setMessage('Si è verificato un errore. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch (error) {
      console.error('Google sign in error:', error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Prop Control</h1>
          <p className="text-slate-400">Accedi al tuo dashboard</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Accedi</CardTitle>
            <CardDescription className="text-center text-slate-400">
              Scegli il tuo metodo di accesso preferito
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-red-400">
                  {error === 'OAuthSignin' && 'Errore durante l\'accesso con Google'}
                  {error === 'OAuthCallback' && 'Errore di callback OAuth'}
                  {error === 'OAuthCreateAccount' && 'Impossibile creare l\'account'}
                  {error === 'EmailCreateAccount' && 'Impossibile creare l\'account con questa email'}
                  {error === 'Callback' && 'Errore di callback'}
                  {error === 'OAuthAccountNotLinked' && 'Account già esistente con email diversa'}
                  {error === 'EmailSignin' && 'Impossibile inviare l\'email'}
                  {error === 'CredentialsSignin' && 'Credenziali non valide'}
                  {error === 'SessionRequired' && 'Accesso richiesto'}
                  {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'OAuthAccountNotLinked', 'EmailSignin', 'CredentialsSignin', 'SessionRequired'].includes(error) && 'Si è verificato un errore'}
                </AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <AlertDescription className="text-green-400">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">Oppure</span>
              </div>
            </div>

            {/* Email Sign In */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
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
                Invia link di accesso
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

            {/* Credentials Sign In */}
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-200">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Il tuo username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="La tua password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
              <Button
                type="submit"
                disabled={isCredentialsLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isCredentialsLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <User className="mr-2 h-4 w-4" />
                )}
                Accedi con Username
              </Button>
            </form>

            <div className="text-center text-sm text-slate-400">
              Non hai un account?{' '}
              <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 underline">
                Registrati
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

export default function SignInPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="text-white">Caricamento...</div>
        </div>
      }>
        <SignInForm />
      </Suspense>
    </ErrorBoundary>
  )
}