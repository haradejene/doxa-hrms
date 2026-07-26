'use client'

import Link from 'next/link'
import {
  Linkedin, Twitter, Github, Mail,
  Briefcase, Users, Heart, Globe,
  ArrowRight, CheckCircle
} from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers/jobs' },
      { label: 'Our Team', href: '/team' },
      { label: 'Culture', href: '/culture' },
      { label: 'Blog', href: '/blog' },
    ],
    careers: [
      { label: 'All Jobs', href: '/careers/jobs' },
      { label: 'Departments', href: '/careers/departments' },
      { label: 'Locations', href: '/careers/locations' },
      { label: 'Benefits', href: '/careers/benefits' },
      { label: 'FAQ', href: '/careers/faq' },
    ],
    resources: [
      { label: 'Help Center', href: '/help' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Accessibility', href: '/accessibility' },
    ],
    connect: [
      { label: 'Contact Us', href: '/contact', icon: Mail },
      { label: 'LinkedIn', href: 'https://linkedin.com/company/doxa', icon: Linkedin, external: true },
      { label: 'Twitter', href: 'https://twitter.com/doxa', icon: Twitter, external: true },
      { label: 'GitHub', href: 'https://github.com/doxa', icon: Github, external: true },
    ],
  }

  const benefits = [
    { icon: Heart, label: 'Health & Wellness', desc: 'Comprehensive medical, dental, and vision coverage' },
    { icon: Globe, label: 'Remote Friendly', desc: 'Work from anywhere with flexible arrangements' },
    { icon: Briefcase, label: 'Growth Budget', desc: 'Annual learning & development stipend' },
    { icon: Users, label: 'Team Events', desc: 'Regular team building and company retreats' },
  ]

  const stats = [
    { value: '150+', label: 'Team Members' },
    { value: '15+', label: 'Countries' },
    { value: '50+', label: 'Open Roles' },
    { value: '95%', label: 'Retention Rate' },
  ]

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">D</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">Doxa</span>
                <span className="text-xs text-purple-300 font-medium ml-2 bg-purple-900/30 px-2 py-0.5 rounded-full">Careers</span>
              </div>
            </Link>

            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Building the future of HR technology. We're a diverse team of innovators
              passionate about transforming how companies manage their people.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4 pt-4 border-t border-gray-800">
              {[
                { icon: Linkedin, href: 'https://linkedin.com/company/doxa', label: 'LinkedIn' },
                { icon: Twitter, href: 'https://twitter.com/doxa', label: 'Twitter' },
                { icon: Github, href: 'https://github.com/doxa', label: 'GitHub' },
                { icon: Mail, href: 'mailto:careers@doxa.com', label: 'Email' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target={social.href.startsWith('http') || social.href.startsWith('mailto') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-400 hover:bg-gray-700 transition-all duration-200 group"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <nav className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-purple-300 transition-colors flex items-center gap-2 group"
                  >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Careers Links */}
          <nav className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Careers</h3>
            <ul className="space-y-3">
              {footerLinks.careers.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-purple-300 transition-colors flex items-center gap-2 group"
                  >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources Links */}
          <nav className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-purple-300 transition-colors flex items-center gap-2 group"
                  >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 pt-12 border-t border-gray-800">
          <h3 className="text-white font-semibold text-lg mb-8">Why Join Doxa?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="bg-gray-800/50 rounded-xl p-6 hover:bg-gray-800 border border-gray-700 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-purple-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">{benefit.label}</h4>
                <p className="text-sm text-gray-400">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl p-8 md:p-12 border border-purple-900/30">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <CheckCircle className="h-4 w-4" />
                We&apos;re Hiring!
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Ready to join our team?
              </h3>
              <p className="text-gray-300 mb-6 max-w-md mx-auto">
                We&apos;re looking for talented people to help shape the future of HR technology.
                Check out our open positions and apply today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/careers/jobs"
                  className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-200 shadow-lg"
                >
                  View Open Positions
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/careers/benefits"
                  className="inline-flex items-center justify-center gap-2 border-2 border-purple-500 text-purple-300 px-6 py-3 rounded-lg font-semibold hover:bg-purple-500/10 transition-all duration-200"
                >
                  View Benefits
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Link href="/" className="flex items-center gap-2 hover:text-purple-400 transition-colors">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="font-medium text-white">Doxa Inc.</span>
              </Link>
              <span className="hidden sm:inline">© {currentYear}</span>
              <span className="hidden sm:inline">·</span>
              <Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy</Link>
              <span className="hidden sm:inline">·</span>
              <Link href="/terms" className="hover:text-purple-400 transition-colors">Terms</Link>
              <span className="hidden sm:inline">·</span>
              <Link href="/cookies" className="hover:text-purple-400 transition-colors">Cookies</Link>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-purple-400 font-medium">We're hiring!</span>
              </span>
              <Link
                href="/careers/jobs"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                View {stats[2].value} open roles →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}