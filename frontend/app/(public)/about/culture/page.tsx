import Link from 'next/link'
import { Heart, Users, Zap, Globe, Target, Coffee } from 'lucide-react'

export default function CulturePage() {
  return (
    <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-violet-200 blur-[100px] rounded-full opacity-30 -z-10" />
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-none tracking-tight mb-6">
          A place where <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">people</span> come first.
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          We believe that building a great product starts with building a
           great team. Discover what makes working at Doxa unique, inspiring, and fun.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
        {[
          { icon: Heart, title: 'Empathy Driven', desc: 'We lead with understanding and prioritize the well-being of our team above all else.', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
          { icon: Zap, title: 'Impact Focused', desc: 'We don\'t just work hard; we work smart to deliver meaningful results every day.', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
          { icon: Globe, title: 'Global Mindset', desc: 'With a diverse team from all walks of life, we bring unique perspectives to the table.', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        ].map((value, i) => (
          <div key={i} className={`p-8 rounded-3xl border ${value.border} bg-white shadow-sm hover:shadow-xl transition-all duration-300 group`}>
            <div className={`w-14 h-14 rounded-2xl ${value.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <value.icon className={`h-6 w-6 ${value.color}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
            <p className="text-gray-500 leading-relaxed">{value.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-[2.5rem] p-10 md:p-16 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600 rounded-full blur-[100px] opacity-40 transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-40 transform -translate-x-1/2 translate-y-1/2" />
        
        <h2 className="text-3xl md:text-5xl font-black mb-6 relative z-10">Ready to make an impact?</h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg relative z-10">
          Join our growing team and help us build the future of HR technology in Ethiopia and beyond.
        </p>
        <Link
          href="/careers/jobs"
          className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg relative z-10"
        >
          View Open Roles
        </Link>
      </div>
    </div>
  )
}
