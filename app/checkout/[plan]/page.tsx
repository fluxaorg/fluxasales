'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Lock, CreditCard, ArrowLeft, Zap, Shield, Star } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const planDetails: Record<string, { name: string; price: string; period: string; features: string[]; color: string }> = {
  basic: {
    name: 'Basic',
    price: 'R$49',
    period: '/mês',
    color: 'from-slate-600 to-slate-800',
    features: ['1 funil ativo', '2.000 leads máximo', 'Meta Pixel', 'Exportação CSV', 'Suporte por email'],
  },
  pro: {
    name: 'Pro',
    price: 'R$149',
    period: '/mês',
    color: 'from-indigo-600 to-blue-700',
    features: ['5 funis ativos', '8.000 leads máximo', 'Meta Pixel', 'Webhooks ativos', 'Suporte prioritário'],
  },
  elite: {
    name: 'Elite',
    price: 'R$249',
    period: '/mês',
    color: 'from-violet-600 to-purple-700',
    features: ['12 funis ativos', '30.000 leads máximo', 'Webhooks + Equipe', 'Múltiplos usuários', 'Colaboração entre contas'],
  },
}

export default function CheckoutPage() {
  const params = useParams()
  const slug = (params.plan as string) || 'pro'
  const plan = planDetails[slug] || planDetails.pro
  const [showComingSoon, setShowComingSoon] = useState(false)

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-apple-border py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-apple-ink/70 hover:text-apple-ink transition-colors">
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-apple-blue flex items-center justify-center">
              <Zap size={12} fill="white" className="text-white" />
            </div>
            <span className="text-base font-bold text-apple-ink">Fluxa Sales</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-apple-ink/40">
            <Lock size={12} />
            <span>Pagamento seguro</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 grid md:grid-cols-2 gap-10 items-start">
        {/* Left: Plan summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div>
            <p className="text-xs font-semibold text-apple-blue uppercase tracking-[0.2em] mb-2">Você escolheu</p>
            <h1 className="text-4xl font-bold text-apple-ink tracking-tight">Plano {plan.name}</h1>
          </div>

          {/* Price card */}
          <div className={`rounded-3xl p-8 bg-gradient-to-br ${plan.color} text-white shadow-xl`}>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
              <span className="text-white/60 text-base mb-1">{plan.period}</span>
            </div>
            <p className="text-white/60 text-sm mt-1">Cobrado mensalmente · Cancele quando quiser</p>
          </div>

          {/* Features */}
          <div className="bg-white rounded-2xl p-6 border border-apple-border">
            <p className="text-xs font-semibold text-apple-ink/40 uppercase tracking-widest mb-4">Incluído no plano</p>
            <ul className="space-y-3">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-apple-ink/80">
                  <div className="w-5 h-5 rounded-full bg-apple-blue/10 flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-apple-blue" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 text-xs text-apple-ink/40">
            <div className="flex items-center gap-1.5">
              <Shield size={13} />
              <span>Dados protegidos (LGPD)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star size={13} />
              <span>Suporte incluído</span>
            </div>
          </div>
        </motion.div>

        {/* Right: Payment form (mockup) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-3xl border border-apple-border p-8 shadow-sm space-y-6"
        >
          <h2 className="text-xl font-semibold text-apple-ink tracking-tight">Dados de pagamento</h2>

          {/* Coming soon notice */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap size={14} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-900">Integração de pagamento em breve</p>
              <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
                Estamos integrando o checkout com Stripe. Por enquanto, entre em contato via email para assinar.
              </p>
            </div>
          </div>

          {/* Fake form fields */}
          <div className="space-y-4 opacity-50 pointer-events-none select-none">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-apple-ink/60 uppercase tracking-wider">Nome no cartão</label>
              <input
                disabled
                placeholder="João Silva"
                className="w-full border border-apple-border rounded-xl px-4 py-3 text-sm text-apple-ink bg-apple-parchment"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-apple-ink/60 uppercase tracking-wider">Número do cartão</label>
              <div className="relative">
                <input
                  disabled
                  placeholder="1234 5678 9012 3456"
                  className="w-full border border-apple-border rounded-xl px-4 py-3 text-sm text-apple-ink bg-apple-parchment pr-12"
                />
                <CreditCard size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-ink/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-apple-ink/60 uppercase tracking-wider">Validade</label>
                <input disabled placeholder="MM/AA" className="w-full border border-apple-border rounded-xl px-4 py-3 text-sm text-apple-ink bg-apple-parchment" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-apple-ink/60 uppercase tracking-wider">CVV</label>
                <input disabled placeholder="123" className="w-full border border-apple-border rounded-xl px-4 py-3 text-sm text-apple-ink bg-apple-parchment" />
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3 pt-2">
            <Link
              href="/contato"
              className="w-full flex items-center justify-center gap-2 bg-apple-blue hover:bg-apple-blue-focus text-white py-4 rounded-2xl font-semibold text-[15px] transition-all"
            >
              Falar com o time de vendas
            </Link>
            <Link
              href="/#pricing"
              className="w-full flex items-center justify-center gap-2 bg-apple-parchment hover:bg-apple-border text-apple-ink py-3 rounded-2xl text-sm font-medium transition-all border border-apple-border"
            >
              Escolher outro plano
            </Link>
          </div>

          <p className="text-center text-xs text-apple-ink/30">
            Ao assinar você concorda com nossos{' '}
            <Link href="#" className="underline hover:text-apple-blue">Termos de Uso</Link>
          </p>
        </motion.div>
      </main>
    </div>
  )
}
