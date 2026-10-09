'use client'

import { useEffect, useState } from 'react'
import { effectivePlan, hasEliteFeatures } from '@/lib/plans'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  LogOut, Pencil, Lock, Check, X, BarChart2,
  GitBranch, Users, Zap, Crown, Shield
} from 'lucide-react'

import { getAvatar } from '@/lib/avatar'

const PLAN_LIMITS: Record<string, { funnels: number; leads: number; label: string; icon: React.ReactNode }> = {
  TRIAL: { funnels: 1,  leads: 500,   label: 'Trial',  icon: <Shield size={14} /> },
  BASIC: { funnels: 2,  leads: 2000,  label: 'Basic',  icon: <Zap size={14} /> },
  PRO:   { funnels: 5,  leads: 8000,  label: 'Pro',    icon: <BarChart2 size={14} /> },
  ELITE: { funnels: 12, leads: 30000, label: 'Elite',  icon: <Crown size={14} /> },
  UNLIMITED: { funnels: Infinity, leads: Infinity, label: 'Ilimitado', icon: <Crown size={14} /> },
}

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser]         = useState<any>(null)
  const [plan, setPlan]         = useState('TRIAL')
  const [orgId, setOrgId]       = useState('')
  const [funnelCount, setFunnelCount] = useState(0)
  const [leadCount, setLeadCount]     = useState(0)
  const [loading, setLoading]   = useState(true)

  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName]         = useState('')
  const [savingName, setSavingName]   = useState(false)

  const [editingPw, setEditingPw] = useState(false)
  const [newPw, setNewPw]         = useState('')
  const [savingPw, setSavingPw]   = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      setNewName(user.user_metadata?.full_name || user.email?.split('@')[0] || '')

      const { data: org } = await supabase.from('fluxaleads_organizations').select('id').eq('user_id', user.id).single()
      if (org) {
        setOrgId(org.id)
        const { data: sub } = await supabase.from('fluxaleads_subscriptions').select('plan').eq('org_id', org.id).single()
        setPlan(effectivePlan(sub?.plan, user))
        const { count: fc } = await supabase.from('fluxaleads_funnels').select('*', { count: 'exact', head: true }).eq('org_id', org.id)
        setFunnelCount(fc ?? 0)
        const { count: lc } = await supabase.from('fluxaleads_leads').select('*', { count: 'exact', head: true }).eq('org_id', org.id)
        setLeadCount(lc ?? 0)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveName = async () => {
    setSavingName(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: newName.trim() } })
    setSavingName(false)
    if (error) { toast.error('Erro ao salvar.'); return }
    toast.success('Nome atualizado!')
    setEditingName(false)
  }

  const handleSavePw = async () => {
    if (newPw.length < 6) { toast.error('Senha deve ter ao menos 6 caracteres.'); return }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSavingPw(false)
    if (error) { toast.error(error.message); return }
    toast.success('Senha atualizada!')
    setNewPw('')
    setEditingPw(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-linear-indigo border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const avatar = getAvatar(user?.email)
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.TRIAL
  const funnelPct = Math.min((funnelCount / limits.funnels) * 100, 100)
  const leadPct   = Math.min((leadCount   / limits.leads)   * 100, 100)
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-linear-text-quaternary mb-1">Conta</p>
        <h1 className="text-3xl font-semibold text-linear-text-primary tracking-tight">Meu Perfil</h1>
      </div>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-linear-border bg-linear-surface/40 backdrop-blur-xl overflow-hidden"
      >
        {/* Top banner */}
        <div className={`h-24 bg-gradient-to-r ${avatar.bg} opacity-70`} />

        <div className="px-8 pb-8">
          {/* Avatar */}
          <div className={`-mt-10 mb-5 w-20 h-20 rounded-2xl bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-3xl border-4 border-linear-surface shadow-xl`}>
            {avatar.symbol}
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-linear-text-primary">{displayName}</h2>
              <p className="text-linear-text-tertiary text-sm mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-2 text-linear-indigo">
                {limits.icon}
                <span className="text-xs font-bold uppercase tracking-widest">Plano {limits.label}</span>
              </div>
            </div>

            <button onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all self-start"
            >
              <LogOut size={15} /> Sair da conta
            </button>
          </div>
        </div>
      </motion.div>

      {/* Usage analytics */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-[28px] border border-linear-border bg-linear-surface/40 backdrop-blur-xl p-8 space-y-6"
      >
        <h3 className="text-sm font-semibold text-linear-text-primary uppercase tracking-wider">Uso do Plano</h3>

        {/* Funnels */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-linear-text-secondary">
              <GitBranch size={14} className="text-linear-indigo" />
              <span>Funis ativos</span>
            </div>
            <span className="text-linear-text-quaternary font-mono">
              <span className={funnelPct >= 90 ? 'text-red-400 font-bold' : 'text-linear-text-primary font-semibold'}>{funnelCount}</span>
              {' '}/ {limits.funnels}
            </span>
          </div>
          <div className="h-2 rounded-full bg-linear-surface-elevated overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${funnelPct}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className={`h-full rounded-full ${funnelPct >= 90 ? 'bg-red-500' : 'bg-linear-indigo'}`}
            />
          </div>
        </div>

        {/* Leads */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-linear-text-secondary">
              <Users size={14} className="text-linear-indigo" />
              <span>Leads capturados</span>
            </div>
            <span className="text-linear-text-quaternary font-mono">
              <span className={leadPct >= 90 ? 'text-red-400 font-bold' : 'text-linear-text-primary font-semibold'}>
                {leadCount.toLocaleString('pt-BR')}
              </span>
              {' '}/ {limits.leads.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="h-2 rounded-full bg-linear-surface-elevated overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${leadPct}%` }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className={`h-full rounded-full ${leadPct >= 90 ? 'bg-red-500' : 'bg-linear-indigo'}`}
            />
          </div>
        </div>

        {/* Plan details grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[
            { label: 'Funis permitidos', value: limits.funnels },
            { label: 'Leads máximo',     value: limits.leads.toLocaleString('pt-BR') },
            { label: 'Plano atual',      value: limits.label },
            { label: 'Webhooks',         value: plan === 'TRIAL' ? 'Não' : 'Sim' },
          ].map(item => (
            <div key={item.label} className="p-4 rounded-2xl bg-linear-surface-elevated border border-linear-border">
              <p className="text-[10px] text-linear-text-quaternary uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-linear-text-primary font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Settings — tudo num bloco só */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-[28px] border border-linear-border bg-linear-surface/40 backdrop-blur-xl p-8 space-y-5"
      >
        <h3 className="text-sm font-semibold text-linear-text-primary uppercase tracking-wider">Configurações da Conta</h3>

        {/* Nome — clique inline para editar */}
        <div>
          <p className="text-[10px] text-linear-text-quaternary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Pencil size={10} /> Nome de exibição
          </p>
          {editingName ? (
            <div className="flex gap-2">
              <input
                autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                className="flex-1 bg-linear-bg border border-linear-indigo/50 rounded-xl px-3 py-2 text-sm text-linear-text-primary outline-none"
              />
              <button onClick={handleSaveName} disabled={savingName} className="p-2 rounded-xl bg-linear-indigo text-white">
                <Check size={15} />
              </button>
              <button onClick={() => setEditingName(false)} className="p-2 rounded-xl bg-linear-surface border border-linear-border text-linear-text-quaternary">
                <X size={15} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setEditingName(true); setNewName(displayName) }}
              className="w-full text-left px-3 py-2 rounded-xl bg-linear-surface-elevated border border-linear-border hover:border-linear-indigo/40 transition-all group"
            >
              <span className="text-sm text-linear-text-primary font-medium">{displayName}</span>
              <span className="text-xs text-linear-text-quaternary ml-2 opacity-0 group-hover:opacity-100 transition-opacity">clique para editar</span>
            </button>
          )}
        </div>

        {/* Senha */}
        <div>
          <p className="text-[10px] text-linear-text-quaternary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Lock size={10} /> Senha
          </p>
          {editingPw ? (
            <div className="flex gap-2">
              <input
                autoFocus type="password" placeholder="Nova senha (mín. 6 caracteres)"
                value={newPw} onChange={e => setNewPw(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSavePw(); if (e.key === 'Escape') setEditingPw(false) }}
                className="flex-1 bg-linear-bg border border-linear-indigo/50 rounded-xl px-3 py-2 text-sm text-linear-text-primary outline-none"
              />
              <button onClick={handleSavePw} disabled={savingPw} className="p-2 rounded-xl bg-linear-indigo text-white">
                <Check size={15} />
              </button>
              <button onClick={() => setEditingPw(false)} className="p-2 rounded-xl bg-linear-surface border border-linear-border text-linear-text-quaternary">
                <X size={15} />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingPw(true)}
              className="w-full text-left px-3 py-2 rounded-xl bg-linear-surface-elevated border border-linear-border hover:border-linear-indigo/40 transition-all group"
            >
              <span className="text-sm text-linear-text-quaternary tracking-widest">••••••••</span>
              <span className="text-xs text-linear-text-quaternary ml-2 opacity-0 group-hover:opacity-100 transition-opacity">clique para alterar</span>
            </button>
          )}
        </div>

        {!hasEliteFeatures(plan) && (
          <a href="/checkout/elite"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-linear-indigo/10 border border-linear-indigo/30 text-linear-indigo font-semibold text-sm hover:bg-linear-indigo/20 transition-all"
          >
            <Crown size={15} /> Fazer upgrade de plano
          </a>
        )}
      </motion.div>
    </div>
  )
}
