import React, { useState } from 'react'
import { Scan, Play, RotateCcw, Info, Shield } from 'lucide-react'
import { useDetection } from '../hooks/useDetection'
import ResultPanel from '../components/ResultPanel'
import ProcessingOverlay from '../components/ProcessingOverlay'
import PipelineReport from '../components/PipelineReport'
import ErrorAlert from '../components/ErrorAlert'

const DEMO_TEXTS = [
  'My Aadhaar number is 2345 6789 0123 and PAN is ABCDE1234F. Please verify my KYC.',
  'Contact: rajesh.kumar@gmail.com, +91 98765 43210. DOB: 15/08/1990. Voter ID: ABC1234567',
  'Passport No: J1234567. Bank A/C: 123456789012, IFSC: HDFC0001234, DL: MH2019001234567',
  'UPI: kavya@okaxis, GST: 27AABCU9603R1ZX. PIN Code: 400001, Near Churchgate, Mumbai.',
]

export default function LiveDetection() {
  const [text, setText] = useState('')
  const { result, loading, error, runText, reset } = useDetection()

  return (
    <div className="max-w-4xl space-y-4">
      <div className="gov-card p-4 border-l-4 border-l-gov-darkblue">
        <h2 className="text-lg font-display font-bold text-gov-darkblue flex items-center gap-2">
          <Scan size={18} /> Real-Time PII Detection Console
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          13-stage AI pipeline: Regex + spaCy NER + BERT Transformer · Redis caching · Real-time risk scoring
        </p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-800">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <span>All content processed in-memory. Detection logged to PostgreSQL audit system per IT Act 2000.</span>
      </div>

      {/* Demo samples */}
      <div className="gov-card overflow-hidden">
        <div className="gov-section-header rounded-t">
          <Scan size={12} /> Sample Test Inputs — Click to Load
        </div>
        <div className="p-3 flex flex-wrap gap-2">
          {DEMO_TEXTS.map((t, i) => (
            <button key={i} onClick={() => { setText(t); reset() }}
              className="text-xs px-3 py-1.5 rounded border border-gov-darkblue text-gov-darkblue
                         bg-gov-lightblue hover:bg-gov-darkblue hover:text-white transition-colors font-semibold">
              Sample {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="gov-card overflow-hidden">
        <div className="gov-section-header rounded-t">
          <Scan size={12} /> Input Text for Analysis
          <span className="ml-auto text-xs text-blue-200 font-mono">{text.length} / 50,000 chars</span>
        </div>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); reset() }}
          placeholder="Enter or paste text here for PII detection…&#10;&#10;Example: My Aadhaar is 2345 6789 0123 and PAN is ABCDE1234F"
          className="w-full bg-gray-50 text-sm text-gray-700 placeholder-gray-400 p-4
                     resize-none focus:outline-none focus:bg-white transition-colors font-mono min-h-[160px]"
        />
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-white">
          <button onClick={() => { setText(''); reset() }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors">
            <RotateCcw size={12} /> Clear
          </button>
          <button
            onClick={() => text.trim() && runText(text)}
            disabled={loading || !text.trim()}
            className="gov-btn-primary flex items-center gap-2">
            <Play size={13} />
            {loading ? 'Running Pipeline…' : 'Run AI Detection Pipeline'}
          </button>
        </div>
      </div>

      <ErrorAlert message={error} />

      {/* Processing animation */}
      {loading && <ProcessingOverlay type="text" />}

      {/* Results */}
      {result && !loading && (
        <>
          <div>
            <div className="gov-section-header rounded-t">
              <Shield size={12} /> Detection Results — Request ID: {result.request_id}
              <span className="ml-auto text-xs text-blue-200 font-mono">
                {result.processing_time_ms?.toFixed(1)}ms · {result.pipeline_stages?.length || 13} pipeline stages
              </span>
            </div>
            <div className="border border-t-0 border-gray-200 rounded-b p-4 bg-white">
              <ResultPanel result={result} />
            </div>
          </div>
          {/* Pipeline execution report */}
          <PipelineReport result={result} />
        </>
      )}
    </div>
  )
}
