'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, TrendingUp, Globe } from 'lucide-react'

interface NewsAndMacroTabProps {
  accountId?: string
}

export function NewsAndMacroTab({ accountId }: NewsAndMacroTabProps) {
  const [lastUpdate] = useState<Date>(new Date())

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl">NEWS & MACRO</CardTitle>
            </div>
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Ultimo aggiornamento: {lastUpdate.toLocaleTimeString('it-IT')}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendario Settimanale
              </TabsTrigger>
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Eventi Giornalieri
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="weekly" className="mt-6">
              <div className="w-full overflow-hidden rounded-lg border bg-background">
                <iframe 
                  src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=25,32,6,37,22,17,35,4,39,14,48,10,43,21,38,36,26,5,110,12,72&calType=week&timeZone=16&lang=9" 
                  width="100%" 
                  height="500" 
                  frameBorder="0" 
                  allowTransparency={true} 
                  marginWidth="0" 
                  marginHeight="0"
                  className="w-full"
                  title="Calendario Economico Settimanale"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="daily" className="mt-6">
              <div className="w-full overflow-hidden rounded-lg border bg-background">
                <iframe 
                  src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=25,32,6,37,22,17,35,4,39,14,48,10,43,21,38,36,26,5,110,12,72&calType=day&timeZone=16&lang=9" 
                  width="100%" 
                  height="500" 
                  frameBorder="0" 
                  allowTransparency={true} 
                  marginWidth="0" 
                  marginHeight="0"
                  className="w-full"
                  title="Calendario Economico Giornaliero"
                />
              </div>
            </TabsContent>
            
            <div className="mt-6 text-center">
              <div className="text-xs text-muted-foreground">
                Calendario economico fornito da{' '}
                <a 
                  href="https://it.investing.com/" 
                  rel="nofollow" 
                  target="_blank" 
                  className="text-primary font-semibold hover:underline transition-colors"
                >
                  Investing.com Italia
                </a>
                {' '}- Il Portale di Trading sul Forex e sui titoli di borsa.
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}