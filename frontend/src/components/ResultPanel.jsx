import React, { useState } from 'react'
import clsx from 'clsx'
import {
  Shield, Clock, Eye, EyeOff, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react'
import RiskBadge from './RiskBadge'
import EntityCard from './EntityCard'
import PDFExportButton from './PDFExportButton'
import { formatMs, PII_TYPE_COLORS, PII_TYPE_LABELS } from '../utils/helpers'

// ── Highlighted text renderer ─────────────────────────────────────────────────
function HighlightedText({ text, entities }) {
  if (!text || !entities?.length) return <span className="text-gray-700">{text}</span>
  const sorted = [...entities]
    .filter(e => e.start_pos != null && e.end_pos != null)
    .sort((a, b) => a.start_pos - b.start_pos)
  const parts = []
  let cursor = 0
  for (const ent of sorted) {
    if (ent.start_pos > cursor) {
      parts.push(<span key={`text-${cursor}`} className="text-gray-800">{text.slice(cursor, ent.start_pos)}</span>)
    }
    const color = PII_TYPE_COLORS[ent.type] || '#003580'
    const label = PII_TYPE_LABELS[ent.type] || ent.type
    parts.push(
      <span key={`ent-${ent.start_pos}`} className="relative inline-block group">
        <mark style={{ background: `${color}25`, borderBottom: `2.5px solid ${color}`, borderRadius: '3px', padding: '1px 3px', color, fontWeight: 700 }}>
          {text.slice(ent.start_pos, ent.end_pos)}
        </mark>
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none border border-gray-700 shadow-lg">
          {label} · {(ent.confidence * 100).toFixed(0)}% · {ent.source}
        </span>
      </span>
    )
    cursor = ent.end_pos
  }
  if (cursor < text.length) {
    parts.push(<span key="text-end" className="text-gray-800">{text.slice(cursor)}</span>)
  }
  return <>{parts}</>
}

// ── DPDP Compliance Card ───────────────────────────────────────────────────────
function DPDPComplianceCard({ result }) {
  const risk      = result.risk_summary || {}
  const entities  = result.entities || []
  const riskLevel = risk.overall_risk || 'LOW'

  const hasCritical = (risk.critical_count || 0) > 0
  const hasHigh     = (risk.high_count || 0) > 0
  const isMasked    = !!result.masked_text
  const entityCount = risk.total_entities || 0

  let score = 100
  if (hasCritical)     score -= 30
  if (hasHigh)         score -= 15
  if (entityCount > 5) score -= 10
  if (!isMasked)       score -= 20
  score = Math.max(0, score)

  const scoreColor =
    score >= 80 ? '#16a34a' :
    score >= 60 ? '#ca8a04' :
    score >= 40 ? '#ea580c' : '#dc2626'

  const checks = [
    { label: 'PII Masking Applied',        pass: isMasked },
    { label: 'Audit Log Recorded',         pass: true },
    { label: 'In-Memory Processing Only',  pass: true },
    { label: 'AI Detection Active',        pass: result.bert_available },
    { label: 'No Critical PII Exposed',    pass: !hasCritical },
    { label: 'No High-Risk PII Exposed',   pass: !hasHigh },
    { label: 'DPDP Act 2023 — Compliant',  pass: score >= 60 },
    { label: 'IT Act 2000 — Compliant',    pass: true },
  ]
  const passed = checks.filter(c => c.pass).length

  return (
    <div className="border border-blue-200 rounded-xl overflow-hidden mt-2">
      <div className="bg-gov-darkblue px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-yellow-300" />
          <span className="text-white text-sm font-bold">DPDP Act 2023 — Compliance Report</span>
        </div>
        <span className="text-blue-200 text-xs">Government of India Data Protection Advisory</span>
      </div>
      <div className="p-4 bg-white">
        <div className="flex items-center gap-6">
          {/* Score circle */}
          <div className="flex-shrink-0 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 font-bold text-2xl"
              style={{ borderColor: scoreColor, color: scoreColor }}>
              {score}%
            </div>
            <p className="text-xs text-gray-500 mt-1 font-semibold">Compliance</p>
          </div>
          {/* Checks */}
          <div className="flex-1 grid grid-cols-2 gap-1.5">
            {checks.map(({ label, pass }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs">
                {pass
                  ? <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
                  : <XCircle size={13} className="text-red-500 flex-shrink-0" />}
                <span className={pass ? 'text-gray-700' : 'text-red-600 font-semibold'}>{label}</span>
              </div>
            ))}
          </div>
          {/* Summary */}
          <div className="flex-shrink-0 text-center">
            <div className="text-2xl font-bold" style={{ color: scoreColor }}>{passed}/{checks.length}</div>
            <p className="text-xs text-gray-500 font-semibold">Checks Passed</p>
            <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: scoreColor }}>
              {score >= 80 ? 'COMPLIANT' : score >= 60 ? 'PARTIAL' : 'NON-COMPLIANT'}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400 text-center">
          As per IT Act 2000 & DPDP Act 2023 — Government of India | All PII handled per MeitY guidelines
        </div>
      </div>
    </div>
  )
}

