'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ThemeProvider, useTheme } from '@/lib/theme'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileDock from './MobileDock'
import AIAssistantButton from './AIAssistantButton'
import MobileAIButton from './MobileAIButton'
import PageTransition from '@/components/ui/PageTransition'
import { createClient } from '@/lib/supabase/client'

function EtherealBackground() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className={`absolute inset-0 transition-colors duration-700 ${isLight ? 'bg-[#f5f5f7]' : 'bg-[#0c0c0f]'}`} />

      {/* Main light beam — tall narrow vertical streak */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '55%',
          width: '320px',
          height: '130%',
          background: isLight
            ? 'linear-gradient(to right, transparent 0%, rgba(0,102,204,0.05) 30%, rgba(0,130,255,0.13) 50%, rgba(0,102,204,0.05) 70%, transparent 100%)'
            : 'linear-gradient(to right, transparent 0%, rgba(180,210,255,0.07) 30%, rgba(220,235,255,0.18) 50%, rgba(180,210,255,0.07) 70%, transparent 100%)',
          filter: 'blur(28px)',
          transformOrigin: 'top center',
        }}
        animate={{
          rotate: [-4, 2, -2, 4, -4],
          x: [-30, 20, -10, 30, -30],
          opacity: [0.6, 0.8, 0.7, 0.85, 0.6],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Core glow — brighter inner line */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '55%',
          width: '80px',
          height: '130%',
          background: isLight
            ? 'linear-gradient(to right, transparent 0%, rgba(0,102,204,0.18) 50%, transparent 100%)'
            : 'linear-gradient(to right, transparent 0%, rgba(210,230,255,0.22) 50%, transparent 100%)',
          filter: 'blur(12px)',
          transformOrigin: 'top center',
        }}
        animate={{
          rotate: [-4, 2, -2, 4, -4],
          x: [-30, 20, -10, 30, -30],
          opacity: [0.5, 0.75, 0.6, 0.8, 0.5],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ambient floor glow */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '-5%',
          left: '20%',
          right: '20%',
          height: '300px',
          background: 'radial-gradient(ellipse at center bottom, rgba(160,185,255,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const [userName, setUserName]   = useState<string | undefined>()
  const [plan, setPlan] = useState<string>('TRIAL')
  const pathname = usePathname()
  const isBuilder = pathname?.includes('/builder')
  const { theme } = useTheme()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const email = data.user?.email
      setUserEmail(email ?? undefined)
      setUserName(data.user?.user_metadata?.full_name || email?.split('@')[0])
      if (email) {
        const { data: org } = await supabase.from('fluxaleads_organizations').select('id').eq('user_id', data.user?.id).single()
        if (org) {
          const { data: sub } = await supabase.from('fluxaleads_subscriptions').select('plan').eq('org_id', org.id).single()
          if (sub) setPlan(sub.plan)
        }
      }
    })
  }, [])

  if (isBuilder) {
    return (
      <div className="min-h-screen bg-linear-bg dashboard-theme selection:bg-linear-indigo/30 selection:text-linear-text-primary overflow-hidden">
        {children}
        <AIAssistantButton />
      </div>
    )
  }

  return (
    <div data-theme={theme} className="flex min-h-screen dashboard-theme selection:bg-linear-indigo/30 selection:text-linear-text-primary relative">
      <EtherealBackground />
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar userEmail={userEmail} userName={userName} plan={plan} />
      </div>

      {/* Main content — extra left margin only on desktop */}
      <main className="flex-1 min-w-0 md:ml-[88px] transition-all duration-300 relative z-10">
        <div className="p-5 md:p-8 lg:p-12 max-w-[1400px] mx-auto min-h-screen pb-32 md:pb-12">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      <AIAssistantButton />

      {/* Mobile dock */}
      <div className="md:hidden">
        <MobileDock />
      </div>

      {/* Mobile AI button — top right */}
      <MobileAIButton />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardInner>{children}</DashboardInner>
    </ThemeProvider>
  )
}
