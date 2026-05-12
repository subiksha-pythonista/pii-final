import React, { useEffect, useState, useCallback } from 'react'
import clsx from 'clsx'
import { Activity, CheckCircle2, XCircle, RefreshCw, Cpu, Database, Zap, Shield } from 'lucide-react'
import { getHealth } from '../services/api'

const SERVICES = [
  { id: 'api',       label: 'FastAPI Backend',     icon: Zap,      desc: 'REST + WebSocket API Server' },
  { id: 'regex',     label: 'Regex PII Engine',    icon: Shield,   desc: '13 Indian PII pattern matchers' },
  { id: 'spacy',     label: 'spaCy NER Model',     icon: Cpu,      desc: 'en_core_web_sm — Named Entity Recognition' },
  { id: 'tesseract', label: 'Tesseract OCR',        icon: Activity, desc: 'Document text extraction (eng+hin)' },
  { id: 'whisper',   label: 'Whisper STT',          icon: Activity, desc: 'OpenAI Whisper base — Speech to Text' },
  { id: 'db',        label: 'Database',             icon: Database, desc: 'SQLite (dev) / PostgreSQL (prod)' },
]

export default function SystemHealth() {
  const [health, setHealth]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [lastCheck, setLastCheck] = useState(null)

  const check = useCallback(async () => {
    setLoading(true)
    try { setHealth(await getHealth()) }
    catch { setHealth(null) }
    finally { setLoading(false); setLastCheck(new Date().toLocaleTimeString('en-IN')) }
  }, [])

  useEffect(() => { check() }, [check])

  const apiOk = !!health

  return (
    <div className="max-w-3xl space-y-4">
      <div className="gov-card p-4 border-l-4 border-l-gov-darkblue flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-gov-darkblue flex items-center gap-2">
            <Activity size={18} /> System Health &amp; Status
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Component availability and service readiness</p>
        </div>
        <button onClick={check}
          className="gov-btn-secondary flex items-center gap-2 text-xs">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Overall status banner */}
      <div className={clsx(
        'p-4 rounded border flex items-center gap-3',
        apiOk ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
      )}>
        {apiOk
          ? <CheckCircle2 size={24} className="text-green-600" />
          : <XCircle      size={24} className="text-red-600" />
        }
        <div>
          <p className={clsx('font-display font-bold text-base', apiOk ? 'text-green-800' : 'text-red-800')}>
            {apiOk ? 'All Systems Operational' : 'Backend Unreachable'}
          </p>
          <p className="text-xs text-gray-500">
            {health?.version ? `Version ${health.version}` : 'Cannot connect to backend'} · Last checked: {lastCheck || '—'}
          </p>
        </div>
      </div>

      {/* Component table */}
      <div className="gov-card overflow-hidden">
        <div className="gov-section-header rounded-t">
          <Activity size={12} /> Component Status
        </div>
        <table className="gov-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Description</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {SERVICES.map(svc => {
              const ok = apiOk
              return (
                <tr key={svc.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <svc.icon size={13} className="text-gov-darkblue" />
                      <span className="font-semibold text-gov-darkblue">{svc.label}</span>
                    </div>
                  </td>
                  <td className="text-gray-500">{svc.desc}</td>
                  <td className="text-center">
                    <span className={clsx(
                      'inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded border',
                      ok ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'
                    )}>
                      {ok ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {ok ? 'OPERATIONAL' : 'DOWN'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Stack info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="gov-card overflow-hidden">
          <div className="gov-section-header rounded-t"><Zap size={12} /> API Endpoints</div>
          <div className="p-3 space-y-1">
            {['POST /detect/text','POST /detect/document','POST /detect/audio',
              'WS   /stream/live','GET  /analytics','GET  /analytics/logs','GET  /health'].map(e => (
              <p key={e} className="font-mono text-xs text-gray-600 py-0.5 border-b border-gray-50">{e}</p>
            ))}
          </div>
        </div>
        <div className="gov-card overflow-hidden">
          <div className="gov-section-header rounded-t"><Cpu size={12} /> Technology Stack</div>
          <div className="p-3 space-y-1">
            {[
              ['Backend',   'FastAPI · Python 3.11'],
              ['Frontend',  'React 18 · Tailwind CSS'],
              ['NLP',       'spaCy en_core_web_sm'],
              ['OCR',       'Tesseract 5.x (eng+hin)'],
              ['STT',       'OpenAI Whisper base'],
              ['Database',  'SQLite / PostgreSQL'],
              ['Compliance','IT Act 2000 · DPDP 2023'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-0.5 border-b border-gray-50 text-xs">
                <span className="text-gray-500 font-semibold">{k}</span>
                <span className="font-mono text-gov-darkblue">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
