'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Settings, Upload } from 'lucide-react'

const navigation = [
  { name: 'Impostazioni', href: '/settings', icon: Settings },
  { name: 'Import Dati', href: '/import', icon: Upload },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors touch-target no-select',
              'active:scale-95 transition-transform duration-75', // Mobile tap feedback
              isActive
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-responsive">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}