'use client'

import Link from 'next/link'
import { CheckCircle, ArrowRight, Briefcase } from 'lucide-react'

export default function ApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-10">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">Application Submitted!</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Thank you for applying. Our team will carefully review your application and reach out within 5–7 business days.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/careers/jobs"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/25"
            >
              <Briefcase className="h-4 w-4" />
              Explore More Roles
            </Link>
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1">
              Back to home <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
