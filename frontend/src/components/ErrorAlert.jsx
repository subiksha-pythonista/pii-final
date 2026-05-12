import React, { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

export default function ErrorAlert({ message }) {
  const [showHelp, setShowHelp] = useState(false)
  if (!message) return null

  const isNetworkError = message.toLowerCase().includes('network') ||
                         message.toLowerCase().includes('connect') ||
                         message.toLowerCase().includes('backend')

  return (
    <div className="rounded-xl border overflow-hidden animate-fade-in">
      {/* Error header */}
      <div className="flex items-start gap-3 p-4 bg-red-50 border-b border-red-200">
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
        <div className="flex-1">
          <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-0.5">
            System Error
          </p>
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {isNetworkError && (
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800
                       bg-red-100 border border-red-300 px-2 py-1 rounded transition-colors flex-shrink-0">
            Fix {showHelp ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}
      </div>

      {/* Help section for network errors */}
      {isNetworkError && showHelp && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <p className="text-xs font-bold text-blue-800 mb-2">
            How to fix — Start the backend:
          </p>
          <div className="space-y-1">
            {[
              'cd C:\\Projects\\PII-SYS\\pii-detection-system\\backend',
              '.\\venv\\Scripts\\Activate.ps1',
              'python -m uvicorn app.main:app --reload --port 8000',
            ].map((cmd, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-blue-600 font-bold w-4">{i+1}.</span>
                <code className="text-xs bg-gray-900 text-green-400 px-3 py-1 rounded font-mono flex-1">
                  {cmd}
                </code>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Then wait for <code className="bg-blue-100 px-1 rounded">Application startup complete.</code> and try again.
          </p>
        </div>
      )}
    </div>
  )
}
