'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function ApplySuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Application Submitted!
        </h1>
        <p className="text-gray-600 mb-2">
          Thank you for applying! We've received your application and will review it shortly.
        </p>
        <p className="text-gray-500 mb-8">
          You will receive a confirmation email shortly with next steps.
        </p>
        <div className="space-x-4">
          <Link
            href="/careers/jobs"
            className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Browse More Jobs
          </Link>
          <Link
            href="/"
            className="inline-block bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
