import { useState, useCallback } from 'react'
import { detectText, detectDocument, detectAudio } from '../services/api'
import { saveScan } from '../utils/scanStore'

export function useDetection() {
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [progress, setProgress] = useState('')

  const reset = useCallback(() => {
    setResult(null); setError(null); setProgress('')
  }, [])

  const runText = useCallback(async (text) => {
    setLoading(true); setError(null); setProgress('Running AI detection pipeline…')
    try {
      const res = await detectText(text)
      setResult(res)
      saveScan(res, 'TEXT')           // ← save to store
    } catch (e) {
      setError(e.message || 'Detection failed.')
    } finally { setLoading(false); setProgress('') }
  }, [])

  const runDocument = useCallback(async (file) => {
    setLoading(true); setError(null); setProgress('Uploading document…')
    try {
      setProgress('Running OCR + BERT pipeline… (30-60 seconds)')
      const res = await detectDocument(file)
      setResult(res)
      saveScan(res, 'DOCUMENT')       // ← save to store
    } catch (e) {
      setError(e.message || 'Document scan failed.')
    } finally { setLoading(false); setProgress('') }
  }, [])

  const runAudio = useCallback(async (file) => {
    setLoading(true); setError(null); setProgress('Uploading audio…')
    try {
      setProgress('Transcribing with Whisper + BERT… (1-3 minutes)')
      const res = await detectAudio(file)
      setResult(res)
      saveScan(res, 'AUDIO')          // ← save to store
    } catch (e) {
      setError(e.message || 'Audio scan failed.')
    } finally { setLoading(false); setProgress('') }
  }, [])

  return { result, loading, error, progress, runText, runDocument, runAudio, reset }
}