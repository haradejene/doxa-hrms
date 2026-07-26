'use client'

import { useState, useEffect } from 'react'
import { Star, TrendingUp, Award, CheckCircle2, Loader2 } from 'lucide-react'
import api from '@/services/api'

interface PerformanceRecord {
  id: number
  employee_name: string
  reviewer: string
  score: number | null
  date: string
  status: 'completed' | 'in_progress'
}

const avatarGradients = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
]

function ScoreRing({ score }: { score: number | null }) {
  if (!score) return <div className="text-2xl font-bold text-gray-300">N/A</div>
  const pct = (score / 5) * 100
  const colors = score >= 4 ? 'text-emerald-600' : score >= 3 ? 'text-amber-600' : 'text-red-500'
  return (
    <div className="flex flex-col items-center">
      <span className={`text-3xl font-black ${colors}`}>{score.toFixed(1)}</span>
      <span className="text-xs text-gray-400">/ 5.0</span>
    </div>
  )
}

export default function PerformancePage() {
  const [records, setRecords] = useState<PerformanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/performance').then(r => setRecords(r.data)).finally(() => setLoading(false))
  }, [])

  const avgScore = records.filter(r => r.score).reduce((s, r) => s + (r.score ?? 0), 0) / (records.filter(r => r.score).length || 1)

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-amber-500 to-orange-500 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
          <Star className="h-6 w-6 text-white/70 mb-2" />
          <p className="text-3xl font-bold">{avgScore.toFixed(1)}</p>
          <p className="text-sm text-white/70 mt-1">Avg. Score</p>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Completed</p>
            <p className="text-xl font-bold text-gray-900">{records.filter(r => r.status === 'completed').length}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">In Progress</p>
            <p className="text-xl font-bold text-gray-900">{records.filter(r => r.status === 'in_progress').length}</p>
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((r, i) => (
          <div key={r.id} className="card p-6 hover:shadow-md hover:border-violet-200 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-white text-sm font-bold`}>
                  {r.employee_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{r.employee_name}</p>
                  <p className="text-xs text-gray-400">{r.reviewer}</p>
                </div>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                r.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}>
                {r.status.replace('_', ' ')}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-4 flex items-end justify-between">
              <ScoreRing score={r.score} />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${r.score && s <= Math.round(r.score) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}