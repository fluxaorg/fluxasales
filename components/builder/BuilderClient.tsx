'use client'

import { useState, useCallback, useRef, useMemo, useEffect, lazy, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import PropertyEditor from './PropertyEditor'
import { Funnel, FunnelPage, FunnelComponent, ComponentType, ComponentContent } from '@/types'
import {
  GripVertical, Trash2, Plus, ChevronLeft, Type, Heading,
  MousePointer2, HelpCircle, CheckCircle2, Save, Globe,
  Pencil, AlertTriangle, Loader, Palette, Zap as Sparkles,
  ArrowRight, Check
} from 'lucide-react'
import { FloatingDock } from '@/components/ui/floating-dock'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeEditor from './ThemeEditor'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
const AnimatedAIChat = lazy(() => import('@/components/ui/animated-ai-chat'))

interface BuilderClientProps {
  funnel: Funnel
  initialPages: FunnelPage[]
  plan: string
}

type SaveStatus = 'saved' | 'saving' | 'error'

const COMPONENT_PALETTE: { type: ComponentType; label: string; icon: any }[] = [
  { type: 'HEADING',  label: 'Título',    icon: Heading       },
  { type: 'TEXT',     label: 'Texto',     icon: Type          },
  { type: 'INPUT',    label: 'Campo',     icon: MousePointer2 },
  { type: 'QUESTION', label: 'Pergunta',  icon: HelpCircle    },
  { type: 'BUTTON',   label: 'Botão',     icon: CheckCircle2  },
]

const DEFAULT_CONTENT: Record<ComponentType, object> = {
  HEADING:  { text: 'Novo título', size: 'h2' },
  TEXT:     { text: 'Escreva algo aqui...' },
  INPUT:    { label: 'Email', placeholder: 'seu@email.com', field_name: 'email', required: true },
  QUESTION: { question: 'Qual é a sua pergunta?', options: [{ id: crypto.randomUUID(), label: 'Opção 1', next_page_id: null }] },
  BUTTON:   { label: 'Próxima etapa', action: 'next_page', next_page_id: null },
}

// Publish button with interactive hover animation
function PublishButton({ status, publishing, onClick }: {
  status: string; publishing: boolean; onClick: () => void
}) {
  const isPublished = status === 'published'
  return (
    <motion.button
      onClick={onClick}
      disabled={publishing}
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`group relative flex min-w-[120px] items-center justify-center overflow-hidden rounded-full border p-2 px-5 font-semibold text-xs transition-all ${
        isPublished
          ? 'border-linear-border bg-linear-bg text-linear-text-secondary hover:border-red-500/40 hover:text-red-400'
          : 'border-linear-indigo/50 bg-linear-indigo/10 text-linear-indigo hover:bg-linear-indigo hover:text-white'
      } disabled:opacity-50`}
    >
      <div className={`absolute left-3 h-2 w-2 rounded-full transition-all duration-500 ${isPublished ? 'bg-emerald-500' : 'bg-linear-indigo'} group-hover:scale-[30]`} />
      <span className="relative z-10 transition-all duration-500 group-hover:translate-x-12 group-hover:opacity-0 flex items-center gap-1.5">
        {publishing ? <Loader size={12} className="animate-spin" /> : isPublished ? <Globe size={12} /> : <Save size={12} />}
        {publishing ? '...' : isPublished ? 'Publicado' : 'Publicar'}
      </span>
      <div className="absolute inset-0 z-10 flex -translate-x-12 items-center justify-center gap-1.5 text-white opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 text-xs font-semibold">
        {isPublished ? 'Despublicar' : <><span>Publicar</span><ArrowRight size={12} /></>}
      </div>
    </motion.button>
  )
}

