'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

interface TradingGoalsProps {
  account: any
  stats?: any
}

interface Goal {
  id: string
  title: string
  description: string
  target: number
  current: number
  unit: string
  deadline: Date | null
  completed: boolean
  category: 'performance' | 'learning' | 'discipline'
}

export default function TradingGoals({ account, stats }: TradingGoalsProps) {
  // Sample goals
  // In a real implementation, these would be stored in a database and updated based on user actions
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 'goal-1',
      title: 'Aumentare win rate',
      description: 'Raggiungere un win rate del 60% nei prossimi 30 giorni',
      target: 60,
      current: stats?.winRate || 45,
      unit: '%',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      completed: false,
      category: 'performance'
    },
    {
      id: 'goal-2',
      title: 'Ridurre drawdown massimo',
      description: 'Mantenere il drawdown massimo sotto il 10%',
      target: 10,
      current: stats?.maxDrawdown || 15,
      unit: '%',
      deadline: null, // Ongoing goal
      completed: false,
      category: 'risk'
    },
    {
      id: 'goal-3',
      title: 'Completare corso di analisi tecnica',
      description: 'Finire il corso avanzato di analisi tecnica',
      target: 100,
      current: 65,
      unit: '%',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      completed: false,
      category: 'learning'
    },
    {
      id: 'goal-4',
      title: 'Mantenere diario di trading',
      description: 'Registrare tutti i trade con analisi pre e post',
      target: 50,
      current: 42,
      unit: 'trade',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      completed: false,
      category: 'discipline'
    }
  ])
  
  // Calculate progress percentage
  const calculateProgress = (goal: Goal) => {
    if (goal.completed) return 100
    
    // For goals where lower is better (like drawdown)
    if (goal.category === 'risk' && goal.current > goal.target) {
      return Math.max(0, Math.min(100, 100 - ((goal.current - goal.target) / goal.target) * 100))
    }
    
    return Math.max(0, Math.min(100, (goal.current / goal.target) * 100))
  }
  
  // Format deadline
  const formatDeadline = (deadline: Date | null) => {
    if (!deadline) return 'Continuo'
    
    const now = new Date()
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Scaduto'
    if (diffDays === 0) return 'Oggi'
    if (diffDays === 1) return 'Domani'
    if (diffDays < 30) return `${diffDays} giorni`
    
    const diffMonths = Math.floor(diffDays / 30)
    return `${diffMonths} ${diffMonths === 1 ? 'mese' : 'mesi'}`
  }
  
  // Get progress color based on progress percentage
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600'
    if (progress >= 50) return 'bg-blue-600'
    if (progress >= 25) return 'bg-amber-600'
    return 'bg-red-600'
  }
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'learning':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'discipline':
        return <Target className="h-4 w-4 text-purple-600" />
      case 'risk':
        return <Clock className="h-4 w-4 text-amber-600" />
      default:
        return <Target className="h-4 w-4 text-gray-600" />
    }
  }
  
  // Mark goal as completed
  const completeGoal = (goalId: string) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? { ...goal, completed: true } : goal
      )
    )
  }

  return (
    <Card className="border-2 border-gradient-to-r from-green-200 to-teal-200 mb-6">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg text-white">
              <Target className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Obiettivi di Trading
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Plus className="h-3.5 w-3.5" />
            Nuovo Obiettivo
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {goals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">Nessun obiettivo impostato. Crea il tuo primo obiettivo!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = calculateProgress(goal)
              
              return (
                <div 
                  key={goal.id} 
                  className={`p-4 rounded-lg border ${goal.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getCategoryIcon(goal.category)}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                          {goal.title}
                          {goal.completed && (
                            <Badge className="bg-green-100 text-green-800">Completato</Badge>
                          )}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">{goal.description}</p>
                        
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <div>
                              Progresso: <span className="font-medium">{goal.current}</span>/{goal.target} {goal.unit}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDeadline(goal.deadline)}
                            </div>
                          </div>
                          <Progress 
                            value={progress} 
                            className="h-1.5" 
                            indicatorClassName={getProgressColor(progress)} 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {!goal.completed && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => completeGoal(goal.id)}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}