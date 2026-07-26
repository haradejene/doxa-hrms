'use client'

import { User, Lock, Bell, Globe, ChevronRight } from 'lucide-react'

const sections = [
  {
    title: 'Profile Information',
    desc: 'Update your personal details, contact info, and profile photo.',
    icon: User,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    title: 'Security & Password',
    desc: 'Change password, enable two-factor authentication, view active sessions.',
    icon: Lock,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Notifications',
    desc: 'Configure alerts for payroll, leaves, reviews, and system events.',
    icon: Bell,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    title: 'System Preferences',
    desc: 'Set timezone, language, and default views across the dashboard.',
    icon: Globe,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
]

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-4">
      {/* Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white flex items-center gap-5 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-2xl flex-shrink-0">HR</div>
        <div>
          <p className="text-xl font-bold">HR Administrator</p>
          <p className="text-sm text-violet-200">admin@doxa.com · Super Admin</p>
          <p className="text-xs text-violet-300 mt-1">Member since Jan 2025</p>
        </div>
      </div>

      {/* Setting Sections */}
      <div className="card divide-y divide-gray-100 overflow-hidden">
        {sections.map((s) => (
          <button
            key={s.title}
            className="w-full flex items-center gap-5 p-5 hover:bg-gray-50 transition-colors text-left group"
          >
            <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
              <s.icon className={`h-5 w-5 ${s.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{s.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="card p-5 border-red-100">
        <h3 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h3>
        <p className="text-xs text-gray-400 mb-3">These actions are irreversible. Please proceed with caution.</p>
        <button className="text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl px-4 py-2 transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  )
}