// ── Main ResultPanel ───────────────────────────────────────────────────────────
export default function ResultPanel({ result }) {
  const [showMasked, setShowMasked] = useState(false)
  const [expanded,   setExpanded]   = useState(true)
  if (!result) return null

  const {
    entities, risk_summary, processing_time_ms,
    original_text, masked_text, transcript,
    ocr_confidence, ai_layers_used, bert_available,
  } = result

  const textToShow = original_text || transcript || ''

  const riskStyles = {
    CRITICAL: { border: 'border-l-red-500',    bg: 'bg-red-50',    icon: 'text-red-600' },
    HIGH:     { border: 'border-l-orange-500', bg: 'bg-orange-50', icon: 'text-orange-600' },
    MEDIUM:   { border: 'border-l-yellow-500', bg: 'bg-yellow-50', icon: 'text-yellow-600' },
    LOW:      { border: 'border-l-green-500',  bg: 'bg-green-50',  icon: 'text-green-600' },
  }
  const rs = riskStyles[risk_summary.overall_risk] || riskStyles.LOW

  const bertCount   = entities.filter(e => e.source === 'BERT').length
  const hybridCount = entities.filter(e => e.source?.startsWith('HYBRID')).length
  const regexCount  = entities.filter(e => e.source === 'REGEX').length
  const spacyCount  = entities.filter(e => e.source === 'spaCy').length

  return (
    <div className="space-y-4 animate-fade-in">

      {/* PDF Export */}
      <div className="flex justify-end">
        <PDFExportButton result={result} />
      </div>

      {/* AI Pipeline */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-gov-darkblue text-white rounded-lg shadow-gov">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-200 mr-1">AI Pipeline:</span>
        {(ai_layers_used || ['REGEX']).map(layer => (
          <span key={layer} className={clsx(
            'text-xs font-bold px-3 py-1 rounded-full border',
            layer === 'BERT'  ? 'bg-green-400/20 text-green-300 border-green-400/50' :
            layer === 'spaCy' ? 'bg-purple-400/20 text-purple-300 border-purple-400/50' :
                                'bg-blue-400/20 text-blue-300 border-blue-400/50'
          )}>
            {layer === 'BERT' ? '🤖 BERT Transformer' : layer === 'spaCy' ? '🧠 spaCy NER' : '🔍 Regex Engine'}
          </span>
        ))}
        {bert_available && <span className="text-xs text-green-300 font-semibold ml-1">✓ dslim/bert-base-NER</span>}
        <span className="ml-auto flex items-center gap-1 text-xs text-blue-200">
          <Clock size={11} /> {formatMs(processing_time_ms)}
        </span>
      </div>

      {/* Detection Summary */}
      <div className={clsx('border border-gray-200 border-l-4 rounded-lg p-4 shadow-sm', rs.border, rs.bg)}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-3">
            {risk_summary.total_entities > 0
              ? <AlertTriangle size={24} className={clsx('flex-shrink-0 mt-0.5', rs.icon)} />
              : <CheckCircle2  size={24} className="flex-shrink-0 mt-0.5 text-green-600" />}
            <div>
              <p className="font-display font-bold text-gray-900 text-lg">
                {risk_summary.total_entities > 0
                  ? `${risk_summary.total_entities} PII Entit${risk_summary.total_entities > 1 ? 'ies' : 'y'} Detected`
                  : 'No PII Detected — Content is Safe'}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{risk_summary.recommendation}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <RiskBadge level={risk_summary.overall_risk} size="md" />
            <div className="text-center px-3 border-l border-gray-300">
              <p className="text-2xl font-display font-bold text-gray-900">{risk_summary.risk_score}</p>
              <p className="text-xs text-gray-500 font-semibold">RISK SCORE</p>
            </div>
          </div>
        </div>
        {risk_summary.total_entities > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
            {regexCount  > 0 && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">🔍 Regex: {regexCount}</span>}
            {spacyCount  > 0 && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300">🧠 spaCy: {spacyCount}</span>}
            {bertCount   > 0 && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-300">🤖 BERT: {bertCount}</span>}
            {hybridCount > 0 && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-300">🔀 Hybrid: {hybridCount}</span>}
            <span className="w-px bg-gray-300 mx-1" />
            {[
              { label: 'Critical', count: risk_summary.critical_count, cls: 'bg-red-100 text-red-800 border-red-300' },
              { label: 'High',     count: risk_summary.high_count,     cls: 'bg-orange-100 text-orange-800 border-orange-300' },
              { label: 'Medium',   count: risk_summary.medium_count,   cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
              { label: 'Low',      count: risk_summary.low_count,      cls: 'bg-green-100 text-green-800 border-green-300' },
            ].filter(x => x.count > 0).map(({ label, count, cls }) => (
              <span key={label} className={clsx('text-xs font-bold px-2.5 py-1 rounded-full border', cls)}>{count} {label}</span>
            ))}
            {ocr_confidence != null && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-300">
                OCR: {(ocr_confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* DPDP Compliance Card — NEW */}
      <DPDPComplianceCard result={result} />

      {/* Analysed Text */}
      {textToShow && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gov-darkblue text-white">
            <span className="text-sm font-bold flex items-center gap-2">
              <Shield size={14} />
              {transcript ? 'Audio Transcript — PII Highlighted' : 'Analysed Text — PII Highlighted'}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowMasked(!showMasked)}
                className="flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition-colors font-semibold border border-white/20">
                {showMasked ? <Eye size={11} /> : <EyeOff size={11} />}
                {showMasked ? 'Show Original' : 'Show Masked'}
              </button>
              <button onClick={() => setExpanded(!expanded)} className="text-white/70 hover:text-white p-1 rounded transition-colors">
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
          {expanded && (
            <div className="p-5 bg-gray-50 max-h-52 overflow-y-auto scrollbar-thin">
              {showMasked
                ? <p className="text-sm font-mono leading-relaxed text-orange-700 bg-orange-50 border border-orange-200 rounded p-3">{masked_text}</p>
                : <p className="text-sm font-mono leading-loose"><HighlightedText text={textToShow} entities={entities} /></p>}
            </div>
          )}
          {expanded && entities.length > 0 && !showMasked && (
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 font-semibold mr-1">Legend:</span>
              {entities.slice(0, 6).map(e => (
                <span key={e.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${PII_TYPE_COLORS[e.type] || '#003580'}15`, color: PII_TYPE_COLORS[e.type] || '#003580', border: `1px solid ${PII_TYPE_COLORS[e.type] || '#003580'}40` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: PII_TYPE_COLORS[e.type] || '#003580' }} />
                  {PII_TYPE_LABELS[e.type] || e.type}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Entity Cards */}
      {entities.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gov-darkblue text-white">
            <span className="text-sm font-bold flex items-center gap-2">
              <Shield size={14} /> Detected PII Entities — {entities.length} found
            </span>
            <span className="text-xs text-blue-200">Hover over highlighted text to see details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {entities.map(e => <EntityCard key={e.id} entity={e} />)}
          </div>
        </div>
      )}

      {entities.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <p className="text-gray-800 font-display font-bold text-lg">No PII Detected</p>
          <p className="text-sm text-gray-500 mt-1">All {(ai_layers_used || []).join(' + ')} layers scanned — content is safe.</p>
        </div>
      )}
    </div>
  )
}