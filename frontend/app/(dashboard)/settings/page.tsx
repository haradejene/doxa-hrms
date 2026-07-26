'use client'

import { useState } from 'react'
import { Settings, Building, Users, Shield, Mail, Database, CreditCard, Save } from 'lucide-react'

const sections = [
  { id: 'general', title: 'General', icon: Settings, description: 'Company information and basic settings' },
  { id: 'company', title: 'Company', icon: Building, description: 'Company profile and structure' },
  { id: 'security', title: 'Security', icon: Shield, description: 'Authentication and access control' },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your HRMS system configuration</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <section.icon className={`h-5 w-5 ${activeSection === section.id ? 'text-purple-600' : 'text-gray-400'}`} />
                <span>{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
              <p className="mt-1 text-sm text-gray-500">Configure your organization's basic information.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  defaultValue="Doxa Inc."
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Email</label>
                <input
                  type="email"
                  defaultValue="hr@doxa.com"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-2.5 text-sm font-medium text-white hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}