'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  LineChart,
  BarChart,
  PieChart,
  Target,
  Brain,
  Lightbulb,
  ArrowRight
} from 'lucide-react'

interface TradingInsightsProps {
  account: any
  stats?: any
  openTrades?: any[]
  onInsightClick?: (insight: string) => void
}

interface Insight {
  id: string
  title: string
  description: string
  type: 'strength' | 'weakness' | 'opportunity' | 'risk'
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  action?: string
}

export default function TradingInsights({ account, stats, openTrades = [], onInsightClick }: TradingInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [activeTab, setActiveTab] = useState('all')
  
  // Generate insights based on trading data
  useEffect(() => {
    if (!stats) return
    
    const generatedInsights: Insight[] = []
    
    // Win rate insights
    if (stats.winRate < 40) {
      generatedInsights.push({
        id: 'win-rate-low',
        title: 'Win rate sotto la media',
        description: `Il tuo win rate del ${stats.winRate}% è sotto la media. Considera di rivedere la tua strategia di entrata.`,
        type: 'weakness',
        priority: 'high',
        actionable: true,
        action: 'Analizza i miei pattern di trading'
      })
    } else if (stats.winRate > 60) {
      generatedInsights.push({
        id: 'win-rate-high',
        title: 'Win rate eccellente',
        description: `Il tuo win rate del ${stats.winRate}% è superiore alla media. Continua con questa strategia.`,
        type: 'strength',
        priority: 'medium',
        actionable: false
      })
    }
    
    // Risk management insights
    if (stats.avgRiskReward && stats.avgRiskReward < 1) {
      generatedInsights.push({
        id: 'risk-reward-low',
        title: 'Rapporto rischio/rendimento basso',
        description: 'Il tuo rapporto rischio/rendimento medio è inferiore a 1:1. Considera di ottimizzare i tuoi target profit.',
        type: 'weakness',
        priority: 'high',
        actionable: true,
        action: 'Suggerisci stop loss ottimali'
      })
    }
    
    // Open positions insights
    if (openTrades.length > 3) {
      generatedInsights.push({
        id: 'too-many-positions',
        title: 'Troppe posizioni aperte',
        description: `Hai ${openTrades.length} posizioni aperte simultaneamente. Questo potrebbe aumentare il rischio complessivo.`,
        type: 'risk',
        priority: 'medium',
        actionable: true,
        action: 'Valuta il rischio attuale'
      })
    }
    
    // Drawdown insights
    if (stats.maxDrawdown && stats.maxDrawdown > 10) {
      generatedInsights.push({
        id: 'high-drawdown',
        title: 'Drawdown significativo',
        description: `Il tuo drawdown massimo del ${stats.maxDrawdown}% è considerevole. Rivedi la tua gestione del rischio.`,
        type: 'risk',
        priority: 'high',
        actionable: true,
        action: 'Consiglia strategie di miglioramento'
      })
    }
    
    // Market opportunities based on current conditions
    generatedInsights.push({
      id: 'market-opportunity',
      title: 'Opportunità di mercato',
      description: 'Le condizioni di mercato attuali mostrano potenziali opportunità su EURUSD e GOLD.',
      type: 'opportunity',
      priority: 'medium',
      actionable: false
    })
    
    // Set the generated insights
    setInsights(generatedInsights)
  }, [stats, openTrades])
  
  // Filter insights based on active tab
  const filteredInsights = activeTab === 'all' 
    ? insights 
    : insights.filter(insight => insight.type === activeTab)
  
  // Handle insight action click
  const handleActionClick = (action: string) => {
    if (onInsightClick) {
      onInsightClick(action)
    }
  }
  
  // Get color based on insight type
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'weakness':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'opportunity':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'risk':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }
  
  // Get icon based on insight type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'weakness':
        return <TrendingDown className="h-4 w-4 text-amber-600" />
      case 'opportunity':
        return <Lightbulb className="h-4 w-4 text-blue-600" />
      case 'risk':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <LineChart className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200 mb-6">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
              <Brain className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Trading Insights
            </CardTitle>
          </div>
          <Badge className="bg-purple-100 text-purple-800 text-xs">
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-5 mb-2">
            <TabsTrigger value="all">Tutti</TabsTrigger>
            <TabsTrigger value="strength">Punti di forza</TabsTrigger>
            <TabsTrigger value="weakness">Debolezze</TabsTrigger>
            <TabsTrigger value="opportunity">Opportunità</TabsTrigger>
            <TabsTrigger value="risk">Rischi</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {filteredInsights.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">Nessun insight disponibile per questa categoria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInsights.map((insight) => (
              <div 
                key={insight.id} 
                className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start gap-2">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{insight.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          insight.priority === 'high' ? 'border-red-300 text-red-700' :
                          insight.priority === 'medium' ? 'border-amber-300 text-amber-700' :
                          'border-blue-300 text-blue-700'
                        }`}
                      >
                        {insight.priority === 'high' ? 'Alta priorità' :
                         insight.priority === 'medium' ? 'Media priorità' :
                         'Bassa priorità'}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{insight.description}</p>
                    
                    {insight.actionable && insight.action && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 text-xs h-7 px-2"
                        onClick={() => handleActionClick(insight.action!)}
                      >
                        {insight.action}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}