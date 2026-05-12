import React from 'react'

export default function LoadingSpinner({ text = 'Processing request…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="relative w-10 h-10">
        <div className="w-10 h-10 rounded-full border-4 border-gov-lightblue border-t-gov-darkblue animate-spin" />
      </div>
      <p className="text-sm text-gov-darkblue font-semibold">{text}</p>
      <p className="text-xs text-gray-400">Please wait — system is processing your request</p>
    </div>
  )
}
