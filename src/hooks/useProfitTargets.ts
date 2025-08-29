'use client'

import { useState, useEffect } from 'react'

interface ProfitTargetData {
  accountSize: number
  currentBalance: number
  profitTargetAmount: number
  profitTargetPercent: number
  
  closed: {
    netPnL: number
    progress: number
    remainingAmount: number
    trades: number
  }
  
  floating: {
    netPnL: number
    progress: number
    remainingAmount: number
    openPositions: number
    openNetPnL: number
  }
  
  dailyLoss: {
    amount: number
    progress: number
    limit: number
    todayClosedPnL: number
    todayOpenPnL: number
  }
  
  overallLoss: {
    amount: number
    percent: number
    progress: number
    limit: number
    isInProfit: boolean
  }
}

export function useProfitTargets(accountId: string) {
  const [data, setData] = useState<ProfitTargetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accountId) return

    const fetchProfitTargets = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/accounts/${accountId}/profit-targets`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        setData(result)
        
      } catch (err: any) {
        console.error('Error fetching profit targets:', err)
        setError(err.message || 'Failed to fetch profit targets')
      } finally {
        setLoading(false)
      }
    }

    fetchProfitTargets()
    
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchProfitTargets, 30000)
    
    return () => clearInterval(interval)
  }, [accountId])

  return { data, loading, error, refetch: () => {
    if (accountId) {
      const fetchProfitTargets = async () => {
        try {
          setLoading(true)
          setError(null)
          
          const response = await fetch(`/api/accounts/${accountId}/profit-targets`)
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const result = await response.json()
          setData(result)
          
        } catch (err: any) {
          console.error('Error fetching profit targets:', err)
          setError(err.message || 'Failed to fetch profit targets')
        } finally {
          setLoading(false)
        }
      }
      fetchProfitTargets()
    }
  }}
}