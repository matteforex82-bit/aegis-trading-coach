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

const WEBHOOK_URL = 'https://n8n-jw98k-u48054.vm.elestio.app/webhook/20fbd8d6-69f9-4b4c-82e9-c0c6497e10a2'

// Image optimization constants
const MAX_WIDTH = 1024
const MAX_HEIGHT = 768  
const IMAGE_QUALITY = 0.8

export default function AegisAssistant({ account, stats, rules, openTrades = [] }: AegisAssistantProps) {
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
      
      console.log('🤖 AEGIS Response from N8N:', result)
      console.log('🔍 Response structure:', JSON.stringify(result, null, 2))
      console.log('🔍 Response keys:', Object.keys(result))
      
      // Handle N8N response format: array with output property
      let responseContent = 'Ho ricevuto la tua richiesta, ma c\'è stato un problema nella risposta.'
      
      if (Array.isArray(result) && result.length > 0 && result[0].output) {
        responseContent = result[0].output
        console.log('✅ Using N8N array[0].output format')
      } else if (result.output) {
        responseContent = result.output
        console.log('✅ Using result.output format')
      } else if (result.response) {
        responseContent = result.response
        console.log('✅ Using result.response format')
      } else if (result.message) {
        responseContent = result.message
        console.log('✅ Using result.message format')
      } else if (typeof result === 'string') {
        responseContent = result
        console.log('✅ Using string result format')
      } else {
        console.log('❌ Unknown response format:', typeof result)
        console.log('❌ Available properties:', Object.keys(result))
        // Try to find any text content in the object
        const firstKey = Object.keys(result)[0]
        if (firstKey && typeof result[firstKey] === 'string') {
          responseContent = result[firstKey]
          console.log('✅ Using first string property:', firstKey)
        }
      }
      
      const aegisMessage: Message = {
        id: `aegis_${Date.now()}`,
        content: responseContent,
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
                  placeholder="Scrivi la tua domanda ad AEGIS o incolla screenshot con Ctrl+V..."
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