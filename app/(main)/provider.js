import React from 'react'
import { AppSidebar } from './_components/AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

function DashboardProvider({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className='w-full'>
        <SidebarTrigger />
        {children}
      </div>
    </SidebarProvider>
  )
}

export default DashboardProvider
