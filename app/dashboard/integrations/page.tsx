'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Plug2, Plus, Trash2, Activity, Globe, ShieldAlert, Copy, X, Check } from 'lucide-react'
import { Webhook } from '@/types'

const INTEGRATIONS = [
  { id: 'webhook', name: 'Webhook Personalizado', desc: 'Envie dados de leads para qualquer URL via HTTP POST.', icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'pixel', name: 'Meta Pixel', desc: 'Rastreie conversões automaticamente em todos os seus funis.', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'zapier', name: 'Zapier', desc: 'Conecte com mais de 5.000 apps via Zapier (use o webhook).', icon: Plug2, color: 'text-orange-400', bg: 'bg-orange-400/10', external: true },
  { id: 'make', name: 'Make (Integromat)', desc: 'Automações avançadas com o Make via webhook.', icon: Plug2, color: 'text-purple-400', bg: 'bg-purple-500/10', external: true },
]

export default function IntegrationsPage() {
  const supabase = createClient()
  const [orgId, setOrgId]         = useState('')
  const [pixelId, setPixelId]     = useState('')
  const [savingPixel, setSavingPixel] = useState(false)
  const [webhooks, setWebhooks]   = useState<Webhook[]>([])
  const [showNew, setShowNew]     = useState(false)
  const [newUrl, setNewUrl]       = useState('')
  const [creating, setCreating]   = useState(false)
  const [newSecret, setNewSecret] = useState<{ secret: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('fluxaleads_organizations').select('id, meta_pixel_id').eq('user_id', user.id).single()
      if (!org) return
      setOrgId(org.id)
      setPixelId(org.meta_pixel_id || '')
      const { data: wh } = await supabase.from('fluxaleads_webhooks').select('*').eq('org_id', org.id).order('created_at', { ascending: false })
      setWebhooks(wh ?? [])
    }
    load()
  }, [])

  const handleSavePixel = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPixel(true)
    const { error } = await supabase.from('fluxaleads_organizations').update({ meta_pixel_id: pixelId.trim() || null }).eq('id', orgId)
    setSavingPixel(false)
    if (error) { toast.error('Erro ao salvar.'); return }
    toast.success('Meta Pixel salvo!')
  }

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    const secret = crypto.randomUUID()
    const { data, error } = await supabase.from('fluxaleads_webhooks').insert({ org_id: orgId, url: newUrl.trim(), event_type: 'lead_created', active: true, secret }).select().single()
    setCreating(false)
    if (error || !data) { toast.error('Erro ao criar webhook.'); return }
    setWebhooks(prev => [data, ...prev])
    setNewSecret({ secret })
    setShowNew(false)
    setNewUrl('')
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('fluxaleads_webhooks').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir.'); return }
    setWebhooks(prev => prev.filter(w => w.id !== id))
    toast.success('Webhook excluído.')
  }

  const handleToggle = async (wh: Webhook) => {
    const { error } = await supabase.from('fluxaleads_webhooks').update({ active: !wh.active }).eq('id', wh.id)
    if (error) { toast.error('Erro.'); return }
    setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, active: !w.active } : w))
  }

  return (
    <div className="space-y-10 pb-12">
      <div>
        <div className="flex items-center gap-2 text-linear-text-quaternary mb-2">
          <Plug2 size={14} />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Conexões</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-linear-text-primary">Integrações</h1>
        <p className="text-linear-text-tertiary mt-2 text-sm">Conecte a Fluxa Sales ao seu ecossistema de ferramentas.</p>
      </div>

      {/* Cards de integração */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((int, i) => (
          <motion.div key={int.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="p-6 rounded-2xl border border-linear-border bg-linear-surface/30 flex items-start gap-4"
          >
            <div className={`w-10 h-10 rounded-xl ${int.bg} flex items-center justify-center flex-shrink-0`}>
              <int.icon size={20} className={int.color} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-linear-text-primary">{int.name}</h3>
                {int.external && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-linear-surface-elevated border border-linear-border text-linear-text-quaternary uppercase tracking-wider">via webhook</span>}
              </div>
              <p className="text-xs text-linear-text-tertiary mt-1 leading-relaxed">{int.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chave secreta revelada */}
      <AnimatePresence>
        {newSecret && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-linear-indigo/10 border border-linear-indigo/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-linear-indigo">
                <ShieldAlert size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Chave secreta gerada — copie agora</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-linear-bg border border-linear-border px-4 py-3 rounded-xl font-mono text-sm text-linear-indigo break-all">{newSecret.secret}</code>
                <button onClick={() => { navigator.clipboard.writeText(newSecret.secret); toast.success('Copiado!') }} className="p-3 bg-linear-indigo text-white rounded-xl hover:bg-linear-violet transition-colors">
                  <Copy size={18} />
                </button>
              </div>
              <button onClick={() => setNewSecret(null)} className="text-xs text-linear-text-quaternary hover:text-linear-text-secondary">Salvei a chave, fechar aviso</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Meta Pixel */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-linear-text-primary flex items-center gap-2">
            <Globe size={15} className="text-blue-400" /> Meta Pixel
          </h2>
          <div className="p-6 rounded-2xl border border-linear-border bg-linear-surface/30 space-y-4">
            <p className="text-xs text-linear-text-tertiary leading-relaxed">Adicione seu Pixel ID para rastrear visualizações e leads em todos os funis automaticamente.</p>
            <form onSubmit={handleSavePixel} className="flex gap-2">
              <input value={pixelId} onChange={e => setPixelId(e.target.value)} placeholder="Ex: 123456789012345"
                className="flex-1 bg-linear-bg border border-linear-border rounded-xl px-4 py-2.5 text-sm text-linear-text-secondary outline-none focus:border-linear-indigo/50 transition-all"
              />
              <button type="submit" disabled={savingPixel} className="bg-linear-indigo text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-linear-violet transition-all disabled:opacity-50">
                {savingPixel ? '...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>

        {/* Webhooks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-linear-text-primary flex items-center gap-2">
              <Activity size={15} className="text-orange-400" /> Webhooks
            </h2>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-xs text-linear-indigo border border-linear-indigo/30 px-3 py-1.5 rounded-lg hover:bg-linear-indigo/10 transition-all">
              <Plus size={13} /> Novo
            </button>
          </div>

          <AnimatePresence>
            {showNew && (
              <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onSubmit={handleCreateWebhook}
                className="p-4 rounded-2xl border border-linear-indigo/30 bg-linear-indigo/5 space-y-3"
              >
                <input type="url" required value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://sua-api.com/webhook"
                  className="w-full bg-linear-bg border border-linear-border rounded-xl px-4 py-2.5 text-sm text-linear-text-secondary outline-none focus:border-linear-indigo/50"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={creating} className="flex-1 bg-linear-indigo text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-linear-violet transition-all disabled:opacity-50">
                    {creating ? 'Criando...' : 'Criar Webhook'}
                  </button>
                  <button type="button" onClick={() => setShowNew(false)} className="px-3 rounded-xl border border-linear-border text-linear-text-quaternary hover:text-linear-text-secondary">
                    <X size={15} />
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {webhooks.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-linear-border text-center text-xs text-linear-text-quaternary">
                Nenhum webhook configurado ainda.
              </div>
            ) : webhooks.map(wh => (
              <div key={wh.id} className="flex items-center justify-between p-4 rounded-xl border border-linear-border bg-linear-surface/20 group">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-linear-text-secondary truncate pr-4">{wh.url}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${wh.active ? 'bg-emerald-400' : 'bg-linear-text-quaternary'}`} />
                    <span className="text-[10px] text-linear-text-quaternary">{wh.active ? 'Ativo' : 'Pausado'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleToggle(wh)} className="p-1.5 rounded-lg text-linear-text-quaternary hover:text-linear-text-secondary hover:bg-linear-surface transition-all" title={wh.active ? 'Pausar' : 'Ativar'}>
                    <Activity size={14} />
                  </button>
                  <button onClick={() => handleDelete(wh.id)} className="p-1.5 rounded-lg text-linear-text-quaternary hover:text-red-400 hover:bg-red-400/10 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
