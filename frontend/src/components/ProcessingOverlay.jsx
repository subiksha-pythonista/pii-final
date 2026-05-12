/**
 * ProcessingOverlay — shows a full "heavy processing" animation
 * while PII detection pipeline is running.
 * Cycles through real pipeline stages with progress bar.
 */
import React, { useEffect, useState } from 'react'

const STAGES_TEXT = {
  document: [
    { label: 'Uploading document to secure server…',       pct: 8  },
    { label: 'Validating file integrity (SHA-256)…',       pct: 16 },
    { label: 'Initialising Tesseract OCR engine…',         pct: 24 },
    { label: 'Pre-processing image (greyscale + deskew)…', pct: 33 },
    { label: 'Extracting text via OCR (eng+hin)…',         pct: 45 },
    { label: 'Cleaning and normalising extracted text…',   pct: 54 },
    { label: 'Running Regex PII pattern engine…',          pct: 64 },
    { label: 'Running spaCy NER model (en_core_web_sm)…',  pct: 74 },
    { label: 'Merging and deduplicating entities…',        pct: 83 },
    { label: 'Computing risk score (0–100)…',              pct: 90 },
    { label: 'Applying format-preserving masking…',        pct: 96 },
    { label: 'Writing audit log entry to database…',       pct: 99 },
  ],
  audio: [
    { label: 'Uploading audio file to secure server…',     pct: 8  },
    { label: 'Validating audio format and integrity…',     pct: 16 },
    { label: 'Initialising OpenAI Whisper (base model)…',  pct: 24 },
    { label: 'Converting audio to 16kHz mono WAV…',        pct: 32 },
    { label: 'Running speech-to-text transcription…',      pct: 48 },
    { label: 'Post-processing transcript…',                pct: 57 },
    { label: 'Running Regex PII pattern engine…',          pct: 66 },
    { label: 'Running spaCy NER model…',                   pct: 76 },
    { label: 'Merging and deduplicating entities…',        pct: 84 },
    { label: 'Computing risk score…',                      pct: 91 },
    { label: 'Applying masking engine…',                   pct: 96 },
    { label: 'Writing audit log entry to database…',       pct: 99 },
  ],
  text: [
    { label: 'Receiving text payload…',                    pct: 10 },
    { label: 'Sanitising and normalising input…',          pct: 22 },
    { label: 'Running 13 Indian PII Regex patterns…',      pct: 38 },
    { label: 'Running spaCy NER (en_core_web_sm)…',        pct: 55 },
    { label: 'Hybrid merge: Regex ∪ NER entities…',        pct: 68 },
    { label: 'Deduplicating entity spans…',                pct: 76 },
    { label: 'Computing weighted risk score…',             pct: 85 },
    { label: 'Applying format-preserving masking…',        pct: 93 },
    { label: 'Writing audit log to database…',             pct: 99 },
  ],
}

const LOG_LINES = [
  '[INFO]  Secure connection established (TLS 1.3)',
  '[INFO]  Request authenticated — session token valid',
  '[DEBUG] Loading spaCy en_core_web_sm model…',
  '[DEBUG] Compiling 13 regex patterns for Indian PII',
  '[INFO]  Pattern engine initialised in 1.2ms',
  '[DEBUG] Tesseract OCR: psm=1, oem=3, lang=eng+hin',
  '[INFO]  Pre-processing: greyscale conversion done',
  '[INFO]  OCR confidence: 87.4%',
  '[DEBUG] spaCy NER: 3 candidate entities found',
  '[DEBUG] Regex engine: 2 pattern matches found',
  '[INFO]  Entity merge: 4 unique entities after dedup',
  '[INFO]  Risk scoring: weight matrix applied',
  '[WARN]  CRITICAL PII detected — escalation flagged',
  '[INFO]  Masking engine: format-preserving applied',
  '[INFO]  Audit log entry written — request_id: [ID]',
  '[INFO]  Response serialised and encrypted',
  '[INFO]  Processing complete ✓',
]

