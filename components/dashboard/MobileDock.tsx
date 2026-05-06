'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, GitBranch, Users, BarChart2,
  Plug2, CreditCard, Settings, LogOut, UserCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const items = [
  { href: '/dashboard',              label: 'Início',   icon: LayoutDashboard },
  { href: '/dashboard/funnels',      label: 'Funis',    icon: GitBranch       },
  { href: '/dashboard/leads',        label: 'Leads',    icon: Users           },
  { href: '/dashboard/analytics',    label: 'Análises', icon: BarChart2       },
  { href: '/dashboard/integrations', label: 'Integr.',  icon: Plug2           },
  { href: '/dashboard/subscription', label: 'Plano',    icon: CreditCard      },
  { href: '/dashboard/profile',      label: 'Perfil',   icon: UserCircle      },
  { href: '/dashboard/settings',     label: 'Config.',  icon: Settings        },
]

// Width constants (px)
const ICON_W  = 52   // inactive item width
const PILL_W  = 104  // active item pill width (icon + text)
const PAD     = 16   // horizontal padding inside dock
const VISIBLE = 4    // how many items visible at once (approx)

function getItemOffset(navItems: { href: string; label: string; icon: any }[], targetIdx: number, activeIdx: number) {
  let x = PAD
  for (let i = 0; i < targetIdx; i++) {
    x += i === activeIdx ? PILL_W : ICON_W
  }
  return x
}

export default function MobileDock(_props?: object) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const x        = useMotionValue(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const activeIdx = items.findIndex(item =>
    item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
  )
  const currentActive = activeIdx === -1 ? 0 : activeIdx

  // Total content width
  const totalW = PAD * 2 + items.reduce((acc, _, i) => acc + (i === currentActive ? PILL_W : ICON_W), 0)
  const visibleW = ICON_W * (VISIBLE - 1) + PILL_W + PAD * 2
  const maxDrag = Math.max(0, totalW - visibleW)

  const handleDragEnd = () => {
    const cur = x.get()
    // Snap to nearest item boundary
    const clamped = Math.max(-maxDrag, Math.min(0, cur))
    if (clamped !== cur) animate(x, clamped, { type: 'spring', stiffness: 400, damping: 40 })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Sessão encerrada.')
    router.push('/')
  }

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[200] flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto overflow-hidden rounded-[26px] bg-[#111114]/95 backdrop-blur-2xl border border-white/[0.09] shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
        style={{ maxWidth: `${visibleW}px`, width: '92vw' }}
      >
        {/* Swipeable track */}
        <motion.div
          ref={trackRef}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: -maxDrag, right: 0 }}
          dragElastic={0.08}
          dragMomentum
          onDragEnd={handleDragEnd}
          className="flex items-center cursor-grab active:cursor-grabbing"
          style={{ x, paddingLeft: PAD, paddingRight: PAD, paddingTop: 10, paddingBottom: 10, width: totalW }}
        >
          {items.map((item, i) => {
            const isActive = i === currentActive
            return (
              <Link key={item.href} href={item.href} className="flex-shrink-0">
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className={`flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'rounded-full bg-white/[0.12] border border-white/[0.14] gap-2 px-4 py-2.5'
                      : 'rounded-full py-2.5'
                  }`}
                  style={{ width: isActive ? PILL_W : ICON_W }}
                >
                  <item.icon
                    size={isActive ? 18 : 20}
                    style={{ color: isActive ? '#ffffff' : '#8a8f98', flexShrink: 0 }}
                  />
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      className="text-[11px] font-semibold text-white whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            )
          })}

          {/* Logout */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleLogout}
            className="flex-shrink-0 flex items-center justify-center rounded-full py-2.5"
            style={{ width: ICON_W }}
          >
            <LogOut size={20} style={{ color: '#8a8f98' }} />
          </motion.button>
        </motion.div>

        {/* Home indicator line */}
        <div className="flex justify-center pb-2">
          <div className="w-10 h-[3px] rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  )
}
