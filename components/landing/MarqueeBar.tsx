export default function MarqueeBar() {
  const items = [
    'Funis Interativos',
    'Captura de Leads',
    'Qualificação Automática',
    'Webhooks em Tempo Real',
    'Export CSV',
    'Pixel Meta',
    'Editor Drag-Drop',
    'Multi-Etapas',
    'Link Público',
    'Sem Código',
  ]

  const repeated = [...items, ...items]

  return (
    <div className="border-y border-dark-text bg-wine overflow-hidden py-4">
      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-4 mx-6">
            <span className="font-mono text-xs uppercase tracking-widest text-cream">
              {item}
            </span>
            <span className="text-cream/40">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
