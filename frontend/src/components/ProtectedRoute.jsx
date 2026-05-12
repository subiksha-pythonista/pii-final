/**
 * ProtectedRoute — Guards routes by login status and role permission
 * Usage: <ProtectedRoute permission="canUpload"> <UploadScan /> </ProtectedRoute>
 */
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Shield, Lock } from 'lucide-react'
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext'

export default function ProtectedRoute({ children, permission }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gov-offwhite">
        <div className="text-center space-y-3">
          <svg className="animate-spin mx-auto text-gov-darkblue" width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx={12} cy={12} r={10} strokeOpacity={0.3}/>
            <path d="M12 2a10 10 0 0 1 10 10"/>
          </svg>
          <p className="text-gov-darkblue font-semibold text-sm">Verifying session…</p>
        </div>
      </div>
    )
  }

  // Not logged in — redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but no permission for this route
  if (permission && !ROLE_PERMISSIONS[user.role]?.[permission]) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center mb-4">
          <Lock size={28} className="text-red-600" />
        </div>
        <h2 className="text-xl font-display font-bold text-gov-darkblue mb-2">Access Denied</h2>
        <p className="text-sm text-gray-600 max-w-sm mb-1">
          Your role (<strong>{ROLE_PERMISSIONS[user.role]?.label}</strong>) does not have permission to access this section.
        </p>
        <p className="text-xs text-gray-500">Contact your system administrator to request elevated access.</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-4 py-2">
          <Shield size={12} />
          This access attempt has been logged as per IT Act 2000.
        </div>
      </div>
    )
  }

  return children
}
