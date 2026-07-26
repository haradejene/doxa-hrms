'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  CalendarCheck,
  TrendingUp,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Recruitment', href: '/recruitment', icon: Briefcase },
  { name: 'Employees', href: '/employees', icon: Users },
  { name: 'Payroll', href: '/payroll', icon: CreditCard },
  { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
  { name: 'Performance', href: '/performance', icon: TrendingUp },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600/75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
          <div className="absolute right-0 top-0 -mr-12 pt-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent pathname={pathname} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <SidebarContent pathname={pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-purple-600 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="lg:hidden">
                <span className="text-sm font-semibold text-gray-900">DOXA HR</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative text-gray-400 hover:text-purple-600 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full" />
              </button>
              <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-medium text-sm">
                  HA
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">HR Admin</p>
                  <p className="text-xs text-gray-500">admin@doxa.com</p>
                </div>
                <button className="text-gray-400 hover:text-red-500 transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
      <div className="flex flex-shrink-0 items-center px-4">
        <div className="flex items-center space-x-2">
          <Image
            src="/doxa-logo.png"
            alt="Doxa Logo"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">DOXA HR</h1>
            <span className="text-[10px] text-purple-600 font-medium">v2.0</span>
          </div>
        </div>
      </div>
      <nav className="mt-8 flex-1 space-y-1 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-purple-50 text-purple-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 h-5 w-5 flex-shrink-0 transition-colors
                  ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'}
                `}
              />
              {item.name}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 bg-purple-600 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-gray-100 pt-4 px-2">
        <div className="rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
          <p className="text-xs text-purple-600 font-medium">Need help?</p>
          <p className="text-xs text-gray-500 mt-1">Contact support</p>
        </div>
      </div>
    </div>
  )
}
