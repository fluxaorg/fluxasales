'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import { GooeyText } from '@/components/ui/gooey-text-morphing'
import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section className="py-32 px-6 bg-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-apple-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 bg-apple-blue/8 border border-apple-blue/15 rounded-full px-4 py-1.5 mb-2">
            <Zap size={12} className="text-apple-blue" fill="currentColor" />
            <span className="text-xs font-semibold text-apple-blue tracking-wide">Comece hoje mesmo</span>
          </div>

          <h2 className="text-[44px] md:text-[64px] font-semibold text-apple-ink leading-[1.05] tracking-tight">
            Pronto para gerar
          </h2>

          <div className="h-[70px] md:h-[90px] flex items-center justify-center">
            <GooeyText
              texts={['mais leads', 'mais vendas', 'mais clientes', 'mais resultados']}
              morphTime={1.2}
              cooldownTime={2.5}
              className="w-full h-[70px] md:h-[90px]"
              textClassName="text-[48px] md:text-[64px] font-bold text-apple-blue"
            />
          </div>

          <p className="text-lg text-apple-ink/50 max-w-xl mx-auto leading-relaxed">
            Junte-se a centenas de criadores que já transformam tráfego em resultados com funis interativos da Fluxa Sales.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="#pricing"
              onClick={e => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="group flex items-center gap-2 bg-apple-blue hover:bg-apple-blue-focus text-white rounded-full px-10 py-4 text-base font-semibold transition-all shadow-xl shadow-apple-blue/25 hover:shadow-apple-blue/40 hover:scale-[1.03]"
            >
              Começar grátis agora
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contato"
              className="text-apple-ink/60 hover:text-apple-ink text-sm font-medium transition-colors"
            >
              Falar com o time →
            </Link>
          </div>

          <p className="text-xs text-apple-ink/30">
            Sem cartão de crédito · Trial gratuito · Cancele quando quiser
          </p>
        </motion.div>
      </div>
    </section>
  )
}
