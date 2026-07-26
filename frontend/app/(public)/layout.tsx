import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
import { Menu } from 'lucide-react'
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
      <body className={`${inter.className} bg-gray-50`}>
        <div className="min-h-screen flex flex-col">
          {/* Header - with Purple Doxa Branding */}
          <header className="bg-white border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo with Purple Accent */}
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="relative">
                    <Image
                      src="/doxa-logo.png"
                      alt="Doxa Logo"
                      width={36}
                      height={36}
                      className="rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300"
                      priority
                    />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-gray-900">Doxa</span>
                    <span className="text-xs text-purple-600 font-medium ml-2 bg-purple-50 px-2.5 py-0.5 rounded-full">Careers</span>
                  </div>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-purple-600 transition-colors text-sm font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    href="/careers/jobs"
                    className="text-gray-600 hover:text-purple-600 transition-colors text-sm font-medium"
                  >
                    Jobs
                  </Link>
                  <Link
                    href="/careers/benefits"
                    className="text-gray-600 hover:text-purple-600 transition-colors text-sm font-medium"
                  >
                    Benefits
                  </Link>
                  <Link
                    href="/about"
                    className="text-gray-600 hover:text-purple-600 transition-colors text-sm font-medium"
                  >
                    About
                  </Link>
                  <Link
                    href="/login"
                    className="text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Sign In
                  </Link>
                </nav>

                {/* Mobile menu button */}
                <button className="md:hidden text-gray-500 hover:text-purple-600">
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
        </div>
      </body>
    </html>
  )
}
