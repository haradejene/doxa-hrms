import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, Sparkles, Briefcase } from 'lucide-react'
import '../globals.css'
import Footer from '@/components/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Doxa Careers - Join Our Team',
  description: 'Find your next career opportunity at Doxa. We\'re hiring talented professionals across all departments.',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 flex flex-col min-h-screen`}>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                    <Image
                      src="/doxa-logo.png"
                      alt="Doxa Logo"
                      width={24}
                      height={24}
                      className="rounded-lg brightness-0 invert"
                      priority
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xl font-black text-gray-900 tracking-tight">Doxa</span>
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full ml-2 uppercase tracking-wider">Careers</span>
                </div>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link
                  href="/"
                  className="text-sm font-semibold text-gray-600 hover:text-violet-600 transition-colors"
                >
                  Life at Doxa
                </Link>
                <Link
                  href="/careers/jobs"
                  className="text-sm font-semibold text-gray-600 hover:text-violet-600 transition-colors flex items-center gap-1.5"
                >
                  <Briefcase className="h-4 w-4" />
                  Open Roles
                </Link>
                <div className="h-6 w-px bg-gray-200" />
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-600 hover:text-violet-600 transition-colors"
                >
                  Employee Login
                </Link>
                <Link
                  href="/careers/jobs"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-600 transition-colors shadow-md hover:shadow-lg hover:shadow-violet-500/25"
                >
                  <Sparkles className="h-4 w-4 text-violet-300" />
                  View Openings
                </Link>
              </nav>

              {/* Mobile menu button */}
              <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  )
}
