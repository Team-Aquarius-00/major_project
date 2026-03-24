import { useEffect, useRef, useState, useCallback } from 'react'

interface Alert {
  type: string
  message: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  data?: any
}

interface WebSocketMessage {
  type: 'alert' | 'status' | 'heartbeat' | 'pending_alerts'
  data?: any
  timestamp: string
}

export function useInterviewAlerts(
  interviewId: string,
  enabled: boolean = true,
) {
  const ws = useRef<WebSocket | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Construct WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const wsUrl = backendUrl.replace('http', 'ws')
    return `${wsUrl}/ws/alerts/${interviewId}`
  }, [interviewId])

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)

      if (message.type === 'alert') {
        const newAlert: Alert = {
          type: message.data.type,
          message: message.data.message,
          severity: message.data.severity,
          timestamp: message.timestamp,
          data: message.data.data,
        }
        setAlerts((prev) => [...prev, newAlert])
      } else if (message.type === 'status') {
        console.log('Interview status:', message.data)
      } else if (message.type === 'heartbeat') {
        console.log('Heartbeat from server')
      } else if (message.type === 'pending_alerts') {
        const pendingAlerts: Alert[] = message.data.map((a: any) => ({
          type: a.type,
          message: a.message,
          severity: a.severity,
          timestamp: a.timestamp,
          data: a.data,
        }))
        setAlerts((prev) => [...prev, ...pendingAlerts])
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || !interviewId) return

    try {
      const wsUrl = getWebSocketUrl()
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)

        // Request pending alerts
        ws.current?.send(
          JSON.stringify({
            type: 'get_pending_alerts',
          }),
        )

        // Send heartbeat every 30 seconds
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(
              JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
              }),
            )
          }
        }, 30000)
      }

      ws.current.onmessage = handleMessage

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }

      ws.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        clearInterval(heartbeatIntervalRef.current)

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }
    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
      setIsConnected(false)
    }
  }, [enabled, interviewId, getWebSocketUrl, handleMessage])

  // Connect on mount
  useEffect(() => {
    if (enabled && interviewId) {
      connect()
    }

    return () => {
      if (ws.current) {
        ws.current.close()
      }
      clearInterval(heartbeatIntervalRef.current)
      clearTimeout(reconnectTimeoutRef.current)
    }
  }, [enabled, interviewId, connect])

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const getAlertsByType = useCallback(
    (type: string) => {
      return alerts.filter((alert) => alert.type === type)
    },
    [alerts],
  )

  return {
    alerts,
    isConnected,
    clearAlerts,
    getAlertsByType,
  }
}
