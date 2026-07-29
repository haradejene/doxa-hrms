import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Doxa Careers',
  description: 'Join a team building the future of HR technology. Browse open roles at Doxa.',
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white`}>

        {/* ─── Navbar ─── */}
        <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-500/30 group-hover:scale-105 transition-transform">
                <Image src="/doxa-logo.png" alt="Doxa" width={18} height={18} className="brightness-0 invert" priority />
              </div>
              <span className="font-black text-gray-900 text-base tracking-tight">Doxa</span>
              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">Careers</span>
            </Link>

            {/* Links */}
            <nav className="hidden md:flex items-center gap-7">
              <Link href="/careers/jobs" className="text-sm font-semibold text-gray-600 hover:text-violet-600 transition-colors">Open Roles</Link>
              <Link href="/about/culture" className="text-sm font-semibold text-gray-600 hover:text-violet-600 transition-colors">Culture</Link>
              <Link href="/login" className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">Employee Login</Link>
            </nav>

            <Link
              href="/careers/jobs"
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-violet-600 transition-colors shadow-sm"
            >
              See open roles
            </Link>
          </div>
        </header>

        {/* Page content (push below navbar) */}
        <div className="pt-16">
          {children}
        </div>

        {/* ─── Footer ─── */}
        <footer className="border-t border-gray-100 py-10 mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
                <Image src="/doxa-logo.png" alt="Doxa" width={14} height={14} className="brightness-0 invert" />
              </div>
              <span className="text-sm font-bold text-gray-800">Doxa HR</span>
            </div>
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} Doxa. All rights reserved.</p>
            <div className="flex gap-5">
              <Link href="#" className="text-xs text-gray-400 hover:text-gray-600">Privacy</Link>
              <Link href="#" className="text-xs text-gray-400 hover:text-gray-600">Terms</Link>
              <Link href="mailto:careers@doxa.com" className="text-xs text-gray-400 hover:text-gray-600">Contact</Link>
            </div>
          </div>
        </footer>

      </body>
    </html>
  )
}
