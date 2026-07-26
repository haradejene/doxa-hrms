'use client'

import { Settings, User, Bell, Lock, Globe } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your system preferences and account settings</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {/* Profile Settings */}
        <div className="p-6 sm:p-8 flex items-start gap-6 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg shrink-0">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
            <p className="text-sm text-gray-500 mt-1">Update your personal details, profile picture, and contact information.</p>
          </div>
        </div>

        {/* Security Settings */}
        <div className="p-6 sm:p-8 flex items-start gap-6 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Security & Password</h3>
            <p className="text-sm text-gray-500 mt-1">Manage your password, enable two-factor authentication, and view login sessions.</p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="p-6 sm:p-8 flex items-start gap-6 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg shrink-0">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-500 mt-1">Configure how and when you receive alerts for leaves, payroll, and tasks.</p>
          </div>
        </div>

        {/* System Settings */}
        <div className="p-6 sm:p-8 flex items-start gap-6 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="p-3 bg-gray-100 text-gray-600 rounded-lg shrink-0">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">System Preferences</h3>
            <p className="text-sm text-gray-500 mt-1">Set your local timezone, language, and default dashboard views.</p>
          </div>
        </div>
      </div>
    </div>
  )
}