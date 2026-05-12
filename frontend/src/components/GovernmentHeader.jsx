/**
 * GovernmentHeader — authentic Indian government portal header
 * Fixed: ticker scrolls properly from right to left
 */
import React, { useEffect, useState } from 'react'

// ── Ashoka Chakra SVG ─────────────────────────────────────────────────────────
function AshokaChakra({ size = 48, spin = false }) {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 360) / 24
    const rad = (angle * Math.PI) / 180
    const r  = size / 2 - 3
    const cx = size / 2
    const cy = size / 2
    return {
      x1: cx + (r * 0.25) * Math.cos(rad),
      y1: cy + (r * 0.25) * Math.sin(rad),
      x2: cx + r * Math.cos(rad),
      y2: cy + r * Math.sin(rad),
    }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={spin ? { animation: 'spin-slow 20s linear infinite' } : {}}>
      <circle cx={size/2} cy={size/2} r={size/2-1} fill="none" stroke="#000080" strokeWidth="2" />
      <circle cx={size/2} cy={size/2} r={size/2-6} fill="none" stroke="#000080" strokeWidth="1" />
      <circle cx={size/2} cy={size/2} r={4} fill="#000080" />
      {spokes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke="#000080" strokeWidth="1.2" />
      ))}
    </svg>
  )
}

// ── Government Emblem ─────────────────────────────────────────────────────────
function GovernmentEmblem({ size = 72 }) {
  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size * 1.15} viewBox="0 0 100 115" fill="none">
        <rect x="15" y="100" width="70" height="8" rx="1" fill="#1a3a6b" />
        <rect x="20" y="95" width="60" height="6" rx="1" fill="#1e4080" />
        <ellipse cx="50" cy="88" rx="28" ry="5" fill="#1e4080" />
        <rect x="22" y="75" width="56" height="14" rx="2" fill="#1a3a6b" />
        <circle cx="50" cy="82" r="6" fill="none" stroke="#c8a84b" strokeWidth="1.5" />
        <circle cx="50" cy="82" r="1.5" fill="#c8a84b" />
        {Array.from({length:8},(_,i)=>{
          const a=(i*45*Math.PI)/180
          return <line key={i} x1={50+1.5*Math.cos(a)} y1={82+1.5*Math.sin(a)}
            x2={50+5.5*Math.cos(a)} y2={82+5.5*Math.sin(a)} stroke="#c8a84b" strokeWidth="1"/>
        })}
        <ellipse cx="32" cy="80" rx="6" ry="4" fill="#c8a84b" />
        <circle cx="28" cy="78" r="3" fill="#c8a84b" />
        <line x1="26" y1="78" x2="24" y2="75" stroke="#c8a84b" strokeWidth="1.2"/>
        <line x1="30" y1="84" x2="30" y2="88" stroke="#c8a84b" strokeWidth="1.5"/>
        <line x1="34" y1="84" x2="34" y2="88" stroke="#c8a84b" strokeWidth="1.5"/>
        <ellipse cx="68" cy="80" rx="6" ry="4" fill="#c8a84b" />
        <circle cx="72" cy="78" r="3" fill="#c8a84b" />
        <line x1="74" y1="78" x2="76" y2="75" stroke="#c8a84b" strokeWidth="1.2"/>
        <line x1="66" y1="84" x2="66" y2="88" stroke="#c8a84b" strokeWidth="1.5"/>
        <line x1="70" y1="84" x2="70" y2="88" stroke="#c8a84b" strokeWidth="1.5"/>
        <ellipse cx="42" cy="60" rx="9" ry="7" fill="#c8a84b" />
        <circle cx="38" cy="53" r="7" fill="#c8a84b" />
        <circle cx="38" cy="53" r="8.5" fill="none" stroke="#9a7a2e" strokeWidth="3" strokeDasharray="2 1"/>
        <circle cx="36" cy="52" r="1" fill="#1a3a6b"/>
        <ellipse cx="38" cy="68" rx="4" ry="2" fill="#b8943b"/>
        <ellipse cx="46" cy="68" rx="4" ry="2" fill="#b8943b"/>
        <path d="M51 60 Q58 55 56 50 Q54 46 57 44" stroke="#c8a84b" strokeWidth="2" fill="none"/>
        <ellipse cx="58" cy="60" rx="9" ry="7" fill="#c8a84b" />
        <circle cx="62" cy="53" r="7" fill="#c8a84b" />
        <circle cx="62" cy="53" r="8.5" fill="none" stroke="#9a7a2e" strokeWidth="3" strokeDasharray="2 1"/>
        <circle cx="64" cy="52" r="1" fill="#1a3a6b"/>
        <ellipse cx="54" cy="68" rx="4" ry="2" fill="#b8943b"/>
        <ellipse cx="62" cy="68" rx="4" ry="2" fill="#b8943b"/>
        <path d="M49 60 Q42 55 44 50 Q46 46 43 44" stroke="#c8a84b" strokeWidth="2" fill="none"/>
        <rect x="18" y="107" width="64" height="7" rx="1" fill="#0d2155"/>
        <text x="50" y="113" textAnchor="middle" fontSize="5" fill="#c8a84b"
          fontFamily="Noto Serif, serif" fontWeight="600">सत्यमेव जयते</text>
      </svg>
    </div>
  )
}

