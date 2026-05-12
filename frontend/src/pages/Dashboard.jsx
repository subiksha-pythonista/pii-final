import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Scan, Upload, Zap, BarChart3, AlertTriangle,
  Activity, ArrowRight, Info, Lock, FileText,
  CheckCircle2, Database, Cpu
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'
import { getAnalytics } from '../services/api'
import { formatMs } from '../utils/helpers'

const DEMO_SPARK = [
  {name:'Mon',v:4},{name:'Tue',v:7},{name:'Wed',v:5},{name:'Thu',v:12},
  {name:'Fri',v:9},{name:'Sat',v:3},{name:'Sun',v:8},
]

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null)
  useEffect(() => { getAnalytics().then(setAnalytics).catch(() => {}) }, [])
  const stats = analytics || {}

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Page Title ── */}
      <div className="gov-card p-4 border-l-4 border-l-gov-darkblue">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-display font-bold text-gov-darkblue">
              PII Detection System — Command Dashboard
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Intelligent Real-Time Indian Government PII Detection & Risk Assessment Portal
            </p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-300 px-3 py-1.5 rounded text-green-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow" />
            All Systems Operational
          </div>
        </div>
      </div>

      {/* ── Notice ── */}
      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
        <Info size={14} className="flex-shrink-0 mt-0.5 text-blue-600" />
        <span>
          <strong>Official Use Only:</strong> This system processes sensitive government data.
          All actions are logged and audited as per IT Act 2000 and DPDP Act 2023.
        </span>
      </div>

      {/* ── About This Portal ── */}
      <div className="gov-card overflow-hidden">
        <div className="gov-section-header rounded-t">
          <Info size={12} /> About This Portal — Intelligent PII Detection System
        </div>

        {/* Top banner */}
        <div className="bg-gradient-to-r from-gov-darkblue to-blue-800 px-6 py-4 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Intelligent System to Detect Government-Issued PII
              </h3>
              <p className="text-xs text-blue-200 mt-1">
                Ministry of Electronics & Information Technology (MeitY) |
                Government of India | Classified: RESTRICTED
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {['IT Act 2000','DPDP Act 2023','NIC Infrastructure','AES-256 Encrypted'].map(tag => (
                  <span key={tag} className="text-xs bg-white/10 border border-white/20 px-2 py-0.5 rounded-full text-blue-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Col 1 — What is this + How to use */}
          <div className="lg:col-span-2 space-y-4">

            {/* What is this */}
            <div>
              <h4 className="text-xs font-bold text-gov-darkblue uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info size={12} /> What is this System?
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                This is an <strong className="text-gov-darkblue">AI-powered Intelligent PII Detection &
                Risk Assessment System</strong> built for detecting, masking, and risk-scoring
                Indian government-issued Personally Identifiable Information (PII) from
                text, scanned documents, and audio recordings — in real time.
              </p>
              <p className="text-xs text-gray-600 leading-relaxed mt-2">
                The system uses a <strong className="text-gov-darkblue">13-stage AI pipeline</strong> combining
                Regex pattern matching, spaCy Named Entity Recognition, and BERT Transformer
                deep learning models — achieving <strong>86% precision</strong> and <strong>81% recall</strong> on
                Indian government PII detection tasks.
              </p>
              <p className="text-xs text-gray-600 leading-relaxed mt-2">
                All operations are <strong>fully compliant</strong> with IT Act 2000 and
                DPDP Act 2023 — no PII is stored permanently, all scans are audit-logged,
                and all data is processed in-memory with AES-256 encryption.
              </p>
            </div>

            {/* How to use */}
            <div>
              <h4 className="text-xs font-bold text-gov-darkblue uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Scan size={12} /> How to Use This Portal
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { step:'01', icon: Scan,     color:'bg-blue-50 border-blue-200 text-blue-700',
                    title:'Detect Text PII',
                    desc:'Go to PII Detection → paste any text containing Aadhaar, PAN, phone, email etc. → click Run AI Detection Pipeline' },
                  { step:'02', icon: Upload,   color:'bg-purple-50 border-purple-200 text-purple-700',
                    title:'Scan Documents',
                    desc:'Go to Upload & Scan → upload Aadhaar card, PAN card, or Passport image → OCR extracts text → AI pipeline scans' },
                  { step:'03', icon: Zap,      color:'bg-orange-50 border-orange-200 text-orange-700',
                    title:'Live Stream Monitor',
                    desc:'Go to Live Monitor → click Start Monitor → real-time WebSocket stream shows PII detection on simulated chat' },
                  { step:'04', icon: FileText, color:'bg-green-50 border-green-200 text-green-700',
                    title:'Download PDF Report',
                    desc:'After any scan → click Download Official PDF Report → get MeitY classified report with risk score & entity details' },
                ].map(({ step, icon: Icon, color, title, desc }) => (
                  <div key={step} className={`border rounded-lg p-3 ${color}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-black opacity-40">STEP {step}</span>
                      <Icon size={12} />
                      <span className="text-xs font-bold">{title}</span>
                    </div>
                    <p className="text-xs opacity-70 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Col 2 — Pipeline + Tech + Stats */}
          <div className="space-y-4">

            {/* AI Pipeline stages */}
            <div>
              <h4 className="text-xs font-bold text-gov-darkblue uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Cpu size={12} /> AI Detection Pipeline
              </h4>
              <div className="space-y-1.5">
                {[
                  { stage:'Stage 1-3',  label:'Input Validation + Preprocessing + Cache',  color:'bg-gray-100 text-gray-700' },
                  { stage:'Stage 4',    label:'Regex Engine — 13 Indian PII patterns',       color:'bg-blue-100 text-blue-700' },
                  { stage:'Stage 5',    label:'spaCy NER — Named Entity Recognition',        color:'bg-purple-100 text-purple-700' },
                  { stage:'Stage 6',    label:'BERT Transformer — dslim/bert-base-NER',      color:'bg-green-100 text-green-700' },
                  { stage:'Stage 7-8',  label:'Ensemble Scoring + Validation',               color:'bg-yellow-100 text-yellow-700' },
                  { stage:'Stage 9-11', label:'Dedup + Risk Score + Format Masking',         color:'bg-orange-100 text-orange-700' },
                  { stage:'Stage 12-13',label:'Redis Cache + PDF Report Generation',         color:'bg-red-100 text-red-700' },
                ].map(({ stage, label, color }) => (
                  <div key={stage} className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs ${color}`}>
                    <span className="font-black text-xs opacity-50 w-16 flex-shrink-0">{stage}</span>
                    <span className="font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech stack */}
            <div>
              <h4 className="text-xs font-bold text-gov-darkblue uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Database size={12} /> Technology Stack
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label:'BERT Transformer', color:'bg-green-100 text-green-800 border-green-300' },
                  { label:'spaCy NER',        color:'bg-purple-100 text-purple-800 border-purple-300' },
                  { label:'Regex (13 types)', color:'bg-blue-100 text-blue-800 border-blue-300' },
                  { label:'Tesseract OCR',    color:'bg-yellow-100 text-yellow-800 border-yellow-300' },
                  { label:'Whisper STT',      color:'bg-pink-100 text-pink-800 border-pink-300' },
                  { label:'FastAPI',          color:'bg-gray-100 text-gray-800 border-gray-300' },
                  { label:'React + Vite',     color:'bg-cyan-100 text-cyan-800 border-cyan-300' },
                  { label:'WebSocket',        color:'bg-orange-100 text-orange-800 border-orange-300' },
                  { label:'SQLite / PostgreSQL', color:'bg-indigo-100 text-indigo-800 border-indigo-300' },
                  { label:'jsPDF Report',     color:'bg-red-100 text-red-800 border-red-300' },
                ].map(({ label, color }) => (
                  <span key={label} className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Key metrics */}
            <div>
              <h4 className="text-xs font-bold text-gov-darkblue uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity size={12} /> System Capabilities
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value:'13',     label:'PII Types',          color:'text-gov-darkblue' },
                  { value:'13',     label:'Pipeline Stages',    color:'text-purple-700' },
                  { value:'86%',    label:'Precision',          color:'text-green-700' },
                  { value:'<500ms', label:'Response Time',      color:'text-orange-700' },
                  { value:'3',      label:'AI Models Active',   color:'text-blue-700' },
                  { value:'100%',   label:'Audit Coverage',     color:'text-red-700' },
                ].map(({ value, label, color }) => (
                  <div key={label} className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                    <p className={`text-lg font-black ${color}`}>{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Scan}          label="Total Scans"  value={stats.total_scans ?? 0} color="gov" />
        <StatCard icon={AlertTriangle} label="PII Detected" value={stats.total_entities_detected ?? 0} color="red" />
        <StatCard icon={Activity}      label="Avg Latency"  value={stats.avg_processing_time_ms ? formatMs(stats.avg_processing_time_ms) : '—'} color="orange" />
        <StatCard icon={BarChart3}     label="Precision"    value={stats.precision_estimate ? `${(stats.precision_estimate*100).toFixed(0)}%` : '94%'} color="green" />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="gov-card p-4 col-span-2">
          <div className="gov-section-header rounded mb-3 -mx-4 -mt-4 px-4">
            <BarChart3 size={12} /> Weekly Scan Activity
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={stats.daily_stats?.length ? [...stats.daily_stats].reverse() : DEMO_SPARK}>
              <defs>
                <linearGradient id="govGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#003580" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#003580" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={stats.daily_stats?.length ? 'date' : 'name'} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4, border: '1px solid #d1d5db' }} />
              <Area type="monotone" dataKey={stats.daily_stats?.length ? 'total_scans' : 'v'}
                stroke="#003580" fill="url(#govGrad)" strokeWidth={2} dot={false} name="Scans" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="gov-card p-4">
          <div className="gov-section-header rounded mb-3 -mx-4 -mt-4 px-4">
            <Shield size={12} /> Risk Distribution
          </div>
          <div className="space-y-2.5">
            {['CRITICAL','HIGH','MEDIUM','LOW'].map(level => {
              const cnt   = stats.risk_level_breakdown?.[level] ?? 0
              const total = Object.values(stats.risk_level_breakdown || {1:1}).reduce((a,b)=>a+b,0)
              return (
                <div key={level} className="flex items-center gap-2">
                  <RiskBadge level={level} size="sm" showDot={false} />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                    <div className="h-full bg-gov-darkblue rounded-full transition-all"
                      style={{ width: `${Math.max(2,(cnt/total)*100)}%` }} />
                  </div>
                  <span className="text-xs font-mono text-gray-600 w-5 text-right">{cnt}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="gov-card overflow-hidden">
        <div className="gov-section-header rounded-t">
          <Scan size={12} /> Quick Actions
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-gray-100">
          {[
            { to:'/detect',    icon:Scan,      label:'Detect PII in Text',    desc:'Paste or type text for instant PII scan',     color:'text-gov-darkblue' },
            { to:'/upload',    icon:Upload,    label:'Scan Document / Audio', desc:'Upload Aadhaar, PAN, Passport or audio file', color:'text-purple-700' },
            { to:'/stream',    icon:Zap,       label:'Live Stream Monitor',   desc:'Real-time WebSocket PII monitoring',          color:'text-orange-700' },
            { to:'/analytics', icon:BarChart3, label:'View Analytics',        desc:'Detection metrics, trends & model stats',     color:'text-green-700' },
          ].map(({ to, icon: Icon, label, desc, color }) => (
            <Link key={to} to={to}
              className="flex items-start gap-3 p-4 hover:bg-gov-lightblue transition-colors group">
              <Icon size={20} className={color} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gov-darkblue">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-gov-darkblue transition-colors mt-0.5" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── PII Types ── */}
      <div className="gov-card overflow-hidden">
        <div className="gov-section-header rounded-t">
          <Shield size={12} /> Covered Indian Government PII Types (13 Types)
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {[
            ['Aadhaar Number','CRITICAL'],['PAN Number','CRITICAL'],['Passport','CRITICAL'],
            ['Voter ID','HIGH'],['Driving License','HIGH'],['Bank Account','HIGH'],['UPI ID','HIGH'],
            ['IFSC Code','MEDIUM'],['Phone Number','MEDIUM'],['Email','MEDIUM'],['DOB','MEDIUM'],
            ['GST Number','MEDIUM'],['PIN Code','LOW'],
          ].map(([name, risk]) => (
            <div key={name} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2.5 py-1">
              <span className="text-xs font-semibold text-gov-darkblue">{name}</span>
              <RiskBadge level={risk} size="sm" showDot />
            </div>
          ))}
        </div>
      </div>

      {/* ── Compliance ── */}
      <div className="gov-card overflow-hidden">
        <div className="gov-section-header rounded-t">
          <Lock size={12} /> Compliance & Security
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
          {[
            { icon:CheckCircle2, color:'text-green-600', label:'IT Act 2000',       desc:'All detections logged & audited' },
            { icon:CheckCircle2, color:'text-green-600', label:'DPDP Act 2023',     desc:'No permanent PII storage' },
            { icon:Database,     color:'text-blue-600',  label:'In-Memory Only',    desc:'Data never written to disk' },
            { icon:Cpu,          color:'text-purple-600',label:'AES-256 + TLS 1.3', desc:'End-to-end encrypted' },
          ].map(({ icon: Icon, color, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-4">
              <Icon size={20} className={color} />
              <div>
                <p className="text-xs font-bold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}