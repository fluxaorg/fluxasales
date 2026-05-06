'use client'

import { Check, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const plans = [
  {
    name: 'Basic',
    price: 'R$49',
    period: '/mês',
    slug: 'basic',
    desc: 'Perfeito para quem está começando a capturar leads online.',
    features: ['1 funil ativo', '2.000 leads máximo', 'Meta Pixel', 'Exportação CSV', 'Suporte por email'],
    cta: 'Começar agora',
    featured: false,
  },
  {
    name: 'Pro',
    price: 'R$149',
    period: '/mês',
    slug: 'pro',
    desc: 'Para equipes que precisam de escala e integrações avançadas.',
    features: ['5 funis ativos', '8.000 leads máximo', 'Meta Pixel', 'Webhooks ativos', 'Suporte prioritário'],
    cta: 'Assinar Pro',
    featured: true,
  },
  {
    name: 'Elite',
    price: 'R$249',
    period: '/mês',
    slug: 'elite',
    desc: 'Solução completa para grandes operações e agências.',
    features: ['12 funis ativos', '30.000 leads máximo', 'Webhooks + Equipe', 'Múltiplos usuários', 'Colaboração entre contas'],
    cta: 'Assinar Elite',
    featured: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-32 px-6 bg-apple-parchment overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-apple-blue uppercase tracking-[0.2em]"
          >
            Planos
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[40px] md:text-[56px] font-semibold text-apple-ink leading-[1.1] tracking-tight"
          >
            Simples, como deve ser.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-apple-ink/60"
          >
            Escolha o plano que melhor se encaixa no seu momento.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className={`relative rounded-[40px] p-12 flex flex-col transition-all duration-500 ${
                plan.featured
                  ? 'bg-apple-ink text-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] scale-105 z-10'
                  : 'bg-white border border-apple-border text-apple-ink'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-apple-blue text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-apple-blue/20">
                  Recomendado
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-xl font-semibold mb-2 ${plan.featured ? 'text-white' : 'text-apple-ink'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                  <span className={`text-sm font-medium ${plan.featured ? 'text-white/40' : 'text-apple-ink/40'}`}>
                    {plan.period}
                  </span>
                </div>
              </div>

              <p className={`text-[15px] leading-relaxed mb-10 ${plan.featured ? 'text-white/60' : 'text-apple-ink/60'}`}>
                {plan.desc}
              </p>

              <ul className="space-y-4 mb-12 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm font-medium">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.featured ? 'bg-apple-blue' : 'bg-apple-blue/10 text-apple-blue'}`}>
                      <Check size={12} className={plan.featured ? 'text-white' : ''} />
                    </div>
                    <span className={plan.featured ? 'text-white/90' : 'text-apple-ink/80'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/checkout/${plan.slug}`}
                className={`w-full py-4 rounded-2xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2 group ${
                  plan.featured
                    ? 'bg-apple-blue text-white hover:bg-apple-blue-focus'
                    : 'bg-apple-ink text-white hover:bg-black'
                }`}
              >
                {plan.cta}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-apple-ink/40">
            Precisa de uma solução personalizada?{' '}
            <Link href="/contato" className="text-apple-blue font-medium hover:underline">
              Fale conosco.
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
