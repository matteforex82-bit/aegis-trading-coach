import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
})

// Stripe client-side
export const getStripe = () => {
  if (typeof window === 'undefined') return null
  
  const { loadStripe } = require('@stripe/stripe-js')
  
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
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