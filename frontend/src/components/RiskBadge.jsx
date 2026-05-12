import React from 'react'
import clsx from 'clsx'

const CONFIG = {
  CRITICAL: { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-400',    dot: 'bg-red-600' },
  HIGH:     { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-400', dot: 'bg-orange-600' },
  MEDIUM:   { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400', dot: 'bg-yellow-500' },
  LOW:      { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-400',  dot: 'bg-green-600' },
}

export default function RiskBadge({ level, size = 'sm', showDot = true }) {
  const c = CONFIG[level] || CONFIG.LOW
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 font-mono font-bold border rounded',
      c.bg, c.text, c.border,
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
    )}>
      {showDot && <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', c.dot)} />}
      {level}
    </span>
  )
}
