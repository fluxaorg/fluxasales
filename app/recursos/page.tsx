import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { MousePointer2, GitBranch, Zap, BarChart3, Globe, ShieldCheck, Layers, Users, Download, Webhook } from 'lucide-react'

const features = [
  {
    icon: MousePointer2,
    title: 'Editor Drag-and-Drop',
    desc: 'Monte funis completos arrastando e soltando componentes. Textos, perguntas, imagens, botões, vídeos — tudo sem escrever uma linha de código. Interface pensada para iniciantes e avançados.',
    details: ['Componentes prontos para uso', 'Edição em tempo real', 'Preview instantâneo', 'Publicação com 1 clique'],
    color: 'bg-blue-50 text-blue-500',
  },
  {
    icon: GitBranch,
    title: 'Lógica Condicional',
    desc: 'Direcione cada visitante para um caminho diferente com base nas respostas dele. Crie jornadas personalizadas que aumentam o engajamento e qualificam melhor cada lead.',
    details: ['Ramificações por resposta', 'Múltiplos caminhos', 'Lógica AND/OR', 'Testes A/B de rotas'],
    color: 'bg-violet-50 text-violet-500',
  },
  {
    icon: Zap,
    title: 'Webhooks em Tempo Real',
    desc: 'Conecte sua conta a qualquer CRM, plataforma de email ou sistema externo via webhooks. Cada novo lead dispara automaticamente o evento para o seu endpoint.',
    details: ['HTTP POST configurável', 'Payload em JSON', 'Chave secreta HMAC', 'Log de entregas'],
    color: 'bg-orange-50 text-orange-500',
  },
  {
    icon: BarChart3,
    title: 'Análises em Tempo Real',
    desc: 'Acompanhe cada etapa do seu funil com métricas detalhadas. Veja onde os visitantes abandonam, qual opção mais converte e como otimizar seu quiz.',
    details: ['Taxa de conversão por etapa', 'Abandono por pergunta', 'Origem do tráfego', 'Histórico de leads'],
    color: 'bg-emerald-50 text-emerald-500',
  },
  {
    icon: Globe,
    title: 'Links Públicos Personalizados',
    desc: 'Cada funil recebe uma URL única e profissional. Compartilhe nas redes sociais, em anúncios pagos, por WhatsApp ou incorpore diretamente no seu site.',
    details: ['URL customizável', 'Embed via iframe', 'Domínio próprio (Elite)', 'QR Code gerado'],
    color: 'bg-cyan-50 text-cyan-500',
  },
  {
    icon: Layers,
    title: 'Meta Pixel & Rastreamento',
    desc: 'Integre seu Pixel do Meta e rastreie conversões automaticamente em todos os funis. O evento Lead é disparado assim que o visitante completa a jornada.',
    details: ['Pixel ID configurável', 'Evento Lead automático', 'Scripts personalizados', 'Google Tag Manager'],
    color: 'bg-pink-50 text-pink-500',
  },
  {
    icon: Download,
    title: 'Exportação de Leads (CSV)',
    desc: 'Exporte todos os seus leads para CSV com um clique. Inclui todos os campos padrão (email, nome, telefone) e os campos personalizados de cada funil.',
    details: ['Export com 1 clique', 'Todos os campos incluídos', 'Filtro por funil', 'Formato UTF-8 com BOM'],
    color: 'bg-amber-50 text-amber-500',
  },
  {
    icon: Users,
    title: 'Colaboração em Equipe',
    desc: 'No plano Elite, convide colaboradores para editar os mesmos funis em tempo real. Ideal para agências que gerenciam múltiplos clientes.',
    details: ['Convite por email', 'Edição simultânea', 'Até 2 colaboradores (Elite)', 'Controle de acesso'],
    color: 'bg-indigo-50 text-indigo-500',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança & LGPD',
    desc: 'Seus dados e os dados dos seus leads são armazenados com criptografia de ponta a ponta. IPs são hasheados, em conformidade com LGPD e GDPR.',
    details: ['Criptografia em repouso', 'RLS no banco de dados', 'IPs em SHA-256', 'LGPD & GDPR'],
    color: 'bg-slate-100 text-slate-600',
  },
]

export default function RecursosPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 bg-apple-parchment border-b border-apple-border">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <p className="text-xs font-semibold text-apple-blue uppercase tracking-[0.2em]">Recursos</p>
          <h1 className="text-[48px] md:text-[60px] font-semibold text-apple-ink leading-[1.05] tracking-tight">
            Tudo que você precisa para<br />converter mais.
          </h1>
          <p className="text-lg text-apple-ink/55 max-w-2xl mx-auto leading-relaxed">
            Uma plataforma completa para criar, publicar e analisar funis interativos que qualificam leads e aumentam suas vendas.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group p-8 rounded-[28px] border border-apple-border hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-500 bg-white"
            >
              <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-lg font-semibold text-apple-ink mb-3 tracking-tight">{f.title}</h3>
              <p className="text-sm text-apple-ink/60 leading-relaxed mb-5">{f.desc}</p>
              <ul className="space-y-1.5">
                {f.details.map(d => (
                  <li key={d} className="flex items-center gap-2 text-xs text-apple-ink/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-apple-blue flex-shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-apple-ink text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl font-semibold text-white tracking-tight">Pronto para experimentar?</h2>
          <p className="text-white/50">Crie seu primeiro funil gratuitamente. Sem cartão de crédito.</p>
          <a
            href="/#pricing"
            className="inline-flex items-center gap-2 bg-apple-blue hover:bg-apple-blue-focus text-white rounded-full px-8 py-4 font-semibold transition-all"
          >
            Ver planos
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