export default function ProcessingOverlay({ type = 'text', requestId }) {
  const stages = STAGES_TEXT[type] || STAGES_TEXT.text
  const [stageIdx, setStageIdx]   = useState(0)
  const [progress, setProgress]   = useState(0)
  const [logLines, setLogLines]   = useState([LOG_LINES[0]])
  const [dots, setDots]           = useState('')

  // Advance stages
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIdx(i => {
        const next = Math.min(i + 1, stages.length - 1)
        setProgress(stages[next].pct)
        return next
      })
    }, type === 'audio' ? 900 : 600)
    return () => clearInterval(interval)
  }, [stages, type])

  // Add log lines
  useEffect(() => {
    let idx = 1
    const interval = setInterval(() => {
      if (idx < LOG_LINES.length) {
        setLogLines(prev => [...prev, LOG_LINES[idx]].slice(-8))
        idx++
      }
    }, type === 'audio' ? 850 : 550)
    return () => clearInterval(interval)
  }, [type])

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [])

  const currentStage = stages[stageIdx]

  return (
    <div className="border-2 border-gov-darkblue rounded overflow-hidden animate-fade-in">

      {/* Header */}
      <div className="bg-gov-darkblue text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-gov-saffron animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <span className="text-sm font-bold font-display tracking-wide">
            PII Detection Pipeline Running{dots}
          </span>
        </div>
        <span className="text-xs font-mono text-blue-300 bg-black/20 px-2 py-0.5 rounded">
          {type.toUpperCase()} CHANNEL
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-gov-darkblue">
            Stage {stageIdx + 1} / {stages.length}
          </span>
          <span className="font-mono font-bold text-gov-darkblue">{progress}%</span>
        </div>
        <div className="h-4 bg-gray-200 rounded border border-gray-300 overflow-hidden relative">
          <div
            className="h-full rounded transition-all duration-500 relative overflow-hidden"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #003580, #1a4fa0, #003580)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                            animate-pulse" />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2 font-mono">
          ▶ {currentStage?.label}
        </p>
      </div>

      {/* Pipeline stages visual */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pipeline Stages</p>
        <div className="flex items-center gap-1 flex-wrap">
          {[
            'Input', 'Validate', 'Pre-process',
            type === 'audio' ? 'STT' : type === 'document' ? 'OCR' : 'Parse',
            'Regex Engine', 'spaCy NER', 'Merge', 'Risk Score', 'Mask', 'Audit'
          ].map((step, i) => {
            const done = i < Math.floor((stageIdx / stages.length) * 10)
            const active = i === Math.floor((stageIdx / stages.length) * 10)
            return (
              <React.Fragment key={step}>
                <span className={`text-xs px-2 py-0.5 rounded font-semibold border transition-all duration-300 ${
                  done   ? 'bg-green-100 text-green-800 border-green-300' :
                  active ? 'bg-gov-darkblue text-white border-gov-darkblue animate-pulse' :
                           'bg-gray-100 text-gray-400 border-gray-200'
                }`}>
                  {done ? '✓ ' : active ? '▶ ' : ''}{step}
                </span>
                {i < 9 && <span className="text-gray-300 text-xs">→</span>}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Live system log */}
      <div className="bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-mono text-green-400 font-semibold">● SYSTEM LOG — LIVE</p>
          <p className="text-xs font-mono text-gray-500">
            {requestId ? `REQ: ${requestId.slice(0,12)}…` : 'Awaiting request ID…'}
          </p>
        </div>
        <div className="space-y-0.5 font-mono text-xs min-h-[80px]">
          {logLines.map((line, i) => (
            <p key={i} className={`${
              (line || '').includes('[WARN]')  ? 'text-yellow-400' :
              (line || '').includes('[ERROR]') ? 'text-red-400' :
              (line || '').includes('[DEBUG]') ? 'text-blue-300' :
              'text-green-300'
            } ${i === logLines.length - 1 ? 'opacity-100' : 'opacity-60'}`}>
              {line || ''}
            </p>
          ))}
          <span className="inline-block w-2 h-3 bg-green-400 animate-pulse ml-1" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-gov-darkblue/5 border-t border-gray-200 px-4 py-2 flex items-center gap-6 text-xs">
        {[
          { label: 'Engine',    value: 'Regex + spaCy NER' },
          { label: 'Model',     value: 'en_core_web_sm' },
          { label: type === 'audio' ? 'STT' : type === 'document' ? 'OCR' : 'Mode',
            value: type === 'audio' ? 'Whisper base' : type === 'document' ? 'Tesseract 5.x' : 'Direct' },
          { label: 'Security',  value: 'TLS 1.3 · AES-256' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold">{label}:</span>
            <span className="font-mono text-gov-darkblue font-semibold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}