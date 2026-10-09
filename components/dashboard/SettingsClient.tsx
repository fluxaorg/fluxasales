'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { parsePixelId } from '@/lib/meta-pixel'
import { Webhook } from '@/types'
import {
  Globe,
  Plus,
  Trash2,
  Copy,
  ShieldAlert,
  Activity,
  Settings2,
  X,
  AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SettingsClientProps {
  orgId: string
  metaPixelId: string
  webhooks: Webhook[]
}

export default function SettingsClient({ orgId, metaPixelId: initialPixelId, webhooks: initialWebhooks }: SettingsClientProps) {
  const supabase = createClient()

  // Pixel
  const [pixelId, setPixelId] = useState(initialPixelId)
  const [savingPixel, setSavingPixel] = useState(false)

  // Webhooks
  const [webhooks, setWebhooks] = useState(initialWebhooks)
  const [showNewWebhook, setShowNewWebhook] = useState(false)
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookEvent, setNewWebhookEvent] = useState('lead_created')
  const [creatingWebhook, setCreatingWebhook] = useState(false)
  const [newSecret, setNewSecret] = useState<{ secret: string; id: string } | null>(null)
  const [confirmDeleteWebhook, setConfirmDeleteWebhook] = useState<string | null>(null)
  const [deletingWebhook, setDeletingWebhook] = useState(false)

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('settings-changes')
      // Listen to Org changes (Pixel)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'fluxaleads_organizations',
        filter: `id=eq.${orgId}`
      }, (payload) => {
        setPixelId(payload.new.meta_pixel_id || '')
      })
      // Listen to Webhook changes
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'fluxaleads_webhooks',
        filter: `org_id=eq.${orgId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setWebhooks(prev => [payload.new as Webhook, ...prev])
        } else if (payload.eventType === 'DELETE') {
          setWebhooks(prev => prev.filter(w => w.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setWebhooks(prev => prev.map(w => w.id === payload.new.id ? payload.new as Webhook : w))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, orgId])

  const handleSavePixel = async (e: React.FormEvent) => {
    e.preventDefault()
    const { value, error: invalid } = parsePixelId(pixelId)
    if (invalid) { toast.error(invalid); return }
    setSavingPixel(true)
    const { data, error } = await supabase
      .from('fluxaleads_organizations')
      .update({ meta_pixel_id: value })
      .eq('id', orgId)
      .select('meta_pixel_id')
    setSavingPixel(false)
    if (error || !data?.length) { toast.error('Erro ao salvar o Pixel.'); return }
    setPixelId(value ?? '')
    toast.success(value ? 'Pixel salvo! Ele já vale para todos os funis publicados.' : 'Pixel removido.')
  }

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingWebhook(true)
    const secret = crypto.randomUUID()
    const { data, error } = await supabase
      .from('fluxaleads_webhooks')
      .insert({
        org_id: orgId,
        url: newWebhookUrl.trim(),
        event_type: newWebhookEvent,
        active: true,
        secret,
      })
      .select()
      .single()
    setCreatingWebhook(false)
    if (error || !data) { toast.error('Erro ao criar webhook.'); return }
    setWebhooks(prev => [data, ...prev])
    setNewSecret({ secret, id: data.id })
    setShowNewWebhook(false)
    setNewWebhookUrl('')
  }

  const handleToggleWebhook = async (webhook: Webhook) => {
    const { error } = await supabase
      .from('fluxaleads_webhooks')
      .update({ active: !webhook.active })
      .eq('id', webhook.id)
    if (error) { toast.error('Erro ao atualizar webhook.'); return }
    setWebhooks(prev => prev.map(w => w.id === webhook.id ? { ...w, active: !w.active } : w))
    toast.success(webhook.active ? 'Webhook desativado' : 'Webhook ativado')
  }

  const handleDeleteWebhook = async (id: string) => {
    setDeletingWebhook(true)
    const { error } = await supabase.from('fluxaleads_webhooks').delete().eq('id', id)
    setDeletingWebhook(false)
    if (error) { toast.error('Erro ao excluir webhook.'); return }
    setWebhooks(prev => prev.filter(w => w.id !== id))
    setConfirmDeleteWebhook(null)
    toast.success('Webhook excluído.')
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-linear-text-quaternary mb-2">
          <Settings2 size={14} />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Configurações da Organização</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-linear-text-primary">Configurações & Integrações</h1>
        <p className="text-linear-text-tertiary mt-2 text-sm">
          Gerencie seu rastreamento, webhooks e chaves de API.
        </p>
      </div>

      {/* Secret reveal (one-time) */}
      <AnimatePresence>
        {newSecret && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-linear-indigo/10 border border-linear-indigo/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-linear-indigo">
                <ShieldAlert size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Chave secreta gerada com sucesso</span>
              </div>
              <p className="text-xs text-linear-text-secondary leading-relaxed">
                Esta chave é usada para assinar os payloads enviados ao seu webhook.
                <span className="font-bold text-white ml-1">Copie agora, ela não será exibida novamente por razões de segurança.</span>
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-linear-bg border border-linear-border px-4 py-3 rounded-xl font-mono text-sm text-linear-indigo break-all">
                  {newSecret.secret}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(newSecret.secret); toast.success('Copiado!') }}
                  className="p-3 bg-linear-indigo text-white rounded-xl hover:bg-linear-violet transition-colors"
                >
                  <Copy size={20} />
                </button>
              </div>
              <button
                onClick={() => setNewSecret(null)}
                className="text-[11px] font-medium text-linear-text-quaternary hover:text-linear-text-secondary transition-colors"
              >
                Salvei minha chave, fechar aviso
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1 — Meta Pixel */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-surface border border-linear-border flex items-center justify-center text-linear-indigo">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-linear-text-primary tracking-tight">Rastreamento</h3>
              <p className="text-xs text-linear-text-quaternary">Meta Pixel & Conversões</p>
            </div>
          </div>

          <div className="bg-linear-surface/60 border border-linear-border rounded-2xl p-8 space-y-6">
            <p className="text-xs text-linear-text-tertiary leading-relaxed">
              Adicione seu Meta Pixel ID para rastrear automaticamente eventos de visualização e captura de leads em todos os seus funis.
            </p>
            <form onSubmit={handleSavePixel} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-linear-text-quaternary">Pixel ID</label>
                <div className="flex gap-2">
                  <input
                    value={pixelId}
                    onChange={e => setPixelId(e.target.value)}
                    placeholder="Ex: 123456789012345"
                    className="flex-1 bg-linear-surface border border-linear-border rounded-xl px-4 py-3 text-sm text-linear-text-secondary focus:border-linear-indigo/50 focus:bg-linear-surface-hover outline-none transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={savingPixel} 
                    className="bg-linear-indigo text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-linear-violet transition-all disabled:opacity-50"
                  >
                    {savingPixel ? '...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Section 2 — Webhooks */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-surface border border-linear-border flex items-center justify-center text-orange-500">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-linear-text-primary tracking-tight">Webhooks</h3>
                <p className="text-xs text-linear-text-quaternary">Integrações em tempo real</p>
              </div>
            </div>
            <button 
              onClick={() => setShowNewWebhook(true)}
              className="flex items-center gap-2 bg-linear-surface border border-linear-border px-4 py-2 rounded-lg text-xs font-medium text-linear-text-secondary hover:border-linear-indigo/40 hover:text-linear-indigo transition-all"
            >
              <Plus size={14} /> Novo
            </button>
          </div>

          <div className="space-y-3">
            {webhooks.length === 0 ? (
              <div className="bg-linear-surface/20 border border-dashed border-linear-border rounded-2xl p-12 text-center">
                <p className="text-xs text-linear-text-quaternary font-medium italic">Nenhum webhook ativo.</p>
              </div>
            ) : (
              webhooks.map(wh => (
                <div key={wh.id} className="bg-linear-surface/60 border border-linear-border rounded-2xl p-5 flex items-center justify-between group">
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-linear-text-secondary truncate pr-4">{wh.url}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-mono text-linear-indigo uppercase tracking-wider bg-linear-indigo/10 px-1.5 py-0.5 rounded">
                        {wh.event_type}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${wh.active ? 'bg-emerald-500' : 'bg-linear-text-quaternary'}`} />
                        <span className="text-[10px] text-linear-text-quaternary font-medium uppercase tracking-widest">
                          {wh.active ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleToggleWebhook(wh)}
                      className="p-2 text-linear-text-quaternary hover:text-linear-text-secondary rounded-lg hover:bg-linear-surface transition-all"
                      title={wh.active ? 'Desativar' : 'Ativar'}
                    >
                      <Activity size={16} />
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteWebhook(wh.id)}
                      className="p-2 text-linear-text-quaternary hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteWebhook && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteWebhook(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-linear-surface border border-linear-border rounded-[32px] z-[301] shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h4 className="text-xl font-semibold text-linear-text-primary tracking-tight mb-2">Excluir Webhook?</h4>
              <p className="text-sm text-linear-text-tertiary mb-8">
                Esta ação vai parar as notificações em tempo real para esta URL.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDeleteWebhook(confirmDeleteWebhook)}
                  disabled={deletingWebhook}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {deletingWebhook ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
                <button
                  onClick={() => setConfirmDeleteWebhook(null)}
                  className="w-full bg-linear-surface-elevated border border-linear-border text-linear-text-secondary py-4 rounded-2xl font-semibold hover:bg-linear-surface-hover transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Webhook Modal */}
      <AnimatePresence>
        {showNewWebhook && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewWebhook(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-linear-surface border border-linear-border rounded-[32px] z-[201] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-linear-border flex items-center justify-between">
                <h4 className="text-lg font-semibold text-linear-text-primary tracking-tight">Novo Webhook</h4>
                <button onClick={() => setShowNewWebhook(false)} className="text-linear-text-quaternary hover:text-linear-text-primary"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateWebhook} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-linear-text-quaternary">URL do Endpoint</label>
                  <input
                    type="url"
                    value={newWebhookUrl}
                    onChange={e => setNewWebhookUrl(e.target.value)}
                    required
                    placeholder="https://your-api.com/webhook"
                    className="w-full bg-linear-bg border border-linear-border rounded-xl px-4 py-3 text-sm text-linear-text-secondary focus:border-linear-indigo/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-linear-text-quaternary">Tipo de Evento</label>
                  <select
                    value={newWebhookEvent}
                    onChange={e => setNewWebhookEvent(e.target.value)}
                    className="w-full bg-linear-bg border border-linear-border rounded-xl px-4 py-3 text-sm text-linear-text-secondary focus:border-linear-indigo/50 outline-none transition-all appearance-none"
                  >
                    <option value="lead_created">Novo Lead (lead_created)</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={creatingWebhook}
                  className="w-full bg-linear-indigo text-white py-4 rounded-2xl font-semibold hover:bg-linear-violet transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(94,106,210,0.3)]"
                >
                  {creatingWebhook ? 'Criando...' : 'Criar Webhook'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
