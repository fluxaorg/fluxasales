'use client'

interface HeroSectionProps {
  onOpenLogin: () => void
}

export default function HeroSection({ onOpenLogin }: HeroSectionProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2 border border-wine/30 px-3 py-1 mb-8">
            <span className="w-2 h-2 rounded-full bg-wine animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-wine">
              Funis inteligentes
            </span>
          </div>

          <h1 className="font-serif text-6xl lg:text-7xl text-dark-text leading-[1.05] mb-6">
            Capture leads que
            <em className="not-italic text-wine"> realmente</em>
            <br />
            convertem.
          </h1>

          <p className="font-sans text-lg text-dark-text/60 leading-relaxed mb-10 max-w-lg">
            Crie funis interativos sem código. Qualifique seus leads com perguntas
            inteligentes e aumente sua taxa de conversão em até 3×.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => scrollTo('pricing')}
              className="btn-brutalist text-base px-8 py-4"
            >
              Começar grátis
            </button>
            <button
              onClick={() => scrollTo('how')}
              className="btn-outline text-base px-8 py-4"
            >
              Ver como funciona
            </button>
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm text-dark-text/40 font-sans">
            <span>✓ Sem cartão de crédito</span>
            <span>✓ Configuração em 5 min</span>
          </div>
        </div>

        {/* Right — mock funnel preview */}
        <div className="relative">
          <div className="border border-dark-text bg-cream"
            style={{ boxShadow: '8px 8px 0px #6B1F2C' }}>
            <div className="border-b border-dark-text px-5 py-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border border-dark-text/30 bg-dark-text/10" />
              <span className="w-3 h-3 rounded-full border border-dark-text/30 bg-dark-text/10" />
              <span className="w-3 h-3 rounded-full border border-dark-text/30 bg-dark-text/10" />
              <span className="ml-4 font-mono text-xs text-dark-text/40 truncate">
                preview/seu-funil
              </span>
            </div>
            <div className="p-8 space-y-5">
              <p className="font-mono text-xs uppercase tracking-widest text-wine">
                Etapa 1 de 3
              </p>
              <h2 className="font-serif text-2xl text-dark-text">
                Qual é o seu maior desafio?
              </h2>
              {['Gerar mais leads', 'Converter mais clientes', 'Automatizar processos'].map((opt, i) => (
                <div
                  key={i}
                  className={`border border-dark-text px-5 py-3 font-sans text-sm cursor-pointer transition-all ${i === 0 ? 'bg-wine text-cream' : 'bg-cream text-dark-text hover:bg-dark-text/5'}`}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
          {/* Decorative offset box */}
          <div className="absolute -z-10 inset-0 translate-x-3 translate-y-3 border border-wine/20 bg-wine/5" />
        </div>
      </div>
    </section>
  )
}
