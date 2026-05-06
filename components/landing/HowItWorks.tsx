'use client'

import { motion } from 'framer-motion'
import { Edit3, Share2, TrendingUp } from 'lucide-react'

const steps = [
  {
    icon: Edit3,
    title: 'Crie seu funil',
    desc: 'Monte etapas interativas com nosso editor visual intuitivo. Arraste componentes, configure perguntas e botões — zero código.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    icon: Share2,
    title: 'Compartilhe o link',
    desc: 'Cada funil recebe um link único e profissional. Compartilhe nas redes sociais, anúncios, ou incorpore no seu próprio domínio.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  {
    icon: TrendingUp,
    title: 'Converta mais leads',
    desc: 'Receba dados qualificados em tempo real. Exporte para CSV ou conecte via webhook com seu CRM favorito automaticamente.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-32 px-6 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-24 space-y-4">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-apple-blue uppercase tracking-[0.2em]"
          >
            Passo a Passo
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[40px] md:text-[56px] font-semibold text-apple-ink leading-[1.1] tracking-tight"
          >
            De ideia a conversão em minutos.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
          {steps.map((step, i) => (
            <motion.div 
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative flex flex-col items-center text-center group"
            >
              {/* Connector line for desktop */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-[1px] bg-gradient-to-r from-apple-border to-transparent z-0" />
              )}
              
              <div className={`w-20 h-20 rounded-3xl ${step.bgColor} ${step.color} flex items-center justify-center mb-8 relative z-10 shadow-sm border border-apple-border/50 group-hover:scale-110 transition-transform duration-500`}>
                <step.icon size={32} />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-apple-ink text-white text-[10px] font-bold flex items-center justify-center">
                  0{i + 1}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-apple-ink mb-4 tracking-tight">{step.title}</h3>
              <p className="text-[15px] text-apple-ink/60 leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
