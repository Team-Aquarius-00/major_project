import React from 'react'
import DashboardProvider from './provider'

function DashboardLayout({ children }) {
  return (
    <div className='bg-secondary'>
      <DashboardProvider>
        <div className='p-10 w-full'>{children}</div>
      </DashboardProvider>
    </div>
  )
}

export default DashboardLayout
