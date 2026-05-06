'use client'

import { useState } from 'react'
import LoginModal from '@/components/Auth/LoginModal'
import { FloatingIconsHero } from '@/components/floating-icons-hero-section'
import { LiquidButton } from '@/components/liquid-glass-button'
import { 
  Zap,
  Target,
  BarChart3,
  MousePointer2,
  Layers,
  ArrowRight,
  MessageSquare
} from 'lucide-react'

const heroIcons = [
  { id: 1, icon: Zap, className: 'top-[15%] left-[10%] text-apple-blue' },
  { id: 2, icon: Target, className: 'top-[25%] right-[15%] text-linear-indigo' },
  { id: 3, icon: BarChart3, className: 'bottom-[20%] left-[15%] text-emerald-500' },
  { id: 4, icon: MousePointer2, className: 'bottom-[25%] right-[20%] text-orange-500' },
  { id: 5, icon: MessageSquare, className: 'top-[40%] left-[5%] text-purple-500' },
  { id: 6, icon: Layers, className: 'bottom-[10%] right-[10%] text-blue-400' },
]

export default function Hero() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <section className="bg-white overflow-hidden">
        <FloatingIconsHero
          title="Funis que convertem."
          subtitle="Crie experiências interativas que qualificam leads e aumentam suas vendas em até 3x. Sem código, em minutos."
          ctaText="Começar agora"
          ctaHref="#"
          icons={heroIcons}
          className="bg-white h-[90vh]"
          onClick={() => setOpen(true)}
        />

        {/* Apple-style mockup below hero */}
        <div className="max-w-5xl mx-auto px-6 -mt-24 mb-32 relative z-20">
          <div className="relative rounded-3xl overflow-hidden border border-apple-border shadow-[0_20px_80px_rgba(0,0,0,0.1)] bg-white">
            <div className="aspect-[16/9] bg-apple-parchment flex items-center justify-center p-8 md:p-16">
              <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-apple-border overflow-hidden p-6 md:p-12 text-center space-y-8">
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase tracking-[0.2em] text-apple-blue">Etapa 1 de 3</p>
                  <h3 className="text-3xl md:text-4xl font-semibold text-apple-ink tracking-tight">
                    Qual é o seu principal objetivo?
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Aumentar Vendas',
                    'Gerar Leads',
                    'Fidelizar Clientes',
                    'Outro'
                  ].map((opt, i) => (
                    <div 
                      key={opt} 
                      className={`p-6 rounded-xl border-2 transition-all cursor-default text-left ${
                        i === 0 
                          ? 'border-apple-blue bg-apple-blue/5 text-apple-blue' 
                          : 'border-apple-border hover:border-apple-blue/30 text-apple-ink/70'
                      }`}
                    >
                      <span className="font-medium">{opt}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-center">
                  <LiquidButton className="text-apple-ink px-10 py-4 text-sm font-bold rounded-full hover:scale-105 transition-all flex items-center gap-2 group">
                    Próxima etapa
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </LiquidButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LoginModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
