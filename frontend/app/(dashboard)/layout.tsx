'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
          <Sidebar pathname={pathname} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar pathname={pathname} />
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        {/* Top bar */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="py-8 flex-1">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
