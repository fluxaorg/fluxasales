'use client'

import { useState, useEffect, lazy, Suspense, useId, useRef } from 'react'
import { useOutsideClick } from '@/hooks/use-outside-click'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Funnel, FunnelStatus } from '@/types'
import { slugify, DEFAULT_THEME } from '@/lib/funnel-theme'
import { funnelLimit, hasEliteFeatures, PLAN_LABEL, PlanId } from '@/lib/plans'
import { 
  Plus, 
  Settings2, 
  ExternalLink, 
  Trash2, 
  Copy, 
  Globe, 
  BarChart2,
  MoreHorizontal,
  X,
  Loader,
  AlertCircle,
  AlertTriangle,
  Zap,
  Sparkles,
  User,
  MessageSquare,
  ChevronLeft,
  Share2,
  Mail,
  UserPlus,
  Send,
  Check,
  Link as LinkIcon
} from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import Link from 'next/link'
import { createPortal } from 'react-dom'

const AnimatedAIChat = lazy(() => import('@/components/ui/animated-ai-chat'))

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

interface FunnelsListProps {
  funnels: Funnel[]
  leadCounts: Record<string, number>
  orgId: string
  plan: string
  /** @deprecated o limite é calculado a partir do plano */
  limit?: number
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days > 7) return new Date(dateStr).toLocaleDateString('en-US')
  if (days > 0) return `${days}d ago`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `${hours}h ago`
  return 'now'
}

