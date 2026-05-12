/**
 * App.jsx — Root router with Auth + Protected Routes
 * 
 * Changes from original:
 * 1. Wraps everything in AuthProvider
 * 2. /login route → LoginPage (public)
 * 3. All other routes → ProtectedRoute with role-based permission check
 */
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import LiveDetection from './pages/LiveDetection'
import UploadScan from './pages/UploadScan'
import LiveStream from './pages/LiveStream'
import Analytics from './pages/Analytics'
import AuditLogs from './pages/AuditLogs'
import SystemHealth from './pages/SystemHealth'

function PortalRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }/>
        <Route path="/detect" element={
          <ProtectedRoute permission="canDetect">
            <LiveDetection />
          </ProtectedRoute>
        }/>
        <Route path="/upload" element={
          <ProtectedRoute permission="canUpload">
            <UploadScan />
          </ProtectedRoute>
        }/>
        <Route path="/stream" element={
          <ProtectedRoute permission="canStream">
            <LiveStream />
          </ProtectedRoute>
        }/>
        <Route path="/analytics" element={
          <ProtectedRoute permission="canViewAnalytics">
            <Analytics />
          </ProtectedRoute>
        }/>
        <Route path="/logs" element={
          <ProtectedRoute permission="canViewLogs">
            <AuditLogs />
          </ProtectedRoute>
        }/>
        <Route path="/health" element={
          <ProtectedRoute permission="canViewHealth">
            <SystemHealth />
          </ProtectedRoute>
        }/>
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />}/>
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />}/>
        {/* All protected routes */}
        <Route path="/*" element={<PortalRoutes />}/>
      </Routes>
    </AuthProvider>
  )
}
