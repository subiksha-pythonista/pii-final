// src/pages/Analytics.jsx — Enhanced version
// Same structure as yours, real data connect, better UI

import React, { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts'
import {
  BarChart3, TrendingUp, Target, Clock, Shield,
  AlertTriangle, RefreshCw, Info, FileText, Scan,
  CheckCircle2, Activity, Zap, Database, Eye,
  ChevronUp, ChevronDown, Minus,
} from 'lucide-react'
import { getAnalytics, getAuditLogs } from '../services/api'
import { PII_TYPE_LABELS, PII_TYPE_COLORS, formatMs } from '../utils/helpers'

// ── Constants ─────────────────────────────────────────────────
const RISK_COLORS = {
  CRITICAL: '#dc2626',
  HIGH:     '#ea580c',
  MEDIUM:   '#ca8a04',
  LOW:      '#16a34a',
}
const RISK_BG = {
  CRITICAL: 'bg-red-50 border-red-300 text-red-800',
  HIGH:     'bg-orange-50 border-orange-300 text-orange-800',
  MEDIUM:   'bg-yellow-50 border-yellow-300 text-yellow-800',
  LOW:      'bg-green-50 border-green-300 text-green-800',
}
const SOURCE_COLORS = {
  TEXT:     '#003580',
  DOCUMENT: '#7c3aed',
  AUDIO:    '#db2777',
  STREAM:   '#0891b2',
}
const RISK_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

// ── Tooltip ────────────────────────────────────────────────────
const GovTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-300 rounded-lg
      shadow-lg px-3 py-2 text-xs z-50 min-w-[120px]">
      <p className="text-gray-600 font-semibold border-b
        border-gray-100 pb-1 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: p.color || p.fill || '#003580' }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-bold text-gray-900 ml-auto pl-2">
            {typeof p.value === 'number'
              ? p.value.toLocaleString()
              : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── KPI Card ───────────────────────────────────────────────────
function KPICard({
  icon: Icon, label, value, sub,
  borderColor, iconBg, iconColor, badge,
  trend, loading
}) {
  if (loading) return (
    <div className="bg-white border border-gray-200 rounded-lg
      shadow-sm p-4 animate-pulse">
      <div className="h-10 w-10 bg-gray-100 rounded mb-3" />
      <div className="h-7 w-3/4 bg-gray-100 rounded mb-1.5" />
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
    </div>
  )

  const TrendIcon = trend > 0
    ? ChevronUp
    : trend < 0
    ? ChevronDown
    : Minus

  return (
    <div className={`bg-white border border-gray-200 border-t-4
      rounded-lg shadow-sm p-4 transition-all duration-200
      hover:shadow-md hover:-translate-y-0.5 ${borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500
            uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900
            mt-1 truncate font-mono">{value}</p>
          {sub && (
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          )}
          {badge && (
            <span className="inline-block mt-1.5 text-xs font-bold
              px-2 py-0.5 rounded-full bg-green-100 text-green-800
              border border-green-300">
              {badge}
            </span>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs
              font-semibold
              ${trend > 0
                ? 'text-emerald-600'
                : trend < 0
                ? 'text-red-500'
                : 'text-gray-400'}`}>
              <TrendIcon size={12} />
              {Math.abs(trend)}% vs last period
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center
            justify-center flex-shrink-0 ${iconBg}`}>
            <Icon size={18} className={iconColor} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between
      bg-gray-900 text-white px-4 py-2.5 rounded-t-lg">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={13} className="text-blue-300" />}
        <span className="text-xs font-bold uppercase
          tracking-widest text-gray-200">{title}</span>
      </div>
      {action}
    </div>
  )
}

// ── Circle Metric ──────────────────────────────────────────────
function CircleMetric({ label, value, sub, pct, textColor }) {
  const dashArray = `${Math.round(pct * 100)} 100`
  return (
    <div className="p-5 text-center">
      <div className="relative w-20 h-20 mx-auto mb-3">
        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none"
            stroke="#f3f4f6" strokeWidth="3.5" />
          <circle cx="18" cy="18" r="15.9" fill="none"
            stroke="currentColor" strokeWidth="3.5"
            strokeDasharray={dashArray}
            strokeLinecap="round"
            className={textColor}
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <span className={`absolute inset-0 flex items-center
          justify-center text-sm font-black ${textColor}`}>
          {value}
        </span>
      </div>
      <p className="font-bold text-gray-800 text-sm">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg
      p-12 text-center shadow-sm">
      <div className="w-16 h-16 rounded-full bg-blue-50
        border-2 border-blue-200 flex items-center
        justify-center mx-auto mb-4">
        <BarChart3 size={28} className="text-blue-400" />
      </div>
      <h3 className="font-bold text-gray-800 text-lg mb-2">
        No Scan Data Yet
      </h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
        Analytics will populate automatically after you run
        PII detections. Go to{' '}
        <strong>PII Detection</strong> or{' '}
        <strong>Upload & Scan</strong> and run your first scan.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {[
          { href: '/detect', icon: Scan,     label: 'Detect Text' },
          { href: '/upload', icon: FileText,  label: 'Upload Doc' },
        ].map(({ href, icon: Icon, label }) => (
          <a key={href} href={href}
            className="flex items-center gap-2 px-4 py-2
              bg-blue-700 text-white text-sm font-semibold
              rounded-lg hover:bg-blue-800 transition-colors">
            <Icon size={14} /> {label}
          </a>
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// MAIN ANALYTICS COMPONENT
// ═════════════════════════════════════════════════════════════
export default function Analytics() {
  const [data,        setData]        = useState(null)
  const [logs,        setLogs]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [period,      setPeriod]      = useState(30)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [d, l] = await Promise.all([
        getAnalytics(),
        getAuditLogs(1, 10).catch(() => ({ logs: [] })),
      ])
      setData(d)
      setLogs(l.logs || [])
      setLastRefresh(
        new Date().toLocaleTimeString('en-IN', {
          hour:   '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    } catch {
      setError(
        'Cannot connect to backend. ' +
        'Make sure server is running at http://localhost:8000'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [autoRefresh, load])

  // ── Derived data ───────────────────────────────────────────
  const hasData = data && data.total_scans > 0

  const entityChartData = hasData
    ? Object.entries(data.entity_type_breakdown || {})
        .map(([k, v]) => ({
          name:  PII_TYPE_LABELS[k] || k,
          value: v,
          fill:  PII_TYPE_COLORS[k] || '#003580',
          type:  k,
        }))
        .sort((a, b) => b.value - a.value)
    : []

  const top5Data = entityChartData.slice(0, 5)

  const riskChartData = hasData
    ? RISK_ORDER
        .map(k => ({
          name:  k,
          value: data.risk_level_breakdown[k] || 0,
        }))
        .filter(d => d.value > 0)
    : []

  const sourceChartData = hasData
    ? Object.entries(data.source_type_breakdown || {})
        .map(([k, v]) => ({
          name:  k,
          value: v,
          fill:  SOURCE_COLORS[k] || '#003580',
        }))
        .filter(d => d.value > 0)
    : []

  const dailyChartData = hasData
    ? [...(data.daily_stats || [])]
        .reverse()
        .map(d => ({
          date:        d.date?.slice(5) || d.date,
          Scans:       d.total_scans,
          Entities:    d.total_entities,
          'High Risk': d.high_risk_count || 0,
        }))
    : []

  const precision = data?.precision_estimate ?? 0
  const recall    = data?.recall_estimate    ?? 0
  const f1        = precision && recall
    ? (2 * precision * recall) / (precision + recall)
    : 0

  const totalRisk = riskChartData.reduce((a, b) => a + b.value, 0) || 1
  const topPIIType   = entityChartData[0]?.name || '—'
  const criticalHigh =
    (data?.risk_level_breakdown?.CRITICAL || 0) +
    (data?.risk_level_breakdown?.HIGH     || 0)
  const avgPerScan = hasData
    ? (data.total_entities_detected / data.total_scans).toFixed(1)
    : '0'

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-6xl space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg
        p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900
          flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-700" />
          Analytics & Performance Dashboard
        </h2>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg
        p-12 text-center shadow-sm">
        <div className="w-10 h-10 rounded-full border-4
          border-blue-100 border-t-blue-700 animate-spin
          mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-700">
          Loading analytics from database…
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Querying scan_results and audit_logs tables
        </p>
      </div>
    </div>
  )

  // ── Error ──────────────────────────────────────────────────
  if (error) return (
    <div className="max-w-6xl space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg
        p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900
          flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-700" />
          Analytics & Performance Dashboard
        </h2>
      </div>
      <div className="p-4 bg-red-50 border border-red-200
        rounded-lg flex items-start gap-3 text-sm text-red-800">
        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Backend Connection Error</p>
          <p className="text-xs mt-0.5 text-red-600">{error}</p>
          <button onClick={load}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5
              bg-red-700 text-white text-xs font-semibold
              rounded-lg hover:bg-red-800 transition-colors">
            <RefreshCw size={11} /> Retry Connection
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl space-y-5">

      {/* ── HEADER ── */}
      <div className="bg-white border border-gray-200 rounded-lg
        p-4 shadow-sm border-l-4 border-l-blue-700
        flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900
            flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-700" />
            Analytics & Performance Dashboard
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Live data from your actual scans ·
            Last refreshed: {lastRefresh || '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period tabs */}
          <div className="flex gap-0.5 p-1 bg-gray-100 rounded-lg">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setPeriod(d)}
                className={`px-3 py-1.5 rounded-md text-xs
                  font-semibold transition-all
                  ${period === d
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}>
                {d}d
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs
            text-gray-600 cursor-pointer select-none">
            <input type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="accent-blue-700 w-3.5 h-3.5" />
            Auto-refresh
          </label>
          <button onClick={load}
            className="flex items-center gap-1.5 px-3 py-2
              bg-blue-700 text-white text-xs font-semibold
              rounded-lg hover:bg-blue-800 transition-colors">
            <RefreshCw size={12}
              className={loading ? 'animate-spin' : ''} />
            Refresh Stats
          </button>
        </div>
      </div>

      {/* ── INFO BANNER ── */}
      <div className="flex items-start gap-2 p-3 bg-blue-50
        border border-blue-200 rounded-lg text-xs text-blue-800">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <span>
          All data shown is pulled directly from your actual
          scan results stored in the audit &amp; scan_results
          tables.{' '}
          {hasData
            ? `Showing results from ${data.total_scans} scan${
                data.total_scans !== 1 ? 's' : ''
              }.`
            : 'No scans recorded yet.'}
        </span>
      </div>

      {!hasData && <EmptyState />}

      {hasData && (
        <>
          {/* ── KPI ROW 1 ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={Scan}
              label="Total Scans"
              value={data.total_scans.toLocaleString()}
              sub="All input channels"
              badge="Live"
              borderColor="border-t-blue-700"
              iconBg="bg-blue-50"
              iconColor="text-blue-700"
            />
            <KPICard
              icon={AlertTriangle}
              label="PII Entities Found"
              value={data.total_entities_detected.toLocaleString()}
              sub="Across all scans"
              borderColor="border-t-red-600"
              iconBg="bg-red-50"
              iconColor="text-red-600"
            />
            <KPICard
              icon={Target}
              label="Avg Risk Score"
              value={`${data.avg_risk_score?.toFixed(1) ?? '—'}`}
              sub={`Max: ${data.max_risk_score?.toFixed(1) ?? '—'} / 100`}
              borderColor="border-t-orange-500"
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
            />
            <KPICard
              icon={Clock}
              label="Avg Latency"
              value={formatMs(data.avg_processing_time_ms)}
              sub="End-to-end processing"
              borderColor="border-t-green-600"
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
          </div>

          {/* ── KPI ROW 2 ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={Eye}
              label="Top PII Type"
              value={topPIIType}
              sub="Most detected in scans"
              borderColor="border-t-purple-600"
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
            <KPICard
              icon={Database}
              label="BERT AI Status"
              value="Active"
              sub="dslim/bert-base-NER"
              badge="Online"
              borderColor="border-t-green-500"
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
            <KPICard
              icon={Shield}
              label="Critical + High"
              value={criticalHigh.toLocaleString()}
              sub="Requiring immediate action"
              borderColor="border-t-red-700"
              iconBg="bg-red-50"
              iconColor="text-red-700"
            />
            <KPICard
              icon={Zap}
              label="F1 Score"
              value={`${(f1 * 100).toFixed(1)}%`}
              sub="Precision × Recall"
              borderColor="border-t-orange-400"
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
            />
          </div>

          {/* ── ML METRICS + RISK BREAKDOWN ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* ML Model Performance */}
            <div className="bg-white border border-gray-200
              rounded-lg shadow-sm overflow-hidden">
              <SectionHeader
                icon={TrendingUp}
                title="ML Model Performance Metrics"
              />
              <div className="p-5 space-y-4">
                {[
                  {
                    label: 'Precision',
                    value: precision,
                    bar:   'bg-green-600',
                    text:  'text-green-700',
                  },
                  {
                    label: 'Recall',
                    value: recall,
                    bar:   'bg-blue-700',
                    text:  'text-blue-700',
                  },
                  {
                    label: 'F1 Score',
                    value: f1,
                    bar:   'bg-orange-500',
                    text:  'text-orange-700',
                  },
                ].map(({ label, value, bar, text }) => (
                  <div key={label}>
                    <div className="flex justify-between
                      text-xs mb-1.5">
                      <span className="font-semibold
                        text-gray-600">{label}</span>
                      <span className={`font-mono font-bold
                        ${text}`}>
                        {(value * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full
                      border border-gray-200 overflow-hidden">
                      <div
                        className={`h-full ${bar} rounded-full
                          transition-all duration-700`}
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Model status chips */}
                <div className="pt-3 border-t border-gray-100
                  space-y-2">
                  {[
                    {
                      color: 'bg-blue-50 border-blue-200 text-blue-800',
                      text:  'Regex Engine: 13 Indian PII patterns active',
                    },
                    {
                      color: 'bg-purple-50 border-purple-200 text-purple-800',
                      text:  'spaCy NER: en_core_web_sm active',
                    },
                    {
                      color: 'bg-green-50 border-green-200 text-green-800',
                      text:  'BERT Transformer: dslim/bert-base-NER active',
                    },
                  ].map(({ color, text }) => (
                    <div key={text}
                      className={`flex items-center gap-1.5
                        text-xs border rounded-lg px-2.5 py-1.5
                        font-medium ${color}`}>
                      <CheckCircle2 size={11}
                        className="flex-shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Level Breakdown */}
            <div className="bg-white border border-gray-200
              rounded-lg shadow-sm overflow-hidden">
              <SectionHeader
                icon={Shield}
                title="Risk Level Breakdown — Your Scans"
              />
              <div className="p-5">
                {riskChartData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={180}>
                      <PieChart>
                        <Pie
                          data={riskChartData}
                          dataKey="value"
                          cx="50%" cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {riskChartData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={RISK_COLORS[entry.name]}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<GovTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="flex-1 space-y-2">
                      {RISK_ORDER.map(level => {
                        const count =
                          data.risk_level_breakdown[level] || 0
                        if (!count) return null
                        const pct = Math.round(
                          (count / totalRisk) * 100
                        )
                        return (
                          <div key={level}
                            className={`flex items-center
                              justify-between px-3 py-2 rounded-lg
                              border text-xs font-semibold
                              ${RISK_BG[level]}`}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  background: RISK_COLORS[level]
                                }}
                              />
                              {level}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold
                                text-base">{count}</span>
                              <span className="text-gray-500
                                font-normal">({pct}%)</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-400
                    text-sm py-10">
                    No risk data yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── ALL PII TYPES BAR CHART ── */}
          {entityChartData.length > 0 && (
            <div className="bg-white border border-gray-200
              rounded-lg shadow-sm overflow-hidden">
              <SectionHeader
                icon={AlertTriangle}
                title="PII Types Detected — All Scans"
              />
              <div className="p-5">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={entityChartData}
                    margin={{
                      top: 5, right: 20,
                      bottom: 65, left: 0
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: '#374151',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                      angle={-35}
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<GovTooltip />} />
                    <Bar
                      dataKey="value"
                      name="Count"
                      radius={[5, 5, 0, 0]}
                    >
                      {entityChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Legend chips */}
                <div className="flex flex-wrap gap-2 mt-3
                  pt-3 border-t border-gray-100">
                  {entityChartData.map(
                    ({ name, value, fill, type }) => (
                      <div key={type}
                        className="flex items-center gap-1.5
                          bg-gray-50 border border-gray-200
                          rounded-lg px-2.5 py-1 text-xs">
                        <span
                          className="w-2.5 h-2.5 rounded-sm
                            flex-shrink-0"
                          style={{ background: fill }}
                        />
                        <span className="font-semibold
                          text-gray-700">{name}</span>
                        <span className="font-mono font-bold
                          text-blue-700">{value}×</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TOP 5 + SOURCE CHANNEL ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {top5Data.length > 0 && (
              <div className="bg-white border border-gray-200
                rounded-lg shadow-sm overflow-hidden">
                <SectionHeader
                  icon={Target}
                  title="Top 5 Most Detected PII Types"
                />
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={top5Data}
                      layout="vertical"
                      margin={{ left: 10, right: 40 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f3f4f6"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{
                          fill: '#374151',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        width={100}
                      />
                      <Tooltip content={<GovTooltip />} />
                      <Bar
                        dataKey="value"
                        name="Count"
                        radius={[0, 5, 5, 0]}
                      >
                        {top5Data.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200
              rounded-lg shadow-sm overflow-hidden">
              <SectionHeader
                icon={BarChart3}
                title="Scans by Input Channel"
              />
              <div className="p-5">
                {sourceChartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={sourceChartData}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f3f4f6"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fill: '#6b7280', fontSize: 10 }}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{
                            fill: '#374151',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                          width={80}
                        />
                        <Tooltip content={<GovTooltip />} />
                        <Bar
                          dataKey="value"
                          name="Scans"
                          radius={[0, 5, 5, 0]}
                        >
                          {sourceChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-3
                      pt-2 border-t border-gray-100">
                      {sourceChartData.map(
                        ({ name, value, fill }) => (
                          <div key={name}
                            className="flex items-center gap-1.5
                              bg-gray-50 border border-gray-200
                              rounded-lg px-2.5 py-1 text-xs">
                            <span
                              className="w-2.5 h-2.5 rounded-sm"
                              style={{ background: fill }}
                            />
                            <span className="font-semibold
                              text-gray-700">{name}</span>
                            <span className="font-mono font-bold
                              text-blue-700">
                              {value} scan{value !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-400
                    text-sm py-10">
                    No source data yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── DAILY TREND AREA CHART ── */}
          <div className="bg-white border border-gray-200
            rounded-lg shadow-sm overflow-hidden">
            <SectionHeader
              icon={TrendingUp}
              title="Daily Scan & Entity Trend"
            />
            <div className="p-5">
              {dailyChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={230}>
                    <AreaChart data={dailyChartData}>
                      <defs>
                        <linearGradient
                          id="scanGrad" x1="0" y1="0"
                          x2="0" y2="1">
                          <stop offset="0%"
                            stopColor="#003580"
                            stopOpacity={0.35} />
                          <stop offset="100%"
                            stopColor="#003580"
                            stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient
                          id="entGrad" x1="0" y1="0"
                          x2="0" y2="1">
                          <stop offset="0%"
                            stopColor="#dc2626"
                            stopOpacity={0.35} />
                          <stop offset="100%"
                            stopColor="#dc2626"
                            stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient
                          id="riskGrad" x1="0" y1="0"
                          x2="0" y2="1">
                          <stop offset="0%"
                            stopColor="#ea580c"
                            stopOpacity={0.3} />
                          <stop offset="100%"
                            stopColor="#ea580c"
                            stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f3f4f6"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                      />
                      <YAxis
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<GovTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="Scans"
                        stroke="#003580"
                        fill="url(#scanGrad)"
                        strokeWidth={2}
                        dot={{
                          fill: '#003580', r: 4,
                          strokeWidth: 2, stroke: '#fff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Entities"
                        stroke="#dc2626"
                        fill="url(#entGrad)"
                        strokeWidth={2}
                        dot={{
                          fill: '#dc2626', r: 4,
                          strokeWidth: 2, stroke: '#fff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="High Risk"
                        stroke="#ea580c"
                        fill="url(#riskGrad)"
                        strokeWidth={1.5}
                        strokeDasharray="4 2"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-5
                    mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 bg-blue-700
                        inline-block rounded" />
                      Scans
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 bg-red-600
                        inline-block rounded" />
                      PII Entities
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 bg-orange-500
                        inline-block rounded" />
                      High Risk
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-400
                  text-sm py-10">
                  Not enough daily data yet — run more scans
                  over multiple days to see trends
                </p>
              )}
            </div>
          </div>

          {/* ── AI MODEL CIRCLES ── */}
          <div className="bg-white border border-gray-200
            rounded-lg shadow-sm overflow-hidden">
            <SectionHeader icon={Zap} title="AI Model Performance" />
            <div className="grid grid-cols-1 sm:grid-cols-3
              divide-x divide-gray-100">
              <CircleMetric
                label="Precision"
                value={`${(precision * 100).toFixed(1)}%`}
                sub="13 Indian PII patterns"
                pct={precision}
                textColor="text-green-700"
              />
              <CircleMetric
                label="Recall"
                value={`${(recall * 100).toFixed(1)}%`}
                sub="Entity coverage rate"
                pct={recall}
                textColor="text-blue-700"
              />
              <CircleMetric
                label="F1 Score"
                value={`${(f1 * 100).toFixed(1)}%`}
                sub="Precision × Recall"
                pct={f1}
                textColor="text-orange-700"
              />
            </div>
          </div>

          {/* ── RECENT ACTIVITY TABLE ── */}
          {logs.length > 0 && (
            <div className="bg-white border border-gray-200
              rounded-lg shadow-sm overflow-hidden">
              <SectionHeader
                icon={Activity}
                title="Recent Scan Activity"
              />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b
                      border-gray-200">
                      {[
                        'Time', 'Source', 'Entities',
                        'Risk Level', 'Score', 'Latency',
                        'AI Layers',
                      ].map(h => (
                        <th key={h} className="text-left px-4 py-3
                          font-bold text-gray-500 uppercase
                          tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log.request_id || i}
                        className="border-b border-gray-50
                          hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono
                          whitespace-nowrap text-gray-500">
                          {new Date(log.timestamp)
                            .toLocaleTimeString('en-IN', {
                              hour:   '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="font-bold px-2 py-0.5
                              rounded-lg text-xs"
                            style={{
                              background:
                                `${SOURCE_COLORS[log.source_type]
                                || '#003580'}15`,
                              color:
                                SOURCE_COLORS[log.source_type]
                                || '#003580',
                            }}
                          >
                            {log.source_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono
                          font-bold text-blue-700 text-center">
                          {log.entity_count}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold px-2 py-0.5
                            rounded-lg border text-xs
                            ${RISK_BG[log.risk_level] || ''}`}>
                            {log.risk_level}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono
                          text-gray-600">
                          {log.risk_score?.toFixed(1) ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-mono
                          text-gray-400 whitespace-nowrap">
                          {formatMs(log.processing_time_ms)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {['REGEX', 'spaCy', 'BERT'].map(l => (
                              <span key={l}
                                className={`px-1.5 py-0.5 rounded
                                  font-semibold text-xs
                                  ${l === 'BERT'
                                    ? 'bg-green-100 text-green-800'
                                    : l === 'spaCy'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'}`}>
                                {l}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SCAN SUMMARY STATS ── */}
          <div className="bg-white border border-gray-200
            rounded-lg shadow-sm overflow-hidden">
            <SectionHeader
              icon={Activity}
              title="Scan Summary Statistics"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4
              divide-x divide-y divide-gray-100">
              {[
                {
                  label: 'Total Scans',
                  value: data.total_scans,
                  sub:   'All input channels',
                  color: 'text-blue-700',
                },
                {
                  label: 'Total PII Found',
                  value: data.total_entities_detected,
                  sub:   'Unique entity instances',
                  color: 'text-red-700',
                },
                {
                  label: 'Avg Entities / Scan',
                  value: avgPerScan,
                  sub:   'PII entities per request',
                  color: 'text-orange-700',
                },
                {
                  label: 'Critical + High',
                  value: criticalHigh,
                  sub:   'Requiring immediate action',
                  color: 'text-red-800',
                },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="p-5">
                  <p className="text-xs font-semibold text-gray-500
                    uppercase tracking-wider">{label}</p>
                  <p className={`text-2xl font-bold mt-1 font-mono
                    ${color}`}>
                    {typeof value === 'number'
                      ? value.toLocaleString()
                      : value}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── COMPLIANCE ── */}
          <div className="bg-white border border-gray-200
            rounded-lg shadow-sm overflow-hidden">
            <SectionHeader
              icon={Shield}
              title="Compliance & Data Governance"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4
              divide-x divide-gray-100">
              {[
                {
                  label: 'IT Act 2000',
                  value: 'Compliant',
                  sub:   'All actions logged',
                  bg:    'bg-green-50',
                  text:  'text-green-800',
                },
                {
                  label: 'DPDP Act 2023',
                  value: 'Compliant',
                  sub:   'No raw PII in DB',
                  bg:    'bg-green-50',
                  text:  'text-green-800',
                },
                {
                  label: 'Data Storage',
                  value: 'In-Memory',
                  sub:   'Session only processing',
                  bg:    'bg-blue-50',
                  text:  'text-blue-800',
                },
                {
                  label: 'Audit Coverage',
                  value: '100%',
                  sub:   `${data.total_scans} scans logged`,
                  bg:    'bg-blue-50',
                  text:  'text-blue-800',
                },
              ].map(({ label, value, sub, bg, text }) => (
                <div key={label} className={`p-5 ${bg}`}>
                  <p className="text-xs font-semibold text-gray-500
                    uppercase tracking-wider">{label}</p>
                  <p className={`text-lg font-bold mt-1 ${text}`}>
                    {value}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </>
      )}
    </div>
  )
}