export default function BuilderClient({ funnel: initialFunnel, initialPages, plan }: BuilderClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const [funnel, setFunnel]               = useState(initialFunnel)
  const [pages, setPages]                 = useState<FunnelPage[]>(initialPages)
  const [activePageId, setActivePageId]   = useState(initialPages[0]?.id ?? '')
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus]       = useState<SaveStatus>('saved')
  const [publishing, setPublishing]       = useState(false)
  const [confirmDeletePageId, setConfirmDeletePageId] = useState<string | null>(null)
  const [deletingPage, setDeletingPage]   = useState(false)
  const [activeTab, setActiveTab]         = useState<'content' | 'design'>('content')
  const [showAIChat, setShowAIChat]       = useState(false)

  // Canvas pan
  const [pan, setPan]       = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const panOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  const isElite = plan === 'ELITE'

  useEffect(() => {
    if (!isElite) return
    const pagesChannel = supabase.channel('funnel-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fluxaleads_pages', filter: `funnel_id=eq.${funnel.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setPages(prev => [...prev, { ...(payload.new as any), components: [] }])
        else if (payload.eventType === 'UPDATE') setPages(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p))
        else if (payload.eventType === 'DELETE') setPages(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fluxaleads_components' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (!pages.some(p => p.id === payload.new.page_id)) return
          setPages(prev => prev.map(p => {
            if (p.id !== payload.new.page_id) return p
            const exists = p.components.some(c => c.id === payload.new.id)
            return { ...p, components: exists ? p.components.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c) : [...p.components, payload.new as any] }
          }))
        } else if (payload.eventType === 'DELETE') {
          setPages(prev => prev.map(p => ({ ...p, components: p.components.filter(c => c.id !== payload.old.id) })))
        }
      }).subscribe()
    return () => { supabase.removeChannel(pagesChannel) }
  }, [isElite, funnel.id, supabase, pages.length])

  const activePage = useMemo(() => pages.find(p => p.id === activePageId), [pages, activePageId])
  const selectedComponent = useMemo(() => activePage?.components?.find((c: any) => c.id === selectedComponentId) ?? null, [activePage, selectedComponentId])

  const scheduleSave = useCallback((fn: () => Promise<void>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(async () => {
      try { await fn(); setSaveStatus('saved') }
      catch (err) { setSaveStatus('error'); toast.error('Erro ao salvar.') }
    }, 800)
  }, [])

  const handleAddPage = async () => {
    const maxOrder = Math.max(-1, ...pages.map(p => p.page_order))
    const { data, error } = await supabase.from('fluxaleads_pages').insert({ funnel_id: funnel.id, name: `Etapa ${pages.length + 1}`, page_order: maxOrder + 1 }).select().single()
    if (error || !data) { toast.error('Erro ao adicionar etapa.'); return }
    const newPage: FunnelPage = { ...data, components: [] }
    setPages(prev => [...prev, newPage])
    setActivePageId(data.id)
  }

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) { toast.error('O funil deve ter ao menos 1 etapa.'); return }
    setDeletingPage(true)
    const { error } = await supabase.from('fluxaleads_pages').delete().eq('id', pageId)
    setDeletingPage(false)
    if (error) { toast.error('Erro ao excluir etapa.'); return }
    const newPages = pages.filter(p => p.id !== pageId)
    setPages(newPages)
    if (activePageId === pageId) setActivePageId(newPages[0].id)
    setConfirmDeletePageId(null)
    toast.success('Etapa excluída.')
  }

  const handleAddComponent = async (type: ComponentType) => {
    if (!activePage) return
    const maxOrder = Math.max(-1, ...(activePage.components || []).map(c => c.component_order))
    const content = DEFAULT_CONTENT[type]
    const { data, error } = await supabase.from('fluxaleads_components').insert({ page_id: activePage.id, type, content, component_order: maxOrder + 1 }).select().single()
    if (error || !data) { toast.error('Erro ao adicionar componente.'); return }
    setPages(prev => prev.map(p => p.id === activePage.id ? { ...p, components: [...p.components, data] } : p))
    setSelectedComponentId(data.id)
  }

  const handleUpdateComponent = useCallback((id: string, content: ComponentContent) => {
    setPages(prev => prev.map(p => ({ ...p, components: (p.components || []).map(c => c.id === id ? { ...c, content } : c) })))
    scheduleSave(async () => {
      const { error } = await supabase.from('fluxaleads_components').update({ content }).eq('id', id)
      if (error) throw error
    })
  }, [scheduleSave, supabase])

  const handleUpdateTheme = useCallback((theme: any) => {
    setFunnel(prev => ({ ...prev, theme }))
    scheduleSave(async () => {
      const { error } = await supabase.from('fluxaleads_funnels').update({ theme }).eq('id', initialFunnel.id)
      if (error) throw error
    })
  }, [scheduleSave, supabase, initialFunnel.id])

  const handleDeleteComponent = async (id: string) => {
    const { error } = await supabase.from('fluxaleads_components').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir componente.'); return }
    setPages(prev => prev.map(p => ({ ...p, components: (p.components || []).filter(c => c.id !== id) })))
    if (selectedComponentId === id) setSelectedComponentId(null)
  }

  const handlePublish = async () => {
    setPublishing(true)
    const newStatus = funnel.status === 'published' ? 'draft' : 'published'
    const { error } = await supabase.from('fluxaleads_funnels').update({ status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null }).eq('id', funnel.id)
    setPublishing(false)
    if (error) { toast.error('Erro ao publicar.'); return }
    setFunnel(prev => ({ ...prev, status: newStatus }))
    if (newStatus === 'published') {
      const url = `${window.location.origin}/preview/${funnel.slug}`
      navigator.clipboard.writeText(url)
      toast.success(`Publicado! Link copiado: ${url}`)
    } else {
      toast.success('Funil despublicado.')
    }
  }

  // Drag & drop reorder
  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || !activePage) return
    const items = Array.from(activePage.components)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    const updated = items.map((c, i) => ({ ...c, component_order: i }))
    setPages(prev => prev.map(p => p.id === activePageId ? { ...p, components: updated } : p))
    // Persist reorder
    await Promise.all(updated.map(c =>
      supabase.from('fluxaleads_components').update({ component_order: c.component_order }).eq('id', c.id)
    ))
  }, [activePage, activePageId, supabase])


  const handleAIChatSend = async (message: string) => {
    const msg = message.toLowerCase()
    toast.loading('IA processando...')
    await new Promise(resolve => setTimeout(resolve, 1800))
    toast.dismiss()
    let updated = false
    if (msg.includes('fundo') || msg.includes('tema') || msg.includes('cor')) {
      const t = (funnel.theme || {}) as any
      if (msg.includes('vermelho')) handleUpdateTheme({ ...t, bg_color: '#450a0a', accent_color: '#ef4444' })
      else if (msg.includes('azul')) handleUpdateTheme({ ...t, bg_color: '#081421', accent_color: '#3b82f6' })
      else if (msg.includes('verde')) handleUpdateTheme({ ...t, bg_color: '#061a11', accent_color: '#10b981' })
      else handleUpdateTheme({ ...t, bg_color: '#09090b', accent_color: '#5E6ADA' })
      updated = true
    }
    if (msg.includes('adicionar') || msg.includes('criar') || msg.includes('inserir')) {
      if (msg.includes('título') || msg.includes('heading')) handleAddComponent('HEADING')
      else if (msg.includes('texto')) handleAddComponent('TEXT')
      else if (msg.includes('campo') || msg.includes('input')) handleAddComponent('INPUT')
      else if (msg.includes('botão')) handleAddComponent('BUTTON')
      else if (msg.includes('pergunta') || msg.includes('quiz')) handleAddComponent('QUESTION')
      else if (msg.includes('etapa') || msg.includes('página')) handleAddPage()
      updated = true
    }
    toast(updated ? 'Funil atualizado pela IA!' : 'Dica: peça para "mudar tema para azul" ou "adicionar um título"', { icon: '🤖' })
  }

  const renderComponentPreview = (comp: FunnelComponent) => {
    const c = comp.content as unknown as Record<string, unknown>
    switch (comp.type) {
      case 'HEADING':  return <p className="font-sans text-xl font-semibold text-linear-text-primary">{String(c.text ?? '')}</p>
      case 'TEXT':     return <p className="font-sans text-sm text-linear-text-secondary leading-relaxed">{String(c.text ?? '')}</p>
      case 'INPUT':    return (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-linear-text-tertiary">{String(c.label ?? '')}</p>
          <div className="border border-linear-border bg-linear-bg/50 rounded-md px-3 py-2 text-sm text-linear-text-quaternary">{String(c.placeholder ?? '')}</div>
        </div>
      )
      case 'QUESTION': return (
        <div className="space-y-2.5">
          <p className="font-sans font-medium text-sm text-linear-text-primary">{String(c.question ?? '')}</p>
          <div className="grid grid-cols-1 gap-2">
            {(c.options as Array<{ id: string; label: string }>)?.map(opt => (
              <div key={opt.id} className="border border-linear-border bg-linear-bg/50 rounded-md px-3 py-2 text-xs text-linear-text-secondary">{opt.label}</div>
            ))}
          </div>
        </div>
      )
      case 'BUTTON':   return (
        <div className="bg-linear-indigo text-white text-xs font-medium px-4 py-2 rounded-md inline-block shadow-[0_0_15px_rgba(94,106,210,0.3)]">{String(c.label ?? '')}</div>
      )
    }
  }

  return (
    <div className="h-screen flex flex-col bg-linear-bg text-linear-text-primary font-sans">
      {/* ── Top bar ── */}
      <div className="border-b border-linear-border px-6 py-3 flex items-center justify-between bg-linear-surface/80 backdrop-blur-md z-50">
        {/* Left */}
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => router.push('/dashboard/funnels')}
            className="flex items-center gap-2 text-sm text-linear-text-tertiary hover:text-linear-text-primary transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Sair</span>
          </button>
          <div className="h-4 w-[1px] bg-linear-border" />
          <div className="flex items-center gap-2 group">
            <input
              value={funnel.name}
              onChange={e => {
                const n = e.target.value
                setFunnel(prev => ({ ...prev, name: n }))
                scheduleSave(async () => { const { error } = await supabase.from('fluxaleads_funnels').update({ name: n }).eq('id', funnel.id); if (error) throw error })
              }}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 w-fit min-w-[120px] outline-none group-hover:text-linear-indigo transition-colors"
              placeholder="Nome do funil"
            />
            <Pencil size={11} className="text-linear-text-quaternary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Center: save status */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <div className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[11px] text-linear-text-tertiary">
            {saveStatus === 'saved' && 'Sincronizado'}
            {saveStatus === 'saving' && 'Salvando...'}
            {saveStatus === 'error' && 'Erro de conexão'}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <PublishButton status={funnel.status} publishing={publishing} onClick={handlePublish} />
        </div>
      </div>

      {/* ── Page navigation (centered) ── */}
      <div className="border-b border-linear-border px-6 py-2 bg-linear-surface/40 flex items-center justify-center gap-1 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1">
          {pages.map((page, i) => (
            <div key={page.id} className="flex items-center gap-1">
              <HoverBorderGradient
                as="button"
                onClick={() => { setActivePageId(page.id); setSelectedComponentId(null) }}
                containerClassName={`rounded-full h-8 ${activePageId === page.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                className={`rounded-full px-3 py-0 text-[11px] font-medium whitespace-nowrap h-full flex items-center ${activePageId === page.id ? 'bg-linear-surface text-linear-indigo' : 'bg-linear-bg text-linear-text-tertiary'}`}
                duration={activePageId === page.id ? 1.5 : 3}
              >
                {i + 1}. {page.name}
              </HoverBorderGradient>
              {pages.length > 1 && activePageId === page.id && (
                <button onClick={() => setConfirmDeletePageId(page.id)} className="text-linear-text-quaternary hover:text-red-400 transition-colors p-0.5">
                  <Plus className="rotate-45" size={13} />
                </button>
              )}
              {i < pages.length - 1 && <div className="mx-1 text-linear-text-quaternary/30 text-xs">/</div>}
            </div>
          ))}
        </div>
        <button onClick={handleAddPage}
          className="ml-3 p-1.5 rounded-full border border-dashed border-linear-border text-linear-text-quaternary hover:text-linear-indigo hover:border-linear-indigo transition-all"
          title="Nova etapa"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas — pannable */}
        <div
          ref={canvasRef}
          className={`flex-1 overflow-hidden relative bg-[#0A0A0B] select-none ${panning ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}
          onMouseDown={e => {
            // Only start panning when clicking the raw canvas background
            const tag = (e.target as HTMLElement).tagName
            const isBackground = tag === 'DIV' && !(e.target as HTMLElement).closest('[data-comp]')
            if (!isBackground) return
            setPanning(true)
            panOrigin.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
          }}
          onMouseMove={e => {
            if (!panning) return
            setPan({ x: panOrigin.current.px + e.clientX - panOrigin.current.mx, y: panOrigin.current.py + e.clientY - panOrigin.current.my })
          }}
          onMouseUp={() => setPanning(false)}
          onMouseLeave={() => setPanning(false)}
          onClick={e => { if (!panning) setSelectedComponentId(null) }}
        >
          {/* Panned inner layer */}
          <div
            style={{ transform: `translate(calc(-50% + ${pan.x}px), ${pan.y}px)`, position: 'absolute', left: '50%', top: '48px', width: '560px', paddingBottom: '120px' }}
          >
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="components">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    data-comp
                    className="min-h-[400px] flex flex-col"
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()}
                  >
                    {(activePage?.components || []).map((comp, index) => (
                      <Draggable key={comp.id} draggableId={comp.id} index={index}>
                        {(drag, snapshot) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            onClick={e => { e.stopPropagation(); setSelectedComponentId(comp.id) }}
                            className={`relative mb-4 rounded-2xl border transition-colors ${
                              snapshot.isDragging
                                ? 'shadow-2xl shadow-linear-indigo/30 border-linear-indigo bg-linear-surface-elevated opacity-90'
                                : selectedComponentId === comp.id
                                ? 'bg-linear-surface-elevated border-linear-indigo shadow-[0_0_30px_rgba(94,106,210,0.1)]'
                                : 'bg-linear-surface/30 border-linear-border hover:border-linear-indigo/30'
                            }`}
                          >
                            <div className="flex items-stretch">
                              {/* Drag handle — only this initiates drag */}
                              <div
                                {...drag.dragHandleProps}
                                className="flex items-center px-2 text-linear-text-quaternary hover:text-linear-indigo cursor-grab active:cursor-grabbing rounded-l-2xl hover:bg-linear-indigo/10 transition-colors"
                                title="Arrastar"
                              >
                                <GripVertical size={16} />
                              </div>
                              <div className="flex-1 p-5 min-w-0">
                                {renderComponentPreview(comp)}
                              </div>
                            </div>
                            {selectedComponentId === comp.id && (
                              <button
                                onClick={e => { e.stopPropagation(); handleDeleteComponent(comp.id) }}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {(activePage?.components || []).length === 0 && (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-linear-border rounded-2xl opacity-40 py-20">
                        <Plus size={32} className="mb-4 text-linear-text-quaternary" />
                        <p className="text-sm font-medium">Esta etapa está vazia</p>
                        <p className="text-xs text-linear-text-quaternary mt-1">Clique nos ícones abaixo para adicionar componentes</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Floating Dock */}
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]">
            <FloatingDock items={[
              ...COMPONENT_PALETTE.map(item => ({
                title: item.label,
                icon: <item.icon className="h-full w-full" />,
                onClick: () => { setActiveTab('content'); handleAddComponent(item.type) }
              })),
              { title: 'Design', icon: <Palette className="h-full w-full" />, onClick: () => setActiveTab('design') },
              { title: 'IA Builder', icon: <Sparkles className="h-full w-full" />, onClick: () => setShowAIChat(true) },
            ]} />
          </div>
        </div>

        {/* AI Chat */}
        <AnimatePresence>
          {showAIChat && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
            >
              <div className="relative w-full max-w-4xl h-[80vh] bg-linear-surface border border-linear-border rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
                <button onClick={() => setShowAIChat(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors z-[110]">
                  <Plus className="rotate-45" size={24} />
                </button>
                <div className="flex-1 overflow-hidden">
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader className="w-8 h-8 animate-spin text-linear-indigo" /></div>}>
                    <AnimatedAIChat onSend={handleAIChatSend} />
                  </Suspense>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right sidebar */}
        <div className="w-80 border-l border-linear-border bg-linear-surface/30 overflow-y-auto">
          {activeTab === 'design' ? (
            <ThemeEditor theme={funnel.theme as any} onUpdate={handleUpdateTheme} />
          ) : selectedComponent ? (
            <PropertyEditor key={selectedComponent.id} component={selectedComponent} pages={pages} onUpdate={content => handleUpdateComponent(selectedComponent.id, content)} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-linear-surface-elevated flex items-center justify-center mb-4 text-linear-text-quaternary border border-linear-border">
                <MousePointer2 size={20} />
              </div>
              <h4 className="text-sm font-medium text-linear-text-secondary">Nada selecionado</h4>
              <p className="text-xs text-linear-text-quaternary mt-2 leading-relaxed">
                Clique em um componente no canvas para editar suas propriedades.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete step modal */}
      <AnimatePresence>
        {confirmDeletePageId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDeletePageId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-linear-surface border border-linear-border rounded-[32px] z-[301] shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h4 className="text-xl font-semibold text-linear-text-primary tracking-tight mb-2">Excluir Etapa?</h4>
              <p className="text-sm text-linear-text-tertiary mb-8">Esta ação removerá permanentemente esta etapa e todos os seus componentes.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleDeletePage(confirmDeletePageId)} disabled={deletingPage} className="w-full bg-red-500 text-white py-4 rounded-2xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50">
                  {deletingPage ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
                <button onClick={() => setConfirmDeletePageId(null)} className="w-full bg-linear-surface-elevated border border-linear-border text-linear-text-secondary py-4 rounded-2xl font-semibold hover:bg-linear-surface-hover transition-all">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
