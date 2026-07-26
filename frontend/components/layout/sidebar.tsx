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
  ChevronRight,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'text-violet-500' },
  { name: 'Recruitment', href: '/recruitment', icon: Briefcase, color: 'text-blue-500' },
  { name: 'Employees', href: '/employees', icon: Users, color: 'text-emerald-500' },
  { name: 'Payroll', href: '/payroll', icon: CreditCard, color: 'text-amber-500' },
  { name: 'Attendance', href: '/attendance', icon: CalendarCheck, color: 'text-cyan-500' },
  { name: 'Performance', href: '/performance', icon: TrendingUp, color: 'text-orange-500' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, color: 'text-pink-500' },
  { name: 'Settings', href: '/settings', icon: Settings, color: 'text-gray-400' },
]

interface SidebarProps {
  pathname: string;
}

export function Sidebar({ pathname }: SidebarProps) {
  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' }}>
      {/* Logo */}
      <div className="flex flex-shrink-0 items-center px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <Image
              src="/doxa-logo.png"
              alt="Doxa Logo"
              width={22}
              height={22}
              className="rounded-md"
              priority
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">DOXA HR</h1>
            <span className="text-[10px] text-violet-300 font-medium">People Platform</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/10 mb-4" />

      {/* Nav Label */}
      <p className="px-5 text-[10px] font-semibold text-violet-300/60 uppercase tracking-widest mb-2">Menu</p>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                  : 'text-violet-200 hover:bg-white/8 hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/15' : 'bg-white/5'}`}>
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : item.color}`} />
                </div>
                {item.name}
              </div>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-white/60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto p-4">
        <div className="rounded-2xl bg-white/8 border border-white/10 p-4">
          <p className="text-xs font-semibold text-white">Need help?</p>
          <p className="text-xs text-violet-300 mt-0.5 mb-3">Our support team is ready</p>
          <a href="mailto:support@doxa.com" className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
