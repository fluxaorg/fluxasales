'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  { q: 'O que é um funil interativo?', a: 'Uma sequência de perguntas que guia o visitante, coleta informações e qualifica o lead antes de converter. Diferente de um formulário estático, adapta o caminho com base nas respostas.' },
  { q: 'Preciso saber programar?', a: 'Não. O editor é 100% visual — arraste e solte componentes para montar suas etapas. Nenhuma linha de código necessária.' },
  { q: 'Como funciona o plano Trial?', a: 'O Trial permite criar 1 funil e capturar leads ilimitados. Ideal para testar antes de assinar um plano pago.' },
  { q: 'Posso integrar com meu CRM?', a: 'Sim. Configure webhooks para enviar dados ao RD Station, HubSpot, ActiveCampaign ou qualquer sistema que aceite HTTP POST.' },
  { q: 'Como funciona o Meta Pixel?', a: 'Insira seu Pixel ID nas configurações. A Fluxa dispara o evento Lead automaticamente quando alguém completa o funil.' },
  { q: 'Meus dados estão seguros?', a: 'Sim. Infraestrutura Supabase com criptografia. IPs são armazenados como hashes SHA-256, respeitando LGPD/GDPR.' },
  { q: 'Posso exportar meus leads?', a: 'Sim. Na página de leads, exporte tudo para CSV com um clique, incluindo campos personalizados de cada funil.' },
  { q: 'Como cancelo minha assinatura?', a: 'Entre em contato por email. Cancele quando quiser, sem multas. Seus dados ficam disponíveis por 30 dias.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-apple-blue uppercase tracking-[0.2em]"
          >
            Suporte
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[40px] font-semibold text-apple-ink tracking-tight"
          >
            Perguntas frequentes.
          </motion.h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border-b border-apple-border"
            >
              <button 
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-8 text-left group transition-all"
              >
                <span className="text-lg font-medium text-apple-ink pr-8 group-hover:text-apple-blue transition-colors">
                  {faq.q}
                </span>
                <span className={`flex-shrink-0 text-apple-ink/20 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}>
                  <ChevronDown size={24} />
                </span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-8">
                      <p className="text-[17px] text-apple-ink/60 leading-relaxed max-w-2xl">
                        {faq.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
