import React from 'react'
import clsx from 'clsx'
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, XCircle, CheckCircle2 } from 'lucide-react'

const ACTIONS = {
  CRITICAL: [
    '🚨 Immediately mask or redact all detected PII before sharing',
    '🔒 Restrict document access to authorised personnel only',
    '📋 Log this detection in the audit trail as per IT Act 2000',
    '🔔 Escalate to Data Protection Officer (DPO) immediately',
    '❌ Do NOT store, transmit or process this data without encryption',
    '📜 Ensure DPDP Act 2023 compliance before further processing',
  ],
  HIGH: [
    '⚠️ Mask sensitive PII before sharing this document',
    '🔒 Limit access to this document to authorised users only',
    '📋 Record this scan in the audit system per IT Act 2000',
    '🔐 Use encrypted channels if this data must be transmitted',
    '📜 Review data retention policy as per DPDP Act 2023',
  ],
  MEDIUM: [
    '✅ Review detected PII before sharing this document',
    '📋 Follow standard data handling procedures per IT Act 2000',
    '🔐 Ensure data is transmitted over secure HTTPS/TLS channels',
    '🗑️ Delete unnecessary copies of this data after processing',
  ],
  LOW: [
    '✅ Content appears safe — standard handling procedures apply',
    '📋 Routine logging maintained per IT Act 2000',
    '🔍 Continue monitoring for any additional PII',
  ],
}

const RISK_REASONS = {
  AADHAAR_NUMBER:   'Aadhaar Number: Linked to bank, mobile & govt services — identity theft risk',
  PAN_NUMBER:       'PAN Card: Misused for financial fraud & fake tax filings',
  PASSPORT_NUMBER:  'Passport: Enables identity fraud & illegal border crossing',
  VOTER_ID:         'Voter ID: Used for electoral fraud & identity impersonation',
  DRIVING_LICENSE:  'Driving License: Used to obtain other IDs illegally',
  BANK_ACCOUNT:     'Bank Account: Direct financial theft & unauthorized transactions',
  UPI_ID:           'UPI ID: Phishing attacks & fake payment requests',
  IFSC_CODE:        'IFSC Code: Combined with account enables unauthorized transfers',
  PHONE_NUMBER:     'Phone Number: SIM swapping & OTP interception',
  EMAIL_ADDRESS:    'Email: Phishing & account takeover attacks',
  DATE_OF_BIRTH:    'Date of Birth: Bypasses identity verification checks',
  INDIAN_ADDRESS:   'Address: Physical stalking & targeted fraud',
  GST_NUMBER:       'GST Number: Tax fraud & fake business registrations',
}

export default function SafetyAnalysis({ risk_summary }) {
  const level   = risk_summary.overall_risk
  const score   = risk_summary.risk_score ?? 0
  const actions = ACTIONS[level] || ACTIONS.LOW

  // ✅ FIXED: Document safe status based on LEVEL not score
  const isNotSafe = level === 'CRITICAL' || level === 'HIGH'
  const isMedium  = level === 'MEDIUM'

  const docStatus = {
    CRITICAL: {
      label: 'Critical Risk — NOT Safe to Share',
      cls:   'bg-red-100 border-red-500 text-red-800',
      icon:  <XCircle size={20} className="text-red-600 flex-shrink-0"/>,
    },
    HIGH: {
      label: 'High Risk — NOT Safe to Share',
      cls:   'bg-orange-100 border-orange-500 text-orange-800',
      icon:  <AlertTriangle size={20} className="text-orange-600 flex-shrink-0"/>,
    },
    MEDIUM: {
      label: 'Medium Risk — Review Before Sharing',
      cls:   'bg-yellow-100 border-yellow-500 text-yellow-800',
      icon:  <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0"/>,
    },
    LOW: {
      label: 'Low Risk — Safe to Share',
      cls:   'bg-green-100 border-green-500 text-green-800',
      icon:  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0"/>,
    },
  }[level]

  // Safety score bar color
  const safetyScore = risk_summary.safety_score ?? Math.max(0, 100 - score)
  const barColor =
    level === 'CRITICAL' ? 'bg-red-500' :
    level === 'HIGH'     ? 'bg-orange-500' :
    level === 'MEDIUM'   ? 'bg-yellow-500' :
                           'bg-green-500'

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gov-darkblue text-white">
        <ShieldAlert size={14}/>
        <span className="text-sm font-bold">Safety Analysis — Document Status</span>
      </div>

      <div className="p-4 space-y-4">

        {/* ✅ FIXED: Document Status — shows NOT Safe for CRITICAL/HIGH */}
        <div className={clsx('flex items-center gap-3 p-3 rounded-lg border-2 font-bold', docStatus.cls)}>
          {docStatus.icon}
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Document Status</p>
            <p className="text-sm font-black">{docStatus.label}</p>
          </div>
        </div>

        {/* Safety Score bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-gray-600">Safety Score</span>
            <span className="font-black text-gray-800">{safetyScore.toFixed(0)}% Safe</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all', barColor)}
              style={{ width: `${safetyScore}%` }}
            />
          </div>
          {/* ✅ FIXED: Correct label based on level */}
          <p className={clsx('text-xs font-bold mt-1', {
            'text-red-600':    level === 'CRITICAL',
            'text-orange-600': level === 'HIGH',
            'text-yellow-600': level === 'MEDIUM',
            'text-green-600':  level === 'LOW',
          })}>
            {level === 'CRITICAL' ? '🚨 Critical — Immediate Action Required!' :
             level === 'HIGH'     ? '⚠️ High Risk — Action Needed' :
             level === 'MEDIUM'   ? '🔍 Medium Risk — Review Required' :
                                    '✅ Low Risk — Safe to proceed'}
          </p>
        </div>

        {/* Why not safe */}
        {(isNotSafe || isMedium) && risk_summary.total_entities > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Why is this document {isNotSafe ? 'NOT safe' : 'risky'}?
            </p>
            <div className="space-y-1.5">
              {(risk_summary.risk_reasons || []).slice(0, 5).map((reason, i) => (
                <div key={i} className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">→</span>
                  <span className="text-xs text-gray-700">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Recommended Actions
          </p>
          <div className="space-y-1.5">
            {actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <span className="flex-shrink-0 font-bold text-blue-600">{i+1}.</span>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 flex items-center gap-1 pt-1 border-t border-gray-100">
          <Info size={10}/>
          As per IT Act 2000 & DPDP Act 2023 — Government of India
        </p>
      </div>
    </div>
  )
}