'use client'

import { motion } from 'framer-motion'
import { Rocket, Building2, ShoppingBag, Megaphone } from 'lucide-react'

const segments = [
  {
    icon: Rocket,
    title: 'Infoprodutores',
    badge: 'Tráfego Qualificado',
    desc: 'Aumente seu ROI levando tráfego qualificado para o front-end da sua oferta. Funis otimizados para converter no ato e maximizar cada clique pago.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Building2,
    title: 'Agências',
    badge: 'Engajamento Inteligente',
    desc: 'Proporcione experiências interativas e personalizadas aos seus clientes — desde captação de leads altamente segmentada até vendas de high-ticket.',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
  },
  {
    icon: ShoppingBag,
    title: 'E-commerces',
    badge: 'Vendas Dinâmicas',
    desc: 'Ofereça ofertas e recomendações personalizadas com base no comportamento de cada cliente. Colete dados estratégicos enquanto vende.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Megaphone,
    title: 'Lançamentos',
    badge: 'Impacto Imediato',
    desc: 'Crie uma experiência única no lançamento: envolva o público com interatividade, colete dados em tempo real e aumente conversão com um pitch alinhado às expectativas.',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
]

export default function ForWhomSection() {
  return (
    <section className="py-32 px-6 bg-apple-parchment overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-apple-blue uppercase tracking-[0.2em]"
          >
            Para quem é
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[40px] md:text-[52px] font-semibold text-apple-ink leading-[1.1] tracking-tight"
          >
            Para quem transforma<br />tráfego em resultados.
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {segments.map((seg, i) => (
            <motion.div
              key={seg.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-[32px] p-10 border border-apple-border hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all duration-500"
            >
              <div className="flex items-start gap-6">
                <div className={`w-14 h-14 rounded-2xl ${seg.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                  <seg.icon size={26} className={seg.color} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-apple-ink tracking-tight">{seg.title}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${seg.bg} ${seg.color}`}>
                      {seg.badge}
                    </span>
                  </div>
                  <p className="text-[15px] text-apple-ink/60 leading-relaxed">{seg.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
