"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ClipboardList, 
  FileText, 
  DollarSign, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  Menu
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/os', label: 'Ordens de Serviço', icon: ClipboardList },
  ]

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-screen bg-gray-900 border-r border-white/10 transition-all duration-300 z-30
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo / Toggle */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          {!collapsed && (
            <span className="font-bold text-xl text-white truncate">
              Solução Rental
            </span>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all group
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }
                `}
                title={collapsed ? link.label : undefined}
              >
                <div className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                  <Icon size={24} />
                </div>
                
                {!collapsed && (
                  <span className="font-medium whitespace-nowrap">
                    {link.label}
                  </span>
                )}

                {/* Tooltip-ish for collapsed state */}
                {collapsed && (
                   <div className="absolute left-16 bg-gray-800 text-white px-3 py-1 rounded-md text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap border border-white/10">
                     {link.label}
                   </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer info if needed */}
        {!collapsed && (
          <div className="p-6 text-xs text-gray-600 border-t border-white/10">
            &copy; 2025 Solução Rental
          </div>
        )}
      </div>
    </aside>
  )
}
