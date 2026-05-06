'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GitBranch, Users, BarChart2, ArrowRight, Plug2, CreditCard, Plus } from 'lucide-react'
import { getAvatar } from '@/lib/avatar'

export default function DashboardHome() {
  const supabase = createClient()
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [plan, setPlan]           = useState('TRIAL')
  const [funnelCount, setFunnelCount] = useState(0)
  const [leadCount, setLeadCount]   = useState(0)
  const [recentFunnels, setRecentFunnels] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      setName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'usuário')

      const { data: org } = await supabase.from('fluxaleads_organizations').select('id').eq('user_id', user.id).single()
      if (!org) return

      const [subRes, funnelRes, leadRes] = await Promise.all([
        supabase.from('fluxaleads_subscriptions').select('plan').eq('org_id', org.id).single(),
        supabase.from('fluxaleads_funnels').select('*', { count: 'exact' }).eq('org_id', org.id).order('created_at', { ascending: false }).limit(4),
        supabase.from('fluxaleads_leads').select('*', { count: 'exact', head: true }).eq('org_id', org.id),
      ])
      if (subRes.data) setPlan(subRes.data.plan)
      setFunnelCount(funnelRes.count ?? 0)
      setRecentFunnels(funnelRes.data ?? [])
      setLeadCount(leadRes.count ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  const avatar = getAvatar(email)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const nav = [
    { href: '/dashboard/funnels',      icon: GitBranch, label: 'Meus Funis',    value: `${funnelCount} criados` },
    { href: '/dashboard/leads',        icon: Users,     label: 'Leads',          value: `${leadCount} capturados` },
    { href: '/dashboard/analytics',    icon: BarChart2, label: 'Análises',       value: 'Ver métricas' },
    { href: '/dashboard/integrations', icon: Plug2,     label: 'Integrações',    value: 'Webhooks & pixels' },
    { href: '/dashboard/subscription', icon: CreditCard,label: 'Assinatura',     value: `Plano ${plan}` },
  ]

  return (
    <div className="space-y-12 pb-12">
      {/* Boas-vindas */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-linear-text-quaternary mb-3">{greeting}</p>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
            {avatar.symbol}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-linear-text-primary tracking-tight capitalize leading-none">{name}</h1>
            <p className="text-linear-text-quaternary text-sm mt-1.5">
              Plano <span className="text-linear-text-secondary font-medium">{plan}</span>
              <span className="mx-2 opacity-30">·</span>
              <span>{funnelCount} funil{funnelCount !== 1 ? 's' : ''}</span>
              <span className="mx-2 opacity-30">·</span>
              <span>{leadCount} lead{leadCount !== 1 ? 's' : ''}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Atalhos — linha minimalista */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-linear-text-quaternary mb-3">Navegação rápida</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
          {nav.map((item, i) => (
            <motion.div key={item.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={item.href}
                className="group flex items-center justify-between p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-linear-indigo/30 hover:bg-white/[0.05] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={15} className="text-linear-text-quaternary group-hover:text-linear-indigo transition-colors" />
                  <div>
                    <p className="text-xs font-semibold text-linear-text-secondary group-hover:text-linear-text-primary transition-colors leading-none">{item.label}</p>
                    <p className="text-[10px] text-linear-text-quaternary mt-0.5">{item.value}</p>
                  </div>
                </div>
                <ArrowRight size={12} className="text-linear-text-quaternary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Funis recentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-linear-text-quaternary">Funis recentes</p>
          <Link href="/dashboard/funnels" className="flex items-center gap-1 text-xs text-linear-text-quaternary hover:text-linear-indigo transition-colors">
            Ver todos <ArrowRight size={11} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl border border-white/[0.05] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : recentFunnels.length === 0 ? (
          <Link href="/dashboard/funnels"
            className="group flex flex-col items-center justify-center gap-3 h-36 rounded-2xl border border-dashed border-white/[0.08] hover:border-linear-indigo/30 transition-all"
          >
            <Plus size={20} className="text-linear-text-quaternary group-hover:text-linear-indigo transition-colors" />
            <p className="text-xs text-linear-text-quaternary group-hover:text-linear-text-secondary transition-colors">Criar primeiro funil</p>
          </Link>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentFunnels.map((f, i) => {
              const daysAgo = Math.floor((Date.now() - new Date(f.created_at).getTime()) / 86400000)
              return (
                <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link href={`/dashboard/funnels/${f.id}/builder`}
                    className="group flex flex-col justify-between h-36 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-linear-indigo/25 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${f.status === 'published' ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <ArrowRight size={12} className="text-linear-text-quaternary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-linear-text-primary leading-tight line-clamp-2 group-hover:text-linear-indigo transition-colors">{f.name}</p>
                      <p className="text-[10px] text-linear-text-quaternary mt-1.5 font-mono">
                        {daysAgo === 0 ? 'hoje' : `há ${daysAgo}d`}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
