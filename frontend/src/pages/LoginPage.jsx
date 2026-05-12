/**
 * LoginPage — NDIVS Intelligence
 * AI-powered Identity Risk Analysis System
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Mail, Eye, EyeOff, AlertTriangle, ChevronDown } from 'lucide-react'
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext'

const ROLES = [
  { value: 'VERIFIER_OFFICER', label: 'Verifier Officer' },
  { value: 'REVIEW_OFFICER',   label: 'Review Officer' },
  { value: 'AUDITOR',          label: 'Auditor' },
  { value: 'SYSTEM_ADMIN',     label: 'System Admin' },
]

const DEMO_CREDS = [
  { email: 'admin@test.com',  role: 'System Admin',      roleValue: 'SYSTEM_ADMIN' },
  { email: 'verify@test.com', role: 'Verifier Officer',  roleValue: 'VERIFIER_OFFICER' },
  { email: 'review@test.com', role: 'Review Officer',    roleValue: 'REVIEW_OFFICER' },
  { email: 'audit@test.com',  role: 'Auditor',           roleValue: 'AUDITOR' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password || !role) {
      setError('Please fill all fields and select a role.')
      return
    }
    setLoading(true); setError('')
    try {
      await login(email.trim(), password, role)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (cred) => {
    setEmail(cred.email)
    setPassword('1234')
    setRole(cred.roleValue)
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">

      {/* Top accent bar */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, #1e40af, #7c3aed, #0891b2)' }} />

      {/* Main body */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl flex gap-8 items-start">

          {/* LEFT — Branding */}
          <div className="flex-1 hidden lg:flex flex-col justify-center pt-8">
            {/* Logo / Icon */}
            <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30
                            flex items-center justify-center mb-6">
              <Shield size={40} className="text-blue-400" />
            </div>

            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              NDIVS Intelligence
            </h1>
            <p className="text-blue-300 text-lg mb-8">
              AI-powered Identity Risk Analysis System
            </p>

            {/* Feature pills */}
            <div className="space-y-3">
              {[
                '🔍 Real-time PII Detection',
                '🤖 BERT + spaCy AI Pipeline',
                '🛡️ Government-grade Security',
                '📊 Risk Analytics Dashboard',
              ].map(f => (
                <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            {/* Role access table */}
            <div className="mt-10 p-4 bg-gray-900/60 border border-gray-700/50 rounded-xl">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Role Access</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left pb-2 text-gray-500 font-medium">Role</th>
                    <th className="pb-2 text-gray-500 font-medium text-center">Detect</th>
                    <th className="pb-2 text-gray-500 font-medium text-center">Upload</th>
                    <th className="pb-2 text-gray-500 font-medium text-center">Analytics</th>
                    <th className="pb-2 text-gray-500 font-medium text-center">Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { role: 'System Admin',     d:true,  u:true,  a:true,  l:true  },
                    { role: 'Verifier Officer', d:true,  u:true,  a:false, l:false },
                    { role: 'Review Officer',   d:true,  u:false, a:true,  l:false },
                    { role: 'Auditor',          d:false, u:false, a:true,  l:true  },
                  ].map(r => (
                    <tr key={r.role} className="border-b border-gray-800/50">
                      <td className="py-2 text-gray-300 font-medium">{r.role}</td>
                      {[r.d, r.u, r.a, r.l].map((v, i) => (
                        <td key={i} className="py-2 text-center">
                          {v
                            ? <span className="text-green-400 font-bold">✓</span>
                            : <span className="text-gray-600">✗</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT — Login card */}
          <div className="w-full max-w-md">
            <div className="bg-gray-900 border border-gray-700/60 rounded-2xl overflow-hidden shadow-2xl">

              {/* Card header */}
              <div className="px-8 pt-8 pb-6 border-b border-gray-800">
                {/* Mobile logo */}
                <div className="flex items-center gap-3 mb-1 lg:hidden">
                  <Shield size={24} className="text-blue-400" />
                  <span className="text-white font-bold text-lg">NDIVS Intelligence</span>
                </div>
                <h2 className="text-xl font-bold text-white">Secure Login</h2>
                <p className="text-sm text-gray-400 mt-1">Authorized Personnel Only</p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="px-8 py-6 space-y-5">

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Email / Username
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700
                                 rounded-lg text-sm text-white placeholder-gray-500
                                 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                                 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700
                                 rounded-lg text-sm text-white placeholder-gray-500
                                 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                                 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Select Role
                  </label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700
                                 rounded-lg text-sm text-white appearance-none cursor-pointer
                                 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                                 transition-colors"
                    >
                      <option value="" disabled>-- Select your role --</option>
                      {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-950/50 border border-red-800/60
                                  rounded-lg text-xs text-red-300">
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-red-400" />
                    {error}
                  </div>
                )}

                {/* Security note */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40
                                  flex items-center justify-center flex-shrink-0">
                    <div className="w-1 h-1 rounded-full bg-green-400" />
                  </div>
                  Secured with 256-bit encryption · All access logged
                </div>

                {/* Login button */}
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold
                             text-sm rounded-lg transition-colors flex items-center justify-center gap-2
                             disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (
                    <>
                      <svg className="animate-spin" width={15} height={15} viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx={12} cy={12} r={10} strokeOpacity={0.3} />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Authenticating…
                    </>
                  ) : (
                    <><Shield size={15} /> Login to Portal</>
                  )}
                </button>
              </form>

              {/* Demo credentials */}
              <div className="px-8 pb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Demo Credentials — Password: <span className="text-blue-400 font-mono">1234</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_CREDS.map(c => (
                    <button key={c.email} onClick={() => fillDemo(c)}
                      className="text-left p-2.5 bg-gray-800/60 border border-gray-700/50
                                 rounded-lg hover:border-blue-600/50 hover:bg-gray-800
                                 transition-all group">
                      <p className="text-xs font-semibold text-blue-400 group-hover:text-blue-300">{c.role}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{c.email}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-gray-950/60 border-t border-gray-800 text-center">
                <p className="text-xs text-gray-600">
                  This is a simulated system for academic purposes only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, #1e40af, #7c3aed, #0891b2)' }} />
    </div>
  )
}
