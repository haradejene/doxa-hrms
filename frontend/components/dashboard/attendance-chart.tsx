'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AttendanceData {
  day: string
  present: number
  absent: number
  leave: number
}

interface AttendanceChartProps {
  data: AttendanceData[]
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Attendance Overview (This Week)</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="present" name="Present" fill="#8B5CF6" radius={[4, 4, 0, 0]} stackId="a" maxBarSize={40} />
            <Bar dataKey="leave" name="On Leave" fill="#FBBF24" radius={[0, 0, 0, 0]} stackId="a" maxBarSize={40} />
            <Bar dataKey="absent" name="Absent" fill="#F87171" radius={[4, 4, 0, 0]} stackId="a" maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
