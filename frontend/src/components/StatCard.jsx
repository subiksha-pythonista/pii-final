import React from 'react'
import clsx from 'clsx'

const COLOR_MAP = {
  gov:    { icon: 'bg-gov-lightblue text-gov-darkblue', border: 'border-t-gov-darkblue' },
  red:    { icon: 'bg-red-100 text-red-700',            border: 'border-t-red-600' },
  orange: { icon: 'bg-orange-100 text-orange-700',      border: 'border-t-orange-500' },
  green:  { icon: 'bg-green-100 text-green-700',        border: 'border-t-green-600' },
  yellow: { icon: 'bg-yellow-100 text-yellow-700',      border: 'border-t-yellow-500' },
}

export default function StatCard({ icon: Icon, label, value, sub, color = 'gov' }) {
  const c = COLOR_MAP[color] || COLOR_MAP.gov
  return (
    <div className={clsx('gov-card border-t-4 p-4', c.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-display font-bold text-gov-darkblue">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className={clsx('w-10 h-10 rounded flex items-center justify-center', c.icon)}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  )
}
