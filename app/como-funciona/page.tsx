import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Edit3, Share2, TrendingUp, Settings, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    number: '01',
    icon: Edit3,
    title: 'Crie seu funil',
    subtitle: 'Em menos de 5 minutos',
    desc: 'Acesse o editor visual e comece a montar as etapas do seu funil arrastando e soltando componentes. Escolha entre textos, perguntas de múltipla escolha, campos de entrada, botões e muito mais.',
    details: [
      'Dê um nome ao funil e ele recebe uma URL única automaticamente',
      'Adicione quantas etapas (páginas) quiser',
      'Arraste componentes e configure o conteúdo de cada um',
      'Configure lógica condicional para direcionar leads por resposta',
      'Customize cores, fontes e visual para combinar com sua marca',
    ],
    color: 'bg-blue-500',
    bg: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    number: '02',
    icon: Settings,
    title: 'Configure as integrações',
    subtitle: 'Conecte ao seu ecossistema',
    desc: 'Antes de publicar, conecte o funil às suas ferramentas. Adicione o Pixel do Meta para rastrear conversões, configure webhooks para enviar leads ao seu CRM e personalize os campos que quer capturar.',
    details: [
      'Cole o ID do seu Meta Pixel nas configurações da conta',
      'Crie um webhook apontando para seu CRM ou RD Station',
      'Defina quais campos serão obrigatórios no funil',
      'Adicione scripts personalizados (Google Tag Manager, etc.)',
      'Teste a integração com um lead de exemplo',
    ],
    color: 'bg-violet-500',
    bg: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    number: '03',
    icon: Share2,
    title: 'Publique e compartilhe',
    subtitle: 'Seu funil no ar em 1 clique',
    desc: 'Com tudo configurado, publique o funil com um clique. Você recebe um link profissional para compartilhar onde quiser — redes sociais, anúncios, WhatsApp, bio do Instagram ou incorporado no seu site.',
    details: [
      'Clique em "Publicar" no editor — o funil vai ao ar imediatamente',
      'Copie o link único e compartilhe onde quiser',
      'Incorpore via iframe no seu site ou WordPress',
      'Use em anúncios do Meta, Google Ads ou TikTok',
      'No plano Elite, conecte seu próprio domínio',
    ],
    color: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Acompanhe os resultados',
    subtitle: 'Dados em tempo real',
    desc: 'Cada visitante que interage com o funil gera dados valiosos. Acompanhe leads capturados, veja as respostas de cada um no painel, exporte para CSV e otimize as etapas que têm maior abandono.',
    details: [
      'Veja novos leads chegando em tempo real no painel',
      'Acesse as respostas completas de cada lead',
      'Filtre leads por funil, data ou campo personalizado',
      'Exporte todos os dados para CSV com 1 clique',
      'Webhooks disparam a cada novo lead capturado',
    ],
    color: 'bg-orange-500',
    bg: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
]

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 bg-apple-parchment border-b border-apple-border">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <p className="text-xs font-semibold text-apple-blue uppercase tracking-[0.2em]">Como funciona</p>
          <h1 className="text-[48px] md:text-[60px] font-semibold text-apple-ink leading-[1.05] tracking-tight">
            De ideia a conversão<br />em minutos.
          </h1>
          <p className="text-lg text-apple-ink/55 leading-relaxed">
            Veja como criar, publicar e escalar funis interativos que qualificam leads e aumentam suas vendas com a Fluxa Sales.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-20">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'md:[&>div:first-child]:order-2' : ''}`}
            >
              {/* Text */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className={`text-5xl font-bold ${step.textColor} opacity-20`}>{step.number}</span>
                  <div className={`w-10 h-10 rounded-2xl ${step.bg} flex items-center justify-center`}>
                    <step.icon size={20} className={step.textColor} />
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${step.textColor} mb-2`}>{step.subtitle}</p>
                  <h2 className="text-3xl font-semibold text-apple-ink tracking-tight mb-4">{step.title}</h2>
                  <p className="text-base text-apple-ink/60 leading-relaxed">{step.desc}</p>
                </div>
                <ul className="space-y-2.5">
                  {step.details.map(d => (
                    <li key={d} className="flex items-start gap-3 text-sm text-apple-ink/70">
                      <div className={`w-5 h-5 rounded-full ${step.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check size={11} className={step.textColor} />
                      </div>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual card */}
              <div className={`rounded-3xl ${step.bg} border border-${step.color}/10 p-10 flex items-center justify-center min-h-[280px]`}>
                <div className="text-center space-y-4">
                  <div className={`w-20 h-20 rounded-3xl ${step.bg} border-2 border-${step.color}/20 flex items-center justify-center mx-auto`}>
                    <step.icon size={36} className={step.textColor} />
                  </div>
                  <div className={`text-6xl font-bold ${step.textColor} opacity-10`}>{step.number}</div>
                  <p className={`text-sm font-semibold ${step.textColor}`}>{step.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ quick */}
      <section className="py-20 px-6 bg-apple-parchment border-t border-apple-border">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-semibold text-apple-ink tracking-tight">Ainda tem dúvidas?</h2>
          <p className="text-apple-ink/55">Confira nossa página de perguntas frequentes ou fale diretamente com o time.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#faq" className="flex items-center gap-2 bg-apple-ink text-white rounded-full px-7 py-3.5 font-semibold text-sm transition-all hover:bg-black">
              Ver FAQ <ArrowRight size={16} />
            </Link>
            <Link href="/contato" className="flex items-center gap-2 border border-apple-border text-apple-ink rounded-full px-7 py-3.5 font-semibold text-sm hover:bg-white transition-all">
              Falar com o time
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
