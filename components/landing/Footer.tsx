export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="py-20 px-6 bg-white border-t border-apple-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <span className="text-xl font-bold text-apple-ink tracking-tight">Fluxa Sales</span>
            <p className="text-sm text-apple-ink/50 max-w-xs leading-relaxed">
              Transforme visitantes em oportunidades reais com funis interativos de alta conversão. Simples, elegante e focado em resultados.
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold text-apple-ink uppercase tracking-widest mb-6">Produto</h4>
            <ul className="space-y-4 text-sm text-apple-ink/50">
              <li><a href="#features" className="hover:text-apple-blue transition-colors">Recursos</a></li>
              <li><a href="#how" className="hover:text-apple-blue transition-colors">Como funciona</a></li>
              <li><a href="#pricing" className="hover:text-apple-blue transition-colors">Preços</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold text-apple-ink uppercase tracking-widest mb-6">Suporte</h4>
            <ul className="space-y-4 text-sm text-apple-ink/50">
              <li><a href="mailto:contato@fluxa.app" className="hover:text-apple-blue transition-colors">contato@fluxa.app</a></li>
              <li><a href="#" className="hover:text-apple-blue transition-colors">Ajuda</a></li>
              <li><a href="#" className="hover:text-apple-blue transition-colors">Termos</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-apple-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xs text-apple-ink/40">
            © {currentYear} Flüxa Leads · Todos os direitos reservados.
          </div>
          
          <div className="flex items-center gap-2 text-xs text-apple-ink/40">
            <span>By</span>
            <strong className="text-apple-ink font-semibold">Grupo WKS</strong>
          </div>
        </div>
      </div>
    </footer>
  )
}
