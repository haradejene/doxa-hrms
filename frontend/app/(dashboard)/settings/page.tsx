'use client';

import { useState } from 'react';
import {
  User,
  Building,
  Globe,
  Bell,
  Shield,
  Database,
  Mail,
  CreditCard,
  Users,
  Settings as SettingsIcon,
  Save,
  Edit,
  Key,
  Lock,
  UserCog,
} from 'lucide-react';

interface SettingSection {
  id: string;
  title: string;
  icon: any;
  description: string;
}

const sections: SettingSection[] = [
  { id: 'general', title: 'General', icon: SettingsIcon, description: 'Company information and basic settings' },
  { id: 'company', title: 'Company', icon: Building, description: 'Company profile and structure' },
  { id: 'users', title: 'Users', icon: Users, description: 'User management and roles' },
  { id: 'security', title: 'Security', icon: Shield, description: 'Authentication and access control' },
  { id: 'email', title: 'Email', icon: Mail, description: 'Email configuration and notifications' },
  { id: 'integrations', title: 'Integrations', icon: Database, description: 'Third-party integrations' },
  { id: 'billing', title: 'Billing', icon: CreditCard, description: 'Subscription and payment settings' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [companyName, setCompanyName] = useState('Acme Inc.');
  const [companyEmail, setCompanyEmail] = useState('hr@acme.com');
  const [companyPhone, setCompanyPhone] = useState('+1 234 567 8900');
  const [timezone, setTimezone] = useState('America/New_York');
  const [currency, setCurrency] = useState('USD');

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return (
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
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Email</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">GMT (London)</option>
                  <option value="Europe/Paris">CET (Paris)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                <Save className="inline h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        );
      case 'company':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
              <p className="mt-1 text-sm text-gray-500">Manage your company profile and departments.</p>
            </div>
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Company Logo</p>
                  <p className="text-sm text-gray-500">Upload your company logo</p>
                </div>
                <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                  Change Logo
                </button>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Departments</p>
                  <p className="text-sm text-gray-500">Manage departments and reporting structure</p>
                </div>
                <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                  Manage
                </button>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Positions</p>
                  <p className="text-sm text-gray-500">Manage job titles and positions</p>
                </div>
                <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                  Manage
                </button>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              <p className="mt-1 text-sm text-gray-500">Manage users, roles, and permissions.</p>
            </div>
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                          HA
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">HR Admin</p>
                          <p className="text-xs text-gray-500">admin@company.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">Administrator</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-sm">
                          JM
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">John Manager</p>
                          <p className="text-xs text-gray-500">john@company.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">Manager</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                <UserCog className="inline h-4 w-4 mr-2" />
                Add User
              </button>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              <p className="mt-1 text-sm text-gray-500">Configure authentication and security preferences.</p>
            </div>
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Enhance security with 2FA</p>
                  </div>
                  <button className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">
                    Enable
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Change Password</p>
                    <p className="text-sm text-gray-500">Update your password regularly</p>
                  </div>
                  <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                    <Key className="inline h-4 w-4 mr-2" />
                    Change
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Session Management</p>
                    <p className="text-sm text-gray-500">Manage active sessions</p>
                  </div>
                  <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                    <Lock className="inline h-4 w-4 mr-2" />
                    View Sessions
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Select a setting category to configure</p>
          </div>
        );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your HRMS system configuration</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <section.icon className={`h-5 w-5 ${
                  activeSection === section.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span>{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}