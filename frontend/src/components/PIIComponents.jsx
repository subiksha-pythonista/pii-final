/**
 * Shared UI Components
 * RiskBadge       — coloured risk level pill
 * EntityCard      — single detected entity display
 * HighlightedText — text with inline PII highlights
 * StatCard        — metric card for dashboard/analytics
 * Spinner         — loading indicator
 */

import React from 'react'
import { riskColor, piiLabel, confidenceColor, buildHighlightSegments } from '../utils/helpers'
import { Shield, AlertTriangle, Info, CheckCircle } from 'lucide-react'

// ── RiskBadge ─────────────────────────────────────────────────────────────────
export function RiskBadge({ level, size = 'sm' }) {
  const c = riskColor(level)
  const icons = { CRITICAL: Shield, HIGH: AlertTriangle, MEDIUM: Info, LOW: CheckCircle }
  const Icon = icons[level] ?? Info
  const px = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-semibold rounded ${px}`}
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      <Icon size={size === 'lg' ? 14 : 11} />
      {level}
    </span>
  )
}

// ── EntityCard ────────────────────────────────────────────────────────────────
export function EntityCard({ entity, showMask = true }) {
  const [masked, setMasked] = React.useState(showMask)
  const c = riskColor(entity.risk_level)

  return (
    <div
      className="rounded-lg p-3 text-sm space-y-1.5 transition-all"
      style={{ background: c.bg, border: `1px solid ${c.border}40` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-white text-xs">{piiLabel(entity.type)}</span>
        <RiskBadge level={entity.risk_level} />
      </div>

      <div className="font-mono text-xs bg-black/30 rounded px-2 py-1 flex items-center justify-between">
        <span style={{ color: c.text }}>
          {masked ? entity.masked_value : entity.value}
        </span>
        <button
          onClick={() => setMasked(m => !m)}
          className="text-gov-muted hover:text-white text-[10px] ml-2 transition-colors"
        >
          {masked ? 'Reveal' : 'Mask'}
        </button>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-gov-muted">
        <span>Confidence</span>
        <div className="flex-1 h-1 rounded-full bg-black/40">
          <div
            className="h-1 rounded-full transition-all"
            style={{
              width: `${entity.confidence * 100}%`,
              background: confidenceColor(entity.confidence),
            }}
          />
        </div>
        <span style={{ color: confidenceColor(entity.confidence) }}>
          {(entity.confidence * 100).toFixed(0)}%
        </span>
        <span className="text-gov-blue font-medium">{entity.source || 'REGEX'}</span>
      </div>
    </div>
  )
}

// ── HighlightedText ───────────────────────────────────────────────────────────
export function HighlightedText({ text, entities }) {
  const segments = buildHighlightSegments(text, entities)

  return (
    <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-all">
      {segments.map((seg, i) => {
        if (!seg.entity) return <span key={i}>{seg.text}</span>
        const cls = `pii-highlight-${seg.entity.risk_level.toLowerCase()}`
        return (
          <span key={i} className={cls} title={`${piiLabel(seg.entity.type)} (${seg.entity.risk_level})`}>
            {seg.text}
          </span>
        )
      })}
    </p>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, accent = '#C8971A' }) {
  return (
    <div className="glass rounded-xl p-5 space-y-2">
      <div className="flex items-start justify-between">
        <p className="text-gov-muted text-xs font-medium uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className="p-1.5 rounded-lg" style={{ background: `${accent}20` }}>
            <Icon size={16} style={{ color: accent }} />
          </div>
        )}
      </div>
      <p className="text-3xl font-heading font-bold" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-gov-muted text-xs">{sub}</p>}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = '#C8971A' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" stroke={`${color}30`} strokeWidth="3" />
      <path d="M12 2 A10 10 0 0 1 22 12" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ── SectionTitle ──────────────────────────────────────────────────────────────
export function SectionTitle({ children, sub }) {
  return (
    <div className="mb-6">
      <h2 className="font-heading text-xl font-bold text-white">{children}</h2>
      {sub && <p className="text-gov-muted text-sm mt-0.5">{sub}</p>}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      {Icon && <Icon size={40} className="text-gov-muted opacity-40" />}
      <p className="text-white font-medium">{title}</p>
      {sub && <p className="text-gov-muted text-sm max-w-xs">{sub}</p>}
    </div>
  )
}
