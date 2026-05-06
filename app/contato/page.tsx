'use client'

import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, Zap, Send, Check } from 'lucide-react'

export default function ContatoPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 bg-apple-parchment border-b border-apple-border">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <p className="text-xs font-semibold text-apple-blue uppercase tracking-[0.2em]">Contato</p>
          <h1 className="text-[48px] md:text-[60px] font-semibold text-apple-ink leading-[1.05] tracking-tight">
            Fale com a gente.
          </h1>
          <p className="text-lg text-apple-ink/55 leading-relaxed">
            Tem dúvidas, sugestões ou quer entender melhor como a Fluxa Sales pode ajudar seu negócio? Nossa equipe está pronta para responder.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          {/* Info */}
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-semibold text-apple-ink tracking-tight mb-6">Como podemos ajudar?</h2>
              <div className="space-y-5">
                {[
                  { icon: MessageSquare, title: 'Suporte técnico', desc: 'Problemas com a plataforma, configurações ou integrações. Respondemos em até 24h.', contact: 'suporte@fluxa.app' },
                  { icon: Zap, title: 'Vendas & planos', desc: 'Quer conhecer melhor os planos ou precisa de uma proposta personalizada para sua agência?', contact: 'vendas@fluxa.app' },
                  { icon: Mail, title: 'Parcerias', desc: 'Interesse em parceria, afiliado ou integração com outra plataforma.', contact: 'parceiros@fluxa.app' },
                ].map(item => (
                  <div key={item.title} className="flex gap-4 p-6 rounded-2xl border border-apple-border hover:shadow-sm transition-all bg-white">
                    <div className="w-10 h-10 rounded-xl bg-apple-blue/8 flex items-center justify-center flex-shrink-0">
                      <item.icon size={18} className="text-apple-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-apple-ink text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-apple-ink/55 leading-relaxed mb-2">{item.desc}</p>
                      <a href={`mailto:${item.contact}`} className="text-xs text-apple-blue font-medium hover:underline">{item.contact}</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-apple-parchment border border-apple-border">
              <p className="text-xs font-semibold text-apple-ink/40 uppercase tracking-wider mb-3">Tempo de resposta</p>
              <div className="space-y-2">
                {[
                  ['Suporte técnico', 'até 24h'],
                  ['Vendas', 'até 4h úteis'],
                  ['Parcerias', 'até 3 dias úteis'],
                ].map(([type, time]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-apple-ink/70">{type}</span>
                    <span className="font-medium text-apple-ink">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl border border-apple-border p-8 shadow-sm"
          >
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check size={28} className="text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-apple-ink">Mensagem enviada!</h3>
                <p className="text-apple-ink/55 text-sm max-w-xs leading-relaxed">
                  Recebemos sua mensagem e retornaremos em breve. Obrigado pelo contato!
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  className="text-sm text-apple-blue font-medium hover:underline mt-2"
                >
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-apple-ink tracking-tight mb-6">Envie uma mensagem</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-apple-ink/50 uppercase tracking-wider">Nome</label>
                      <input
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                        placeholder="Seu nome"
                        className="w-full border border-apple-border rounded-xl px-4 py-3 text-sm text-apple-ink focus:border-apple-blue/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-apple-ink/50 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required
                        placeholder="seu@email.com"
                        className="w-full border border-apple-border rounded-xl px-4 py-3 text-sm text-apple-ink focus:border-apple-blue/50 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-apple-ink/50 uppercase tracking-wider">Assunto</label>
                    <select
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      required
                      className="w-full border border-apple-border rounded-xl px-4 py-3 text-sm text-apple-ink focus:border-apple-blue/50 focus:outline-none transition-all bg-white appearance-none"
                    >
                      <option value="">Selecione um assunto</option>
                      <option value="suporte">Suporte técnico</option>
                      <option value="vendas">Vendas & planos</option>
                      <option value="parceria">Parceria</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-apple-ink/50 uppercase tracking-wider">Mensagem</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      required
                      rows={5}
                      placeholder="Descreva sua dúvida ou necessidade..."
                      className="w-full border border-apple-border rounded-xl px-4 py-3 text-sm text-apple-ink focus:border-apple-blue/50 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-apple-blue hover:bg-apple-blue-focus text-white py-4 rounded-2xl font-semibold transition-all"
                  >
                    <Send size={16} />
                    Enviar mensagem
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
