'use client'

import { useState, useEffect } from 'react'
import { Users, Briefcase, FileCheck, CalendarOff, TrendingUp, UserPlus, ArrowRight, Clock, CheckCircle2, Zap } from 'lucide-react'
import api from '@/services/api'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/stat-card'
import AttendanceChart from '@/components/dashboard/attendance-chart'

interface DashboardStats {
  totalEmployees: number
  openPositions: number
  pendingApplications: number
  onLeaveToday: number
  monthlyGrowth: number
  activeEmployees: number
  onLeaveEmployees: number
  byDepartment: Record<string, number>
}

interface RecentEmployee {
  id: number
  name: string
  email: string
  department: string
  position: string
  status: string
  initials: string
}

interface Activity {
  id: number
  type: string
  message: string
  time: string
  user: string
}

const mockAttendanceData = [
  { day: 'Mon', present: 45, absent: 3, leave: 2 },
  { day: 'Tue', present: 48, absent: 1, leave: 1 },
  { day: 'Wed', present: 44, absent: 4, leave: 2 },
  { day: 'Thu', present: 49, absent: 0, leave: 1 },
  { day: 'Fri', present: 42, absent: 3, leave: 5 },
]

const avatarColors = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentEmployees, setRecentEmployees] = useState<RecentEmployee[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, activitiesRes, recentRes] = await Promise.all([
        api.get('/api/dashboard/metrics'),
        api.get('/api/dashboard/activities'),
        api.get('/api/dashboard/recent-employees'),
      ])
      setStats(metricsRes.data)
      setActivities(activitiesRes.data)
      setRecentEmployees(recentRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={Users}
            trend={stats.monthlyGrowth}
            trendLabel="vs. last month"
            gradient="bg-gradient-to-br from-violet-600 to-purple-700"
            iconBg="bg-white/20"
          />
          <StatCard
            title="Open Positions"
            value={stats.openPositions}
            icon={Briefcase}
            gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
            iconBg="bg-white/20"
          />
          <StatCard
            title="Pending Applications"
            value={stats.pendingApplications}
            icon={FileCheck}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
            iconBg="bg-white/20"
          />
          <StatCard
            title="On Leave Today"
            value={stats.onLeaveToday}
            icon={CalendarOff}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            iconBg="bg-white/20"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <div className="lg:col-span-2">
          <AttendanceChart data={mockAttendanceData} />
        </div>

        {/* Department Breakdown */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            By Department
          </h3>
          <div className="space-y-3">
            {stats?.byDepartment && Object.entries(stats.byDepartment).map(([dept, count], i) => {
              const total = stats.totalEmployees || 1
              const pct = Math.round((count / total) * 100)
              const barColors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
              return (
                <div key={dept}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600 truncate">{dept}</span>
                    <span className="text-xs font-bold text-gray-900 ml-2">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColors[i % barColors.length]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {(!stats?.byDepartment || Object.keys(stats.byDepartment).length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">No department data</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Employees */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-violet-500" />
              Recent Employees
            </h3>
            <Link href="/employees" className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentEmployees.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No employees found</p>
            )}
            {recentEmployees.map((emp, i) => (
              <div key={emp.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {emp.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                  <p className="text-xs text-gray-400 truncate">{emp.position} · {emp.department}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                  emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  emp.status === 'on_leave' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {emp.status?.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-500" />
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {activities.slice(0, 5).map((act, i) => (
              <div key={act.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  act.type === 'hire' ? 'bg-violet-50' :
                  act.type === 'job' ? 'bg-blue-50' : 'bg-emerald-50'
                }`}>
                  {act.type === 'hire' ? <UserPlus className="h-3.5 w-3.5 text-violet-600" /> :
                   act.type === 'job' ? <Briefcase className="h-3.5 w-3.5 text-blue-600" /> :
                   <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">{act.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{act.time}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/recruitment/new', label: 'Post a Job', icon: Briefcase, bg: 'bg-violet-50', icon_color: 'text-violet-600', border: 'hover:border-violet-200' },
            { href: '/employees/new', label: 'Add Employee', icon: UserPlus, bg: 'bg-blue-50', icon_color: 'text-blue-600', border: 'hover:border-blue-200' },
            { href: '/payroll', label: 'Run Payroll', icon: Zap, bg: 'bg-amber-50', icon_color: 'text-amber-600', border: 'hover:border-amber-200' },
            { href: '/analytics', label: 'View Reports', icon: TrendingUp, bg: 'bg-emerald-50', icon_color: 'text-emerald-600', border: 'hover:border-emerald-200' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 ${action.border} hover:shadow-md transition-all duration-200 group`}
            >
              <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <action.icon className={`h-5 w-5 ${action.icon_color}`} />
              </div>
              <span className="text-sm font-semibold text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
