'use client'

import Link from 'next/link'
import { ArrowRight, Briefcase, Users, Award, Sparkles, TrendingUp } from 'lucide-react'

export default function PublicHome() {
  return (
    <div>
      {/* Hero Section with Purple Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full opacity-10 blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/10">
              <Sparkles className="h-4 w-4 text-purple-300" />
              <span className="text-sm text-purple-100">🚀 12+ positions open now</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Build Your Career at
              <span className="bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent"> Doxa</span>
            </h1>
            
            <p className="text-xl text-purple-200 mb-8 leading-relaxed">
              We're building the future of HR technology. Join a team of passionate 
              innovators shaping the way companies manage their people.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link
                href="/careers/jobs"
                className="inline-flex items-center bg-white text-purple-700 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl group"
              >
                View Open Positions
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Learn About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Briefcase, label: 'Open Positions', value: '12+' },
            { icon: Users, label: 'Team Members', value: '156' },
            { icon: Award, label: 'Awards Won', value: '8' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-xl">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
