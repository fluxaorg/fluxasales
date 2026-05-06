'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  GitBranch, Users, BarChart2, Settings, LogOut, Plug2, LayoutDashboard, CreditCard, Sun, Moon
} from 'lucide-react'
import { getAvatar } from '@/lib/avatar'
import { useTheme } from '@/lib/theme'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/dashboard',              label: 'Início',        icon: LayoutDashboard },
  { href: '/dashboard/funnels',      label: 'Meus Funis',    icon: GitBranch       },
  { href: '/dashboard/leads',        label: 'Leads',         icon: Users           },
  { href: '/dashboard/analytics',    label: 'Análises',      icon: BarChart2       },
  { href: '/dashboard/integrations', label: 'Integrações',   icon: Plug2           },
  { href: '/dashboard/subscription', label: 'Assinatura',    icon: CreditCard      },
]

interface SidebarProps { userEmail?: string; userName?: string; plan?: string }

export default function Sidebar({ userEmail, userName, plan }: SidebarProps) {
  const avatar = getAvatar(userEmail)
  const displayName = userName || userEmail?.split('@')[0] || 'Usuário'

  const isElite = plan === 'ELITE'
  const eliteNavItems = isElite
    ? [...navItems.slice(0, 2), { href: '/dashboard/team', label: 'Equipe', icon: Users }, ...navItems.slice(2)]
    : navItems

  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isHovered, setIsHovered] = useState(false)
  const { theme, toggle } = useTheme()
  const isLight = theme === 'light'

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Sessão encerrada.')
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <aside
        className="fixed left-4 top-4 bottom-4 z-[100] flex"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          animate={{ width: isHovered ? 240 : 72 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`h-full backdrop-blur-xl border border-linear-border rounded-[24px] flex flex-col overflow-hidden shadow-2xl ${isLight ? 'bg-white/80 shadow-black/10' : 'bg-linear-surface/80 shadow-black/50'}`}
        >
          {/* Logo */}
          <div className="h-20 flex items-center px-4 mb-2">
            <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden border border-linear-border">
              <img src="/logo.png" alt="Fluxa" className="w-full h-full object-cover" />
            </div>
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-3 font-semibold tracking-tight whitespace-nowrap"
                style={{ color: isLight ? '#0066CC' : '#f7f8f8' }}
                >
                  Fluxa <span className="font-black">Sales</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3">
            {/* Divider label */}
            <AnimatePresence>
              {isHovered && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 mb-1 mt-1"
                  style={{ color: isLight ? '#9A9A9E' : '#62666d' }}
                >
                  Menu
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
            {eliteNavItems.map((item, idx) => {
              // Add divider before Integrações (index 4)
              const showDivider = idx === 4
              const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
              return (
                <div key={item.href}>
                {showDivider && (
                  <div className="mx-3 my-2 border-t" style={{ borderColor: isLight ? 'rgba(0,102,204,0.1)' : 'rgba(255,255,255,0.06)' }} />
                )}
                <Link href={item.href}>
                  <motion.div
                    whileHover="hover"
                    initial="rest"
                    animate="rest"
                    className={`flex items-center h-11 px-3 rounded-xl transition-colors duration-150 cursor-pointer group hover:!bg-foreground ${
                      isActive
                        ? 'bg-[#6366f1]/20 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.35)]'
                        : ''
                    }`}
                  >
                    <div className="w-6 flex-shrink-0 flex items-center justify-center">
                      <motion.div
                        variants={{
                          rest:  { y: 0, scale: 1,    color: isActive ? (isLight ? '#0066CC' : '#818cf8') : (isLight ? '#424245' : '#d0d6e0') },
                          hover: { y: -5, scale: 1.2, color: isLight ? '#ffffff' : '#0c0c0f' },
                        }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                      >
                        <item.icon size={18} />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {isHovered && (
                        <motion.span
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -5 }}
                          className="ml-3 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 group-hover:!text-background"
                          style={{ color: isActive ? (isLight ? '#0066CC' : '#ffffff') : (isLight ? '#424245' : '#d0d6e0') }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
                </div>
              )
            })}
            </div>
          </nav>

          {/* Bottom section */}
          <div className="p-3 space-y-1 border-t border-linear-border">

            {/* Profile — goes to /dashboard/profile */}
            <Link href="/dashboard/profile"
              className="w-full flex items-center h-12 px-2 rounded-xl transition-all group hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className={`w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-sm shadow-md text-white`}>
                <span className="text-white" style={{ color: 'white' }}>{avatar.symbol}</span>
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="ml-3 flex flex-col overflow-hidden text-left"
                  >
                    <span className="text-[12px] font-medium truncate w-32 transition-colors duration-150" style={{ color: isLight ? '#1D1D1F' : '#d0d6e0' }}>
                      {displayName}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest transition-colors duration-150" style={{ color: isLight ? '#6E6E73' : '#62666d' }}>Plano {plan}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            {/* Theme toggle */}
            <motion.button
              onClick={toggle}
              whileHover="hover" initial="rest" animate="rest"
              className={`w-full flex items-center h-10 px-3 rounded-lg transition-colors duration-150 group hover:!bg-foreground`}
            >
              <div className="w-6 flex-shrink-0 flex items-center justify-center">
                <motion.div
                  variants={{ rest: { y: 0, scale: 1, color: isLight ? '#6E6E73' : '#d0d6e0' }, hover: { y: -5, scale: 1.2, color: isLight ? '#ffffff' : '#0c0c0f' } }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                >
                  {isLight ? <Moon size={16} /> : <Sun size={16} />}
                </motion.div>
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="ml-3 text-xs font-semibold transition-colors duration-150 group-hover:!text-background" style={{ color: isLight ? '#6E6E73' : '#d0d6e0' }}
                  >
                    {isLight ? 'Modo escuro' : 'Modo claro'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Sair */}
            <motion.button
              onClick={handleLogout}
              whileHover="hover" initial="rest" animate="rest"
              className="w-full flex items-center h-10 px-3 rounded-lg transition-colors duration-150 group hover:!bg-foreground"
            >
              <div className="w-6 flex-shrink-0 flex items-center justify-center">
                <motion.div
                  variants={{ rest: { y: 0, scale: 1, color: isLight ? '#6E6E73' : '#d0d6e0' }, hover: { y: -5, scale: 1.2, color: isLight ? '#ffffff' : '#0c0c0f' } }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                >
                  <LogOut size={16} />
                </motion.div>
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-3 text-xs font-semibold transition-colors duration-150 group-hover:!text-background" style={{ color: isLight ? '#6E6E73' : '#d0d6e0' }}>
                    Sair
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Configurações */}
            <Link href="/dashboard/settings">
              <motion.div
                whileHover="hover" initial="rest" animate="rest"
                className={`flex items-center h-10 px-3 rounded-lg transition-colors duration-150 group hover:!bg-foreground ${
                  pathname.startsWith('/dashboard/settings')
                    ? 'bg-[#6366f1]/20 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.35)]'
                    : ''
                }`}
              >
                <div className="w-6 flex-shrink-0 flex items-center justify-center">
                  <motion.div
                    variants={{
                      rest:  { y: 0, scale: 1,    color: pathname.startsWith('/dashboard/settings') ? (isLight ? '#0066CC' : '#818cf8') : (isLight ? '#6E6E73' : '#d0d6e0') },
                      hover: { y: -5, scale: 1.2, color: isLight ? '#ffffff' : '#0c0c0f' },
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  >
                    <Settings size={16} />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {isHovered && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-3 text-xs font-semibold transition-colors duration-150 group-hover:!text-background"
                      style={{ color: pathname.startsWith('/dashboard/settings') ? (isLight ? '#0066CC' : '#ffffff') : (isLight ? '#424245' : '#d0d6e0') }}>
                      Configurações
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </aside>

    </>
  )
}
