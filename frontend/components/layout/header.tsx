'use client'

import { Bell, Menu, LogOut } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
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
  )
}
