'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Carlos Mendes',
    handle: '@carlosmendes.mkt',
    avatar: 'C',
    color: 'bg-blue-500',
    text: 'Desde que implementei os funis interativos da Fluxa Sales, minha taxa de conversão aumentou 35%. É extremamente intuitivo — em menos de 20 minutos já tinha meu primeiro funil no ar.',
    date: 'Março 2025',
  },
  {
    name: 'Juliana Ribeiro',
    handle: '@julianaribeiro.ads',
    avatar: 'J',
    color: 'bg-violet-500',
    text: 'Em 30 dias usando a Fluxa bati recorde de leads qualificados. A diferença para formulários estáticos é absurda — o lead chega com muito mais contexto e intenção de compra.',
    date: 'Janeiro 2025',
  },
  {
    name: 'Rafael Costa',
    handle: '@rafacosta.digital',
    avatar: 'R',
    color: 'bg-emerald-500',
    text: 'A plataforma mais completa que já usei para criar quizzes de qualificação. O editor drag-and-drop é sensacional, e a integração com webhook me salvou horas de trabalho manual.',
    date: 'Fevereiro 2025',
  },
  {
    name: 'Amanda Torres',
    handle: '@amandatorres.coach',
    avatar: 'A',
    color: 'bg-orange-500',
    text: 'Gamifiquei toda a jornada dos meus leads com a Fluxa. O que me fez bater sete dígitos em menos de 45 dias quando comecei a testar a ferramenta. Produto incrível.',
    date: 'Dezembro 2024',
  },
  {
    name: 'Diego Brandão',
    handle: '@diegobrandao.ads',
    avatar: 'D',
    color: 'bg-rose-500',
    text: 'Troquei minhas landing pages estáticas por funis interativos com a Fluxa. Simplifiquei toda a estrutura e comecei a ver muito mais conversões de forma orgânica.',
    date: 'Novembro 2024',
  },
  {
    name: 'Fernanda Silva',
    handle: '@fernanda.ecommerce',
    avatar: 'F',
    color: 'bg-cyan-500',
    text: 'Uso a Fluxa para recomendar produtos personalizados no meu e-commerce. A taxa de clique nos funis é 3x maior que nas minhas campanhas de email. Simplesmente funciona.',
    date: 'Abril 2025',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-32 px-6 bg-apple-ink overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-white/40 uppercase tracking-[0.3em]"
          >
            Depoimentos
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[40px] md:text-[52px] font-semibold text-white leading-[1.1] tracking-tight"
          >
            Quem usa, recomenda.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-lg"
          >
            Casos reais de quem transformou tráfego em vendas com a Fluxa Sales.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-7 flex flex-col gap-5 hover:bg-white/[0.07] transition-colors duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={13} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/75 text-sm leading-relaxed flex-1">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.08]">
                <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-white/35 text-xs">{t.handle}</p>
                </div>
                <span className="ml-auto text-[10px] text-white/25 font-mono">{t.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
