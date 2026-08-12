'use client'

import { Bell, Menu, LogOut, Search, ChevronDown, X, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import api from '@/services/api'
import { useState, useEffect, useRef } from 'react'

interface HeaderProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, { title: string; desc: string }> = {
  '/dashboard': { title: 'Dashboard', desc: 'Welcome back! Here\'s an overview of your workforce.' },
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
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<any[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get('/api/dashboard/notifications')
      .then(res => setNotifications(res.data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setShowNotifications(false)
        setShowProfileMenu(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/employees?search=${encodeURIComponent(searchQuery)}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  const currentPage = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname?.startsWith(key + '/')
  )?.[1]

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
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
          <button 
            onClick={() => setShowSearch(true)}
            className="hidden md:flex items-center gap-2 text-sm text-gray-500 border border-gray-200/80 bg-gray-50/50 rounded-xl px-3 h-10 hover:bg-gray-100 hover:border-gray-300 transition-all w-56 lg:w-64"
          >
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">Quick search...</span>
            <div className="ml-auto flex items-center gap-0.5 flex-shrink-0">
              <span className="flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] text-gray-500 font-medium bg-white border border-gray-200 rounded shadow-sm">⌘</span>
              <span className="flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] text-gray-500 font-medium bg-white border border-gray-200 rounded shadow-sm">K</span>
            </div>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
              className="relative p-2 rounded-xl text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full border-2 border-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                  <p className="text-sm font-semibold text-gray-900">Notifications</p>
                  <button className="text-xs text-violet-600 hover:text-violet-700 font-medium">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50">
                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 text-center">
                  <button className="text-xs text-gray-500 hover:text-violet-600 font-medium">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
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

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-transparent">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/10 w-full max-w-xl overflow-hidden border border-gray-100">
            <form onSubmit={handleSearchSubmit} className="flex items-center px-4 py-3 border-b border-gray-100">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none focus:shadow-none px-4 text-base text-gray-900 placeholder-gray-400"
                placeholder="Search employees by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="button" onClick={() => setShowSearch(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </form>
            <div className="px-2 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Quick Links</p>
              <div className="space-y-1">
                <button onClick={() => { router.push('/employees/new'); setShowSearch(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-violet-50 hover:text-violet-700 rounded-xl transition-colors">
                  <User className="h-4 w-4" />
                  Add New Employee
                </button>
                <button onClick={() => { router.push('/performance'); setShowSearch(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-violet-50 hover:text-violet-700 rounded-xl transition-colors">
                  <Bell className="h-4 w-4" />
                  Pending Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
