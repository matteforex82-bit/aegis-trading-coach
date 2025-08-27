'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  PieChart,
  LineChart,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Brain
} from 'lucide-react'

interface TradingPerformanceMetricsProps {
  account: any
  stats?: any
}

export default function TradingPerformanceMetrics({ account, stats }: TradingPerformanceMetricsProps) {
  const [activeTab, setActiveTab] = useState('performance')
  
  // Calculate performance score (0-100)
  const performanceScore = stats?.winRate ? Math.min(Math.round(stats.winRate * 1.5), 100) : 65
  
  // Calculate risk score (0-100)
  // Lower is better for risk (less risky)
  const riskScore = stats?.maxDrawdown 
    ? Math.min(Math.round(100 - stats.maxDrawdown * 2), 100) 
    : 75
  
  // Calculate discipline score (0-100)
  const disciplineScore = 80 // Placeholder, would be calculated based on adherence to trading plan
  
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }
  
  // Get progress color based on score
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600'
    if (score >= 60) return 'bg-blue-600'
    if (score >= 40) return 'bg-amber-600'
    return 'bg-red-600'
  }

  return (
    <Card className="border-2 border-gradient-to-r from-blue-200 to-green-200 mb-6">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Trading Performance
            </CardTitle>
          </div>
          <Badge className="bg-green-100 text-green-800 text-xs">
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <Tabs defaultValue="performance" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-1" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="risk">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Rischio
            </TabsTrigger>
            <TabsTrigger value="discipline">
              <Target className="h-4 w-4 mr-1" />
              Disciplina
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Performance Score</h3>
                <p className="text-xs text-gray-500">Basato su win rate e profitto</p>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}/100
              </div>
            </div>
            
            <Progress value={performanceScore} className="h-2" indicatorClassName={getProgressColor(performanceScore)} />
            
            <div className="mt-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <LineChart className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">Win Rate</span>
                  </div>
                  <span className="text-sm font-medium">{stats?.winRate || 0}%</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <PieChart className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">Profitto Medio</span>
                  </div>
                  <span className="text-sm font-medium">{stats?.avgProfit || 0}%</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-purple-600 mr-2" />
                    <span className="text-sm">Crescita Mensile</span>
                  </div>
                  <span className="text-sm font-medium">{stats?.monthlyGrowth || 0}%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start">
                <Brain className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Suggerimento AI</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    {performanceScore >= 80 
                      ? "La tua performance è eccellente. Continua a seguire la tua strategia attuale."
                      : performanceScore >= 60
                      ? "Buona performance. Considera di ottimizzare il tuo win rate aumentando la dimensione dei profitti."
                      : "La tua performance può migliorare. Rivedi la tua strategia di entrata e uscita dal mercato."}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="risk" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Risk Score</h3>
                <p className="text-xs text-gray-500">Basato su drawdown e gestione del rischio</p>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(riskScore)}`}>
                {riskScore}/100
              </div>
            </div>
            
            <Progress value={riskScore} className="h-2" indicatorClassName={getProgressColor(riskScore)} />
            
            <div className="mt-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm">Max Drawdown</span>
                  </div>
                  <span className="text-sm font-medium">{stats?.maxDrawdown || 0}%</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-amber-600 mr-2" />
                    <span className="text-sm">Risk/Reward Ratio</span>
                  </div>
                  <span className="text-sm font-medium">1:{stats?.avgRiskReward || 0}</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">Rischio per Trade</span>
                  </div>
                  <span className="text-sm font-medium">{stats?.riskPerTrade || 0}%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start">
                <Brain className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Suggerimento AI</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    {riskScore >= 80 
                      ? "Eccellente gestione del rischio. Mantieni questo approccio disciplinato."
                      : riskScore >= 60
                      ? "Buona gestione del rischio. Considera di ridurre leggermente il drawdown massimo."
                      : "La tua gestione del rischio necessita attenzione. Riduci l'esposizione per trade."}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="discipline" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Discipline Score</h3>
                <p className="text-xs text-gray-500">Basato sull'aderenza al piano di trading</p>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(disciplineScore)}`}>
                {disciplineScore}/100
              </div>
            </div>
            
            <Progress value={disciplineScore} className="h-2" indicatorClassName={getProgressColor(disciplineScore)} />
            
            <div className="mt-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">Aderenza alle Regole</span>
                  </div>
                  <span className="text-sm font-medium">85%</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">Consistenza</span>
                  </div>
                  <span className="text-sm font-medium">78%</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <LineChart className="h-4 w-4 text-purple-600 mr-2" />
                    <span className="text-sm">Gestione Emotiva</span>
                  </div>
                  <span className="text-sm font-medium">72%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start">
                <Brain className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Suggerimento AI</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    {disciplineScore >= 80 
                      ? "Ottima disciplina di trading. Continua a seguire il tuo piano con costanza."
                      : disciplineScore >= 60
                      ? "Buona disciplina. Lavora sulla consistenza nell'applicare le tue regole di trading."
                      : "La tua disciplina può migliorare. Crea un diario di trading per monitorare l'aderenza al piano."}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}