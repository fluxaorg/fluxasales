'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, Play, Zap, Check, Target, BarChart3, MousePointer2, MessageSquare, Layers, GitBranch } from 'lucide-react'
import { GooeyText } from '@/components/ui/gooey-text-morphing'
import Link from 'next/link'

// ── Floating icon card ────────────────────────────────────────────────────────

interface FloatingIconData {
  id: number
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  className: string
  colorClass: string
}

const floatingIcons: FloatingIconData[] = [
  { id: 1, Icon: Zap,          className: 'top-[18%]  left-[7%]',   colorClass: 'text-apple-blue'   },
  { id: 2, Icon: Target,       className: 'top-[22%]  right-[8%]',  colorClass: 'text-indigo-500'   },
  { id: 3, Icon: BarChart3,    className: 'bottom-[28%] left-[6%]', colorClass: 'text-emerald-500'  },
  { id: 4, Icon: MousePointer2,className: 'bottom-[22%] right-[7%]',colorClass: 'text-orange-500'  },
  { id: 5, Icon: MessageSquare,className: 'top-[48%]  left-[3%]',   colorClass: 'text-violet-500'   },
  { id: 6, Icon: Layers,       className: 'bottom-[12%] right-[4%]',colorClass: 'text-blue-400'     },
  { id: 7, Icon: GitBranch,    className: 'top-[10%]  right-[28%]', colorClass: 'text-pink-500'     },
]

