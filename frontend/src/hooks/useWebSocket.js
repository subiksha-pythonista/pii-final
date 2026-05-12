/**
 * useWebSocket — manages live stream WebSocket connection
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { createStreamSocket } from '../services/api'

export function useWebSocket() {
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current) wsRef.current.close()
    setError(null)

    const ws = createStreamSocket(
      (msg) => {
        setMessages(prev => [msg, ...prev].slice(0, 100))
      },
      (err) => {
        setConnected(false)
        setError('WebSocket connection failed. Is the backend running?')
      }
    )
    ws.onopen  = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    wsRef.current = ws
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    setConnected(false)
  }, [])

  useEffect(() => () => { if (wsRef.current) wsRef.current.close() }, [])

  return { messages, connected, error, connect, disconnect, clearMessages: () => setMessages([]) }
}
