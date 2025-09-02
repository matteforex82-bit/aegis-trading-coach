'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Bot, 
  Send, 
  Image as ImageIcon, 
  User, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Brain,
  TrendingUp,
  Upload,
  X,
  LineChart,
  BarChart,
  Bell,
  BookOpen,
  Lightbulb,
  Target,
  Award,
  Clock,
  Calendar
} from 'lucide-react'


interface Message {
  id: string
  content: string
  sender: 'user' | 'aegis'
  timestamp: Date
  imageUrl?: string
  category?: 'analysis' | 'advice' | 'alert' | 'education' | 'general'
}

interface TradeInsight {
  id: string
  title: string
  description: string
  type: 'strength' | 'weakness' | 'opportunity' | 'threat'
  timestamp: Date
  symbol?: string
}

interface LearningResource {
  id: string
  title: string
  description: string
  category: 'pattern' | 'strategy' | 'psychology' | 'risk'
  completed: boolean
}

interface TradingGoal {
  id: string
  title: string
  description: string
  progress: number
  target: number
  unit: string
  dueDate?: Date
}

interface AegisCoachProps {
  account: any
  stats?: any
  rules?: any
  openTrades?: any[]
}

const WEBHOOK_URL = 'https://n8n-jw98k-u48054.vm.elestio.app/webhook/20fbd8d6-69f9-4b4c-82e9-c0c6497e10a2'

// Image optimization constants
const MAX_WIDTH = 1024
const MAX_HEIGHT = 768  
const IMAGE_QUALITY = 0.8