function FloatingIcon({
  iconData,
  index,
  mouseX,
  mouseY,
}: {
  iconData: FloatingIconData
  index: number
  mouseX: React.MutableRefObject<number>
  mouseY: React.MutableRefObject<number>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 260, damping: 22 })
  const springY = useSpring(y, { stiffness: 260, damping: 22 })

  useEffect(() => {
    const handle = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = Math.hypot(mouseX.current - cx, mouseY.current - cy)
      if (dist < 160) {
        const angle = Math.atan2(mouseY.current - cy, mouseX.current - cx)
        const force = (1 - dist / 160) * 55
        x.set(-Math.cos(angle) * force)
        y.set(-Math.sin(angle) * force)
      } else {
        x.set(0)
        y.set(0)
      }
    }
    window.addEventListener('mousemove', handle)
    return () => window.removeEventListener('mousemove', handle)
  }, [x, y, mouseX, mouseY])

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute ${iconData.className}`}
    >
      <motion.div
        className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 p-3 rounded-3xl shadow-xl bg-white/80 backdrop-blur-md border border-apple-border"
        animate={{
          y:      [0, -10, 0, 10, 0],
          x:      [0,   6, 0,  -6, 0],
          rotate: [0,   4, 0,  -4, 0],
        }}
        transition={{
          duration: 5 + (index * 1.3) % 4,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
      >
        <iconData.Icon className={`w-8 h-8 md:w-10 md:h-10 ${iconData.colorClass}`} />
      </motion.div>
    </motion.div>
  )
}

// ── Quiz mockup data ──────────────────────────────────────────────────────────

const quizSteps = [
  {
    step: '1 de 3',
    question: 'Qual é o seu principal objetivo?',
    options: ['Aumentar Vendas', 'Gerar Leads', 'Fidelizar Clientes', 'Outro'],
    selected: 0,
  },
  {
    step: '2 de 3',
    question: 'Qual é o seu nicho de mercado?',
    options: ['Infoprodutos', 'E-commerce', 'Consultoria', 'Agência'],
    selected: 2,
  },
  {
    step: '3 de 3',
    question: 'Qual é o seu orçamento mensal?',
    options: ['Até R$1k', 'R$1k–5k', 'R$5k–20k', 'Acima de R$20k'],
    selected: 1,
  },
]

// ── Hero ──────────────────────────────────────────────────────────────────────

export default function HeroNew() {
  const [currentStep, setCurrentStep] = useState(0)
  const mouseX = useRef(0)
  const mouseY = useRef(0)

  useEffect(() => {
    const t = setInterval(() => setCurrentStep(s => (s + 1) % quizSteps.length), 3000)
    return () => clearInterval(t)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.current = e.clientX
    mouseY.current = e.clientY
  }

  const step = quizSteps[currentStep]

  return (
    <section
      className="relative bg-white overflow-hidden pt-28 pb-0"
      onMouseMove={handleMouseMove}
    >
      {/* Subtle gradient orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute top-32 right-1/4 w-80 h-80 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* ── Floating icon cards (background) ── */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingIcons.map((icon, i) => (
          <FloatingIcon
            key={icon.id}
            iconData={icon}
            index={i}
            mouseX={mouseX}
            mouseY={mouseY}
          />
        ))}
      </div>

      {/* ── Foreground content ── */}
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex items-center gap-2 bg-apple-blue/8 border border-apple-blue/20 rounded-full px-4 py-1.5"
          >
            <Zap size={12} className="text-apple-blue" fill="currentColor" />
            <span className="text-xs font-semibold text-apple-blue tracking-wide">Funis interativos de alta conversão</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[48px] md:text-[72px] lg:text-[84px] font-semibold text-apple-ink leading-[1.05] tracking-tight max-w-4xl"
          >
            Transforme tráfego em
          </motion.h1>

          {/* GooeyText */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="my-2 h-[90px] md:h-[110px] flex items-center justify-center w-full"
          >
            <GooeyText
              texts={['vendas', 'leads', 'clientes', 'resultados', 'conversões']}
              morphTime={1.5}
              cooldownTime={3.5}
              className="w-full h-[90px] md:h-[110px]"
              textClassName="text-[60px] md:text-[80px] font-bold text-apple-blue"
            />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-4 text-[18px] md:text-[20px] text-apple-ink/55 max-w-2xl leading-relaxed"
          >
            Crie quizzes e funis interativos que qualificam leads e aumentam suas conversões em até 3x.
            Sem código, em minutos.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <Link
              href="#pricing"
              onClick={e => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="group flex items-center gap-2 bg-apple-blue hover:bg-apple-blue-focus text-white rounded-full px-8 py-4 text-base font-semibold transition-all shadow-lg shadow-apple-blue/25 hover:shadow-apple-blue/40 hover:scale-[1.02]"
            >
              Começar grátis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/como-funciona"
              className="flex items-center gap-2 text-apple-ink/70 hover:text-apple-ink transition-colors text-base font-medium px-6 py-4"
            >
              <div className="w-8 h-8 rounded-full border border-apple-border flex items-center justify-center">
                <Play size={12} fill="currentColor" className="translate-x-0.5" />
              </div>
              Como funciona
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 flex items-center gap-6 text-xs text-apple-ink/35"
          >
            {['Sem cartão de crédito', 'Trial gratuito', 'Cancele quando quiser'].map(item => (
              <div key={item} className="flex items-center gap-1.5">
                <Check size={11} className="text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Quiz mockup ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 max-w-3xl mx-auto relative"
        >
          {/* Browser chrome */}
          <div className="bg-white rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.1)] border border-apple-border overflow-hidden">
            {/* Browser bar */}
            <div className="bg-apple-parchment border-b border-apple-border px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-md px-3 py-1 text-[11px] text-apple-ink/30 font-mono border border-apple-border">
                fluxa.app/preview/consultoria-marketing
              </div>
            </div>

            {/* Quiz content */}
            <div className="bg-apple-parchment p-8 md:p-14">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl shadow-sm border border-apple-border p-8 md:p-10 text-center space-y-7"
              >
                {/* Progress */}
                <div className="space-y-3">
                  <p className="text-xs font-mono uppercase tracking-[0.2em] text-apple-blue">Etapa {step.step}</p>
                  <div className="flex gap-2 justify-center">
                    {quizSteps.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-apple-blue' : i < currentStep ? 'w-4 bg-apple-blue/40' : 'w-4 bg-apple-border'}`}
                      />
                    ))}
                  </div>
                </div>

                <h3 className="text-2xl md:text-3xl font-semibold text-apple-ink tracking-tight">
                  {step.question}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {step.options.map((opt, i) => (
                    <div
                      key={opt}
                      className={`p-4 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                        i === step.selected
                          ? 'border-apple-blue bg-apple-blue/5 text-apple-blue'
                          : 'border-apple-border text-apple-ink/60'
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>

                <button className="w-full bg-apple-ink text-white py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 group">
                  Próxima etapa
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </div>
          </div>

          {/* Floating stats badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute -right-4 top-24 bg-white rounded-2xl shadow-xl border border-apple-border p-4 hidden md:block"
          >
            <p className="text-xs text-apple-ink/40 font-mono uppercase tracking-wider mb-1">Conversão</p>
            <p className="text-2xl font-bold text-emerald-500">+47%</p>
            <p className="text-xs text-apple-ink/40 mt-0.5">vs formulário estático</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute -left-4 bottom-24 bg-white rounded-2xl shadow-xl border border-apple-border p-4 hidden md:block"
          >
            <p className="text-xs text-apple-ink/40 font-mono uppercase tracking-wider mb-1">Novo lead</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-7 h-7 rounded-full bg-apple-blue/10 flex items-center justify-center text-apple-blue text-xs font-bold">M</div>
              <div>
                <p className="text-xs font-semibold text-apple-ink">Maria Lima</p>
                <p className="text-[10px] text-apple-ink/40">agora mesmo</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
