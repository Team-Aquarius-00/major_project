'use client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from '@/components/ui/sidebar'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles, ChevronRight } from 'lucide-react'
import { SideBarOptions } from '../../../services/Constants'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AppSidebar() {
  const path = usePathname()
  return (
    <Sidebar className='border-r border-gray-200 bg-white'>
      <SidebarHeader className='flex items-center justify-center py-8 px-4 border-b border-gray-100'>
        <Link
          href='/'
          className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 group'
          aria-label='Home'
        >
          <div className='relative'>
            <Image
              src={'/logo.png'}
              alt='logo'
              width={36}
              height={36}
              className='rounded-md shadow-sm group-hover:shadow-md transition-shadow'
            />
            <div className='absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full'></div>
          </div>
          <div className='flex flex-col gap-0.5'>
            <span className='font-semibold text-sm tracking-tight text-gray-900'>
              AI Recruitment
            </span>
            <span className='text-xs text-gray-500'>Hiring Platform</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className='px-2 py-4'>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(
                SideBarOptions.reduce((acc, item) => {
                  const section = item.section || 'General'
                  acc[section] = acc[section] || []
                  acc[section].push(item)
                  return acc
                }, {}),
              ).map(([section, items]) => (
                <div key={section} className='mb-7'>
                  <SidebarGroupLabel className='text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5 px-3'>
                    {section}
                  </SidebarGroupLabel>
                  <div className='space-y-1'>
                    {items.map((option, index) => (
                      <SidebarMenuItem key={`${section}-${index}`}>
                        <SidebarMenuButton
                          asChild
                          size='lg'
                          isActive={path === option.path}
                          className='group relative rounded-lg transition-all duration-150'
                        >
                          <Link
                            href={option.path}
                            className={`flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-150 ${
                              path === option.path
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-md transition-all duration-150 ${
                                path === option.path
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                              }`}
                            >
                              <option.icon className='h-4 w-4' />
                            </div>
                            <span
                              className={`ml-2.5 text-sm font-medium transition-colors ${
                                path === option.path
                                  ? 'text-gray-900 font-semibold'
                                  : 'text-gray-700 group-hover:text-gray-900'
                              }`}
                            >
                              {option.name}
                            </span>
                            {option.badge ? (
                              <SidebarMenuBadge className='ml-auto bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full'>
                                {option.badge}
                              </SidebarMenuBadge>
                            ) : null}
                            {path === option.path && (
                              <ChevronRight className='ml-auto h-4 w-4 text-blue-500' />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </div>
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='p-4 border-t border-gray-100'>
        <div className='space-y-3'>
          <Button
            asChild
            className='w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-150 font-medium h-9'
          >
            <Link
              href='/dashboard/create-interview'
              className='flex items-center justify-center'
            >
              <Plus className='mr-2 h-4 w-4' />
              New Interview
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