export default function AegisCoach({ account, stats, rules, openTrades = [] }: AegisCoachProps) {
  // Core chat functionality (from original AEGIS)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [pasteSuccess, setPasteSuccess] = useState(false)
  const [imageInfo, setImageInfo] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // New coach-specific state
  const [activeTab, setActiveTab] = useState('chat')
  const [insights, setInsights] = useState<TradeInsight[]>([])
  const [learningResources, setLearningResources] = useState<LearningResource[]>([])
  const [tradingGoals, setTradingGoals] = useState<TradingGoal[]>([])
  const [dailyTip, setDailyTip] = useState<string>('')
  const [performanceScore, setPerformanceScore] = useState<number>(0)
  const [riskScore, setRiskScore] = useState<number>(0)
  const [disciplineScore, setDisciplineScore] = useState<number>(0)


  // Initialize session ID and load data
  useEffect(() => {
    if (account?.id) {
      const storageKey = `aegis_session_${account.id}`
      let existingSessionId = localStorage.getItem(storageKey)
      
      if (!existingSessionId) {
        // Generate new UUID-like session ID
        existingSessionId = `user_${account.login || 'unknown'}_${Date.now()}`
        localStorage.setItem(storageKey, existingSessionId)
      }
      
      setSessionId(existingSessionId)
      
      // Load previous messages if any
      const storageMessages = localStorage.getItem(`aegis_messages_${account.id}`)
      if (storageMessages) {
        try {
          const parsedMessages = JSON.parse(storageMessages)
          setMessages(parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })))
        } catch (error) {
          console.error('Error loading previous messages:', error)
        }
      } else {
        // Welcome message
        setMessages([{
          id: 'welcome',
          content: `👋 Ciao! Sono AEGIS Coach, il tuo assistente AI avanzato per il trading. Posso aiutarti con analisi approfondite, coaching personalizzato e strategie ottimizzate per il tuo account ${account.login}. Sono qui per aiutarti a migliorare le tue performance di trading. Come posso assisterti oggi?`,
          sender: 'aegis',
          timestamp: new Date(),
          category: 'general'
        }])
      }
      
      // Load insights, learning resources and goals
      loadInsights()
      loadLearningResources()
      loadTradingGoals()
      generateDailyTip()
      calculateScores()

    }
  }, [account?.id, account?.login])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save messages to localStorage
  const saveMessages = (newMessages: Message[]) => {
    if (account?.id) {
      localStorage.setItem(`aegis_messages_${account.id}`, JSON.stringify(newMessages))
    }
  }

  // Generate context data to send with message
  const generateContextData = () => {
    return {
      account: {
        login: account.login,
        broker: account.broker,
        currency: account.currency,
        balance: stats?.netPnL ? (50000 + stats.netPnL) : 50000,
        equity: stats?.netPnL ? (50000 + stats.netPnL + (openTrades.reduce((sum, t) => sum + t.pnlGross, 0))) : 50000,
        dailyPnL: rules?.dailyPnL || 0
      },
      openPositions: openTrades.length,
      openTrades: openTrades.slice(0, 5).map(trade => ({
        symbol: trade.symbol,
        side: trade.side,
        volume: trade.volume,
        pnl: trade.pnlGross,
        openPrice: trade.openPrice
      })),
      performance: {
        totalPnL: stats?.netPnL || 0,
        winRate: stats?.winRate || 0,
        totalTrades: stats?.totalTrades || 0
      },
      // Additional context for coaching
      coachContext: {
        performanceScore,
        riskScore,
        disciplineScore,
        insights: insights.length,
        goals: tradingGoals.map(g => ({ title: g.title, progress: g.progress, target: g.target })),
        marketContext: null
      }
    }
  }

  // Send message to AEGIS
  const sendMessage = async () => {
    if (!inputMessage.trim() && !uploadedImage) return
    
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      imageUrl: uploadedImage || undefined
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    saveMessages(newMessages)
    
    setIsLoading(true)
    setInputMessage('')
    setUploadedImage(null)
    setImageInfo('')

    try {
      // Prepare payload for n8n webhook
      const payload = {
        message: inputMessage,
        sessionId: sessionId,
        imageUrl: uploadedImage || null,
        context: generateContextData(),
        timestamp: new Date().toISOString(),
        requestType: 'coaching' // Signal that this is a coaching request
      }

      console.log('🤖 Sending to AEGIS Coach:', payload)

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      console.log('🤖 AEGIS Coach Response:', result)
      
      // Handle N8N response format: array with output property
      let responseContent = 'Ho ricevuto la tua richiesta, ma c\'è stato un problema nella risposta.'
      let category: Message['category'] = 'general'
      
      if (Array.isArray(result) && result.length > 0 && result[0].output) {
        responseContent = result[0].output
        if (result[0].category) category = result[0].category
      } else if (result.output) {
        responseContent = result.output
        if (result.category) category = result.category
      } else if (result.response) {
        responseContent = result.response
        if (result.category) category = result.category
      } else if (result.message) {
        responseContent = result.message
        if (result.category) category = result.category
      } else if (typeof result === 'string') {
        responseContent = result
      } else {
        // Try to find any text content in the object
        const firstKey = Object.keys(result)[0]
        if (firstKey && typeof result[firstKey] === 'string') {
          responseContent = result[firstKey]
        }
      }
      
      // Check if response contains insights or goals
      if (result.insights) {
        processNewInsights(result.insights)
      }
      
      if (result.goals) {
        processNewGoals(result.goals)
      }
      
      if (result.learningResources) {
        processNewLearningResources(result.learningResources)
      }
      
      const aegisMessage: Message = {
        id: `aegis_${Date.now()}`,
        content: responseContent,
        sender: 'aegis',
        timestamp: new Date(),
        category
      }

      const finalMessages = [...newMessages, aegisMessage]
      setMessages(finalMessages)
      saveMessages(finalMessages)

    } catch (error) {
      console.error('Error communicating with AEGIS Coach:', error)
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        content: `⚠️ Mi dispiace, non riesco a connettermi al momento. Errore: ${error instanceof Error ? error.message : 'Connessione fallita'}`,
        sender: 'aegis',
        timestamp: new Date(),
        category: 'alert'
      }

      const finalMessages = [...newMessages, errorMessage]
      setMessages(finalMessages)
      saveMessages(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload for screenshots
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      try {
        console.log('📁 File uploaded, starting optimization...')
        
        // Convert to base64
        const base64 = await blobToBase64(file)
        
        // Auto-resize for optimal API performance
        const { resized, info } = await resizeImage(base64)
        
        setUploadedImage(resized)
        setImageInfo(info)
        
        console.log(`📁 File optimized: ${info}`)
      } catch (error) {
        console.error('Error processing uploaded image:', error)
      }
    }
  }

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  }

  // Calculate optimal size maintaining aspect ratio
  const calculateOptimalSize = (originalWidth: number, originalHeight: number) => {
    // If image is already smaller than max dimensions, keep original
    if (originalWidth <= MAX_WIDTH && originalHeight <= MAX_HEIGHT) {
      return { width: originalWidth, height: originalHeight, wasResized: false }
    }

    // Calculate scaling factor to fit within max dimensions
    const widthRatio = MAX_WIDTH / originalWidth
    const heightRatio = MAX_HEIGHT / originalHeight
    const scaleFactor = Math.min(widthRatio, heightRatio)

    return {
      width: Math.round(originalWidth * scaleFactor),
      height: Math.round(originalHeight * scaleFactor),
      wasResized: true
    }
  }

  // Resize image using Canvas HTML5
  const resizeImage = (base64: string): Promise<{resized: string, info: string}> => {
    return new Promise((resolve) => {
      const img = new Image()
      
      img.onload = () => {
        const { width, height, wasResized } = calculateOptimalSize(img.width, img.height)
        
        if (!wasResized) {
          // Image is already optimal size
          const sizeKB = Math.round((base64.length * 0.75) / 1024)
          resolve({
            resized: base64,
            info: `${img.width}x${img.height}, ${sizeKB}KB (originale)`
          })
          return
        }

        // Create canvas and resize
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve({ resized: base64, info: 'resize fallback' })
          return
        }

        canvas.width = width
        canvas.height = height
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to optimized JPEG
        const resized = canvas.toDataURL('image/jpeg', IMAGE_QUALITY)
        const sizeKB = Math.round((resized.length * 0.75) / 1024)
        
        resolve({
          resized,
          info: `${width}x${height}, ${sizeKB}KB (ottimizzato da ${img.width}x${img.height})`
        })
      }
      
      img.onerror = () => {
        // Fallback to original if resize fails
        resolve({ resized: base64, info: 'resize failed, usando originale' })
      }
      
      img.src = base64
    })
  }

  // Handle paste events for screenshot upload
  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items
    
    if (!items) return
    
    // Look for image items in clipboard
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault()
        
        const blob = item.getAsFile()
        if (blob) {
          try {
            console.log('📸 Screenshot pasted, starting optimization...')
            
            // Convert to base64
            const base64 = await blobToBase64(blob)
            
            // Auto-resize for optimal API performance
            const { resized, info } = await resizeImage(base64)
            
            setUploadedImage(resized)
            setImageInfo(info)
            setPasteSuccess(true)
            
            console.log(`📸 Screenshot optimized: ${info}`)
            
            // Hide success message after 3 seconds (longer for resize info)
            setTimeout(() => setPasteSuccess(false), 3000)
          } catch (error) {
            console.error('Error processing pasted image:', error)
          }
        }
        break
      }
    }
  }

  // Quick action buttons
  const quickActions = [
    { text: "Analizza le mie posizioni aperte", icon: TrendingUp, category: 'analysis' },
    { text: "Suggerisci stop loss ottimali", icon: Brain, category: 'advice' },
    { text: "Valuta il rischio attuale", icon: AlertCircle, category: 'analysis' },
    { text: "Consiglia strategie di miglioramento", icon: Target, category: 'advice' },
    { text: "Analizza i miei pattern di trading", icon: LineChart, category: 'analysis' },
  ]

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  // Coach-specific functions
  const loadInsights = () => {
    if (!account?.id) return
    
    const storageKey = `aegis_insights_${account.id}`
    const storedInsights = localStorage.getItem(storageKey)
    
    if (storedInsights) {
      try {
        const parsedInsights = JSON.parse(storedInsights)
        setInsights(parsedInsights.map((insight: any) => ({
          ...insight,
          timestamp: new Date(insight.timestamp)
        })))
      } catch (error) {
        console.error('Error loading insights:', error)
        // Initialize with sample insights if loading fails
        initializeSampleInsights()
      }
    } else {
      // Initialize with sample insights
      initializeSampleInsights()
    }
  }
  
  const initializeSampleInsights = () => {
    const sampleInsights: TradeInsight[] = [
      {
        id: 'insight_1',
        title: 'Forza: Ottima gestione del rischio',
        description: 'Hai mantenuto un rapporto rischio/rendimento superiore a 1:2 negli ultimi 10 trade.',
        type: 'strength',
        timestamp: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        id: 'insight_2',
        title: 'Debolezza: Chiusure anticipate',
        description: 'Tendi a chiudere i trade in profitto troppo presto, limitando i potenziali guadagni.',
        type: 'weakness',
        timestamp: new Date(Date.now() - 172800000) // 2 days ago
      },
      {
        id: 'insight_3',
        title: 'Opportunità: Pattern su EURUSD',
        description: 'EURUSD sta formando un pattern di inversione che potrebbe offrire buone opportunità di trading.',
        type: 'opportunity',
        symbol: 'EURUSD',
        timestamp: new Date()
      }
    ]
    
    setInsights(sampleInsights)
    saveInsights(sampleInsights)
  }
  
  const saveInsights = (newInsights: TradeInsight[]) => {
    if (account?.id) {
      localStorage.setItem(`aegis_insights_${account.id}`, JSON.stringify(newInsights))
    }
  }
  
  const processNewInsights = (newInsightsData: any[]) => {
    if (!Array.isArray(newInsightsData) || newInsightsData.length === 0) return
    
    const processedInsights = newInsightsData.map(insight => ({
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: insight.title,
      description: insight.description,
      type: insight.type || 'general',
      timestamp: new Date(),
      symbol: insight.symbol
    }))
    
    const updatedInsights = [...insights, ...processedInsights]
    setInsights(updatedInsights)
    saveInsights(updatedInsights)
  }
  
  const loadLearningResources = () => {
    if (!account?.id) return
    
    const storageKey = `aegis_learning_${account.id}`
    const storedResources = localStorage.getItem(storageKey)
    
    if (storedResources) {
      try {
        const parsedResources = JSON.parse(storedResources)
        setLearningResources(parsedResources)
      } catch (error) {
        console.error('Error loading learning resources:', error)
        // Initialize with sample resources if loading fails
        initializeSampleLearningResources()
      }
    } else {
      // Initialize with sample resources
      initializeSampleLearningResources()
    }
  }
  
  const initializeSampleLearningResources = () => {
    const sampleResources: LearningResource[] = [
      {
        id: 'resource_1',
        title: 'Gestione del rischio avanzata',
        description: 'Impara tecniche avanzate per gestire il rischio e proteggere il tuo capitale.',
        category: 'risk',
        completed: false
      },
      {
        id: 'resource_2',
        title: 'Pattern di price action',
        description: 'Riconoscere e sfruttare i pattern di price action più efficaci.',
        category: 'pattern',
        completed: true
      },
      {
        id: 'resource_3',
        title: 'Psicologia del trading',
        description: 'Gestire le emozioni e sviluppare una mentalità vincente nel trading.',
        category: 'psychology',
        completed: false
      }
    ]
    
    setLearningResources(sampleResources)
    saveLearningResources(sampleResources)
  }
  
  const saveLearningResources = (newResources: LearningResource[]) => {
    if (account?.id) {
      localStorage.setItem(`aegis_learning_${account.id}`, JSON.stringify(newResources))
    }
  }
  
  const processNewLearningResources = (newResourcesData: any[]) => {
    if (!Array.isArray(newResourcesData) || newResourcesData.length === 0) return
    
    const processedResources = newResourcesData.map(resource => ({
      id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: resource.title,
      description: resource.description,
      category: resource.category || 'strategy',
      completed: false
    }))
    
    const updatedResources = [...learningResources, ...processedResources]
    setLearningResources(updatedResources)
    saveLearningResources(updatedResources)
  }
  
  const toggleResourceCompletion = (id: string) => {
    const updatedResources = learningResources.map(resource => 
      resource.id === id ? { ...resource, completed: !resource.completed } : resource
    )
    
    setLearningResources(updatedResources)
    saveLearningResources(updatedResources)
  }
  
  const loadTradingGoals = () => {
    if (!account?.id) return
    
    const storageKey = `aegis_goals_${account.id}`
    const storedGoals = localStorage.getItem(storageKey)
    
    if (storedGoals) {
      try {
        const parsedGoals = JSON.parse(storedGoals)
        setTradingGoals(parsedGoals.map((goal: any) => ({
          ...goal,
          dueDate: goal.dueDate ? new Date(goal.dueDate) : undefined
        })))
      } catch (error) {
        console.error('Error loading trading goals:', error)
        // Initialize with sample goals if loading fails
        initializeSampleTradingGoals()
      }
    } else {
      // Initialize with sample goals
      initializeSampleTradingGoals()
    }
  }
  
  const initializeSampleTradingGoals = () => {
    const sampleGoals: TradingGoal[] = [
      {
        id: 'goal_1',
        title: 'Migliorare win rate',
        description: 'Aumentare il win rate dal 45% al 55%',
        progress: 45,
        target: 55,
        unit: '%'
      },
      {
        id: 'goal_2',
        title: 'Ridurre drawdown massimo',
        description: 'Ridurre il drawdown massimo dal 10% al 5%',
        progress: 8,
        target: 5,
        unit: '%'
      },
      {
        id: 'goal_3',
        title: 'Completare formazione',
        description: 'Completare il corso di analisi tecnica avanzata',
        progress: 60,
        target: 100,
        unit: '%',
        dueDate: new Date(Date.now() + 604800000) // 7 days from now
      }
    ]
    
    setTradingGoals(sampleGoals)
    saveTradingGoals(sampleGoals)
  }
  
  const saveTradingGoals = (newGoals: TradingGoal[]) => {
    if (account?.id) {
      localStorage.setItem(`aegis_goals_${account.id}`, JSON.stringify(newGoals))
    }
  }
  
  const processNewGoals = (newGoalsData: any[]) => {
    if (!Array.isArray(newGoalsData) || newGoalsData.length === 0) return
    
    const processedGoals = newGoalsData.map(goal => ({
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: goal.title,
      description: goal.description,
      progress: goal.progress || 0,
      target: goal.target || 100,
      unit: goal.unit || '%',
      dueDate: goal.dueDate ? new Date(goal.dueDate) : undefined
    }))
    
    const updatedGoals = [...tradingGoals, ...processedGoals]
    setTradingGoals(updatedGoals)
    saveTradingGoals(updatedGoals)
  }
  
  const updateGoalProgress = (id: string, newProgress: number) => {
    const updatedGoals = tradingGoals.map(goal => 
      goal.id === id ? { ...goal, progress: newProgress } : goal
    )
    
    setTradingGoals(updatedGoals)
    saveTradingGoals(updatedGoals)
  }
  
  const generateDailyTip = () => {
    const tips = [
      "Ricorda di definire sempre il tuo stop loss prima di entrare in un trade.",
      "La pazienza è una virtù nel trading: attendi i setup perfetti.",
      "Rivedi regolarmente i tuoi trade per identificare pattern ricorrenti.",
      "Il miglior trade è spesso quello che non fai in condizioni di mercato incerte.",
      "Concentrati sul processo, non sui risultati a breve termine.",
      "Mantieni un diario di trading dettagliato per tracciare i tuoi progressi.",
      "Limita l'esposizione su un singolo trade all'1-2% del capitale.",
      "I mercati cambiano: adatta la tua strategia alle condizioni attuali."
    ]
    
    // Use date as seed for consistent daily tip
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
    const tipIndex = dayOfYear % tips.length
    
    setDailyTip(tips[tipIndex])
  }
  


  const calculateScores = () => {
    // In a real implementation, these would be calculated based on actual trading data
    // For now, we'll use sample values or derive from stats if available
    
    // Performance score: based on win rate and profit factor
    const winRate = stats?.winRate || 45
    const profitFactor = stats?.profitFactor || 1.2
    const performanceValue = Math.min(Math.round((winRate / 60 * 50) + (profitFactor / 2 * 50)), 100)
    setPerformanceScore(performanceValue)
    
    // Risk score: based on average risk per trade and max drawdown
    const avgRisk = stats?.avgRisk || 1.5 // % of account per trade
    const maxDrawdown = stats?.maxDrawdown || 8 // %
    const riskValue = Math.min(Math.round(100 - (avgRisk * 10) - (maxDrawdown * 5)), 100)
    setRiskScore(Math.max(riskValue, 0))
    
    // Discipline score: based on adherence to trading plan
    const planAdherence = stats?.planAdherence || 75 // %
    const disciplineValue = Math.min(Math.round(planAdherence), 100)
    setDisciplineScore(disciplineValue)
  }

  return (
    <Card className="border-2 border-gradient-to-r from-purple-200 via-blue-200 to-green-200 mb-6 aegis-coach-container">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 pb-3 sm:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                🤖 AEGIS Trading Coach
                <Badge className="bg-green-100 text-green-800 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Coach intelligente per il trading • Account: {account.login}
              </p>
            </div>
          </div>
          <Button
            variant="outline" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs sm:text-sm"
          >
            {isExpanded ? 'Comprimi' : 'Espandi'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        {/* Daily Tip */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm text-blue-800">Consiglio del giorno:</span>
          </div>
          <p className="text-sm text-blue-700">{dailyTip}</p>
        </div>
        
        {/* Performance Scores */}
        {isExpanded && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-xs text-gray-500 mb-1">Performance</div>
              <div className="flex justify-center mb-1">
                <Progress value={performanceScore} className="h-2 w-16" />
              </div>
              <div className="text-sm font-medium">{performanceScore}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-xs text-gray-500 mb-1">Gestione Rischio</div>
              <div className="flex justify-center mb-1">
                <Progress value={riskScore} className="h-2 w-16" />
              </div>
              <div className="text-sm font-medium">{riskScore}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-xs text-gray-500 mb-1">Disciplina</div>
              <div className="flex justify-center mb-1">
                <Progress value={disciplineScore} className="h-2 w-16" />
              </div>
              <div className="text-sm font-medium">{disciplineScore}%</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!isExpanded && (
          <div className="mb-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">🚀 Azioni rapide:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage(action.text)}
                    className="text-xs h-8 flex items-center gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{action.text}</span>
                    <span className="sm:hidden">{action.text.split(' ')[0]}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {isExpanded && (
          <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid grid-cols-4 mb-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="learning">Formazione</TabsTrigger>
              <TabsTrigger value="goals">Obiettivi</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-0">
              {/* Messages Area */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 h-64 sm:h-80 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-3 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.category === 'alert' 
                            ? 'bg-amber-50 border border-amber-200'
                            : message.category === 'advice'
                              ? 'bg-green-50 border border-green-200'
                              : message.category === 'analysis'
                                ? 'bg-blue-50 border border-blue-200'
                                : message.category === 'education'
                                  ? 'bg-purple-50 border border-purple-200'
                                  : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4 mt-0.5" />
                        ) : (
                          <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                        )}
                        <span className="text-xs font-medium">
                          {message.sender === 'user' ? 'Tu' : 'AEGIS Coach'}
                        </span>
                      </div>
                      
                      {message.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={message.imageUrl}
                            alt="Uploaded"
                            className="max-w-full h-auto rounded border"
                          />
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString('it-IT', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-white border border-gray-200 p-3 rounded-lg flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">AEGIS Coach sta pensando...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Image Upload Preview */}
              {uploadedImage && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">Immagine allegata</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedImage(null)
                        setImageInfo('')
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    className="mt-2 max-w-full h-24 object-cover rounded border"
                  />
                </div>
              )}

              {/* Paste Success Indicator */}
              {pasteSuccess && (
                <div className="mb-2 p-2 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    ✅ Screenshot ottimizzato con successo!
                  </div>
                  {imageInfo && (
                    <div className="text-xs text-green-700">
                      📸 {imageInfo}
                    </div>
                  )}
                </div>
              )}

              {/* Input Area */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onPaste={handlePaste}
                    placeholder="Scrivi la tua domanda ad AEGIS Coach o incolla screenshot con Ctrl+V..."
                    className="min-h-[2.5rem] resize-none"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    onClick={sendMessage}
                    disabled={(!inputMessage.trim() && !uploadedImage) || isLoading}
                    className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="insights" className="mt-0">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 h-80 overflow-y-auto">
                <h3 className="text-sm font-medium mb-3">Trading Insights</h3>
                
                {insights.length === 0 ? (
                  <p className="text-sm text-gray-500">Nessun insight disponibile.</p>
                ) : (
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <div 
                        key={insight.id} 
                        className={`p-3 rounded-lg border ${
                          insight.type === 'strength' ? 'bg-green-50 border-green-200' :
                          insight.type === 'weakness' ? 'bg-amber-50 border-amber-200' :
                          insight.type === 'opportunity' ? 'bg-blue-50 border-blue-200' :
                          'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.symbol || 'General'}
                          </Badge>
                        </div>
                        <p className="text-xs mt-1">{insight.description}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {insight.timestamp.toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="learning" className="mt-0">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 h-80 overflow-y-auto">
                <h3 className="text-sm font-medium mb-3">Risorse di apprendimento</h3>
                
                <Accordion type="single" collapsible className="w-full">
                  {learningResources.map((resource) => (
                    <AccordionItem key={resource.id} value={resource.id}>
                      <AccordionTrigger className="text-sm py-2">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={resource.completed}
                            onChange={() => toggleResourceCompletion(resource.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className={resource.completed ? 'line-through text-gray-500' : ''}>
                            {resource.title}
                          </span>
                          <Badge className={`ml-2 ${getBadgeColorByCategory(resource.category)}`}>
                            {resource.category}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm py-2">{resource.description}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </TabsContent>
            
            <TabsContent value="goals" className="mt-0">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 h-80 overflow-y-auto">
                <h3 className="text-sm font-medium mb-3">Obiettivi di trading</h3>
                
                {tradingGoals.length === 0 ? (
                  <p className="text-sm text-gray-500">Nessun obiettivo impostato.</p>
                ) : (
                  <div className="space-y-4">
                    {tradingGoals.map((goal) => (
                      <div key={goal.id} className="p-3 bg-white border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-medium">{goal.title}</h4>
                          {goal.dueDate && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {goal.dueDate.toLocaleDateString('it-IT')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs mb-2">{goal.description}</p>
                        <div className="flex items-center gap-2 mb-1">
                          <Progress value={(goal.progress / goal.target) * 100} className="h-2 flex-1" />
                          <span className="text-xs font-medium">
                            {goal.progress}{goal.unit} / {goal.target}{goal.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Connection Status */}
        <div className="mt-3 text-center">
          <Badge variant="outline" className="text-xs">
            🔗 Connesso a n8n • Session: {sessionId.slice(-8)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function for badge colors
function getBadgeColorByCategory(category: string): string {
  switch (category) {
    case 'pattern':
      return 'bg-blue-100 text-blue-800'
    case 'strategy':
      return 'bg-green-100 text-green-800'
    case 'psychology':
      return 'bg-purple-100 text-purple-800'
    case 'risk':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}