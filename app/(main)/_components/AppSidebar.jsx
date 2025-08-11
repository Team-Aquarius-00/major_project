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
import { Plus, Sparkles } from 'lucide-react'
import { SideBarOptions } from '../../../services/Constants'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AppSidebar() {
  const path = usePathname()
  return (
    <Sidebar className='border-r border-gray-200/60 bg-gradient-to-b from-white to-gray-50/50'>
      <SidebarHeader className='flex items-center justify-center py-6 px-4'>
        <Link
          href='/'
          className='flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100/80 transition-colors group'
          aria-label='Home'
        >
          <div className='relative'>
            <Image
              src={'/logo.png'}
              alt='logo'
              width={32}
              height={32}
              className='rounded-lg shadow-sm group-hover:shadow-md transition-shadow'
            />
            <div className='absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse'></div>
          </div>
          <div className='flex flex-col'>
            <span className='font-bold text-lg tracking-tight text-gray-900 group-hover:text-gray-700 transition-colors'>
              AI Recruitment
            </span>
            <span className='text-xs text-gray-500 font-medium'>
              Powered by AI
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className='px-3'>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(
                SideBarOptions.reduce((acc, item) => {
                  const section = item.section || 'General'
                  acc[section] = acc[section] || []
                  acc[section].push(item)
                  return acc
                }, {})
              ).map(([section, items]) => (
                <div key={section} className='mb-6'>
                  <SidebarGroupLabel className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2'>
                    {section}
                  </SidebarGroupLabel>
                  <div className='space-y-1'>
                    {items.map((option, index) => (
                      <SidebarMenuItem key={`${section}-${index}`}>
                        <SidebarMenuButton
                          asChild
                          size='lg'
                          isActive={path === option.path}
                          className='group relative overflow-hidden rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-sm'
                        >
                          <Link
                            href={option.path}
                            className='flex items-center w-full'
                          >
                            <div
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                path === option.path
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                                  : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                              }`}
                            >
                              <option.icon className='h-5 w-5' />
                            </div>
                            <span
                              className={`ml-3 font-medium transition-colors ${
                                path === option.path
                                  ? 'text-blue-700 font-semibold'
                                  : 'text-gray-700 group-hover:text-gray-900'
                              }`}
                            >
                              {option.name}
                            </span>
                            {option.badge ? (
                              <SidebarMenuBadge className='ml-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-sm'>
                                {option.badge}
                              </SidebarMenuBadge>
                            ) : null}
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

      <SidebarFooter className='p-4'>
        <div className='space-y-3'>
          <Button
            asChild
            className='w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5'
          >
            <Link
              href='/dashboard/create-interview'
              className='flex items-center justify-center'
            >
              <Plus className='mr-2 h-5 w-5' />
              <span className='font-semibold'>New Interview</span>
            </Link>
          </Button>

          <div className='text-center'>
            <div className='inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-lg'>
              <Sparkles className='h-4 w-4 text-amber-600' />
              <span className='text-xs font-medium text-amber-700'>
                AI Powered
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
