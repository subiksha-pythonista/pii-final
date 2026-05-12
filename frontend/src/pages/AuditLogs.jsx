import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import { FileText, ChevronLeft, ChevronRight, RefreshCw, Download } from 'lucide-react'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { getAuditLogs } from '../services/api'
import { formatDateTime, formatMs } from '../utils/helpers'

const ACTION_LABELS = {
  DETECT_TEXT: 'Text Detection', DETECT_DOCUMENT: 'Document Scan',
  DETECT_AUDIO: 'Audio Transcription', STREAM_MSG: 'Stream Message',
}
const SOURCE_CLS = {
  TEXT:     'bg-blue-100 text-blue-800 border-blue-300',
  DOCUMENT: 'bg-purple-100 text-purple-800 border-purple-300',
  AUDIO:    'bg-pink-100 text-pink-800 border-pink-300',
  STREAM:   'bg-cyan-100 text-cyan-800 border-cyan-300',
}

export default function AuditLogs() {
  const [logs, setLogs]   = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)
  const pageSize = 20

  const load = async (p = page) => {
    setLoading(true)
    try { const r = await getAuditLogs(p, pageSize); setLogs(r.logs); setTotal(r.total) }
    catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="max-w-6xl space-y-4">
      <div className="gov-card p-4 border-l-4 border-l-gov-darkblue flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-gov-darkblue flex items-center gap-2">
            <FileText size={18} /> Audit Log Register
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Complete record of all detection actions — {total} entries · Compliant with IT Act 2000
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(page)} className="gov-btn-secondary flex items-center gap-1.5 text-xs">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner text="Loading audit records…" /> : (
        <>
          <div className="gov-card overflow-hidden">
            <div className="gov-section-header rounded-t">
              <FileText size={12} /> Audit Records — Page {page} of {totalPages}
            </div>
            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Request ID</th>
                    <th>Action</th>
                    <th>Source</th>
                    <th className="text-center">Entities</th>
                    <th>Risk Level</th>
                    <th>Latency</th>
                    <th>Timestamp</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-400 text-sm">
                      No audit records found. Run detections to populate this register.
                    </td></tr>
                  ) : logs.map((log, idx) => (
                    <tr key={log.id}>
                      <td className="font-mono text-gray-400">{(page-1)*pageSize + idx + 1}</td>
                      <td className="font-mono text-xs text-gray-500" title={log.request_id}>
                        {log.request_id.slice(0,12)}…
                      </td>
                      <td className="text-gray-700 text-xs font-semibold">{ACTION_LABELS[log.action] || log.action}</td>
                      <td>
                        <span className={clsx('text-xs font-mono font-semibold px-2 py-0.5 rounded border', SOURCE_CLS[log.source_type] || 'bg-gray-100 text-gray-700 border-gray-300')}>
                          {log.source_type}
                        </span>
                      </td>
                      <td className="font-mono text-center font-bold text-gov-darkblue">{log.entity_count}</td>
                      <td><RiskBadge level={log.risk_level} size="sm" /></td>
                      <td className="font-mono text-xs text-gray-500">{formatMs(log.processing_time_ms)}</td>
                      <td className="text-xs text-gray-500">{formatDateTime(log.timestamp)}</td>
                      <td className="font-mono text-xs text-gray-400">{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-xs text-gray-500">Showing {(page-1)*pageSize+1}–{Math.min(page*pageSize,total)} of {total} records</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="gov-btn-secondary flex items-center gap-1 text-xs">
                  <ChevronLeft size={12} /> Previous
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  className="gov-btn-secondary flex items-center gap-1 text-xs">
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
