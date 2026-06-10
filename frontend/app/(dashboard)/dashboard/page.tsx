'use client';

import { useState } from 'react';
import {
  Users,
  Briefcase,
  CreditCard,
  CalendarCheck,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

// Types
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

interface QuickActionButtonProps {
  title: string;
  description: string;
  href: string;
}

interface Activity {
  id: number;
  type: string;
  message: string;
  time: string;
  user: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
}

// Mock data
const mockStats = {
  totalEmployees: 156,
  openPositions: 12,
  pendingApplications: 34,
  onLeaveToday: 8,
  monthlyGrowth: 5.2,
  turnover: 2.1
};

const recentActivities: Activity[] = [
  { id: 1, type: 'hire', message: 'John Doe was hired as Senior Developer', time: '2 hours ago', user: 'HR Admin' },
  { id: 2, type: 'leave', message: 'Jane Smith requested sick leave', time: '3 hours ago', user: 'Employee' },
  { id: 3, type: 'application', message: 'New application for Frontend Developer', time: '5 hours ago', user: 'Applicant' },
  { id: 4, type: 'review', message: 'Q1 Performance reviews completed', time: '1 day ago', user: 'HR Manager' },
];

const upcomingEvents: Event[] = [
  { id: 1, title: 'Interview: Senior Backend Developer', date: '2024-01-20', time: '10:00 AM' },
  { id: 2, title: 'Payroll Processing Deadline', date: '2024-01-25', time: '5:00 PM' },
  { id: 3, title: 'Monthly All-Hands Meeting', date: '2024-01-30', time: '2:00 PM' },
];

// Components
function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  const colors: Record<'blue' | 'green' | 'yellow' | 'purple', string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
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
  );
}

function QuickActionButton({ title, description, href }: QuickActionButtonProps) {
  return (
    <a
      href={href}
      className="block rounded-lg border border-gray-200 p-4 text-center transition hover:border-blue-500 hover:shadow-md"
    >
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </a>
  );
}

// Main Dashboard Page
export default function DashboardPage() {
  const [stats] = useState(mockStats);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Welcome back! Here's what's happening with your workforce today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          trend={-1}
          color="purple"
        />
      </div>

      {/* Charts and activity section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span>By: {activity.user}</span>
                  <span>•</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Events</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="px-6 py-4">
                <p className="text-sm font-medium text-gray-900">{event.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span>{event.date}</span>
                  <span>•</span>
                  <span>{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <QuickActionButton
            title="Post Job"
            description="Create new job posting"
            href="/recruitment/jobs/new"
          />
          <QuickActionButton
            title="Add Employee"
            description="Register new employee"
            href="/employees/new"
          />
          <QuickActionButton
            title="Process Payroll"
            description="Run monthly payroll"
            href="/payroll/process"
          />
          <QuickActionButton
            title="View Reports"
            description="Generate analytics"
            href="/analytics"
          />
        </div>
      </div>
    </div>
  );
}