export default function FunnelsList({ funnels: initial, leadCounts, orgId, plan }: FunnelsListProps) {
  // Calculado aqui (e não recebido do servidor) porque o plano ilimitado usa Infinity.
  const limit = funnelLimit(plan)
  const planLabel = PLAN_LABEL[plan as PlanId] ?? plan
  const router = useRouter()
  const supabase = createClient()

  const [funnels, setFunnels] = useState(initial)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [createMode, setCreateMode] = useState<'select' | 'manual' | 'ai'>('select')
  const [shareFunnelId, setShareFunnelId] = useState<string | null>(null)
  const [collabEmail, setCollabEmail] = useState('')
  const [sharing, setSharing] = useState(false)

  // Expandable Card state
  const [active, setActive] = useState<Funnel | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()

  // 3D Card effect state
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10])
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null)
      }
    }
    if (active) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [active])

  useOutsideClick(ref, () => setActive(null))

  useEffect(() => {
    const channel = supabase
      .channel('funnel-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'fluxaleads_funnels',
        filter: `org_id=eq.${orgId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setFunnels(prev => [payload.new as Funnel, ...prev])
        } else if (payload.eventType === 'DELETE') {
          setFunnels(prev => prev.filter(f => f.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setFunnels(prev => prev.map(f => f.id === payload.new.id ? payload.new as Funnel : f))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, orgId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (funnels.length >= limit) {
      toast.error(`Limite do plano atingido. Seu plano ${planLabel} permite ${limit} funil(s).`)
      return
    }
    if (!newName.trim()) return
    setCreating(true)

    const { data: funnel, error } = await supabase
      .from('fluxaleads_funnels')
      .insert({ org_id: orgId, name: newName.trim(), slug: slugify(newName), status: 'draft', theme: DEFAULT_THEME })
      .select()
      .single()

    if (error || !funnel) {
      toast.error('Erro ao criar funil.')
      setCreating(false)
      return
    }

    // Etapa inicial com um formulário pronto, para não começar de uma tela vazia.
    const { data: page } = await supabase.from('fluxaleads_pages')
      .insert({ funnel_id: funnel.id, name: 'Início', page_order: 0 })
      .select()
      .single()

    if (page) {
      await supabase.from('fluxaleads_components').insert([
        { page_id: page.id, component_order: 0, type: 'HEADING', content: { text: newName.trim(), size: 'h1' } },
        { page_id: page.id, component_order: 1, type: 'TEXT', content: { text: 'Deixe seus dados e entraremos em contato.' } },
        { page_id: page.id, component_order: 2, type: 'INPUT', content: { label: 'Seu melhor e-mail', placeholder: 'voce@email.com', field_name: 'email', required: true } },
        { page_id: page.id, component_order: 3, type: 'BUTTON', content: { label: 'Quero saber mais', action: 'submit', next_page_id: null } },
      ])
    }

    setCreating(false)
    setShowNew(false)
    setNewName('')
    router.push(`/dashboard/funnels/${funnel.id}/builder`)
  }

  const handleToggleStatus = async (funnel: Funnel) => {
    const newStatus: FunnelStatus = funnel.status === 'published' ? 'draft' : 'published'
    const { error } = await supabase
      .from('fluxaleads_funnels')
      .update({ status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null })
      .eq('id', funnel.id)

    if (error) { toast.error('Erro ao atualizar status.'); return }
    setFunnels(prev => prev.map(f => f.id === funnel.id ? { ...f, status: newStatus } : f))
    toast.success(newStatus === 'published' ? 'Funil publicado!' : 'Funil pausado.')
  }

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const handleCopyLink = async (slug: string, funnelId?: string) => {
    const url = `${window.location.origin}/preview/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado!')
      if (funnelId) {
        setCopiedId(funnelId)
        setTimeout(() => setCopiedId(cur => (cur === funnelId ? null : cur)), 2000)
      }
    } catch {
      // Sem permissão de área de transferência (ex.: http fora de localhost): mostra o link para copiar à mão.
      toast(url, { duration: 8000 })
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase.from('fluxaleads_funnels').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir funil.'); setDeletingId(null); return }
    setFunnels(prev => prev.filter(f => f.id !== id))
    setDeletingId(null)
    setConfirmDeleteId(null)
    toast.success('Funil excluído.')
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasEliteFeatures(plan)) {
      toast.error('Apenas o plano ELITE permite colaboração em tempo real.')
      return
    }
    setSharing(true)
    const { error } = await supabase
      .from('fluxaleads_funnel_collaborators')
      .insert({ funnel_id: shareFunnelId, user_email: collabEmail.trim().toLowerCase() })

    setSharing(false)
    if (error) {
      if (error.code === '23505') toast.error('Este usuário já está colaborando neste funil.')
      else toast.error('Erro ao adicionar colaborador.')
      return
    }

    toast.success('Colaborador adicionado!')
    setCollabEmail('')
    setShareFunnelId(null)
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-linear-border">
        <div>
          <div className="flex items-center gap-2 text-linear-text-quaternary mb-2">
            <Globe size={14} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Gerenciamento</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-linear-text-primary">Seus Funis</h1>
          <p className="text-linear-text-tertiary mt-2 text-sm">
            {Number.isFinite(limit) ? <>{funnels.length} de {limit} funis criados</> : <>{funnels.length} funis criados</>} no plano <span className="text-linear-indigo font-bold">{planLabel}</span>.
          </p>
        </div>
        <button
          onClick={() => { setShowNew(true); setCreateMode('select') }}
          className="flex items-center justify-center gap-2 bg-linear-indigo text-white px-6 py-3 rounded-xl font-semibold hover:bg-linear-violet transition-all shadow-[0_10px_30px_rgba(94,106,210,0.3)]"
        >
          <Plus size={18} />
          Novo Funil
        </button>
      </div>

      {/* Grid */}
      {funnels.length === 0 ? (
        <div className="bg-linear-surface/20 border border-dashed border-linear-border rounded-[32px] py-24 text-center">
          <div className="w-16 h-16 bg-linear-surface border border-linear-border rounded-2xl flex items-center justify-center text-linear-text-quaternary mx-auto mb-6">
            <Globe size={32} />
          </div>
          <p className="text-linear-text-secondary font-medium mb-2">Nenhum funil criado ainda</p>
          <p className="text-linear-text-quaternary text-sm mb-8 max-w-xs mx-auto">
            Comece criando um funil interativo para capturar leads de forma inteligente.
          </p>
          <button onClick={() => setShowNew(true)} className="text-linear-indigo font-semibold hover:text-linear-violet transition-colors">
            Criar meu primeiro funil →
          </button>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {active ? (
              <Portal>
                <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none" style={{ perspective: 1500 }}>
                  {/* Backdrop Blur overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/5 dark:bg-white/5 backdrop-blur-sm pointer-events-auto"
                    onClick={() => setActive(null)}
                  />
                
                <motion.div
                  layoutId={`card-${active.id}-${id}`}
                  ref={ref}
                  style={{ rotateX, rotateY }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  whileHover={{ z: 10 }}
                  className="force-dark w-full max-w-[350px] pointer-events-auto flex flex-col bg-[#0a0a0a] rounded-[24px] shadow-2xl overflow-hidden relative border border-white/10"
                >
                  <button 
                    onClick={() => setActive(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/50 hover:!text-white transition-colors z-50 backdrop-blur-md"
                  >
                    <X size={16} />
                  </button>

                  {/* Luxury Glowing Top Section */}
                  <div className="relative h-48 w-full overflow-hidden bg-[#050505] flex items-center justify-center">
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-[64px] ${active.status === 'published' ? 'bg-emerald-500/80' : 'bg-linear-indigo/80'}`} />
                    <div className={`absolute top-1/4 right-1/4 w-24 h-24 rounded-full blur-[48px] ${active.status === 'published' ? 'bg-emerald-300/40' : 'bg-linear-violet/40'}`} />
                    <div className="absolute bottom-0 h-24 w-full bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
                    
                    <Zap size={48} className={`relative z-10 ${active.status === 'published' ? '!text-emerald-400' : '!text-linear-indigo'}`} strokeWidth={1} />
                  </div>

                  <div className="relative z-10 px-6 pb-6 bg-[#0a0a0a] text-white flex flex-col items-center text-center">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono mb-2 flex items-center justify-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${active.status === 'published' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-gray-500'}`} />
                      {active.status === 'published' ? 'Publicado' : 'Rascunho'} • {leadCounts[active.id] ?? 0} leads
                    </p>
                    
                    <motion.h3 
                      layoutId={`title-${active.id}-${id}`} 
                      className="text-2xl font-bold text-white tracking-tight leading-tight"
                    >
                      {active.name}
                    </motion.h3>
                    
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">
                      Criado {Math.floor((Date.now() - new Date(active.created_at).getTime()) / 86400000) === 0 ? 'hoje' : `há ${Math.floor((Date.now() - new Date(active.created_at).getTime()) / 86400000)} dias`}
                    </p>

                    <div className="mt-8 w-full">
                      <Link
                        href={`/dashboard/funnels/${active.id}/builder`}
                        className="w-full inline-flex justify-center items-center h-12 px-4 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-bold transition-all duration-200 shadow-xl"
                      >
                        Editar Funil
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>
              </Portal>
            ) : null}
          </AnimatePresence>

          <ul className="flex flex-col gap-3 w-full">
            {funnels.map((funnel, i) => {
              const daysAgo = Math.floor((Date.now() - new Date(funnel.created_at).getTime()) / 86400000)
              const leads = leadCounts[funnel.id] ?? 0
              const isPublished = funnel.status === 'published'
              return (
                <motion.li
                  key={funnel.id}
                  layoutId={`card-${funnel.id}-${id}`}
                  onClick={() => setActive(funnel)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-[20px] border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm hover:border-linear-indigo/25 hover:bg-white/[0.05] transition-all duration-300 cursor-pointer overflow-hidden relative"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${isPublished ? 'bg-gradient-to-b from-emerald-500 to-emerald-400 opacity-50 group-hover:opacity-100' : 'bg-transparent'} transition-opacity`} />
                  
                  <div className="flex flex-col gap-1.5 pl-2">
                    <motion.h3 
                      layoutId={`title-${funnel.id}-${id}`}
                      className="text-lg font-bold text-linear-text-primary group-hover:text-linear-indigo transition-colors duration-200"
                    >
                      {funnel.name}
                    </motion.h3>
                    <div className="flex items-center gap-3 text-[11px] text-linear-text-quaternary font-mono">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-400' : 'bg-linear-text-quaternary'}`} />
                        <span className="uppercase tracking-[0.1em]">{isPublished ? 'Publicado' : 'Rascunho'}</span>
                      </div>
                      <span>·</span>
                      <span className="flex items-center gap-1"><BarChart2 size={10} /> {leads} lead{leads !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{daysAgo === 0 ? 'hoje' : `há ${daysAgo}d`}</span>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-0 flex items-center gap-2 pr-2 pl-2 sm:pl-0">
                    {/* Sempre visível (também no celular): copiar o link é a ação mais usada da lista */}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); if (isPublished) handleCopyLink(funnel.slug, funnel.id) }}
                      disabled={!isPublished}
                      aria-label={isPublished ? `Copiar link público de ${funnel.name}` : 'Publique o funil para ter um link público'}
                      title={isPublished ? `/preview/${funnel.slug}` : 'Publique o funil para ter um link público'}
                      className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-linear-border bg-linear-surface text-xs font-semibold text-linear-text-secondary hover:text-linear-text-primary hover:border-linear-indigo/50 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-linear-text-secondary disabled:hover:border-linear-border"
                    >
                      {copiedId === funnel.id
                        ? <><Check size={14} className="text-emerald-400" aria-hidden /> Copiado!</>
                        : <><LinkIcon size={14} aria-hidden /> Copiar link</>}
                    </button>
                    <button type="button" onClick={e => { e.stopPropagation(); setActive(funnel) }}
                      className="flex items-center h-9 px-3.5 rounded-xl bg-white/5 border border-transparent text-xs font-semibold text-linear-text-secondary hover:text-linear-text-primary hover:bg-white/10 cursor-pointer transition-colors">
                      Ver detalhes
                    </button>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
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
              <h4 className="text-xl font-semibold text-linear-text-primary tracking-tight mb-2">Excluir Funil?</h4>
              <p className="text-sm text-linear-text-tertiary mb-8">
                Esta ação é irreversível. Todos os leads e dados deste funil serão removidos permanentemente.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={!!deletingId}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {deletingId ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-full bg-linear-surface-elevated border border-linear-border text-linear-text-secondary py-4 rounded-2xl font-semibold hover:bg-linear-surface-hover transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showNew && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNew(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <div 
              className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`pointer-events-auto w-full ${createMode === 'ai' ? 'max-w-2xl' : 'max-w-md'} bg-linear-surface border border-linear-border rounded-[32px] shadow-2xl overflow-hidden`}
              >
                <div className="px-8 py-6 border-b border-linear-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {createMode === 'select' && <h4 className="text-lg font-semibold text-linear-text-primary tracking-tight">Criar Novo Funil</h4>}
                    {createMode === 'manual' && <button onClick={() => setCreateMode('select')} className="text-linear-indigo mr-2"><ChevronLeft size={20} /></button>}
                    {createMode === 'manual' && <h4 className="text-lg font-semibold text-linear-text-primary tracking-tight">Criação Manual</h4>}
                    {createMode === 'ai' && <button onClick={() => setCreateMode('select')} className="text-linear-indigo mr-2"><ChevronLeft size={20} /></button>}
                    {createMode === 'ai' && <h4 className="text-lg font-semibold text-linear-text-primary tracking-tight flex items-center gap-2">
                      <Sparkles size={18} className="text-linear-indigo" />
                      Co-piloto IA
                    </h4>}
                  </div>
                  <button onClick={() => setShowNew(false)} className="text-linear-text-quaternary hover:text-linear-text-primary"><X size={20} /></button>
                </div>

              {createMode === 'select' && (
                <div className="p-8 grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => setCreateMode('manual')}
                    className="flex items-center gap-6 p-6 bg-linear-bg border border-linear-border rounded-2xl hover:border-linear-indigo/50 hover:bg-linear-surface transition-all text-left group"
                  >
                    <div className="w-12 h-12 bg-linear-surface border border-linear-border rounded-xl flex items-center justify-center text-linear-text-quaternary group-hover:text-linear-indigo transition-colors">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-linear-text-primary">Criar Sozinho</p>
                      <p className="text-xs text-linear-text-tertiary">Monte seu funil do zero, passo a passo.</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setCreateMode('ai')}
                    className="flex items-center gap-6 p-6 bg-linear-bg border border-linear-border rounded-2xl hover:border-linear-indigo/50 hover:bg-linear-surface transition-all text-left group"
                  >
                    <div className="w-12 h-12 bg-linear-indigo/10 border border-linear-indigo/20 rounded-xl flex items-center justify-center text-linear-indigo">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-linear-text-primary">Criar com IA</p>
                      <p className="text-xs text-linear-text-tertiary">Converse com nosso co-piloto para gerar o funil.</p>
                    </div>
                  </button>
                </div>
              )}

              {createMode === 'manual' && (
                <form onSubmit={handleCreate} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-linear-text-quaternary">Nome do Funil</label>
                    <input
                      autoFocus
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      required
                      maxLength={80}
                      placeholder="Ex: Consultoria de Marketing"
                      className="w-full bg-linear-bg border border-linear-border rounded-xl px-4 py-3 text-sm text-linear-text-secondary focus:border-linear-indigo/50 outline-none transition-all"
                    />
                    <p className="text-[10px] text-linear-text-quaternary">O slug será gerado automaticamente.</p>
                  </div>
                  <button 
                    type="submit" 
                    disabled={creating}
                    className="w-full bg-linear-indigo text-white py-4 rounded-2xl font-semibold hover:bg-linear-violet transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(94,106,210,0.3)]"
                  >
                    {creating ? 'Criando...' : 'Criar e Ir para o Editor'}
                  </button>
                </form>
              )}

              {createMode === 'ai' && (
                <div className="p-4 h-[500px]">
                  <Suspense fallback={
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-linear-text-tertiary">
                      <Loader className="w-8 h-8 animate-spin" />
                      <p className="text-sm font-mono animate-pulse">Inicializando IA...</p>
                    </div>
                  }>
                    <AnimatedAIChat 
                      onSend={async (message) => {
                        toast.loading('Preparando seu funil...')
                        setTimeout(() => {
                          toast.dismiss()
                          setNewName(message.slice(0, 30))
                          setCreateMode('manual')
                        }, 2000)
                      }}
                      placeholder="Ex: Crie um funil de 3 etapas para venda de imóveis..."
                    />
                  </Suspense>
                </div>
              )}
            </motion.div>
          </div>
          </>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareFunnelId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShareFunnelId(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-linear-surface border border-linear-border rounded-[32px] z-[301] shadow-2xl overflow-hidden p-8"
            >
              <div className="w-16 h-16 bg-linear-indigo/10 border border-linear-indigo/20 rounded-2xl flex items-center justify-center text-linear-indigo mb-6 mx-auto">
                <UserPlus size={32} />
              </div>
              <h4 className="text-xl font-semibold text-linear-text-primary tracking-tight mb-2 text-center">Colaboração em Tempo Real</h4>
              <p className="text-sm text-linear-text-tertiary mb-8 text-center">
                Convide um colaborador para editar este funil com você. Ele verá o funil no próprio dashboard.
              </p>

              <form onSubmit={handleShare} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-linear-text-quaternary" size={18} />
                  <input
                    type="email"
                    placeholder="email@colaborador.com"
                    value={collabEmail}
                    onChange={e => setCollabEmail(e.target.value)}
                    required
                    className="w-full bg-linear-surface-elevated border border-linear-border rounded-2xl pl-12 pr-4 py-4 text-sm text-linear-text-secondary outline-none focus:border-linear-indigo/50 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sharing}
                  className="w-full bg-linear-indigo text-white py-4 rounded-2xl font-bold hover:bg-linear-violet transition-all flex items-center justify-center gap-2 shadow-xl shadow-linear-indigo/20 disabled:opacity-50"
                >
                  {sharing ? 'Enviando...' : (
                    <>
                      <Send size={18} />
                      Convidar para Colaborar
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
