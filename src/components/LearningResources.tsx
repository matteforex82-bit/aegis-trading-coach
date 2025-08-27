'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Video,
  FileText,
  GraduationCap,
  ExternalLink,
  Clock,
  Star,
  BarChart,
  Brain
} from 'lucide-react'

interface LearningResourcesProps {
  account: any
  stats?: any
}

interface Resource {
  id: string
  title: string
  description: string
  type: 'article' | 'video' | 'course' | 'tool'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  rating: number
  url: string
  tags: string[]
  relevance: number // 0-100 score of how relevant this is to the trader's needs
}

export default function LearningResources({ account, stats }: LearningResourcesProps) {
  const [activeTab, setActiveTab] = useState('recommended')
  
  // Sample learning resources
  // In a real implementation, these would be dynamically generated based on the trader's performance and needs
  const resources: Resource[] = [
    {
      id: 'risk-management-101',
      title: 'Gestione del Rischio: Fondamenti',
      description: 'Impara le basi della gestione del rischio nel trading e come proteggere il tuo capitale.',
      type: 'article',
      difficulty: 'beginner',
      duration: '10 min',
      rating: 4.8,
      url: '#',
      tags: ['risk management', 'basics'],
      relevance: 95
    },
    {
      id: 'technical-analysis-patterns',
      title: 'Pattern di Analisi Tecnica Avanzati',
      description: 'Scopri i pattern di price action più efficaci e come riconoscerli nei grafici.',
      type: 'video',
      difficulty: 'intermediate',
      duration: '25 min',
      rating: 4.6,
      url: '#',
      tags: ['technical analysis', 'patterns'],
      relevance: 85
    },
    {
      id: 'trading-psychology',
      title: 'Psicologia del Trading: Superare le Emozioni',
      description: 'Strategie pratiche per gestire le emozioni durante il trading e mantenere la disciplina.',
      type: 'course',
      difficulty: 'intermediate',
      duration: '2 ore',
      rating: 4.9,
      url: '#',
      tags: ['psychology', 'discipline'],
      relevance: 90
    },
    {
      id: 'position-sizing',
      title: 'Dimensionamento delle Posizioni',
      description: 'Come calcolare la dimensione ottimale delle posizioni per massimizzare i rendimenti e minimizzare i rischi.',
      type: 'article',
      difficulty: 'intermediate',
      duration: '15 min',
      rating: 4.7,
      url: '#',
      tags: ['position sizing', 'risk management'],
      relevance: 88
    },
    {
      id: 'market-analysis',
      title: 'Analisi Multi-Timeframe',
      description: 'Come analizzare i mercati utilizzando diversi timeframe per confermare le tendenze e trovare punti di ingresso ottimali.',
      type: 'video',
      difficulty: 'advanced',
      duration: '40 min',
      rating: 4.5,
      url: '#',
      tags: ['analysis', 'timeframes'],
      relevance: 75
    },
    {
      id: 'trading-journal',
      title: 'Come Tenere un Diario di Trading Efficace',
      description: 'Impara a documentare e analizzare i tuoi trade per migliorare costantemente le tue performance.',
      type: 'tool',
      difficulty: 'beginner',
      duration: '5 min',
      rating: 4.8,
      url: '#',
      tags: ['journal', 'improvement'],
      relevance: 92
    }
  ]
  
  // Filter resources based on active tab
  const filteredResources = () => {
    switch (activeTab) {
      case 'recommended':
        return resources.sort((a, b) => b.relevance - a.relevance).slice(0, 3)
      case 'articles':
        return resources.filter(r => r.type === 'article')
      case 'videos':
        return resources.filter(r => r.type === 'video')
      case 'courses':
        return resources.filter(r => r.type === 'course' || r.type === 'tool')
      default:
        return resources
    }
  }
  
  // Get icon based on resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-5 w-5 text-blue-600" />
      case 'video':
        return <Video className="h-5 w-5 text-red-600" />
      case 'course':
        return <GraduationCap className="h-5 w-5 text-green-600" />
      case 'tool':
        return <BarChart className="h-5 w-5 text-purple-600" />
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />
    }
  }
  
  // Get badge color based on difficulty
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-blue-100 text-blue-800'
      case 'advanced':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200 mb-6">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Risorse di Apprendimento
            </CardTitle>
          </div>
          <Badge className="bg-purple-100 text-purple-800 text-xs">
            AI-Curated
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <Tabs defaultValue="recommended" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="recommended">
              <Brain className="h-4 w-4 mr-1" />
              Consigliati
            </TabsTrigger>
            <TabsTrigger value="articles">
              <FileText className="h-4 w-4 mr-1" />
              Articoli
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Video className="h-4 w-4 mr-1" />
              Video
            </TabsTrigger>
            <TabsTrigger value="courses">
              <GraduationCap className="h-4 w-4 mr-1" />
              Corsi
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {filteredResources().length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">Nessuna risorsa disponibile per questa categoria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResources().map((resource) => (
                  <div 
                    key={resource.id} 
                    className="p-4 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-slate-800">{resource.title}</h3>
                          <Badge className={getDifficultyColor(resource.difficulty)}>
                            {resource.difficulty === 'beginner' ? 'Base' : 
                             resource.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm mt-1 text-gray-600">{resource.description}</p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {resource.duration}
                            </div>
                            <div className="flex items-center text-xs text-amber-500">
                              <Star className="h-3 w-3 mr-1 fill-amber-500" />
                              {resource.rating}
                            </div>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7"
                            onClick={() => window.open(resource.url, '_blank')}
                          >
                            Visualizza
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}