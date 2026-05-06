'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

const stats = [
  { value: 10000, suffix: '+', label: 'Leads capturados', desc: 'em funis ativos' },
  { value: 47, suffix: '%', label: 'Aumento médio', desc: 'na taxa de conversão' },
  { value: 3, suffix: 'x', label: 'Mais engajamento', desc: 'vs formulário estático' },
  { value: 500, suffix: '+', label: 'Usuários ativos', desc: 'em todo o Brasil' },
]

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const duration = 1500
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, value])

  return (
    <span ref={ref} className="text-5xl md:text-6xl font-bold text-white tracking-tight tabular-nums">
      {count.toLocaleString('pt-BR')}{suffix}
    </span>
  )
}

export default function StatsSection() {
  return (
    <section className="py-24 bg-apple-ink overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-xs font-semibold text-white/40 uppercase tracking-[0.3em] mb-16"
        >
          Números que comprovam
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center space-y-2"
            >
              <Counter value={s.value} suffix={s.suffix} />
              <p className="text-white font-semibold text-sm">{s.label}</p>
              <p className="text-white/40 text-xs">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
