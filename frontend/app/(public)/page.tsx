'use client'

import Link from 'next/link'
import { ArrowRight, Briefcase, Users, Award, Sparkles, MapPin, Clock, Heart, Zap, Globe } from 'lucide-react'

const perks = [
  { icon: Heart, label: 'Health & Wellness', desc: 'Full medical, dental, and vision coverage for you and your family.', color: 'text-rose-500', bg: 'bg-rose-50' },
  { icon: Zap, label: 'Career Growth', desc: 'Mentorship, learning budget, and clear promotion pathways.', color: 'text-amber-500', bg: 'bg-amber-50' },
  { icon: Globe, label: 'Remote-Friendly', desc: 'Flexible hybrid work with home office setup stipend.', color: 'text-teal-500', bg: 'bg-teal-50' },
  { icon: Award, label: 'Competitive Pay', desc: 'Market-leading salaries plus equity and performance bonuses.', color: 'text-violet-500', bg: 'bg-violet-50' },
]

export default function PublicHome() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 text-white min-h-[85vh] flex items-center">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-80 h-80 bg-violet-400 rounded-full opacity-10 blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-400 rounded-full opacity-10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500 rounded-full opacity-5 blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
              <Sparkles className="h-4 w-4 text-violet-300" />
              <span className="text-sm text-violet-200 font-medium">We're actively hiring · 15+ open roles</span>
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-6">
              Build Your<br />
              <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Career at Doxa
              </span>
            </h1>

            <p className="text-lg text-violet-200 mb-10 leading-relaxed max-w-xl">
              We're building the next generation of HR technology. Join a team of passionate innovators who believe great workplaces start with great people.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/careers/jobs"
                className="group inline-flex items-center gap-2 bg-white text-violet-800 px-7 py-3.5 rounded-2xl font-bold hover:bg-violet-50 transition-all duration-300 shadow-2xl shadow-violet-900/50"
              >
                View Open Positions
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#perks"
                className="inline-flex items-center gap-2 border border-white/25 text-white px-7 py-3.5 rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Why Doxa?
              </Link>
            </div>

            {/* Mini stats */}
            <div className="flex flex-wrap gap-8 mt-14">
              {[
                { value: '15+', label: 'Open positions' },
                { value: '50+', label: 'Team members' },
                { value: '4.8★', label: 'Glassdoor rating' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl font-black text-white">{s.value}</p>
                  <p className="text-sm text-violet-300 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section id="perks" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900">Why people love working here</h2>
            <p className="text-gray-500 mt-3 text-lg">We invest in our team because great people build great products.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk) => (
              <div key={perk.label} className="group p-6 rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${perk.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <perk.icon className={`h-6 w-6 ${perk.color}`} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{perk.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Ready to join the team?</h2>
          <p className="text-gray-500 mb-8">Browse our open roles and find the perfect fit for your next chapter.</p>
          <Link
            href="/careers/jobs"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-violet-700 hover:to-purple-700 transition-all duration-300 shadow-xl shadow-purple-500/30 hover:shadow-purple-500/40 hover:scale-[1.02]"
          >
            <Briefcase className="h-5 w-5" />
            Browse Open Positions
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
