'use client'

import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  TooltipProps,
} from 'recharts'

interface AttendanceDay {
  day: string
  present: number
  absent: number
  leave: number
}

type SeriesKey = 'present' | 'leave' | 'absent'

interface SeriesConfig {
  key: SeriesKey
  label: string
  color: string
}

interface AttendanceChartProps {
  data?: AttendanceDay[]
}

const mockAttendanceData: AttendanceDay[] = [
  { day: 'Mon', present: 45, absent: 3, leave: 2 },
  { day: 'Tue', present: 48, absent: 1, leave: 1 },
  { day: 'Wed', present: 44, absent: 4, leave: 2 },
  { day: 'Thu', present: 49, absent: 0, leave: 1 },
  { day: 'Fri', present: 42, absent: 3, leave: 5 },
]

const series: SeriesConfig[] = [
  { key: 'present', label: 'Present', color: '#7c3aed' },
  { key: 'leave',   label: 'On leave', color: '#f59e0b' },
  { key: 'absent',  label: 'Absent',   color: '#f43f5e' },
]

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-lg px-3.5 py-3 min-w-[140px]">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p) => {
          const s = series.find((s) => s.key === p.dataKey)
          return (
            <div key={p.dataKey} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s?.color }} />
                {s?.label}
              </span>
              <span className="text-xs font-bold text-gray-900">{p.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AttendanceChart({ data = mockAttendanceData }: AttendanceChartProps) {
  const [activeSeries, setActiveSeries] = useState<SeriesKey[]>(series.map((s) => s.key))

  const toggle = (key: SeriesKey) => {
    setActiveSeries((prev) =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter((k) => k !== key) : prev
        : [...prev, key]
    )
  }

  const avgPresent = Math.round(data.reduce((s, d) => s + d.present, 0) / data.length)
  const bestDay = data.reduce((best, d) => (d.present > best.present ? d : best), data[0])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col">
      {/* Header row */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            Attendance Overview
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Avg {avgPresent} present/day · Best day {bestDay.day}
          </p>
        </div>

        {/* Clickable legend */}
        <div className="flex items-center gap-4">
          {series.map((s) => {
            const isActive = activeSeries.includes(s.key)
            return (
              <button
                key={s.key}
                onClick={() => toggle(s.key)}
                className={`flex items-center gap-1.5 text-[11px] font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-30'}`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-gray-600">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 mt-5 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={s.color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid vertical={false} stroke="#f0f0f5" strokeDasharray="0" />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              width={26}
              tickCount={5}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            />

            {series.map((s) =>
              activeSeries.includes(s.key) ? (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#grad-${s.key})`}
                  dot={{ r: 3, fill: s.color, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, fill: s.color, strokeWidth: 2, stroke: '#fff' }}
                  isAnimationActive={true}
                />
              ) : null
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
