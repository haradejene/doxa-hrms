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

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'People',
    items: [
      { name: 'Employees', href: '/employees', icon: Users },
      { name: 'Recruitment', href: '/recruitment', icon: Briefcase },
      { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Payroll', href: '/payroll', icon: CreditCard },
      { name: 'Performance', href: '/performance', icon: TrendingUp },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  pathname: string
}

export function Sidebar({ pathname }: SidebarProps) {
  return (
    <div
      className="flex flex-1 flex-col h-full overflow-y-auto"
      style={{ backgroundColor: '#faf9f7', borderRight: '1px solid #ede9e3' }}
    >
      {/* Logo */}
      <div className="flex flex-shrink-0 items-center px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Image
              src="/doxa-logo.png"
              alt="Doxa Logo"
              width={20}
              height={20}
              className="brightness-0 invert"
              priority
            />
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-900 tracking-tight leading-none">DOXA HR</p>
            <p className="text-[10px] text-violet-500 font-semibold mt-0.5">People Platform</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t" style={{ borderColor: '#ede9e3' }} />

      {/* Navigation groups */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                        : 'text-gray-600 hover:bg-stone-100 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}
                      />
                      {item.name}
                    </div>
                    {isActive && (
                      <ChevronRight className="h-3.5 w-3.5 text-white/70" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom user card */}
      <div className="p-4">
        <div
          className="rounded-xl p-3.5 flex items-center gap-3"
          style={{ backgroundColor: '#f0ede8', border: '1px solid #e5e0d8' }}
        >
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            HR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">HR Admin</p>
            <p className="text-[10px] text-gray-400 truncate">admin@doxa.com</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Online" />
        </div>
      </div>
    </div>
  )
}
