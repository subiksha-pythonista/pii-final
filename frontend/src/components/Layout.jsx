/**
 * Layout — Government portal shell with Auth integration
 * Shows logged-in user, role badge, logout button in sidebar
 * Role-based nav items (hidden if no permission)
 */
import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Scan, Upload, Zap, BarChart3,
  FileText, Activity, ChevronRight, Menu, X,
  LogOut, User, Shield, ChevronDown
} from 'lucide-react'
import clsx from 'clsx'
import GovernmentHeader from './GovernmentHeader'
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',     hindi: 'डैशबोर्ड',      permission: null },
  { to: '/detect',    icon: Scan,            label: 'PII Detection', hindi: 'पीआईआई पहचान',  permission: 'canDetect' },
  { to: '/upload',    icon: Upload,          label: 'Upload & Scan', hindi: 'अपलोड और स्कैन', permission: 'canUpload' },
  { to: '/stream',    icon: Zap,             label: 'Live Monitor',  hindi: 'लाइव मॉनिटर',   permission: 'canStream' },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics',     hindi: 'विश्लेषण',       permission: 'canViewAnalytics' },
  { to: '/logs',      icon: FileText,        label: 'Audit Logs',    hindi: 'ऑडिट लॉग',      permission: 'canViewLogs' },
  { to: '/health',    icon: Activity,        label: 'System Status', hindi: 'सिस्टम स्थिति',  permission: 'canViewHealth' },
]

const ROLE_COLORS = {
  SYSTEM_ADMIN:     'bg-red-100 text-red-800 border-red-300',
  VERIFIER_OFFICER: 'bg-orange-100 text-orange-800 border-orange-300', REVIEW_OFFICER: 'bg-purple-100 text-purple-800 border-purple-300',
  AUDITOR: 'bg-blue-100 text-blue-800 border-blue-300',
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout, hasPermission } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Filter nav items by role permissions
  const visibleNav = NAV.filter(({ permission }) =>
    !permission || hasPermission(permission)
  )

  return (
    <div className="min-h-screen flex flex-col bg-gov-offwhite">
      <GovernmentHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={clsx(
          'flex flex-col bg-white border-r-2 border-gray-200 shadow-gov flex-shrink-0 transition-all duration-200',
          sidebarOpen ? 'w-56' : 'w-12'
        )}>
          {/* Sidebar header */}
          <div className={clsx(
            'bg-gov-darkblue text-white flex items-center py-2 border-b border-gov-midblue',
            sidebarOpen ? 'px-3 gap-2' : 'justify-center px-1'
          )}>
            {sidebarOpen && <span className="text-xs font-semibold uppercase tracking-wider flex-1">Navigation</span>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gov-midblue rounded transition-colors">
              {sidebarOpen ? <X size={14}/> : <Menu size={14}/>}
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
            {visibleNav.map(({ to, icon: Icon, label, hindi, permission }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => clsx(
                  'flex items-center gap-2.5 transition-all border-l-4',
                  sidebarOpen ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
                  isActive
                    ? 'bg-gov-lightblue border-l-gov-darkblue text-gov-darkblue font-semibold'
                    : 'border-l-transparent text-gray-600 hover:bg-gray-50 hover:text-gov-darkblue hover:border-l-gov-gold'
                )}
              >
                <Icon size={15} className="flex-shrink-0"/>
                {sidebarOpen && (
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight">{label}</p>
                    <p className="text-xs text-gray-400 truncate leading-tight"
                      style={{ fontFamily:'Noto Sans Devanagari,sans-serif', fontSize:10 }}>{hindi}</p>
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User profile section */}
          {user && sidebarOpen && (
            <div className="border-t border-gray-200">
              {/* User info */}
              <div className="p-3 bg-gov-lightblue/60">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gov-darkblue flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-white"/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gov-darkblue truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.designation}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={clsx(
                    'text-xs font-bold px-2 py-0.5 rounded border',
                    ROLE_COLORS[user.role]
                  )}>
                    {user.role}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{user.employeeId}</span>
                </div>
              </div>

              {/* Logout button */}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold
                           text-red-700 hover:bg-red-50 transition-colors border-t border-gray-200">
                <LogOut size={13}/>
                Logout / Sign Out
              </button>
            </div>
          )}

          {/* Collapsed user icon */}
          {user && !sidebarOpen && (
            <div className="border-t border-gray-200 py-2 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-gov-darkblue flex items-center justify-center">
                <User size={14} className="text-white"/>
              </div>
              <button onClick={handleLogout}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                <LogOut size={13}/>
              </button>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb + user bar */}
          <div className="bg-white border-b border-gray-200 px-5 py-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="text-gov-darkblue font-semibold">Home</span>
            <ChevronRight size={12}/>
            <span className="text-gray-600">PII Detection System</span>
            <ChevronRight size={12}/>
            <span className="text-gov-darkblue font-semibold">Portal</span>

            {/* Right side: clearance + secure connection */}
            <div className="ml-auto flex items-center gap-3">
              {user && (
                <span className={clsx(
                  'text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1',
                  ROLE_COLORS[user.role]
                )}>
                  <Shield size={10}/>
                  {user.clearance}
                </span>
              )}
              <span className="text-green-700 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow inline-block"/>
                Secure Connection (TLS 1.3)
              </span>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto scrollbar-thin p-5 bg-gov-offwhite">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gov-darkblue text-white text-xs py-2 px-5 flex items-center justify-between border-t-2 border-gov-gold">
            <span>© 2024 Ministry of Electronics &amp; Information Technology, Government of India</span>
            <span className="text-blue-300">IT Act 2000 · DPDP Act 2023 · NIC Infrastructure</span>
          </footer>
        </div>
      </div>
    </div>
  )
}
