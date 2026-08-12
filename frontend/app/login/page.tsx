'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import api from '@/services/api'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔐 Login form submitted')
    console.log('📧 Email:', formData.email)

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/api/auth/login', {
        email: formData.email,
        password: formData.password,
      })

      console.log('✅ Login successful!', response.data)

      const { token, user } = response.data

      // Store token in localStorage (for API calls)
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(user))

      // Also set cookie for middleware (httpOnly cookie not possible from client, so use regular cookie)
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

      console.log('🔄 Redirecting to dashboard...')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('❌ Login error:', err)

      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please make sure the backend is running on port 8000.')
      } else if (err.response?.status === 401) {
        setError('Invalid email or password. Please try again.')
      } else if (err.response?.status === 419) {
        setError('Session expired. Please refresh and try again.')
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.')
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-3">
              <Image
                src="/doxa-logo.png"
                alt="Doxa Logo"
                width={48}
                height={48}
                className="rounded-lg shadow-md"
                priority
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DOXA HR</h1>
                <p className="text-xs text-purple-600 font-medium">Sign in to continue</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
              ← Back to Careers
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}