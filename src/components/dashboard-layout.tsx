'use client'

import { Navigation } from '@/components/navigation'
import { AccountList } from '@/components/account-list'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              PROP CONTROL
            </h1>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Professional Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0 shadow-sm">
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                Account
              </h2>
              <AccountList />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                Navigazione
              </h3>
              <Navigation />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}