import React, { useState } from 'react'
import clsx from 'clsx'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import { PII_TYPE_LABELS, PII_TYPE_COLORS, confidencePct } from '../utils/helpers'

const RISK_STYLES = {
  CRITICAL: { badge: 'bg-red-100 text-red-800 border-red-400',         bar: 'bg-red-500' },
  HIGH:     { badge: 'bg-orange-100 text-orange-800 border-orange-400', bar: 'bg-orange-500' },
  MEDIUM:   { badge: 'bg-yellow-100 text-yellow-800 border-yellow-400', bar: 'bg-yellow-500' },
  LOW:      { badge: 'bg-green-100 text-green-800 border-green-400',    bar: 'bg-green-500' },
}

const SOURCE_STYLES = {
  'REGEX':  { cls: 'bg-blue-100 text-blue-800 border-blue-300',      icon: '🔍' },
  'spaCy':  { cls: 'bg-purple-100 text-purple-800 border-purple-300', icon: '🧠' },
  'BERT':   { cls: 'bg-green-100 text-green-800 border-green-300',    icon: '🤖' },
  'HYBRID': { cls: 'bg-orange-100 text-orange-800 border-orange-300', icon: '🔀' },
}

function getSourceStyle(source) {
  if (!source) return SOURCE_STYLES['REGEX']
  if (source.startsWith('HYBRID')) return SOURCE_STYLES['HYBRID']
  return SOURCE_STYLES[source] || SOURCE_STYLES['REGEX']
}

function getSourceLabel(source) {
  if (!source) return 'REGEX'
  if (source.startsWith('HYBRID')) return '🔀 Hybrid'
  const s = SOURCE_STYLES[source]
  return s ? `${s.icon} ${source}` : source
}

export default function EntityCard({ entity }) {
  const [copied, setCopied] = useState(false)

  const label  = PII_TYPE_LABELS[entity.type] || entity.type
  const color  = PII_TYPE_COLORS[entity.type] || '#003580'
  const rs     = RISK_STYLES[entity.risk_level] || RISK_STYLES.LOW
  const srcSty = getSourceStyle(entity.source)
  const isBert = entity.source === 'BERT'
  const isFake = !!entity.warning

  // Copy masked value only — never expose original
  const copy = async () => {
    await navigator.clipboard.writeText(entity.masked_value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={clsx(
      'bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md',
      isFake ? 'border-yellow-400' : isBert ? 'border-green-300' : 'border-gray-200'
    )}>
      <div className="h-1 w-full" style={{ background: isFake ? '#EF9F27' : color }} />

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                {label}
              </span>
              <span className={clsx('text-xs font-bold px-1.5 py-0.5 rounded-full border', srcSty.cls)}>
                {getSourceLabel(entity.source)}
              </span>
            </div>

            {/* Always masked — Show button removed for security */}
            <div className="mt-1.5 px-2 py-1.5 rounded-lg font-mono text-sm break-all bg-gray-100 text-gray-500">
              {entity.masked_value}
            </div>
          </div>

          <span className={clsx('flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg border', rs.badge)}>
            {entity.risk_level}
          </span>
        </div>

        {/* Fake warning banner */}
        {isFake && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-300 rounded-lg px-2 py-1.5 mb-2">
            <AlertTriangle size={13} className="text-yellow-600 flex-shrink-0" />
            <span className="text-xs text-yellow-800 font-medium">{entity.warning}</span>
          </div>
        )}

        {/* Confidence bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500 font-semibold">Confidence</span>
            <span className="font-mono font-bold" style={{ color: isFake ? '#BA7517' : color }}>
              {confidencePct(entity.confidence)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${entity.confidence * 100}%`, background: isFake ? '#EF9F27' : color }}
            />
          </div>
        </div>

        {/* Copy masked only — no show/reveal button */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400 font-mono">ID: {entity.id}</span>
          <button
            onClick={copy}
            title="Copy masked value"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gov-darkblue hover:bg-gov-lightblue transition-colors"
          >
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
          </button>
        </div>
      </div>
    </div>
  )
}