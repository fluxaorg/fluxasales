const items = [
  'Drag & Drop', 'Captura de Leads', 'Webhooks', 'Pixel Meta', 'Export CSV',
  'Editor Visual', 'Funis Multi-etapas', 'Link Público', 'Sem Código', 'Qualificação Automática',
]

export default function Marquee() {
  const doubled = [...items, ...items]

  return (
    <div className="py-5 border-y border-[#EBEBEB] bg-[#F5F5F5] overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap w-max">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-5 mx-6 text-xs font-medium text-[#888] uppercase tracking-widest">
            {item}
            <span className="w-1 h-1 rounded-full bg-[#CACACA]" />
          </span>
        ))}
      </div>
    </div>
  )
}
