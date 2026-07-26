'use client'

import Link from 'next/link'
import { ArrowRight, Users, Heart, Zap, Globe, Sparkles, Award, ChevronRight } from 'lucide-react'

const values = [
  { icon: Heart, label: 'People First', desc: 'We put humans at the centre of every decision we make — from product to culture.' },
  { icon: Zap, label: 'Bias for Action', desc: 'We move fast, test ideas early, and learn from everything we ship.' },
  { icon: Globe, label: 'Remote-Inclusive', desc: 'Great work happens everywhere. We support flexibility for every timezone.' },
  { icon: Award, label: 'Grow Together', desc: 'We invest heavily in learning, mentorship, and transparent career progression.' },
]

const departments = [
  { name: 'Engineering', count: 6, icon: '⚙️' },
  { name: 'Product & Design', count: 3, icon: '🎨' },
  { name: 'Marketing', count: 2, icon: '📣' },
  { name: 'Operations', count: 4, icon: '🔄' },
]

export default function PublicHome() {
  return (
    <div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4">
        {/* subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="w-[600px] h-[400px] rounded-full bg-violet-100 opacity-50 blur-3xl -mt-20" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700">We're hiring · 15+ open roles</span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-none tracking-tight mb-5">
            Come build the{' '}
            <span className="text-violet-600">future</span>
            <br />of HR with us.
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed mb-10">
            Doxa is on a mission to make every workplace great — starting with great people. Find where you fit and help us build something that matters.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/careers/jobs"
              className="group inline-flex items-center gap-2 bg-gray-900 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-violet-600 transition-colors shadow-lg"
            >
              Browse open roles
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#culture"
              className="inline-flex items-center gap-2 text-gray-600 border border-gray-200 px-7 py-3.5 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Our culture
            </Link>
          </div>
        </div>
      </section>

      {/* ── Social proof numbers ── */}
      <section className="border-y border-gray-100 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '50+', label: 'Team members' },
            { value: '15+', label: 'Open roles' },
            { value: '4.8★', label: 'Glassdoor rating' },
            { value: '12', label: 'Countries' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Browse by department ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900">Browse by team</h2>
            <p className="text-gray-500 mt-2">Find the right fit for your skills and interests.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {departments.map((dept) => (
              <Link
                key={dept.name}
                href={`/careers/jobs?department=${encodeURIComponent(dept.name)}`}
                className="group flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-6 py-5 hover:border-violet-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{dept.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{dept.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{dept.count} open roles</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/careers/jobs" className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors inline-flex items-center gap-1">
              See all open positions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Our values ── */}
      <section id="culture" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black text-gray-900">What we believe in</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">Our values aren't words on a wall — they're how we make decisions every day.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <div key={v.label} className="group flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all duration-200 bg-white">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  i === 0 ? 'bg-rose-50' : i === 1 ? 'bg-amber-50' : i === 2 ? 'bg-teal-50' : 'bg-violet-50'
                }`}>
                  <v.icon className={`h-5 w-5 ${
                    i === 0 ? 'text-rose-500' : i === 1 ? 'text-amber-500' : i === 2 ? 'text-teal-500' : 'text-violet-500'
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{v.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-gray-900 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-violet-500 rounded-full opacity-20 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-2xl" />
          <div className="relative">
            <h2 className="text-3xl font-black text-white mb-3">Don't see your role?</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">We're always looking for talented people. Send us your CV and we'll reach out when the right opportunity opens up.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/careers/jobs"
                className="inline-flex items-center gap-2 bg-violet-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
              >
                View all roles <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:careers@doxa.com"
                className="inline-flex items-center gap-2 text-white border border-white/20 px-7 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Send your CV
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
