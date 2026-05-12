/**
 * AuthContext — NDIVS Intelligence
 * Roles: SYSTEM_ADMIN, VERIFIER_OFFICER, REVIEW_OFFICER, AUDITOR
 */
import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const MOCK_USERS = [
  {
    id: 'U001',
    email: 'admin@test.com',
    password: '1234',
    name: 'Admin User',
    designation: 'System Administrator',
    role: 'SYSTEM_ADMIN',
  },
  {
    id: 'U002',
    email: 'verify@test.com',
    password: '1234',
    name: 'Verifier Officer',
    designation: 'Verifier Officer',
    role: 'VERIFIER_OFFICER',
  },
  {
    id: 'U003',
    email: 'review@test.com',
    password: '1234',
    name: 'Review Officer',
    designation: 'Review Officer',
    role: 'REVIEW_OFFICER',
  },
  {
    id: 'U004',
    email: 'audit@test.com',
    password: '1234',
    name: 'Auditor',
    designation: 'Auditor',
    role: 'AUDITOR',
  },
]

export const ROLE_PERMISSIONS = {
  SYSTEM_ADMIN: {
    label: 'System Admin',
    canDetect: true,
    canUpload: true,
    canStream: true,
    canViewAnalytics: true,
    canViewLogs: true,
    canViewHealth: true,
    canExportPDF: true,
  },
  VERIFIER_OFFICER: {
    label: 'Verifier Officer',
    canDetect: true,
    canUpload: true,
    canStream: false,
    canViewAnalytics: false,
    canViewLogs: false,
    canViewHealth: false,
    canExportPDF: true,
  },
  REVIEW_OFFICER: {
    label: 'Review Officer',
    canDetect: true,
    canUpload: false,
    canStream: false,
    canViewAnalytics: true,
    canViewLogs: false,
    canViewHealth: false,
    canExportPDF: true,
  },
  AUDITOR: {
    label: 'Auditor',
    canDetect: false,
    canUpload: false,
    canStream: false,
    canViewAnalytics: true,
    canViewLogs: true,
    canViewHealth: false,
    canExportPDF: false,
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('ndivs_session')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          setUser(parsed.user)
        } else {
          sessionStorage.removeItem('ndivs_session')
        }
      }
    } catch { }
    setLoading(false)
  }, [])

  const login = async (email, password, selectedRole) => {
    await new Promise(r => setTimeout(r, 700))
    const found = MOCK_USERS.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('Invalid email or password.')
    if (found.role !== selectedRole) throw new Error('Selected role does not match your account.')
    const { password: _, ...safeUser } = found
    const session = {
      user: safeUser,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    }
    sessionStorage.setItem('ndivs_session', JSON.stringify(session))
    setUser(safeUser)
    return safeUser
  }

  const logout = () => {
    sessionStorage.removeItem('ndivs_session')
    setUser(null)
  }

  const hasPermission = (permission) => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role]?.[permission] ?? false
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
