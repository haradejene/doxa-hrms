'use client'

import Link from 'next/link'
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

interface SidebarProps {
  pathname: string;
}

export function Sidebar({ pathname }: SidebarProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4 h-full bg-white border-r border-gray-200">
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
