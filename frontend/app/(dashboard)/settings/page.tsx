'use client'

import { useState, useEffect } from 'react'
import { User, Lock, Bell, Globe, Check, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react'
import api from '@/services/api'
import { getPayrollSettings, updatePayrollSettings, type PayrollSettings } from '@/services/payroll'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: number
  name: string
  email: string
  role?: string
  created_at?: string
}

type Tab = 'profile' | 'security' | 'notifications' | 'preferences' | 'payroll'

// ─── Notification prefs (localStorage) ───────────────────────────────────────

interface NotifPrefs {
  payrollProcessed: boolean
  leaveRequests:    boolean
  newApplications:  boolean
  performanceReviews: boolean
  systemAlerts:     boolean
}

const DEFAULT_NOTIF: NotifPrefs = {
  payrollProcessed:   true,
  leaveRequests:      true,
  newApplications:    true,
  performanceReviews: true,
  systemAlerts:       false,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-violet-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  const isSuccess = type === 'success'
  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${
      isSuccess
        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
        : 'bg-red-50 border-red-100 text-red-700'
    }`}>
      {isSuccess
        ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        : <AlertCircle className="h-4 w-4 flex-shrink-0" />
      }
      {message}
    </div>
  )
}

function PasswordInput({ id, placeholder, value, onChange }: {
  id: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="input-field pr-10"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function ProfileSection({ user, onUpdate }: { user: UserProfile; onUpdate: (u: UserProfile) => void }) {
  const [name, setName]       = useState(user.name)
  const [email, setEmail]     = useState(user.email)
  const [saving, setSaving]   = useState(false)
  const [alert, setAlert]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const initials = name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const isDirty  = name !== user.name || email !== user.email

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setAlert(null)
    try {
      const res = await api.put('/api/auth/profile', { name, email })
      onUpdate(res.data.user)
      setAlert({ type: 'success', msg: 'Profile updated successfully!' })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setAlert({ type: 'error', msg: e?.response?.data?.message ?? 'Failed to update profile.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white text-xl font-black flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
          {user.role && (
            <span className="mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 capitalize">
              {user.role.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.msg} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
          <input
            className="input-field"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Abebe Tadesse"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="abebe.tadesse@doxa.com"
            required
          />
        </div>
      </div>

      {user.created_at && (
        <p className="text-xs text-gray-400">
          Member since {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button type="submit" disabled={!isDirty || saving} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Changes
        </button>
        {isDirty && (
          <button type="button" onClick={() => { setName(user.name); setEmail(user.email) }} className="btn-secondary">
            Discard
          </button>
        )}
      </div>
    </form>
  )
}

function SecuritySection() {
  const [current, setCurrent]   = useState('')
  const [newPwd, setNewPwd]     = useState('')
  const [confirm, setConfirm]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [alert, setAlert]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setAlert(null)
    if (newPwd !== confirm) {
      setAlert({ type: 'error', msg: 'New passwords do not match.' })
      return
    }
    if (newPwd.length < 8) {
      setAlert({ type: 'error', msg: 'New password must be at least 8 characters.' })
      return
    }
    setSaving(true)
    try {
      await api.put('/api/auth/password', {
        current_password: current,
        password: newPwd,
        password_confirmation: confirm,
      })
      setAlert({ type: 'success', msg: 'Password changed successfully!' })
      setCurrent(''); setNewPwd(''); setConfirm('')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setAlert({ type: 'error', msg: e?.response?.data?.message ?? 'Failed to change password.' })
    } finally {
      setSaving(false)
    }
  }

  const strength = newPwd.length === 0 ? 0 : newPwd.length < 8 ? 1 : newPwd.length < 12 ? 2 : 3
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500']
  const strengthLabels = ['', 'Weak', 'Good', 'Strong']

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {alert && <Alert type={alert.type} message={alert.msg} />}

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5" htmlFor="current-password">Current Password</label>
        <PasswordInput id="current-password" placeholder="Enter your current password" value={current} onChange={setCurrent} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5" htmlFor="new-password">New Password</label>
        <PasswordInput id="new-password" placeholder="At least 8 characters" value={newPwd} onChange={setNewPwd} />
        {newPwd.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3].map(l => (
                <div key={l} className={`h-1.5 rounded-full flex-1 transition-colors ${strength >= l ? strengthColors[strength] : 'bg-gray-100'}`} />
              ))}
            </div>
            <span className={`text-xs font-semibold ${strength === 1 ? 'text-red-500' : strength === 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {strengthLabels[strength]}
            </span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5" htmlFor="confirm-password">Confirm New Password</label>
        <PasswordInput id="confirm-password" placeholder="Repeat new password" value={confirm} onChange={setConfirm} />
        {confirm.length > 0 && newPwd !== confirm && (
          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>

      <div className="pt-2 border-t border-gray-100">
        <button type="submit" disabled={saving || !current || !newPwd || !confirm} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Change Password
        </button>
      </div>
    </form>
  )
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState<NotifPrefs>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notif_prefs')
      if (saved) return { ...DEFAULT_NOTIF, ...JSON.parse(saved) }
    }
    return DEFAULT_NOTIF
  })
  const [saved, setSaved] = useState(false)

  const toggle = (key: keyof NotifPrefs, value: boolean) => {
    setPrefs(p => ({ ...p, [key]: value }))
  }

  const handleSave = () => {
    localStorage.setItem('notif_prefs', JSON.stringify(prefs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const notifItems: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key: 'payrollProcessed',   label: 'Payroll Processed',     desc: 'Get notified when monthly payroll runs are completed.' },
    { key: 'leaveRequests',      label: 'Leave Requests',        desc: 'Alerts for new and updated leave requests.' },
    { key: 'newApplications',    label: 'New Applications',      desc: 'Notify when candidates apply to open positions.' },
    { key: 'performanceReviews', label: 'Performance Reviews',   desc: 'Reminders for pending and completed reviews.' },
    { key: 'systemAlerts',       label: 'System Alerts',         desc: 'Critical system events and error notifications.' },
  ]

  return (
    <div className="space-y-5">
      {saved && <Alert type="success" message="Notification preferences saved!" />}

      <div className="divide-y divide-gray-50">
        {notifItems.map(item => (
          <div key={item.key} className="flex items-center justify-between gap-4 py-4 first:pt-0">
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <ToggleSwitch checked={prefs[item.key]} onChange={v => toggle(item.key, v)} />
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-gray-100">
        <button onClick={handleSave} className="btn-primary">
          <Check className="h-4 w-4" />
          Save Preferences
        </button>
      </div>
    </div>
  )
}

function PreferencesSection() {
  const [timezone, setTimezone]   = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pref_tz') ?? 'Africa/Addis_Ababa' : 'Africa/Addis_Ababa')
  const [language, setLanguage]   = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pref_lang') ?? 'en' : 'en')
  const [dateFormat, setDateFormat] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pref_date') ?? 'YYYY-MM-DD' : 'YYYY-MM-DD')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem('pref_tz', timezone)
    localStorage.setItem('pref_lang', language)
    localStorage.setItem('pref_date', dateFormat)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-5">
      {saved && <Alert type="success" message="Preferences saved!" />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Timezone</label>
          <select className="input-field" value={timezone} onChange={e => setTimezone(e.target.value)}>
            <option value="Africa/Addis_Ababa">Africa/Addis Ababa (EAT +3)</option>
            <option value="UTC">UTC +0</option>
            <option value="America/New_York">America/New York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Language</label>
          <select className="input-field" value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="am">Amharic</option>
            <option value="fr">French</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date Format</label>
          <select className="input-field" value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
            <option value="YYYY-MM-DD">2025-01-31 (ISO)</option>
            <option value="DD/MM/YYYY">31/01/2025</option>
            <option value="MM/DD/YYYY">01/31/2025</option>
            <option value="DD MMM YYYY">31 Jan 2025</option>
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <button onClick={handleSave} className="btn-primary">
          <Check className="h-4 w-4" />
          Save Preferences
        </button>
      </div>
    </div>
  )
}

function PayrollSection() {
  const [settings, setSettings] = useState<PayrollSettings | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [alert, setAlert]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Local form state (percent display)
  const [empRate, setEmpRate]   = useState('')
  const [erRate, setErRate]     = useState('')
  const [ceiling, setCeiling]   = useState('')

  useEffect(() => {
    getPayrollSettings()
      .then(s => {
        setSettings(s)
        setEmpRate(String(Math.round(s.employee_rate * 100)))
        setErRate(String(Math.round(s.employer_rate * 100)))
        setCeiling(String(s.transport_ceiling))
      })
      .catch(() => setAlert({ type: 'error', msg: 'Failed to load payroll settings.' }))
      .finally(() => setLoading(false))
  }, [])

  const isDirty = settings !== null && (
    empRate !== String(Math.round(settings.employee_rate * 100)) ||
    erRate  !== String(Math.round(settings.employer_rate * 100)) ||
    ceiling !== String(settings.transport_ceiling)
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setAlert(null)
    try {
      const res = await updatePayrollSettings({
        employee_rate:    parseFloat(empRate) / 100,
        employer_rate:    parseFloat(erRate)  / 100,
        transport_ceiling: parseFloat(ceiling),
      })
      setSettings(res.settings)
      setAlert({ type: 'success', msg: 'Payroll settings saved successfully!' })
    } catch {
      setAlert({ type: 'error', msg: 'Failed to save payroll settings.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 text-violet-500 animate-spin" /></div>
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {alert && <Alert type={alert.type} message={alert.msg} />}

      {/* Info banner */}
      <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 text-sm text-violet-700">
        <p className="font-semibold mb-1">📋 Ethiopian Payroll Regulations</p>
        <p className="text-xs text-violet-600 leading-relaxed">
          These rates apply to all future payroll runs. Re-running an existing month will use the updated values.
          Default rates: Employee pension 7%, Employer tax 11%, Transport ceiling Br 2,200.
        </p>
      </div>

      {/* Pension */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Pension Contributions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Employee Pension Rate <span className="text-gray-400 font-normal">(% of basic salary)</span>
            </label>
            <div className="relative">
              <input
                type="number" min="0" max="100" step="0.5"
                className="input-field pr-8"
                value={empRate}
                onChange={e => setEmpRate(e.target.value)}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Deducted from employee net pay.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Employer Tax Rate <span className="text-gray-400 font-normal">(% of basic salary)</span>
            </label>
            <div className="relative">
              <input
                type="number" min="0" max="100" step="0.5"
                className="input-field pr-8"
                value={erRate}
                onChange={e => setErRate(e.target.value)}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Paid by employer only. Does not affect net pay.</p>
          </div>
        </div>
      </div>

      {/* Transport */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Transport Allowance</p>
        <div className="max-w-xs">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Tax-Exempt Ceiling <span className="text-gray-400 font-normal">(Birr / month)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">Br</span>
            <input
              type="number" min="0" step="50"
              className="input-field pl-9"
              value={ceiling}
              onChange={e => setCeiling(e.target.value)}
              required
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Exempt up to the lesser of this amount or 25% of basic salary.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button type="submit" disabled={!isDirty || saving} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Payroll Settings
        </button>
        {isDirty && settings && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setEmpRate(String(Math.round(settings.employee_rate * 100)))
              setErRate(String(Math.round(settings.employer_rate * 100)))
              setCeiling(String(settings.transport_ceiling))
            }}
          >
            Discard
          </button>
        )}
      </div>
    </form>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'profile',       label: 'Profile',       icon: User },
  { key: 'security',      label: 'Security',      icon: Lock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'preferences',   label: 'Preferences',   icon: Globe },
  { key: 'payroll',       label: 'Payroll',        icon: DollarSign },
]

export default function SettingsPage() {
  const [tab, setTab]         = useState<Tab>('profile')
  const [user, setUser]       = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/auth/me')
      .then(r => setUser(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const initials = user?.name
    ? user.name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'HR'

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── Profile banner ── */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white flex items-center gap-5 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-4 w-20 h-20 bg-white/5 rounded-full" />
        {loading ? (
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-black text-2xl flex-shrink-0">
            {initials}
          </div>
        )}
        <div>
          <p className="text-xl font-bold">{loading ? '…' : user?.name ?? 'HR Admin'}</p>
          <p className="text-sm text-violet-200">{loading ? '…' : user?.email ?? ''}</p>
          {user?.role && (
            <span className="mt-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white capitalize">
              {user.role.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="card overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === t.key
                  ? 'text-violet-600 border-violet-600 bg-violet-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === 'profile' && (
            loading
              ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 text-violet-500 animate-spin" /></div>
              : user
                ? <ProfileSection user={user} onUpdate={setUser} />
                : <p className="text-sm text-gray-400">Could not load profile.</p>
          )}
          {tab === 'security'      && <SecuritySection />}
          {tab === 'notifications' && <NotificationsSection />}
          {tab === 'preferences'   && <PreferencesSection />}
          {tab === 'payroll'       && <PayrollSection />}
        </div>
      </div>
    </div>
  )
}