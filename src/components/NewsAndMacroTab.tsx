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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Settimanale
              </TabsTrigger>
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Giornaliero
              </TabsTrigger>
              <TabsTrigger value="high-priority" className="flex items-center gap-2">
                <span className="text-red-500">⭐⭐⭐</span>
                Alta Priorità
              </TabsTrigger>
              <TabsTrigger value="weekly-high-priority" className="flex items-center gap-2">
                <span className="text-orange-500">📅⭐</span>
                Settimana VIP
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
            
            <TabsContent value="high-priority" className="mt-6">
              <div className="w-full overflow-hidden rounded-lg border bg-background">
                <div className="p-4 bg-red-50 border-b border-red-200">
                  <div className="flex items-center gap-2 text-red-700">
                    <span className="text-lg">⭐⭐⭐</span>
                    <span className="font-semibold">Eventi ad Alta Priorità - Oggi</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    Mostra solo gli eventi economici di oggi con il massimo impatto sui mercati
                  </p>
                </div>
                <iframe 
                  src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=25,32,6,37,22,17,35,4,39,14,48,10,43,21,38,36,26,5,110,12,72&calType=day&timeZone=16&lang=9&importance=3" 
                  width="100%" 
                  height="450" 
                  frameBorder="0" 
                  allowTransparency={true} 
                  marginWidth="0" 
                  marginHeight="0"
                  className="w-full"
                  title="Eventi Economici ad Alta Priorità - Giornaliero"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="weekly-high-priority" className="mt-6">
              <div className="w-full overflow-hidden rounded-lg border bg-background">
                <div className="p-4 bg-orange-50 border-b border-orange-200">
                  <div className="flex items-center gap-2 text-orange-700">
                    <span className="text-lg">📅⭐</span>
                    <span className="font-semibold">Eventi VIP - Settimana</span>
                  </div>
                  <p className="text-sm text-orange-600 mt-1">
                    Mostra gli eventi economici settimanali con il massimo impatto sui mercati
                  </p>
                </div>
                <iframe 
                  src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=25,32,6,37,22,17,35,4,39,14,48,10,43,21,38,36,26,5,110,12,72&calType=week&timeZone=16&lang=9&importance=3" 
                  width="100%" 
                  height="450" 
                  frameBorder="0" 
                  allowTransparency={true} 
                  marginWidth="0" 
                  marginHeight="0"
                  className="w-full"
                  title="Eventi Economici VIP - Settimanale"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}