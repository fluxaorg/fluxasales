'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Check, ArrowRight, X, Crown, Zap, Shield, BarChart2, QrCode } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const PLANS = [
  {
    slug: 'basic', name: 'Basic', price: 49,
    features: ['1 funil ativo', '2.000 leads', 'Meta Pixel', 'CSV Export', 'Suporte email'],
  },
  {
    slug: 'pro', name: 'Pro', price: 149,
    features: ['5 funis ativos', '8.000 leads', 'Webhooks ativos', 'Suporte prioritário'],
    popular: true,
  },
  {
    slug: 'elite', name: 'Elite', price: 249,
    features: ['12 funis ativos', '30.000 leads', 'Equipe', 'Colaboração', 'Todos os recursos'],
  },
]

// Fake billing history
const HISTORY = [
  { month: 'Abril 2025',   status: 'Pago',    amount: null },
  { month: 'Março 2025',   status: 'Pago',    amount: null },
  { month: 'Fevereiro 2025', status: 'Pago',  amount: null },
]

export default function SubscriptionPage() {
  const supabase = createClient()
  const [plan, setPlan]     = useState('TRIAL')
  const [showPayment, setShowPayment] = useState(false)
  const [payMethod, setPayMethod]     = useState<'pix' | 'card' | null>(null)
  const [selectedUpgrade, setSelectedUpgrade] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('fluxaleads_organizations').select('id').eq('user_id', user.id).single()
      if (!org) return
      const { data: sub } = await supabase.from('fluxaleads_subscriptions').select('plan').eq('org_id', org.id).single()
      if (sub) setPlan(sub.plan)
    }
    load()
  }, [])

  const currentPlan = PLANS.find(p => p.slug === plan.toLowerCase()) ?? { name: plan, price: 0, features: [], slug: plan.toLowerCase() }
  const isTrial = plan === 'TRIAL'
  const nextBilling = new Date(); nextBilling.setDate(nextBilling.getDate() + 7)

  return (
    <div className="space-y-10 pb-12">
      <div>
        <div className="flex items-center gap-2 text-linear-text-quaternary mb-2">
          <CreditCard size={14} />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Conta</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-linear-text-primary">Minha Assinatura</h1>
        <p className="text-linear-text-tertiary mt-2 text-sm">Gerencie seu plano e histórico de pagamentos.</p>
      </div>

      {/* Hero do plano */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[32px] border border-linear-border bg-linear-surface/40 backdrop-blur-xl overflow-hidden"
      >
        <div className="h-[3px] bg-gradient-to-r from-linear-indigo to-linear-violet" />
        <div className="p-10 md:p-14">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            {/* Info */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-linear-text-quaternary mb-4">Plano atual</p>
              <h2 className="text-6xl md:text-7xl font-black text-linear-text-primary tracking-tight leading-none mb-4">
                {currentPlan.name}
              </h2>
              {!isTrial ? (
                <>
                  <p className="text-2xl font-semibold text-linear-text-secondary mb-1">
                    R${currentPlan.price}<span className="text-base font-normal text-linear-text-quaternary">/mês</span>
                  </p>
                  <p className="text-sm text-linear-text-quaternary">
                    Próxima cobrança: <span className="text-linear-text-secondary">{nextBilling.toLocaleDateString('pt-BR')}</span>
                  </p>
                </>
              ) : (
                <p className="text-lg text-amber-400 font-medium">Plano gratuito — sem cobrança</p>
              )}
              {!isTrial && (
                <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                  {currentPlan.features?.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-linear-text-tertiary">
                      <Check size={12} className="text-linear-indigo flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 lg:items-end">
              {!isTrial ? (
                <button onClick={() => setShowPayment(true)}
                  className="flex items-center gap-2 bg-linear-indigo text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-linear-violet transition-all shadow-xl shadow-linear-indigo/25 whitespace-nowrap"
                >
                  <CreditCard size={17} /> Pagar fatura
                </button>
              ) : (
                <button onClick={() => setShowUpgrade(true)}
                  className="flex items-center gap-2 bg-linear-indigo text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-linear-violet transition-all shadow-xl shadow-linear-indigo/25 whitespace-nowrap"
                >
                  <Crown size={17} /> Assinar plano
                </button>
              )}
              {plan !== 'ELITE' && (
                <button onClick={() => setShowUpgrade(true)}
                  className="flex items-center gap-2 text-linear-indigo text-sm font-medium hover:underline"
                >
                  <ArrowRight size={14} /> Fazer upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Histórico + planos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histórico */}
        {!isTrial && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-[28px] border border-linear-border bg-linear-surface/40 backdrop-blur-xl p-8"
          >
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-linear-text-quaternary mb-6">Histórico de Pagamentos</h3>
            <div className="space-y-1">
              {HISTORY.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-linear-border/40 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-linear-text-secondary">{h.month}</p>
                    <p className="text-xs text-linear-text-quaternary mt-0.5">Plano {currentPlan.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold text-linear-text-primary">R${currentPlan.price},00</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <Check size={9} /> Pago
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Outros planos disponíveis */}
        {plan !== 'ELITE' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-[28px] border border-linear-border bg-linear-surface/40 backdrop-blur-xl p-8"
          >
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-linear-text-quaternary mb-6">Planos disponíveis</h3>
            <div className="space-y-3">
              {PLANS.filter(p => p.slug !== plan.toLowerCase()).map(p => (
                <button key={p.slug} onClick={() => { setSelectedUpgrade(p.slug); setShowUpgrade(true) }}
                  className="w-full flex items-center justify-between p-5 rounded-2xl border border-linear-border bg-linear-bg hover:border-linear-indigo/40 hover:bg-linear-surface/50 transition-all group text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-linear-text-primary">{p.name}</span>
                      {p.popular && <span className="text-[9px] bg-linear-indigo text-white px-2 py-0.5 rounded-full font-bold">Popular</span>}
                    </div>
                    <p className="text-xs text-linear-text-quaternary">{p.features.slice(0, 2).join(' · ')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-black text-linear-text-primary">R${p.price}</p>
                      <p className="text-[10px] text-linear-text-quaternary">/mês</p>
                    </div>
                    <ArrowRight size={14} className="text-linear-text-quaternary group-hover:text-linear-indigo group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal pagamento */}
      <AnimatePresence>
        {showPayment && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowPayment(false); setPayMethod(null) }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-linear-surface border border-linear-border rounded-[32px] z-[301] shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-linear-text-primary">Pagar fatura</h3>
                <button onClick={() => { setShowPayment(false); setPayMethod(null) }} className="text-linear-text-quaternary hover:text-linear-text-primary"><X size={20} /></button>
              </div>
              <p className="text-sm text-linear-text-tertiary mb-6">Escolha a forma de pagamento para o plano <span className="font-semibold text-linear-text-primary">{currentPlan.name}</span> — R${currentPlan.price},00</p>
              {!payMethod ? (
                <div className="space-y-3">
                  <button onClick={() => setPayMethod('pix')} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-linear-border hover:border-linear-indigo/40 hover:bg-linear-indigo/5 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><QrCode size={20} className="text-emerald-400" /></div>
                    <div className="text-left"><p className="text-sm font-semibold text-linear-text-primary">PIX</p><p className="text-xs text-linear-text-quaternary">Aprovação instantânea</p></div>
                  </button>
                  <button onClick={() => setPayMethod('card')} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-linear-border hover:border-linear-indigo/40 hover:bg-linear-indigo/5 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-linear-indigo/10 flex items-center justify-center"><CreditCard size={20} className="text-linear-indigo" /></div>
                    <div className="text-left"><p className="text-sm font-semibold text-linear-text-primary">Cartão de crédito</p><p className="text-xs text-linear-text-quaternary">Parcelamento disponível</p></div>
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-linear-indigo/10 border border-linear-indigo/30 flex items-center justify-center mx-auto">
                    {payMethod === 'pix' ? <QrCode size={28} className="text-linear-indigo" /> : <CreditCard size={28} className="text-linear-indigo" />}
                  </div>
                  <div className="bg-linear-indigo/10 border border-linear-indigo/20 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-linear-indigo mb-1">Integração em breve</p>
                    <p className="text-xs text-linear-text-tertiary">O checkout está sendo integrado. Entre em contato para assinar.</p>
                  </div>
                  <Link href="/contato" className="block text-xs text-linear-indigo hover:underline">Falar com o time →</Link>
                  <button onClick={() => setPayMethod(null)} className="text-xs text-linear-text-quaternary hover:text-linear-text-secondary">← Voltar</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal upgrade */}
      <AnimatePresence>
        {showUpgrade && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowUpgrade(false); setSelectedUpgrade(null) }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-linear-surface border border-linear-border rounded-[32px] z-[301] shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-linear-text-primary">Escolher plano</h3>
                <button onClick={() => setShowUpgrade(false)} className="text-linear-text-quaternary hover:text-linear-text-primary"><X size={20} /></button>
              </div>
              <div className="space-y-3 mb-6">
                {PLANS.filter(p => p.slug !== plan.toLowerCase()).map(p => (
                  <button key={p.slug} onClick={() => setSelectedUpgrade(p.slug)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left ${selectedUpgrade === p.slug ? 'border-linear-indigo bg-linear-indigo/10' : 'border-linear-border hover:border-linear-indigo/40'}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-linear-text-primary">{p.name}</span>
                        {p.popular && <span className="text-[9px] bg-linear-indigo text-white px-2 py-0.5 rounded-full font-bold uppercase">Popular</span>}
                      </div>
                      <p className="text-xs text-linear-text-quaternary mt-0.5">{p.features.join(' · ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-linear-text-primary">R${p.price}</p>
                      <p className="text-[10px] text-linear-text-quaternary">/mês</p>
                    </div>
                  </button>
                ))}
              </div>
              {selectedUpgrade && (
                <button
                  onClick={() => { toast('Checkout em breve! Entre em contato para assinar.', { icon: '🚀' }); setShowUpgrade(false) }}
                  className="w-full flex items-center justify-center gap-2 bg-linear-indigo text-white py-4 rounded-2xl font-semibold hover:bg-linear-violet transition-all shadow-xl shadow-linear-indigo/25"
                >
                  <Crown size={16} /> Sim, fazer upgrade para {PLANS.find(p => p.slug === selectedUpgrade)?.name}
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
