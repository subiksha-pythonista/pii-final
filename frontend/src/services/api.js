/**
 * API Service Layer
 * Uses RELATIVE URLs — Vite proxy forwards to backend at 127.0.0.1:8000
 */
import axios from 'axios'

const api = axios.create({
  baseURL: '',
  timeout: 30000,
})

const apiHeavy = axios.create({
  baseURL: '',
  timeout: 180000,
})

// ── Error handler ──────────────────────────────────────────────────────────────
const handleError = (error) => {
  console.error('[API Error]', error)
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    throw new Error(
      'Request timed out. OCR + BERT pipeline takes 30-60 seconds for documents. Please try again.'
    )
  }
  if (error.code === 'ERR_NETWORK' || !error.response) {
    throw new Error(
      'Cannot connect to backend server. Make sure the backend is running:\n' +
      'cd backend → .\\.venv\\Scripts\\Activate.ps1 → uvicorn app.main:app --reload --port 8000'
    )
  }
  if (error.response?.status === 422) {
    const detail = error.response.data?.detail
    throw new Error(typeof detail === 'string' ? detail : 'Invalid input or unsupported file format.')
  }
  if (error.response?.status === 415) {
    throw new Error('Unsupported file type. Use PDF, PNG, JPG for documents. WAV, MP3 for audio.')
  }
  if (error.response?.status === 413) {
    throw new Error('File too large. Max 20MB for documents, 50MB for audio.')
  }
  const msg = error.response?.data?.detail || error.message || 'Unknown error occurred.'
  throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
}

api.interceptors.response.use(r => r, handleError)
apiHeavy.interceptors.response.use(r => r, handleError)

// ── Text Detection ─────────────────────────────────────────────────────────────
export async function detectText(text, includeMasked = true) {
  const { data } = await api.post('/detect/text', {
    text,
    include_masked_text: includeMasked,
  })
  return data
}

// ── Document Detection ─────────────────────────────────────────────────────────
export async function detectDocument(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiHeavy.post('/detect/document', form)
  return data
}

// ── Audio Detection ────────────────────────────────────────────────────────────
export async function detectAudio(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiHeavy.post('/detect/audio', form)
  return data
}

// ── Analytics ──────────────────────────────────────────────────────────────────
// ← FIXED: axios use pannurom — fetch() panna 404 varuthu!
export async function getAnalytics() {
  const { data } = await api.get('/analytics')
  return data
}

export async function getAuditLogs(page = 1, pageSize = 20) {
  const { data } = await api.get('/analytics/logs', {
    params: { page, page_size: pageSize },
  })
  return data
}

// ── Health ─────────────────────────────────────────────────────────────────────
export async function getHealth() {
  const { data } = await api.get('/health')
  return data
}

// ── WebSocket ──────────────────────────────────────────────────────────────────
export function createStreamSocket(onMessage, onError) {
  // ← FIXED: Vite proxy through connect pannanum
  const wsUrl = 'ws://localhost:5173/stream/live'
  const ws = new WebSocket(wsUrl)
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)) } catch { /* ignore */ }
  }
  ws.onerror = onError
  return ws
}

export default api