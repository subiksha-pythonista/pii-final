/**
 * PDFExportButton — Adds a "Download Official Report" button to ResultPanel
 * 
 * Usage in ResultPanel.jsx — add near the top of the result section:
 *   import PDFExportButton from './PDFExportButton'
 *   <PDFExportButton result={result} />
 * 
 * Requires: npm install jspdf
 */
import React, { useState } from 'react'
import { FileDown, Shield, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { generatePIIReport } from '../utils/pdfReport'

export default function PDFExportButton({ result }) {
  const { user, hasPermission } = useAuth()
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [err, setErr]         = useState('')

  if (!hasPermission('canExportPDF')) return null
  if (!result) return null

  const handleExport = async () => {
    setLoading(true); setErr(''); setDone(false)
    try {
      await generatePIIReport(result, user)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch (e) {
      setErr('PDF generation failed. Ensure jsPDF is installed: npm install jspdf')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gov-darkblue text-white text-sm font-semibold
                   rounded border border-gov-darkblue hover:bg-gov-midblue transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx={12} cy={12} r={10} strokeOpacity={0.3}/>
              <path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
            Generating Report…
          </>
        ) : done ? (
          <><CheckCircle2 size={14} className="text-green-300"/> Report Downloaded!</>
        ) : (
          <><FileDown size={14}/> Download Official PDF Report</>
        )}
      </button>

      {/* Restricted badge */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Shield size={10} className="text-gov-darkblue"/>
        <span>Official report · Classified RESTRICTED · Logged under IT Act 2000</span>
      </div>

      {err && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <AlertTriangle size={11} className="flex-shrink-0 mt-0.5"/>
          {err}
        </div>
      )}
    </div>
  )
}
