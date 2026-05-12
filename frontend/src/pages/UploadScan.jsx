import React, { useState, useRef } from 'react'
import clsx from 'clsx'
import { Upload, FileText, Music, X, CheckCircle2, Info, Shield } from 'lucide-react'
import { useDetection } from '../hooks/useDetection'
import ResultPanel from '../components/ResultPanel'
import ProcessingOverlay from '../components/ProcessingOverlay'
import PipelineReport from '../components/PipelineReport'
import ErrorAlert from '../components/ErrorAlert'

const TABS = [
  { id: 'document', icon: FileText, label: 'Document / Image',
    accept: '.pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp',
    hint: 'Upload scanned Aadhaar, PAN, Voter ID, Passport or any government document. Tesseract OCR extracts text → AI pipeline detects PII.' },
  { id: 'audio', icon: Music, label: 'Audio / Video',
    accept: '.wav,.mp3,.mp4,.ogg,.flac,.webm',
    hint: 'Upload voice recording. Whisper STT transcribes → 13-stage AI pipeline detects spoken PII.' },
]

export default function UploadScan() {
  const [tab, setTab]     = useState('document')
  const [file, setFile]   = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()
  const { result, loading, error, runDocument, runAudio, reset } = useDetection()
  const tabCfg = TABS.find(t => t.id === tab)

  const handleFile = (f) => { setFile(f); reset() }
  const handleScan = () => tab === 'document' ? runDocument(file) : runAudio(file)
  const onDrop = (e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if(f) handleFile(f) }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="gov-card p-4 border-l-4 border-l-gov-darkblue">
        <h2 className="text-lg font-display font-bold text-gov-darkblue flex items-center gap-2">
          <Upload size={18} /> Upload &amp; Scan — Document / Audio PII Analysis
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          OCR (Tesseract) + STT (Whisper) + 13-stage AI pipeline: Regex + spaCy + BERT
        </p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <span>Files processed in-memory only. No permanent storage per DPDP Act 2023.</span>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="flex border-b border-gray-200">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setTab(id); setFile(null); reset() }}
              className={clsx(
                'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors',
                tab === id ? 'border-b-gov-darkblue text-gov-darkblue bg-gov-lightblue/50'
                           : 'border-b-transparent text-gray-500 hover:text-gov-darkblue'
              )}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded p-10 text-center transition-all',
              file ? 'border-green-400 bg-green-50 cursor-default' :
              dragging ? 'border-gov-darkblue bg-gov-lightblue cursor-copy' :
              'border-gray-300 hover:border-gov-darkblue hover:bg-gov-lightblue/30 cursor-pointer'
            )}>
            <input ref={inputRef} type="file" accept={tabCfg.accept}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])} className="hidden" />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 size={36} className="text-green-600" />
                <p className="font-semibold text-gov-darkblue">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size/1024).toFixed(1)} KB · Ready</p>
                <button onClick={e => { e.stopPropagation(); setFile(null); reset() }}
                  className="flex items-center gap-1 text-xs text-red-600 border border-red-300 px-2 py-0.5 rounded mt-1">
                  <X size={11} /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Upload size={32} className="text-gov-darkblue/40" />
                <p className="text-sm font-semibold text-gov-darkblue">Drop file or click to browse</p>
                <p className="text-xs text-gray-400 max-w-sm">{tabCfg.hint}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Shield size={11} className="text-gov-darkblue" />
            Encrypted · In-memory · No permanent storage
          </div>
          <button onClick={handleScan} disabled={!file || loading} className="gov-btn-primary flex items-center gap-2">
            <Upload size={14} />
            {loading ? 'Processing…' : `Run AI Scan`}
          </button>
        </div>
      </div>

      <ErrorAlert message={error} />
      {loading && <ProcessingOverlay type={tab} />}
      {result && !loading && (
        <>
          <div>
            <div className="gov-section-header rounded-t">
              <Shield size={12} /> Results — {result.request_id}
              <span className="ml-auto text-xs text-blue-200 font-mono">
                {result.processing_time_ms?.toFixed(1)}ms
                {result.ocr_confidence ? ` · OCR ${(result.ocr_confidence*100).toFixed(0)}%` : ''}
              </span>
            </div>
            <div className="border border-t-0 border-gray-200 rounded-b p-4 bg-white">
              <ResultPanel result={result} />
            </div>
          </div>
          <PipelineReport result={result} />
        </>
      )}
    </div>
  )
}