// ── Scrolling Ticker ──────────────────────────────────────────────────────────
function NoticeTicker() {
  const notices = [
    'This system is authorized for official use only under IT Act 2000 & DPDP Act 2023.',
    'All PII detections are logged and audited.',
    'Unauthorized access is a punishable offence.',
    'For technical support contact: helpdesk@meity.gov.in',
    'Classification: RESTRICTED — Government of India',
    'System uses BERT AI + spaCy NER + Regex Engine for detection.',
    'All data processed in-memory. No permanent PII storage.',
  ]
  const text = notices.join('   |   ')

  return (
    <div className="flex items-center gap-0 overflow-hidden bg-amber-50 border-b border-amber-200"
      style={{ height: '28px' }}>
      {/* NOTICE label */}
      <div className="flex-shrink-0 bg-gov-darkblue text-white text-xs font-bold
                      px-3 py-1 h-full flex items-center z-10">
        NOTICE
      </div>
      {/* Scrolling text container */}
      <div className="flex-1 overflow-hidden relative h-full">
        <div
          className="absolute whitespace-nowrap text-xs font-semibold text-gov-darkblue
                     flex items-center h-full"
          style={{
            animation: 'ticker-scroll 40s linear infinite',
            paddingLeft: '100%',
          }}
        >
          {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </div>
      </div>
    </div>
  )
}

// ── Main Header ───────────────────────────────────────────────────────────────
export default function GovernmentHeader() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeStr = time.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
  const dateStr = time.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="w-full">
      {/* Ticker animation style */}
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* Accessibility bar */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-1
                      flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Skip to main content</span>
          <span className="text-gray-400">|</span>
          <span>Screen Reader Access</span>
          <span className="text-gray-400">|</span>
          <span className="font-semibold text-gov-darkblue cursor-pointer">A-&nbsp; A &nbsp;A+</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-gov-darkblue font-semibold">{timeStr} IST</span>
          <span className="text-gray-400">|</span>
          <span>{dateStr}</span>
        </div>
      </div>

      {/* Tricolor bar */}
      <div style={{
        height: '5px',
        background: 'linear-gradient(90deg, #FF9933 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #138808 66.66%)',
        borderBottom: '1px solid #ddd'
      }} />

      {/* Main header */}
      <div className="bg-white border-b-2 border-gov-darkblue shadow-gov">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-5">
          <div className="flex-shrink-0">
            <GovernmentEmblem size={80} />
          </div>
          <div className="flex-1 border-l-2 border-gov-gold pl-5">
            <p className="text-xs text-gov-darkblue font-body font-semibold tracking-widest uppercase">
              भारत सरकार · Government of India
            </p>
            <h1 className="text-gov-darkblue font-display font-bold leading-tight"
              style={{ fontSize: '1.35rem' }}>
              Ministry of Electronics &amp; Information Technology
            </h1>
            <h2 className="text-gov-darkblue font-display font-semibold"
              style={{ fontSize: '1.05rem' }}>
              Intelligent PII Detection &amp; Risk Assessment System
            </h2>
            <p className="text-xs text-gray-500 font-body mt-0.5">
              बुद्धिमान व्यक्तिगत पहचान योग्य सूचना का पता लगाने की प्रणाली
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-gov-darkblue">Digital India</p>
                <p className="text-xs text-gray-500">डिजिटल इंडिया</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gov-lightblue border-2 border-gov-darkblue
                              flex items-center justify-center">
                <AshokaChakra size={36} spin={true} />
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 border border-green-300 rounded font-semibold">
                IT Act 2000
              </span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded font-semibold">
                DPDP 2023
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="bg-gov-darkblue text-white shadow-md">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between">
          <nav className="flex items-center">
            {[
              { href:'/',          label:'Home' },
              { href:'/detect',    label:'PII Detection' },
              { href:'/upload',    label:'Upload & Scan' },
              { href:'/stream',    label:'Live Monitor' },
              { href:'/analytics', label:'Analytics' },
              { href:'/logs',      label:'Audit Logs' },
              { href:'/health',    label:'System Status' },
            ].map(({ href, label }) => (
              <a key={href} href={href}
                className="px-4 py-3 text-xs font-semibold hover:bg-gov-midblue
                           border-r border-gov-midblue/50 transition-colors
                           first:border-l first:border-gov-midblue/50">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-xs text-blue-200 pr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
            System Active
          </div>
        </div>
      </div>

      {/* ✅ FIXED: Scrolling Notice Ticker */}
      <NoticeTicker />
    </div>
  )
}
