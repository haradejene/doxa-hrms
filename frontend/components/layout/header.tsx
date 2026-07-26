'use client'

import { Bell, Menu, LogOut, Search, ChevronDown } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

interface HeaderProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, { title: string; desc: string }> = {
  '/dashboard': { title: 'Dashboard', desc: 'Welcome back! Here's an overview of your workforce.' },
  '/employees': { title: 'Employees', desc: 'Manage and view all employee records.' },
  '/recruitment': { title: 'Recruitment', desc: 'Track job postings and applicants.' },
  '/payroll': { title: 'Payroll', desc: 'Process salaries and manage compensation.' },
  '/attendance': { title: 'Attendance', desc: 'Monitor daily attendance and leave.' },
  '/performance': { title: 'Performance', desc: 'Track reviews, KPIs and appraisals.' },
  '/analytics': { title: 'Analytics', desc: 'HR insights and workforce metrics.' },
  '/settings': { title: 'Settings', desc: 'Configure your preferences.' },
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const currentPage = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname?.startsWith(key + '/')
  )?.[1]

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Left: Menu + page title */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-violet-600 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">{currentPage?.title ?? 'DOXA HR'}</h2>
            <p className="text-xs text-gray-400 truncate hidden md:block">{currentPage?.desc ?? ''}</p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button className="hidden md:flex items-center gap-2 text-sm text-gray-400 border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 hover:border-violet-300 hover:text-gray-600 transition-all min-w-[160px]">
            <Search className="h-4 w-4" />
            <span>Quick search...</span>
            <span className="ml-auto text-[10px] text-gray-300 font-medium border border-gray-200 rounded px-1">⌘K</span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full border-2 border-white" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-purple-500/30">
                HR
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-tight">HR Admin</p>
                <p className="text-[11px] text-gray-400 leading-tight">admin@doxa.com</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">HR Admin</p>
                  <p className="text-xs text-gray-500">admin@doxa.com</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
