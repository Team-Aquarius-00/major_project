import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  SignOutButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Provider from './provider'
// import Dashboard from '@/app/(main)/dashboard/page'

// Fonts
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Metadata (merged info)
export const metadata: Metadata = {
  title: 'AI Recruitment',
  description: 'AI recruitment platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang='en'>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50/30`}
        >
          <header className='fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-xl shadow-sm shadow-gray-200/20'>
            <div className='mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
              <Link
                href='/'
                className='flex items-center gap-3 group'
                aria-label='AI Recruitment Home'
              >
                <div className='relative'></div>
                <div className='flex flex-col'>
                  <span className='font-bold text-xl tracking-tight text-gray-900 group-hover:text-gray-700 transition-colors'>
                    AI Recruitment
                  </span>
                  <div className='flex items-center gap-1'></div>
                </div>
              </Link>

              <div className='flex items-center gap-3'>
                <SignedOut>
                  <SignInButton
                    mode='modal'
                    forceRedirectUrl='/dashboard'
                    fallbackRedirectUrl='/dashboard'
                  >
                    <Button
                      variant='ghost'
                      size='lg'
                      className='rounded-full px-6 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 font-medium'
                    >
                      Sign in
                    </Button>
                  </SignInButton>
                  <SignUpButton
                    mode='modal'
                    forceRedirectUrl='/dashboard'
                    fallbackRedirectUrl='/dashboard'
                  >
                    <Button
                      size='lg'
                      className='rounded-full px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 font-medium'
                    >
                      Sign up
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <SignOutButton redirectUrl='/'>
                    <Button
                      variant='outline'
                      size='lg'
                      className='rounded-full px-6 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium'
                    >
                      Sign out
                    </Button>
                  </SignOutButton>
                  <div className='ml-2'>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox:
                            'w-10 h-10 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200',
                        },
                      }}
                    />
                  </div>
                </SignedIn>
              </div>
            </div>
          </header>

          <main className='pt-20 min-h-screen'>
            {/* <Dashboard /> */}
            <Provider>{children}</Provider>
          </main>

          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
