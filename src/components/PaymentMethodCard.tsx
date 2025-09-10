'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Shield, 
  Calendar,
  MoreVertical,
  Check
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface PaymentMethod {
  id: string
  type: 'card'
  card: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

interface PaymentMethodCardProps {
  paymentMethods: PaymentMethod[]
  onAddPaymentMethod: () => void
  onDeletePaymentMethod: (id: string) => void
  onSetDefaultPaymentMethod: (id: string) => void
  loading?: boolean
}

const CARD_BRANDS: Record<string, { name: string; color: string }> = {
  visa: { name: 'Visa', color: 'bg-blue-600' },
  mastercard: { name: 'Mastercard', color: 'bg-red-600' },
  amex: { name: 'American Express', color: 'bg-green-600' },
  discover: { name: 'Discover', color: 'bg-orange-600' },
  diners: { name: 'Diners Club', color: 'bg-purple-600' },
  jcb: { name: 'JCB', color: 'bg-indigo-600' },
  unionpay: { name: 'UnionPay', color: 'bg-red-700' },
  unknown: { name: 'Card', color: 'bg-gray-600' }
}

export function PaymentMethodCard({ 
  paymentMethods, 
  onAddPaymentMethod, 
  onDeletePaymentMethod, 
  onSetDefaultPaymentMethod,
  loading = false 
}: PaymentMethodCardProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return
    }

    setDeletingId(id)
    try {
      await onDeletePaymentMethod(id)
      toast.success('Payment method deleted successfully')
    } catch (error) {
      toast.error('Failed to delete payment method')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id)
    try {
      await onSetDefaultPaymentMethod(id)
      toast.success('Default payment method updated')
    } catch (error) {
      toast.error('Failed to update default payment method')
    } finally {
      setSettingDefaultId(null)
    }
  }

  const getBrandInfo = (brand: string) => {
    return CARD_BRANDS[brand.toLowerCase()] || CARD_BRANDS.unknown
  }

  const formatExpiry = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Manage your payment methods and billing information
            </CardDescription>
          </div>
          <Button onClick={onAddPaymentMethod} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-12 bg-gray-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No payment methods added</p>
            <Button onClick={onAddPaymentMethod} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Card
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const brandInfo = getBrandInfo(method.card.brand)
              const isDeleting = deletingId === method.id
              const isSettingDefault = settingDefaultId === method.id
              
              return (
                <div 
                  key={method.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    method.isDefault ? 'border-blue-200 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Card Brand Icon */}
                    <div className={`${brandInfo.color} text-white px-2 py-1 rounded text-xs font-medium min-w-[48px] text-center`}>
                      {method.card.brand.toUpperCase()}
                    </div>
                    
                    {/* Card Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {brandInfo.name} •••• {method.card.last4}
                        </span>
                        {method.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>Expires {formatExpiry(method.card.expMonth, method.card.expYear)}</span>
                        <Shield className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Verified</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={isDeleting || isSettingDefault}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!method.isDefault && (
                        <DropdownMenuItem 
                          onClick={() => handleSetDefault(method.id)}
                          disabled={isSettingDefault}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {isSettingDefault ? 'Setting as default...' : 'Set as default'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDelete(method.id)}
                        disabled={isDeleting || (method.isDefault && paymentMethods.length === 1)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
        
        {paymentMethods.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Your payment information is encrypted and secure</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}