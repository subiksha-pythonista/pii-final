/**
 * Utility helpers — risk colours, entity labels, formatters
 */

export const RISK_CONFIG = {
  CRITICAL: { color: 'text-red-400',    bg: 'bg-red-500/15',   border: 'border-red-500/40',   dot: 'bg-red-500',    label: 'CRITICAL' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/15',border: 'border-orange-500/40', dot: 'bg-orange-500', label: 'HIGH' },
  MEDIUM:   { color: 'text-yellow-400', bg: 'bg-yellow-500/15',border: 'border-yellow-500/40', dot: 'bg-yellow-500', label: 'MEDIUM' },
  LOW:      { color: 'text-green-400',  bg: 'bg-green-500/15', border: 'border-green-500/40',  dot: 'bg-green-500',  label: 'LOW' },
}

export const PII_TYPE_LABELS = {
  AADHAAR_NUMBER:  'Aadhaar',
  PAN_NUMBER:      'PAN',
  PASSPORT_NUMBER: 'Passport',
  VOTER_ID:        'Voter ID',
  DRIVING_LICENSE: 'DL',
  BANK_ACCOUNT:    'Bank A/C',
  IFSC_CODE:       'IFSC',
  PHONE_NUMBER:    'Phone',
  EMAIL_ADDRESS:   'Email',
  DATE_OF_BIRTH:   'DOB',
  INDIAN_ADDRESS:  'PIN Code',
  UPI_ID:          'UPI',
  GST_NUMBER:      'GST',
  PERSON_NAME:     'Name',
  LOCATION:        'Location',
  ORGANIZATION:    'Organisation',
}

export const PII_TYPE_COLORS = {
  AADHAAR_NUMBER:  '#f87171',
  PAN_NUMBER:      '#fb923c',
  PASSPORT_NUMBER: '#fbbf24',
  VOTER_ID:        '#a78bfa',
  DRIVING_LICENSE: '#60a5fa',
  BANK_ACCOUNT:    '#f472b6',
  IFSC_CODE:       '#34d399',
  PHONE_NUMBER:    '#22d3ee',
  EMAIL_ADDRESS:   '#818cf8',
  DATE_OF_BIRTH:   '#e879f9',
  INDIAN_ADDRESS:  '#4ade80',
  UPI_ID:          '#facc15',
  GST_NUMBER:      '#f97316',
}

export function getRiskConfig(level) {
  return RISK_CONFIG[level] || RISK_CONFIG.LOW
}

export function formatMs(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function confidencePct(conf) {
  return `${(conf * 100).toFixed(0)}%`
}

export function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return iso }
}

export function highlightPII(text, entities) {
  if (!text || !entities?.length) return [{ text, type: null }]

  // Sort entities by start position
  const sorted = [...entities]
    .filter(e => e.start_pos != null)
    .sort((a, b) => a.start_pos - b.start_pos)

  const parts = []
  let cursor = 0

  for (const ent of sorted) {
    if (ent.start_pos > cursor) {
      parts.push({ text: text.slice(cursor, ent.start_pos), type: null })
    }
    parts.push({ text: text.slice(ent.start_pos, ent.end_pos), type: ent.type, entity: ent })
    cursor = ent.end_pos
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor), type: null })
  return parts
}
