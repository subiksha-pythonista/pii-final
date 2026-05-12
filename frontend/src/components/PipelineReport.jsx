/**
 * PipelineReport — shows the full 13-stage pipeline execution report
 * after detection completes. Makes the heavy processing visible.
 */
import React, { useState } from 'react'
import clsx from 'clsx'
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, SkipForward, Clock, Database, Cpu } from 'lucide-react'
import { formatMs } from '../utils/helpers'

const STAGE_ICONS = {
  'Input Validation':               '✅',
  'NLP Preprocessing':              '📝',
  'Redis Cache Lookup':             '⚡',
  'Regex PII Engine':               '🔍',
  'spaCy NER':                      '🧠',
  'BERT Transformer NER':           '🤖',
  'Ensemble Confidence Scoring':    '📊',
  'Post-processing Validation':     '✔️',
  'Deduplication & Ranking':        '🔀',
  'Risk Assessment Engine':         '⚠️',
  'Format-preserving Masking':      '🔒',
  'Redis Result Caching':           '💾',
  'Pipeline Report Generation':     '📋',
}

function StatusIcon({ status }) {
  if (status === 'done')    return <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
  if (status === 'skipped') return <SkipForward  size={14} className="text-gray-400 flex-shrink-0" />
  return <XCircle size={14} className="text-red-500 flex-shrink-0" />
}

export default function PipelineReport({ result }) {
  const [expanded, setExpanded] = useState(false)
  if (!result || !result.pipeline_stages?.length) return null

  const stages     = result.pipeline_stages
  const textStats  = result.text_stats || {}
  const totalMs    = result.processing_time_ms
  const doneCount  = stages.filter(s => s.status === 'done').length
  const skipCount  = stages.filter(s => s.status === 'skipped').length

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-4">

      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3
                   bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Cpu size={16} className="text-gov-darkblue" />
          <span className="text-sm font-bold text-gov-darkblue">
            Pipeline Execution Report — {stages.length} Stages
          </span>
          <span className="text-xs bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded-full font-semibold">
            {doneCount} completed
          </span>
          {skipCount > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 border border-gray-300 px-2 py-0.5 rounded-full font-semibold">
              {skipCount} skipped
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs font-mono font-bold text-gov-darkblue">
            <Clock size={11} /> {formatMs(totalMs)} total
          </span>
          {result.redis_cached && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              <Database size={10} /> Cached
            </span>
          )}
          {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">

          {/* Stage timeline */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Execution Timeline
            </p>
            {stages.map((stage, idx) => {
              const maxMs = Math.max(...stages.map(s => s.duration_ms), 1)
              const pct   = (stage.duration_ms / maxMs) * 100
              return (
                <div key={idx} className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg border',
                  stage.status === 'done'    ? 'bg-green-50 border-green-200' :
                  stage.status === 'skipped' ? 'bg-gray-50 border-gray-200' :
                                               'bg-red-50 border-red-200'
                )}>
                  {/* Stage number */}
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gov-darkblue text-white
                                   text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>

                  {/* Icon + Name */}
                  <span className="text-sm flex-shrink-0">{STAGE_ICONS[stage.name] || '⚙️'}</span>
                  <span className={clsx(
                    'text-xs font-semibold flex-1 min-w-0',
                    stage.status === 'skipped' ? 'text-gray-400' : 'text-gray-800'
                  )}>
                    {stage.name}
                  </span>

                  {/* Duration bar */}
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    <div
                      className={clsx(
                        'h-full rounded-full',
                        stage.status === 'skipped' ? 'bg-gray-300' : 'bg-gov-darkblue'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Duration value */}
                  <span className="text-xs font-mono text-gray-500 w-14 text-right flex-shrink-0">
                    {stage.duration_ms.toFixed(2)}ms
                  </span>

                  {/* Entities found */}
                  {stage.entities_found > 0 && (
                    <span className="text-xs font-mono font-bold text-red-600 flex-shrink-0">
                      +{stage.entities_found}
                    </span>
                  )}

                  {/* Status icon */}
                  <StatusIcon status={stage.status} />
                </div>
              )
            })}
          </div>

          {/* Text statistics */}
          {Object.keys(textStats).length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Text Statistics (NLP Preprocessing)
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: 'Characters',    value: textStats.char_count },
                  { label: 'Words',         value: textStats.word_count },
                  { label: 'Sentences',     value: textStats.sentence_count },
                  { label: 'Avg Word Len',  value: textStats.avg_word_length },
                  { label: 'Digit Density', value: textStats.digit_density },
                  { label: 'Uppercase %',   value: `${((textStats.uppercase_ratio || 0) * 100).toFixed(1)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gov-lightblue border border-gov-darkblue/10 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500 font-semibold">{label}</p>
                    <p className="text-sm font-mono font-bold text-gov-darkblue mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI layers summary */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              AI Layers Active
            </p>
            <div className="flex flex-wrap gap-2">
              {(result.ai_layers_used || []).map(layer => (
                <div key={layer} className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold',
                  layer === 'BERT'  ? 'bg-green-50 border-green-300 text-green-800' :
                  layer === 'spaCy' ? 'bg-purple-50 border-purple-300 text-purple-800' :
                                      'bg-blue-50 border-blue-300 text-blue-800'
                )}>
                  {layer === 'BERT'  ? '🤖' : layer === 'spaCy' ? '🧠' : '🔍'}
                  {layer === 'BERT'  ? 'BERT Transformer (dslim/bert-base-NER)' :
                   layer === 'spaCy' ? 'spaCy NER (en_core_web_sm)' :
                                       'Regex Engine (13 Indian PII patterns)'}
                </div>
              ))}
              {result.redis_cached && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold bg-yellow-50 border-yellow-300 text-yellow-800">
                  💾 Redis Cache (result stored for 1hr)
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
