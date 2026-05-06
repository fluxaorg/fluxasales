'use client'

import {
  GitBranch,
  Zap,
  MousePointer2,
  Globe,
  BarChart3,
  ShieldCheck
} from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    title: 'Editor Drag-and-Drop',
    desc: 'Monte funis complexos em minutos. Arraste componentes, configure perguntas e publique com um clique.',
    icon: MousePointer2,
    color: 'text-blue-500'
  },
  {
    title: 'Lógica Condicional',
    desc: 'Direcione cada lead para etapas diferentes com base nas respostas. Jornadas personalizadas para cada visitante.',
    icon: GitBranch,
    color: 'text-purple-500'
  },
  {
    title: 'Webhooks & Pixels',
    desc: 'Envie dados para seu CRM via webhooks e rastreie conversões com o Meta Pixel automaticamente.',
    icon: Zap,
    color: 'text-orange-500'
  },
  {
    title: 'Análises em Tempo Real',
    desc: 'Acompanhe visualizações, taxas de conversão e abandono em um dashboard intuitivo.',
    icon: BarChart3,
    color: 'text-emerald-500'
  },
  {
    title: 'Links Públicos Personalizados',
    desc: 'Gere links profissionais para seus funis ou incorpore-os diretamente no seu site.',
    icon: Globe,
    color: 'text-blue-400'
  },
  {
    title: 'Segurança de Dados',
    desc: 'Seus dados e leads estão protegidos com criptografia ponta a ponta e RLS.',
    icon: ShieldCheck,
    color: 'text-indigo-500'
  },
]

export default function Features() {
  return (
    <section id="features" className="py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24 space-y-4">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-apple-blue uppercase tracking-[0.2em]"
          >
            Poderoso e Simples
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[40px] md:text-[56px] font-semibold text-apple-ink leading-[1.1] tracking-tight"
          >
            Tudo que você precisa.<br />Nada que não precisa.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-10 rounded-[32px] bg-apple-parchment border border-apple-border hover:bg-white hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-500"
            >
              <div className={`w-12 h-12 rounded-2xl bg-white border border-apple-border flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500 ${f.color}`}>
                <f.icon size={24} />
              </div>
              <h3 className="text-xl font-semibold text-apple-ink mb-4 tracking-tight">{f.title}</h3>
              <p className="text-[15px] text-apple-ink/60 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
