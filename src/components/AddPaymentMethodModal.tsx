'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface AddPaymentMethodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function PaymentMethodForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    // Crea il Setup Intent quando il componente viene montato
    const createSetupIntent = async () => {
      try {
        const response = await fetch('/api/billing/setup-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          const { clientSecret } = await response.json()
          setClientSecret(clientSecret)
        } else {
          const error = await response.json()
          setError(error.error || 'Failed to initialize payment setup')
        }
      } catch (error) {
        console.error('Error creating setup intent:', error)
        setError('Failed to initialize payment setup')
      }
    }

    createSetupIntent()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setLoading(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('Card element not found')
      setLoading(false)
      return
    }

    // Conferma il Setup Intent
    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        }
      }
    )

    if (stripeError) {
      setError(stripeError.message || 'An error occurred')
      setLoading(false)
      return
    }

    if (setupIntent && setupIntent.status === 'succeeded') {
      toast.success('Payment method added successfully')
      onSuccess()
    } else {
      setError('Failed to add payment method')
    }

    setLoading(false)
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Card Information</label>
        <div className="p-3 border rounded-md">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CreditCard className="h-4 w-4" />
        <span>Your payment information is encrypted and secure</span>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !clientSecret || loading}
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add Payment Method
        </Button>
      </div>
    </form>
  )
}

export function AddPaymentMethodModal({ open, onOpenChange, onSuccess }: AddPaymentMethodModalProps) {
  const handleSuccess = () => {
    onSuccess()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment Method
          </DialogTitle>
          <DialogDescription>
            Add a new payment method to your account. This card will be saved for future payments.
          </DialogDescription>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <PaymentMethodForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </Elements>
      </DialogContent>
    </Dialog>
  )
}