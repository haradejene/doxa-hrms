'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Briefcase,
  CreditCard,
  CalendarCheck,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  UserPlus,
  FileText,
  Clock,
  Eye,
} from 'lucide-react'
import api from '@/services/api'
import Link from 'next/link'

interface DashboardStats {
  totalEmployees: number
  openPositions: number
  pendingApplications: number
  onLeaveToday: number
  monthlyGrowth: number
  turnover: number
}

interface Activity {
  id: number
  type: string
  message: string
  time: string
  user: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/dashboard/metrics')
      setStats(response.data)
      const activitiesResponse = await api.get('/api/dashboard/activities')
      setActivities(activitiesResponse.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setStats({
        totalEmployees: 156,
        openPositions: 12,
        pendingApplications: 34,
        onLeaveToday: 8,
        monthlyGrowth: 5.2,
        turnover: 2.1
      })
      setActivities([
        { id: 1, type: 'hire', message: 'John Doe was hired as Senior Developer', time: '2 hours ago', user: 'HR Admin' },
        { id: 2, type: 'leave', message: 'Jane Smith requested sick leave', time: '3 hours ago', user: 'Employee' },
        { id: 3, type: 'application', message: 'New application for Frontend Developer', time: '5 hours ago', user: 'Applicant' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600',
    }

    return (
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-md">
        <div className="flex items-center">
          <div className={`rounded-lg p-3 ${colors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {trend !== undefined && (
                <span className={`ml-2 flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your workforce today.
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={Users}
            trend={stats.monthlyGrowth}
            color="blue"
          />
          <StatCard
            title="Open Positions"
            value={stats.openPositions}
            icon={Briefcase}
            trend={-2}
            color="green"
          />
          <StatCard
            title="Pending Applications"
            value={stats.pendingApplications}
            icon={CreditCard}
            trend={8}
            color="yellow"
          />
          <StatCard
            title="On Leave Today"
            value={stats.onLeaveToday}
            icon={CalendarCheck}
            color="purple"
          />
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="px-6 py-4 flex items-start gap-3 hover:bg-purple-50/50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-900">{activity.message}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span>By: {activity.user}</span>
                  <span>•</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions - Below Recent Activity */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/recruitment/new"
          className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Post Job</span>
        </Link>

        <Link
          href="/employees/new"
          className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Add Employee</span>
        </Link>

        <Link
          href="/payroll/process"
          className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Process Payroll</span>
        </Link>

        <Link
          href="/analytics"
          className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Eye className="h-6 w-6 text-orange-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">View Reports</span>
        </Link>
      </div>
    </div>
  )
}
