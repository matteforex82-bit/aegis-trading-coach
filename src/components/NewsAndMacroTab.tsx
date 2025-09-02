'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Calendar, Clock } from 'lucide-react'

interface NewsAndMacroTabProps {
  accountId?: string
}

export function NewsAndMacroTab({ accountId }: NewsAndMacroTabProps) {
  const [lastUpdate] = useState<Date>(new Date())

  return (
    <div className="space-y-6">
      {/* Webhook Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-xl">NEWS & MACRO</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Ultimo aggiornamento: {lastUpdate.toLocaleTimeString('it-IT')}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="w-full overflow-hidden rounded-lg">
                <iframe 
                  src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=25,32,6,37,22,17,35,4,39,14,48,10,43,21,38,36,26,5,110,12,72&calType=week&timeZone=16&lang=9" 
                  width="100%" 
                  height="467" 
                  frameBorder="0" 
                  allowTransparency={true} 
                  marginWidth="0" 
                  marginHeight="0"
                  className="w-full"
                />
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-xs text-gray-500">
                  Calendario economico fornito da{' '}
                  <a 
                    href="https://it.investing.com/" 
                    rel="nofollow" 
                    target="_blank" 
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Investing.com Italia
                  </a>
                  {' '}- Il Portale di Trading sul Forex e sui titoli di borsa.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        

      </div>
    </div>
  )
}