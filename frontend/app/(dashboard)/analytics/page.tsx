'use client'

import { useState, useEffect } from 'react'
import { Users, TrendingUp, DollarSign, Briefcase, CalendarCheck, RefreshCw } from 'lucide-react'
import api from '@/services/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalyticsData {
  overview: {
    totalEmployees: number
    activeEmployees: number
    onLeaveEmployees: number
    openPositions: number
    avgSalary: number
    totalPayroll: number
    attendanceRate: number
  }
  statusBreakdown: Record<string, number>
  byDepartment: Record<string, number>
  byEmploymentType: Record<string, number>
  hiringTrend: { month: string; year: number; count: number }[]
  applicationStages: Record<string, number>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

// ─── SVG Charts ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active:     '#7c3aed',
  on_leave:   '#f59e0b',
  probation:  '#3b82f6',
  suspended:  '#ef4444',
  terminated: '#6b7280',
  resigned:   '#ec4899',
}

const DEPT_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']

function DonutChart({ data, colors }: { data: { label: string; value: number; color?: string }[]; colors?: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="flex items-center justify-center h-full text-sm text-gray-400">No data</div>

  const size  = 140
  const r     = 52
  const cx    = size / 2
  const cy    = size / 2
  const circ  = 2 * Math.PI * r

  let cumulative = 0
  const slices = data.map((d, i) => {
    const pct    = d.value / total
    const offset = circ * (1 - cumulative)
    const dashArr = `${circ * pct} ${circ * (1 - pct)}`
    cumulative += pct
    return { ...d, dashArr, offset, color: d.color ?? (colors?.[i] ?? DEPT_COLORS[i % DEPT_COLORS.length]) }
  })

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={22} />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={22}
            strokeDasharray={s.dashArr}
            strokeDashoffset={s.offset}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-gray-900 font-black" fontSize={22} fontWeight={900}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#9ca3af" fontSize={10}>total</text>
      </svg>
      <div className="flex-1 space-y-2">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-gray-600 capitalize truncate">{s.label.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs font-bold text-gray-900">{s.value}</span>
              <span className="text-[10px] text-gray-400">{Math.round((s.value / total) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((d, i) => (
        <div key={d.label} className="flex flex-col items-center flex-1 gap-1 group">
          <span className="text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
            {d.value}
          </span>
          <div
            className="w-full rounded-t-lg transition-all duration-700 ease-out"
            style={{
              height: `${Math.max((d.value / max) * 100, 4)}%`,
              backgroundColor: d.color ?? DEPT_COLORS[i % DEPT_COLORS.length],
              minHeight: '4px',
            }}
          />
          <span className="text-[9px] text-gray-400 truncate w-full text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function LineChart({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const w = 400; const h = 100; const pad = 16

  const points = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((d.count / max) * (h - pad * 2)),
    ...d,
  }))

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
  // Area fill
  const areaPath = points.length > 0
    ? `M ${points[0].x},${h - pad} ` +
      points.map(p => `L ${p.x},${p.y}`).join(' ') +
      ` L ${points[points.length - 1].x},${h - pad} Z`
    : ''

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 120 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={pad} x2={w - pad} y1={h - pad - t * (h - pad * 2)} y2={h - pad - t * (h - pad * 2)} stroke="#f3f4f6" strokeWidth={1} />
        ))}
        {/* Area */}
        <path d={areaPath} fill="url(#lineGrad)" />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke="#7c3aed" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {points.map((p) => (
          <g key={p.month}>
            <circle cx={p.x} cy={p.y} r={4} fill="#7c3aed" />
            <circle cx={p.x} cy={p.y} r={7} fill="#7c3aed" fillOpacity={0.15} />
          </g>
        ))}
        {/* Labels */}
        {points.map((p) => (
          <text key={p.month + 'l'} x={p.x} y={h - 2} textAnchor="middle" fill="#9ca3af" fontSize={9}>{p.month}</text>
        ))}
      </svg>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, gradient, iconBg }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  gradient: string; iconBg: string;
}) {
  return (
    <div className={`rounded-2xl p-5 text-white relative overflow-hidden ${gradient}`}>
      <div className="absolute -top-5 -right-5 w-24 h-24 bg-white/10 rounded-full" />
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-3xl font-black leading-none">{value}</p>
      <p className="text-sm text-white/80 mt-1">{label}</p>
      {sub && <p className="text-xs text-white/60 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.get('/api/dashboard/analytics')
      setData(res.data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading analytics…</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card p-16 text-center">
        <p className="text-gray-400">Failed to load analytics data. Please try again.</p>
        <button onClick={handleRefresh} className="btn-primary mt-4 mx-auto">Retry</button>
      </div>
    )
  }

  const { overview, statusBreakdown, byDepartment, byEmploymentType, hiringTrend, applicationStages } = data

  const statusDonut = Object.entries(statusBreakdown).map(([label, value]) => ({
    label, value, color: STATUS_COLORS[label] ?? '#6b7280',
  }))

  const deptBar = Object.entries(byDepartment).map(([label, value], i) => ({
    label, value, color: DEPT_COLORS[i % DEPT_COLORS.length],
  }))

  const empTypeDonut = Object.entries(byEmploymentType).map(([label, value], i) => ({
    label, value,
  }))

  const appPipeline = Object.entries(applicationStages).map(([label, value], i) => ({
    label, value, color: DEPT_COLORS[i % DEPT_COLORS.length],
  }))

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Analytics & Insights</h1>
          <p className="text-sm text-gray-400 mt-0.5">Live workforce intelligence from your HR data</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Users} label="Total Employees" value={overview.totalEmployees}
          sub={`${overview.activeEmployees} active · ${overview.onLeaveEmployees} on leave`}
          gradient="bg-gradient-to-br from-violet-600 to-purple-700" iconBg="bg-white/20"
        />
        <KpiCard
          icon={Briefcase} label="Open Positions" value={overview.openPositions}
          sub="Published job postings"
          gradient="bg-gradient-to-br from-blue-500 to-cyan-600" iconBg="bg-white/20"
        />
        <KpiCard
          icon={DollarSign} label="Avg Salary" value={`ETB ${fmtCurrency(overview.avgSalary)}`}
          sub={`Total bill: ETB ${fmtCurrency(overview.totalPayroll)}`}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600" iconBg="bg-white/20"
        />
        <KpiCard
          icon={CalendarCheck} label="Attendance Rate" value={`${overview.attendanceRate}%`}
          sub="Last 30 days"
          gradient="bg-gradient-to-br from-amber-500 to-orange-500" iconBg="bg-white/20"
        />
      </div>

      {/* ── Row 2: Department Bar + Status Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department headcount */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2Icon />
            <h3 className="text-sm font-bold text-gray-900">Headcount by Department</h3>
          </div>
          {deptBar.length > 0
            ? <BarChart data={deptBar} />
            : <p className="text-sm text-gray-400 text-center py-8">No department data</p>
          }
        </div>

        {/* Status donut */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <DonutIcon />
            <h3 className="text-sm font-bold text-gray-900">Employee Status</h3>
          </div>
          {statusDonut.length > 0
            ? <DonutChart data={statusDonut} />
            : <p className="text-sm text-gray-400 text-center py-8">No status data</p>
          }
        </div>
      </div>

      {/* ── Row 3: Hiring Trend + Employment Type + App Pipeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Hiring trend */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-bold text-gray-900">Monthly Hiring Trend</h3>
            <span className="ml-auto text-xs text-gray-400">Last 6 months</span>
          </div>
          <LineChart data={hiringTrend} />
          <div className="flex gap-4 mt-3 border-t border-gray-50 pt-3">
            {hiringTrend.map(t => (
              <div key={t.month} className="flex-1 text-center">
                <p className="text-sm font-bold text-gray-900">{t.count}</p>
                <p className="text-[10px] text-gray-400">{t.month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Employment type */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <DonutIcon />
            <h3 className="text-sm font-bold text-gray-900">Employment Type</h3>
          </div>
          {empTypeDonut.length > 0
            ? <DonutChart data={empTypeDonut} />
            : <p className="text-sm text-gray-400 text-center py-8">No data</p>
          }
        </div>
      </div>

      {/* ── Row 4: Application Pipeline ── */}
      {appPipeline.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2Icon />
            <h3 className="text-sm font-bold text-gray-900">Application Pipeline</h3>
            <span className="ml-auto text-xs text-gray-400">By stage</span>
          </div>
          <div className="flex items-end gap-3 h-28">
            {appPipeline.map((s, i) => {
              const max = Math.max(...appPipeline.map(x => x.value), 1)
              return (
                <div key={s.label} className="flex flex-col items-center flex-1 gap-1 group">
                  <span className="text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">{s.value}</span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-700"
                    style={{
                      height: `${Math.max((s.value / max) * 100, 4)}%`,
                      backgroundColor: s.color,
                      minHeight: '4px',
                    }}
                  />
                  <span className="text-[8px] text-gray-400 truncate w-full text-center capitalize leading-tight">
                    {s.label.replace(/_/g, ' ')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Tiny icon helpers
function BarChart2Icon() {
  return (
    <svg className="h-4 w-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" opacity=".4" />
      <rect x="10" y="6" width="4" height="15" rx="1" fill="currentColor" opacity=".7" />
      <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" />
    </svg>
  )
}

function DonutIcon() {
  return (
    <svg className="h-4 w-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth="2" opacity=".3" />
      <path d="M12 3a9 9 0 0 1 9 9" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}