import Stripe from 'stripe'

// Server-side Stripe instance - only initialize on server
let _stripe: Stripe | null = null

export const getServerStripe = () => {
  if (typeof window !== 'undefined') {
    throw new Error('getServerStripe should only be called on the server side')
  }

  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('⚠️ STRIPE_SECRET_KEY is not set - Stripe features will be disabled')
      return null
    }

    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  }

  return _stripe
}

// Legacy export for backward compatibility
// Note: Returns null if Stripe is not configured (allows build to succeed)
export const stripe = typeof window === 'undefined' ? (process.env.STRIPE_SECRET_KEY ? getServerStripe() : null) : null

// Stripe client-side
export const getStripe = async () => {
  if (typeof window === 'undefined') return null

  const { loadStripe } = await import('@stripe/stripe-js')

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn('⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set - Stripe features will be disabled')
    return null
  }

  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  STARTER: {
    name: 'Starter',
    description: 'Perfetto per trader individuali',
    price: 2900, // €29.00 in cents
    currency: 'eur',
    interval: 'month',
    maxAccounts: 3,
    maxUsers: 1,
    features: [
      'Fino a 3 account trading',
      'Dashboard completa',
      'Analisi delle performance',
      'Supporto email',
    ],
  },
  PROFESSIONAL: {
    name: 'Professional',
    description: 'Per trader professionali e piccoli team',
    price: 7900, // €79.00 in cents
    currency: 'eur',
    interval: 'month',
    maxAccounts: 10,
    maxUsers: 3,
    features: [
      'Fino a 10 account trading',
      'Fino a 3 utenti',
      'Dashboard avanzata',
      'Analisi dettagliate',
      'API access',
      'Supporto prioritario',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Per aziende e prop firm',
    price: 19900, // €199.00 in cents
    currency: 'eur',
    interval: 'month',
    maxAccounts: -1, // Unlimited
    maxUsers: -1, // Unlimited
    features: [
      'Account illimitati',
      'Utenti illimitati',
      'Dashboard personalizzata',
      'Analisi avanzate',
      'API completa',
      'White-label option',
      'Supporto dedicato',
    ],
  },
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS