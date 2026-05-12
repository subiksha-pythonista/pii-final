import React, { useRef, useEffect } from 'react'
import clsx from 'clsx'
import { Zap, Play, Square, Trash2, Wifi, WifiOff, ShieldAlert, Info } from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'
import RiskBadge from '../components/RiskBadge'
import { formatDateTime, PII_TYPE_LABELS } from '../utils/helpers'

function MessageRow({ msg }) {
  const hasPII = msg.pii_found
  return (
    <div className={clsx(
      'p-3 border-b border-gray-100 transition-all animate-slide-in',
      hasPII ? 'bg-red-50 border-l-4 border-l-red-500' : 'bg-white border-l-4 border-l-transparent'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gov-darkblue flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
            {msg.sender?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-gov-darkblue">{msg.sender}</span>
              <span className="text-xs text-gray-400 font-mono">{formatDateTime(msg.timestamp)}</span>
              {hasPII && <ShieldAlert size={11} className="text-red-600 flex-shrink-0" />}
            </div>
            <p className={clsx('text-sm font-mono break-all', hasPII ? 'text-orange-800' : 'text-gray-600')}>
              {msg.masked || msg.content}
            </p>
          </div>
        </div>
        {hasPII && <RiskBadge level={msg.risk_level} size="sm" />}
      </div>

      {hasPII && msg.entities?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-red-100 flex flex-wrap gap-1.5">
          {msg.entities.map((e, i) => (
            <span key={i} className="text-xs font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 font-semibold">
              {PII_TYPE_LABELS[e.type] || e.type}: {e.masked_value}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400 font-mono mt-1">⚡ {msg.processing_ms?.toFixed(1)}ms</p>
    </div>
  )
}

export default function LiveStream() {
  const { messages, connected, error, connect, disconnect, clearMessages } = useWebSocket()
  const bottomRef = useRef()
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  const piiCount = messages.filter(m => m.pii_found).length

  return (
    <div className="max-w-3xl space-y-4">
      <div className="gov-card p-4 border-l-4 border-l-gov-darkblue">
        <h2 className="text-lg font-display font-bold text-gov-darkblue flex items-center gap-2">
          <Zap size={18} /> Live Stream PII Monitor
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Real-time PII detection on live chat/message stream via WebSocket</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-800">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <span>Simulated chat stream — messages arrive every 2–4 seconds. PII is detected in real-time and masked before display. Requires backend WebSocket at ws://localhost:8000/stream/live</span>
      </div>

      {/* Controls */}
      <div className="gov-card p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={clsx('flex items-center gap-1.5 text-sm font-semibold',
            connected ? 'text-green-700' : 'text-gray-500')}>
            {connected ? <Wifi size={15} /> : <WifiOff size={15} />}
            {connected ? 'WebSocket Connected' : 'Disconnected'}
          </div>
        </div>
        <div className="flex items-center gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Messages</p>
            <p className="text-lg font-display font-bold text-gov-darkblue">{messages.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">PII Alerts</p>
            <p className="text-lg font-display font-bold text-red-600">{piiCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Detection Rate</p>
            <p className="text-lg font-display font-bold text-orange-600">
              {messages.length ? `${((piiCount/messages.length)*100).toFixed(0)}%` : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearMessages} className="gov-btn-secondary flex items-center gap-1.5 text-xs">
            <Trash2 size={12} /> Clear
          </button>
          {!connected
            ? <button onClick={connect} className="gov-btn-primary flex items-center gap-1.5">
                <Play size={13} /> Start Monitor
              </button>
            : <button onClick={disconnect}
                className="flex items-center gap-1.5 px-4 py-2 rounded border border-red-400 text-red-700 bg-red-50 hover:bg-red-100 text-sm font-semibold transition-colors">
                <Square size={13} /> Stop
              </button>
          }
        </div>
      </div>

      {error && (
        <div className="p-3 border border-red-300 bg-red-50 text-red-800 text-xs rounded font-mono">{error}</div>
      )}

      {/* Message feed */}
      <div className="gov-card overflow-hidden">
        <div className="gov-section-header rounded-t flex items-center justify-between">
          <span className="flex items-center gap-2"><Zap size={12} /> Live Feed</span>
          <span className="text-xs text-blue-200 font-mono">
            {connected ? '● LIVE' : '○ OFFLINE'}
          </span>
        </div>
        <div className="h-[460px] overflow-y-auto scrollbar-thin flex flex-col">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Zap size={28} className="text-gov-darkblue/20" />
              <p className="text-sm">Click "Start Monitor" to begin live stream detection</p>
            </div>
          ) : (
            [...messages].reverse().map((msg, i) => <MessageRow key={msg.message_id || i} msg={msg} />)
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
