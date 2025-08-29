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
              'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 touch-target no-select',
              'active:scale-95 transition-transform duration-75', // Mobile tap feedback
              isActive
                ? 'bg-sidebar-accent text-sidebar-primary border border-sidebar-border shadow-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary active:bg-sidebar-accent/80'
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