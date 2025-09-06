'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { AccountList } from '@/components/account-list'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme } = useTheme()

  return (
    <div className={`min-h-screen bg-background transition-colors duration-300 ${
      theme === 'neon' ? 'animate-cyber-scan' : ''
    }`}>
      {/* Header */}
      <header className={`bg-card border-b border-border px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-sm transition-colors duration-300 ${
        theme === 'neon' ? 'animate-neon-pulse' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Image 
                  src="/logo.svg?v=4" 
                  alt="PROP CONTROL" 
                  width={120} 
                  height={48} 
                  className={`object-contain logo-enhanced ${
                    theme === 'neon' ? 'animate-neon-glow' : ''
                  }`}
                  priority
                  decoding="async"
                />
              </div>
              {subtitle && (
                <div>
                  <p className="text-muted-foreground text-sm sm:text-base">{subtitle}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-200"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Professional Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-sidebar border-r border-sidebar-border min-h-screen shadow-sm
          transform transition-all duration-300 ease-in-out lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
       `}>
          <div className="p-4 pt-20 lg:pt-4">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-sidebar-foreground mb-4 uppercase tracking-wide transition-colors duration-300">
                Account
              </h2>
              <AccountList />
            </div>

            <div className="border-t border-sidebar-border pt-4">
              <h3 className="text-sm font-semibold text-sidebar-foreground mb-3 uppercase tracking-wide transition-colors duration-300">
                Navigazione
              </h3>
              <Navigation />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 min-h-screen">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}