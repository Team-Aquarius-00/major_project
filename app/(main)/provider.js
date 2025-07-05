import React from 'react'
import { AppSidebar } from './_components/AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

function DashboardProvider({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}

export default DashboardProvider
