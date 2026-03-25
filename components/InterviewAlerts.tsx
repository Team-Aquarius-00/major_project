'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, Phone, Users, Eye, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'

interface Alert {
  type: string
  message: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  data?: Record<string, unknown>
}

interface InterviewAlertsProps {
  alerts: Alert[]
}

export function InterviewAlerts({ alerts }: InterviewAlertsProps) {
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
  const [alertCounts, setAlertCounts] = useState({
    gaze: 0,
    tabSwitch: 0,
    phone: 0,
    people: 0,
  })

  // Update recent alerts and counts
  useEffect(() => {
    if (alerts.length > 0) {
      const latestAlert = alerts[alerts.length - 1]

      // Show toast notification
      const toastMap: Record<
        string,
        { icon: string; title: string; description: string }
      > = {
        gaze_alert: {
          icon: '👀',
          title: 'Gaze Alert',
          description: latestAlert.message,
        },
        tab_switch: {
          icon: '📑',
          title: 'Tab Switch Detected',
          description: latestAlert.message,
        },
        object_detected: {
          icon: '📱',
          title: 'Object Detected',
          description: latestAlert.message,
        },
      }

      const toastConfig = toastMap[latestAlert.type]
      if (toastConfig) {
        toast[latestAlert.severity === 'high' ? 'error' : 'warning'](
          `${toastConfig.icon} ${toastConfig.title}`,
          {
            description: toastConfig.description,
          },
        )
      }

      // Update recent alerts (keep last 10)
      setRecentAlerts((prev) => {
        const updated = [
          ...prev,
          {
            ...latestAlert,
            id: `${latestAlert.timestamp}-${latestAlert.type}`,
          },
        ]
        return updated.slice(-10)
      })

      // Update counts
      setAlertCounts((prev) => ({
        gaze: prev.gaze + (latestAlert.type === 'gaze_alert' ? 1 : 0),
        tabSwitch: prev.tabSwitch + (latestAlert.type === 'tab_switch' ? 1 : 0),
        phone: prev.phone + (latestAlert.message.includes('📱') ? 1 : 0),
        people: prev.people + (latestAlert.message.includes('👥') ? 1 : 0),
      }))
    }
  }, [alerts])

  return (
    <div className='w-full max-w-md'>
      {/* Alert Summary */}
      <div className='grid grid-cols-4 gap-2 mb-4'>
        <div className='bg-red-100 p-3 rounded-lg text-center'>
          <Eye className='w-4 h-4 mx-auto text-red-600 mb-1' />
          <div className='text-sm font-semibold text-red-900'>
            {alertCounts.gaze}
          </div>
          <div className='text-xs text-red-700'>Gaze</div>
        </div>
        <div className='bg-orange-100 p-3 rounded-lg text-center'>
          <Maximize2 className='w-4 h-4 mx-auto text-orange-600 mb-1' />
          <div className='text-sm font-semibold text-orange-900'>
            {alertCounts.tabSwitch}
          </div>
          <div className='text-xs text-orange-700'>Tabs</div>
        </div>
        <div className='bg-purple-100 p-3 rounded-lg text-center'>
          <Phone className='w-4 h-4 mx-auto text-purple-600 mb-1' />
          <div className='text-sm font-semibold text-purple-900'>
            {alertCounts.phone}
          </div>
          <div className='text-xs text-purple-700'>Phone</div>
        </div>
        <div className='bg-cyan-100 p-3 rounded-lg text-center'>
          <Users className='w-4 h-4 mx-auto text-cyan-600 mb-1' />
          <div className='text-sm font-semibold text-cyan-900'>
            {alertCounts.people}
          </div>
          <div className='text-xs text-cyan-700'>People</div>
        </div>
      </div>

      {/* Recent Alerts List */}
      <div className='bg-white border border-gray-200 rounded-lg'>
        <div className='px-4 py-2 border-b border-gray-200 bg-gray-50'>
          <h3 className='text-sm font-semibold text-gray-900'>Recent Alerts</h3>
        </div>

        <div className='max-h-64 overflow-y-auto'>
          {recentAlerts.length === 0 ? (
            <div className='p-4 text-center text-gray-500 text-sm'>
              No alerts yet - stay focused!
            </div>
          ) : (
            <div className='divide-y divide-gray-200'>
              {recentAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 text-sm ${
                    alert.severity === 'high'
                      ? 'bg-red-50 border-l-4 border-red-500'
                      : alert.severity === 'medium'
                        ? 'bg-yellow-50 border-l-4 border-yellow-500'
                        : 'bg-blue-50 border-l-4 border-blue-500'
                  }`}
                >
                  <div className='flex items-start gap-2'>
                    <AlertCircle
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        alert.severity === 'high'
                          ? 'text-red-600'
                          : alert.severity === 'medium'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                      }`}
                    />
                    <div className='flex-1'>
                      <div className='font-medium text-gray-900'>
                        {alert.message}
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
