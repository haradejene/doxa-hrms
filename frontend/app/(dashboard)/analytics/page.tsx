'use client';

import { useState } from 'react';
import {
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface AnalyticsMetric {
  title: string;
  value: string;
  change: number;
  period: string;
  icon: any;
  color: string;
}

interface DepartmentData {
  name: string;
  employees: number;
  growth: number;
}

const metrics: AnalyticsMetric[] = [
  { title: 'Total Employees', value: '156', change: 5.2, period: 'vs last month', icon: Users, color: 'blue' },
  { title: 'Active Positions', value: '12', change: -2, period: 'vs last month', icon: Briefcase, color: 'green' },
  { title: 'Revenue per Employee', value: '$124,500', change: 3.8, period: 'vs last quarter', icon: DollarSign, color: 'purple' },
  { title: 'Hiring Rate', value: '18%', change: 2.1, period: 'vs last month', icon: TrendingUp, color: 'orange' },
];

const departmentData: DepartmentData[] = [
  { name: 'Engineering', employees: 45, growth: 8 },
  { name: 'Design', employees: 28, growth: 5 },
  { name: 'Product', employees: 22, growth: 3 },
  { name: 'Sales', employees: 35, growth: 12 },
  { name: 'HR', employees: 16, growth: 2 },
  { name: 'Marketing', employees: 10, growth: 6 },
];

const hiringTrends = [
  { month: 'Jan', hires: 5, departures: 2 },
  { month: 'Feb', hires: 8, departures: 1 },
  { month: 'Mar', hires: 6, departures: 3 },
  { month: 'Apr', hires: 12, departures: 2 },
  { month: 'May', hires: 9, departures: 1 },
  { month: 'Jun', hires: 7, departures: 4 },
];

export default function AnalyticsPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [timeRange, setTimeRange] = useState('6months');

  const maxEmployees = Math.max(...departmentData.map(d => d.employees));
  const totalEmployees = departmentData.reduce((sum, d) => sum + d.employees, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor workforce metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <button className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={index} className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-3 ${
                metric.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                metric.color === 'green' ? 'bg-green-100 text-green-600' :
                metric.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                <metric.icon className="h-6 w-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                metric.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {Math.abs(metric.change)}%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">{metric.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
              <p className="mt-1 text-xs text-gray-400">{metric.period}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Department Distribution */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Department Distribution</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="space-y-4">
            {departmentData.map((dept) => (
              <div key={dept.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{dept.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">{dept.employees} employees</span>
                    <span className={`text-xs ${
                      dept.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dept.growth > 0 ? '+' : ''}{dept.growth}%
                    </span>
                  </div>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${(dept.employees / totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hiring Trends */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Hiring Trends</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
                <span className="text-xs text-gray-500">Hires</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <span className="text-xs text-gray-500">Departures</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {hiringTrends.map((data) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-blue-600"
                    style={{ height: `${(data.hires / 15) * 100}px` }}
                  />
                  <div
                    className="w-full rounded-t bg-red-400"
                    style={{ height: `${(data.departures / 15) * 100}px` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500">{data.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs text-gray-500">Total Hires</p>
              <p className="text-lg font-semibold text-gray-900">47</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Departures</p>
              <p className="text-lg font-semibold text-gray-900">13</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Net Growth</p>
              <p className="text-lg font-semibold text-green-600">+34</p>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-green-100 p-2 text-green-600">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-900">Employee Satisfaction</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">4.2/5</p>
              <p className="text-xs text-gray-500">Based on 89 reviews</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-900">Turnover Rate</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">8.3%</p>
              <p className="text-xs text-gray-500">Down 2.1% from last quarter</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-900">Avg. Time to Hire</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">12.5 days</p>
              <p className="text-xs text-gray-500">Improved by 3.2 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}