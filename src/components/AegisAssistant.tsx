'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  X
} from 'lucide-react'

interface Message {
  id: string
  content: string
  sender: 'user' | 'aegis'
  timestamp: Date
  imageUrl?: string
}

interface AegisAssistantProps {
  account: any
  stats?: any
  rules?: any
  openTrades?: any[]
}

const WEBHOOK_URL = 'https://n8n-jw98k-u48054.vm.elestio.app/webhook-test/20fbd8d6-69f9-4b4c-82e9-c0c6497e10a2'

export default function AegisAssistant({ account, stats, rules, openTrades = [] }: AegisAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize session ID
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
          content: `👋 Ciao! Sono AEGIS, il tuo assistente AI per il trading. Posso aiutarti con analisi, suggerimenti e strategie per il tuo account ${account.login}. Come posso aiutarti oggi?`,
          sender: 'aegis',
          timestamp: new Date()
        }])
      }
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
        balance: stats?.totalPnL ? (50000 + stats.totalPnL) : 50000,
        equity: stats?.totalPnL ? (50000 + stats.totalPnL + (openTrades.reduce((sum, t) => sum + t.pnlGross, 0))) : 50000,
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
        totalPnL: stats?.totalPnL || 0,
        winRate: stats?.winRate || 0,
        totalTrades: stats?.totalTrades || 0
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

    try {
      // Prepare payload for n8n webhook
      const payload = {
        message: inputMessage,
        sessionId: sessionId,
        imageUrl: uploadedImage || undefined,
        context: generateContextData(),
        timestamp: new Date().toISOString()
      }

      console.log('🤖 Sending to AEGIS:', payload)

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
      
      const aegisMessage: Message = {
        id: `aegis_${Date.now()}`,
        content: result.response || result.message || 'Ho ricevuto la tua richiesta, ma c\'è stato un problema nella risposta.',
        sender: 'aegis',
        timestamp: new Date()
      }

      const finalMessages = [...newMessages, aegisMessage]
      setMessages(finalMessages)
      saveMessages(finalMessages)

    } catch (error) {
      console.error('Error communicating with AEGIS:', error)
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        content: `⚠️ Mi dispiace, non riesco a connettermi al momento. Errore: ${error instanceof Error ? error.message : 'Connessione fallita'}`,
        sender: 'aegis',
        timestamp: new Date()
      }

      const finalMessages = [...newMessages, errorMessage]
      setMessages(finalMessages)
      saveMessages(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload for screenshots
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Quick action buttons
  const quickActions = [
    { text: "Analizza le mie posizioni aperte", icon: TrendingUp },
    { text: "Suggerisci stop loss ottimali", icon: Brain },
    { text: "Valuta il rischio attuale", icon: AlertCircle },
  ]

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="border-2 border-gradient-to-r from-purple-200 via-blue-200 to-green-200 mb-6">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 pb-3 sm:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                🤖 AEGIS Trading Assistant
                <Badge className="bg-green-100 text-green-800 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Assistente intelligente per il trading • Account: {account.login}
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
          <>
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
                        {message.sender === 'user' ? 'Tu' : 'AEGIS'}
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
                    <span className="text-sm text-gray-600">AEGIS sta pensando...</span>
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
                    onClick={() => setUploadedImage(null)}
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

            {/* Input Area */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scrivi la tua domanda ad AEGIS..."
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
          </>
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