'use client'

import { useState, useCallback, useRef, useMemo, useEffect, lazy, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import PropertyEditor from './PropertyEditor'
import ThemeEditor from './ThemeEditor'
import { Funnel, FunnelPage, FunnelComponent, ComponentType, ComponentContent, FunnelTheme, HeadingContent, TextContent, InputContent, QuestionContent, ButtonContent } from '@/types'
import {
  GripVertical, Trash2, Plus, ChevronLeft, Type, Heading, MousePointer2, HelpCircle, CheckCircle2,
  Globe, Loader2, Palette, Zap as Sparkles, ArrowRight, Eye, Monitor, Smartphone, AlertTriangle, X, Copy, CornerDownRight,
} from 'lucide-react'
import { FloatingDock } from '@/components/ui/floating-dock'
import { motion, AnimatePresence } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { resolveTheme, googleFontUrl, alpha } from '@/lib/funnel-theme'
import { hasEliteFeatures } from '@/lib/plans'
const AnimatedAIChat = lazy(() => import('@/components/ui/animated-ai-chat'))

interface BuilderClientProps {
  funnel: Funnel
  initialPages: FunnelPage[]
  plan: string
}

type SaveStatus = 'saved' | 'saving' | 'error'
type Device = 'desktop' | 'mobile'

const COMPONENT_PALETTE: { type: ComponentType; label: string; icon: typeof Heading }[] = [
  { type: 'HEADING',  label: 'Título',   icon: Heading       },
  { type: 'TEXT',     label: 'Texto',    icon: Type          },
  { type: 'INPUT',    label: 'Campo',    icon: MousePointer2 },
  { type: 'QUESTION', label: 'Pergunta', icon: HelpCircle    },
  { type: 'BUTTON',   label: 'Botão',    icon: CheckCircle2  },
]

// Função (e não objeto) para que cada pergunta nova receba IDs de opção únicos.
function defaultContent(type: ComponentType): ComponentContent {
  switch (type) {
    case 'HEADING':  return { text: 'Novo título', size: 'h2' }
    case 'TEXT':     return { text: 'Escreva algo aqui...' }
    case 'INPUT':    return { label: 'Seu melhor e-mail', placeholder: 'voce@email.com', field_name: 'email', required: true }
    case 'QUESTION': return { question: 'Qual é a sua pergunta?', options: [
      { id: crypto.randomUUID(), label: 'Opção 1', next_page_id: null },
      { id: crypto.randomUUID(), label: 'Opção 2', next_page_id: null },
    ] }
    case 'BUTTON':   return { label: 'Continuar', action: 'next_page', next_page_id: null }
  }
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

/** Etapa sem botão nem pergunta = visitante não consegue avançar. */
const isDeadEnd = (page: FunnelPage) => !page.components.some(c => c.type === 'BUTTON' || c.type === 'QUESTION')

export default function BuilderClient({ funnel: initialFunnel, initialPages, plan }: BuilderClientProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [funnel, setFunnel]               = useState(initialFunnel)
  const [pages, setPages]                 = useState<FunnelPage[]>(() => initialPages.map(p => ({ ...p, components: p.components ?? [] })))
  const [activePageId, setActivePageId]   = useState(initialPages[0]?.id ?? '')
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus]       = useState<SaveStatus>('saved')
  const [publishing, setPublishing]       = useState(false)
  const [publishIssues, setPublishIssues] = useState<string[] | null>(null)
  const [confirmDeletePageId, setConfirmDeletePageId] = useState<string | null>(null)
  const [deletingPage, setDeletingPage]   = useState(false)
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null)
  const [showDesign, setShowDesign]       = useState(false)
  const [showAIChat, setShowAIChat]       = useState(false)
  const [device, setDevice]               = useState<Device>('desktop')
  const [busy, setBusy]                   = useState(false)

  const theme = resolveTheme(funnel.theme)
  const isElite = hasEliteFeatures(plan)

  // ── Salvamento: um temporizador por item, para que editar A e depois B não descarte o save de A ──
  const timers = useRef(new Map<string, { timer: NodeJS.Timeout; fn: () => Promise<void> }>())
  const inflight = useRef(0)
  const failed = useRef(false)

  const settle = useCallback(() => {
    if (timers.current.size === 0 && inflight.current === 0) {
      setSaveStatus(failed.current ? 'error' : 'saved')
    }
  }, [])

  const runSave = useCallback(async (key: string) => {
    const entry = timers.current.get(key)
    if (!entry) return
    clearTimeout(entry.timer)
    timers.current.delete(key)
    inflight.current++
    try {
      await entry.fn()
    } catch {
      failed.current = true
      toast.error('Não foi possível salvar. Verifique sua conexão.', { id: 'save-error' })
    } finally {
      inflight.current--
      settle()
    }
  }, [settle])

  const scheduleSave = useCallback((key: string, fn: () => Promise<void>, delay = 500) => {
    const prev = timers.current.get(key)
    if (prev) clearTimeout(prev.timer)
    failed.current = false
    setSaveStatus('saving')
    timers.current.set(key, { fn, timer: setTimeout(() => runSave(key), delay) })
  }, [runSave])

  const flushSaves = useCallback(async () => {
    await Promise.all(Array.from(timers.current.keys()).map(runSave))
  }, [runSave])

  // Avisa antes de fechar a aba com alterações não salvas.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timers.current.size > 0 || inflight.current > 0) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // ── Colaboração em tempo real (ELITE) ──
  const pageIdsRef = useRef(new Set(pages.map(p => p.id)))
  useEffect(() => { pageIdsRef.current = new Set(pages.map(p => p.id)) }, [pages])

  useEffect(() => {
    if (!isElite) return
    const channel = supabase.channel(`funnel-${funnel.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fluxaleads_pages', filter: `funnel_id=eq.${funnel.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setPages(prev => prev.some(p => p.id === payload.new.id) ? prev : [...prev, { ...(payload.new as FunnelPage), components: [] }].sort((a, b) => a.page_order - b.page_order))
        else if (payload.eventType === 'UPDATE') setPages(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...(payload.new as FunnelPage), components: p.components } : p))
        else if (payload.eventType === 'DELETE') setPages(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fluxaleads_components' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setPages(prev => prev.map(p => ({ ...p, components: p.components.filter(c => c.id !== payload.old.id) })))
          return
        }
        const row = payload.new as FunnelComponent
        if (!pageIdsRef.current.has(row.page_id)) return
        // Ignora o eco de alterações que este próprio editor ainda está salvando.
        if (timers.current.has(`comp:${row.id}`)) return
        setPages(prev => prev.map(p => {
          if (p.id !== row.page_id) return p
          const exists = p.components.some(c => c.id === row.id)
          const components = exists ? p.components.map(c => c.id === row.id ? { ...c, ...row } : c) : [...p.components, row]
          return { ...p, components: components.sort((a, b) => a.component_order - b.component_order) }
        }))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isElite, funnel.id, supabase])

  const activePage = useMemo(() => pages.find(p => p.id === activePageId), [pages, activePageId])
  const activeIndex = pages.findIndex(p => p.id === activePageId)
  const selectedComponent = useMemo(() => activePage?.components.find(c => c.id === selectedComponentId) ?? null, [activePage, selectedComponentId])
  const pageLabel = (id: string | null | undefined) => {
    const i = pages.findIndex(p => p.id === id)
    return i === -1 ? null : `${i + 1}. ${pages[i].name}`
  }

  // ── Etapas ──
  const handleAddPage = async () => {
    const maxOrder = Math.max(-1, ...pages.map(p => p.page_order))
    const { data, error } = await supabase.from('fluxaleads_pages')
      .insert({ funnel_id: funnel.id, name: `Etapa ${pages.length + 1}`, page_order: maxOrder + 1 }).select().single()
    if (error || !data) { toast.error('Erro ao adicionar etapa.'); return }
    setPages(prev => prev.some(p => p.id === data.id) ? prev : [...prev, { ...data, components: [] }])
    setActivePageId(data.id)
    setSelectedComponentId(null)
  }

  const handleRenamePage = (pageId: string, name: string) => {
    const clean = name.trim() || `Etapa ${pages.findIndex(p => p.id === pageId) + 1}`
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, name: clean } : p))
    setRenamingPageId(null)
    scheduleSave(`page:${pageId}`, async () => {
      const { error } = await supabase.from('fluxaleads_pages').update({ name: clean }).eq('id', pageId)
      if (error) throw error
    }, 0)
  }

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) { toast.error('O funil precisa de ao menos 1 etapa.'); return }
    setDeletingPage(true)
    const { error } = await supabase.from('fluxaleads_pages').delete().eq('id', pageId)
    setDeletingPage(false)
    if (error) { toast.error('Erro ao excluir etapa.'); return }
    const newPages = pages.filter(p => p.id !== pageId)
    setPages(newPages)
    if (activePageId === pageId) setActivePageId(newPages[Math.max(0, activeIndex - 1)].id)
    setSelectedComponentId(null)
    setConfirmDeletePageId(null)
    toast.success('Etapa excluída.')
  }

  // ── Componentes ──
  /** Insere logo após o componente selecionado (ou no fim), reajustando a ordem dos seguintes. */
  const insertComponent = async (type: ComponentType, content: ComponentContent) => {
    if (!activePage) return
    const list = activePage.components
    const selIndex = list.findIndex(c => c.id === selectedComponentId)
    const at = selIndex === -1 ? list.length : selIndex + 1
    const shifted = list.slice(at)

    setBusy(true)
    if (shifted.length) {
      await Promise.all(shifted.map((c, i) =>
        supabase.from('fluxaleads_components').update({ component_order: at + 1 + i }).eq('id', c.id)))
    }
    const { data, error } = await supabase.from('fluxaleads_components')
      .insert({ page_id: activePage.id, type, content, component_order: at }).select().single()
    setBusy(false)
    if (error || !data) { toast.error('Erro ao adicionar componente.'); return }

    setPages(prev => prev.map(p => {
      if (p.id !== activePage.id) return p
      const next = [...p.components.filter(c => c.id !== data.id)]
      next.splice(at, 0, data)
      return { ...p, components: next.map((c, i) => ({ ...c, component_order: i })) }
    }))
    setSelectedComponentId(data.id)
    setShowDesign(false)
  }

  const handleAddComponent = (type: ComponentType) => insertComponent(type, defaultContent(type))

  const handleDuplicateComponent = (comp: FunnelComponent) => {
    const copy = JSON.parse(JSON.stringify(comp.content))
    if (comp.type === 'QUESTION') copy.options = copy.options.map((o: { id: string }) => ({ ...o, id: crypto.randomUUID() }))
    insertComponent(comp.type, copy)
  }

  // Componentes em exclusão: ignora edições pendentes que o painel envia ao desmontar.
  const deletedIds = useRef(new Set<string>())

  const handleUpdateComponent = useCallback((id: string, content: ComponentContent) => {
    if (deletedIds.current.has(id)) return
    setPages(prev => prev.map(p => ({ ...p, components: p.components.map(c => c.id === id ? { ...c, content } : c) })))
    scheduleSave(`comp:${id}`, async () => {
      const { error } = await supabase.from('fluxaleads_components').update({ content }).eq('id', id)
      if (error) throw error
    })
  }, [scheduleSave, supabase])

  const handleDeleteComponent = async (comp: FunnelComponent) => {
    if (deletedIds.current.has(comp.id)) return
    deletedIds.current.add(comp.id)
    const t = timers.current.get(`comp:${comp.id}`)
    if (t) { clearTimeout(t.timer); timers.current.delete(`comp:${comp.id}`); settle() }

    // Remove da tela na hora; se o banco recusar, o bloco volta e o motivo é mostrado.
    const pageIndex = pages.find(p => p.id === comp.page_id)?.components.findIndex(c => c.id === comp.id) ?? -1
    setPages(prev => prev.map(p => ({ ...p, components: p.components.filter(c => c.id !== comp.id) })))
    if (selectedComponentId === comp.id) setSelectedComponentId(null)

    // .select() devolve as linhas apagadas: com RLS, uma exclusão negada não gera erro, só 0 linhas.
    const { data: removed, error } = await supabase.from('fluxaleads_components').delete().eq('id', comp.id).select('id')
    if (error || !removed?.length) {
      deletedIds.current.delete(comp.id)
      setPages(prev => prev.map(p => {
        if (p.id !== comp.page_id || p.components.some(c => c.id === comp.id)) return p
        const next = [...p.components]
        next.splice(pageIndex === -1 ? next.length : pageIndex, 0, comp)
        return { ...p, components: next }
      }))
      toast.error(error ? `Erro ao excluir: ${error.message}` : 'Não foi possível excluir: sem permissão para alterar este funil.')
      return
    }

    toast(t2 => (
      <span className="flex items-center gap-3 text-sm">
        Componente excluído
        <button
          className="font-semibold text-linear-indigo cursor-pointer hover:underline"
          onClick={async () => {
            toast.dismiss(t2.id)
            const { data, error: err } = await supabase.from('fluxaleads_components')
              .insert({ id: comp.id, page_id: comp.page_id, type: comp.type, content: comp.content, component_order: comp.component_order })
              .select().single()
            if (err || !data) { toast.error('Não foi possível desfazer.'); return }
            deletedIds.current.delete(comp.id)
            setPages(prev => prev.map(p => p.id !== comp.page_id ? p : {
              ...p, components: [...p.components.filter(c => c.id !== data.id), data].sort((a, b) => a.component_order - b.component_order),
            }))
          }}
        >
          Desfazer
        </button>
      </span>
    ), { duration: 5000 })
  }

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || !activePage || result.destination.index === result.source.index) return
    const items = [...activePage.components]
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    const updated = items.map((c, i) => ({ ...c, component_order: i }))
    setPages(prev => prev.map(p => p.id === activePage.id ? { ...p, components: updated } : p))
    const results = await Promise.all(updated
      .filter((c, i) => activePage.components[i]?.id !== c.id)
      .map(c => supabase.from('fluxaleads_components').update({ component_order: c.component_order }).eq('id', c.id)))
    if (results.some(r => r.error)) toast.error('Erro ao salvar a nova ordem.')
  }, [activePage, supabase])

  // ── Tema / nome ──
  const handleUpdateTheme = useCallback((next: FunnelTheme) => {
    setFunnel(prev => ({ ...prev, theme: next }))
    scheduleSave('theme', async () => {
      const { error } = await supabase.from('fluxaleads_funnels').update({ theme: next }).eq('id', initialFunnel.id)
      if (error) throw error
    })
  }, [scheduleSave, supabase, initialFunnel.id])

  const handleRename = (name: string) => {
    setFunnel(prev => ({ ...prev, name }))
    if (!name.trim()) return
    scheduleSave('name', async () => {
      const { error } = await supabase.from('fluxaleads_funnels').update({ name: name.trim() }).eq('id', funnel.id)
      if (error) throw error
    }, 700)
  }

  // ── Publicação ──
  const collectIssues = () => {
    const issues: string[] = []
    pages.forEach((p, i) => {
      if (p.components.length === 0) issues.push(`A etapa ${i + 1} (“${p.name}”) está vazia.`)
      else if (isDeadEnd(p) && i < pages.length - 1) issues.push(`A etapa ${i + 1} (“${p.name}”) não tem botão nem pergunta — o visitante não consegue avançar.`)
    })
    const last = pages[pages.length - 1]
    if (last && last.components.length > 0 && isDeadEnd(last)) issues.push('A última etapa não tem botão para enviar — nenhum lead será capturado.')
    if (!pages.some(p => p.components.some(c => c.type === 'INPUT'))) issues.push('Nenhum campo de contato (e-mail, nome ou telefone) no funil.')
    return issues
  }

  const doPublish = async (status: 'draft' | 'published') => {
    setPublishIssues(null)
    setPublishing(true)
    await flushSaves()
    const { error } = await supabase.from('fluxaleads_funnels')
      .update({ status, published_at: status === 'published' ? new Date().toISOString() : null }).eq('id', funnel.id)
    setPublishing(false)
    if (error) { toast.error('Erro ao alterar a publicação.'); return }
    setFunnel(prev => ({ ...prev, status }))
    if (status === 'published') {
      const url = `${window.location.origin}/preview/${funnel.slug}`
      try { await navigator.clipboard.writeText(url); toast.success('Publicado! Link copiado.') }
      catch { toast.success(`Publicado! ${url}`) }
    } else {
      toast.success('Funil despublicado.')
    }
  }

  const handlePublishClick = () => {
    if (funnel.status === 'published') return doPublish('draft')
    const issues = collectIssues()
    if (issues.length) setPublishIssues(issues)
    else doPublish('published')
  }

  const handlePreview = async () => {
    const win = window.open('about:blank', '_blank')
    await flushSaves()
    if (win) win.location.href = `/preview/${funnel.slug}`
  }

  const handleExit = async () => {
    await flushSaves()
    router.push('/dashboard/funnels')
  }

  // ── Atalhos de teclado ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      if (e.key === 'Escape') { setSelectedComponentId(null); setShowDesign(false); return }
      if (!selectedComponent) return
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleDeleteComponent(selectedComponent) }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); handleDuplicateComponent(selectedComponent) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ── IA (comandos simples) ──
  const handleAIChatSend = async (message: string) => {
    const msg = message.toLowerCase()
    let updated = false
    if (msg.includes('fundo') || msg.includes('tema') || msg.includes('cor')) {
      if (msg.includes('vermelho')) handleUpdateTheme({ ...theme, bg_color: '#1C0A0F', accent_color: '#F43F5E', button_color: '#E11D48' })
      else if (msg.includes('azul')) handleUpdateTheme({ ...theme, bg_color: '#081421', accent_color: '#38BDF8', button_color: '#0EA5E9' })
      else if (msg.includes('verde')) handleUpdateTheme({ ...theme, bg_color: '#061A11', accent_color: '#34D399', button_color: '#10B981' })
      else if (msg.includes('claro') || msg.includes('branco')) handleUpdateTheme({ ...theme, bg_color: '#FAFAF9', text_color: '#0F172A', button_color: '#0F172A', button_text_color: '#FFFFFF' })
      else handleUpdateTheme({ ...theme, bg_color: '#020203', text_color: '#FFFFFF', accent_color: '#5E6ADA', button_color: '#5E6ADA' })
      updated = true
    }
    if (msg.includes('adicionar') || msg.includes('criar') || msg.includes('inserir')) {
      if (msg.includes('título')) await handleAddComponent('HEADING')
      else if (msg.includes('texto')) await handleAddComponent('TEXT')
      else if (msg.includes('campo') || msg.includes('input') || msg.includes('email')) await handleAddComponent('INPUT')
      else if (msg.includes('botão')) await handleAddComponent('BUTTON')
      else if (msg.includes('pergunta') || msg.includes('quiz')) await handleAddComponent('QUESTION')
      else if (msg.includes('etapa') || msg.includes('página')) await handleAddPage()
      updated = true
    }
    toast(updated ? 'Funil atualizado.' : 'Tente: "mudar tema para azul" ou "adicionar uma pergunta".')
  }

  // ── Pré-visualização dos componentes no canvas (com o tema aplicado) ──
  const mobile = device === 'mobile'
  const radius = (max: number) => `min(${theme.border_radius}, ${max}px)`
  const destinationChip = (id: string | null | undefined) => {
    const label = pageLabel(id)
    return label ? (
      <span className="mt-2 inline-flex items-center gap-1 rounded bg-linear-indigo/90 px-1.5 py-0.5 text-[10px] font-medium text-white font-sans">
        <CornerDownRight size={10} aria-hidden /> {label}
      </span>
    ) : null
  }

  const renderComponentPreview = (comp: FunnelComponent) => {
    switch (comp.type) {
      case 'HEADING': {
        const c = comp.content as HeadingContent
        const size = c.size === 'h1' ? (mobile ? 'text-3xl' : 'text-5xl') : c.size === 'h3' ? (mobile ? 'text-xl' : 'text-2xl') : (mobile ? 'text-2xl' : 'text-4xl')
        return <p className={`${size} font-bold tracking-tight leading-tight break-words`} style={{ color: c.color || undefined }}>{c.text || <span className="opacity-40">Título vazio</span>}</p>
      }
      case 'TEXT': {
        const c = comp.content as TextContent
        return <p className="text-base leading-relaxed whitespace-pre-line break-words" style={{ color: c.color || alpha(theme.text_color, 0.75) }}>{c.text || <span className="opacity-40">Texto vazio</span>}</p>
      }
      case 'INPUT': {
        const c = comp.content as InputContent
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium" style={{ color: c.color || alpha(theme.text_color, 0.8) }}>
                {c.label}{c.required && <span style={{ color: theme.accent_color }}> *</span>}
              </p>
              <span className="shrink-0 rounded bg-linear-indigo/90 px-1.5 py-0.5 text-[10px] font-medium text-white font-sans">
                {{ email: 'E-mail', name: 'Nome', phone: 'Telefone', custom: 'Personalizado' }[c.field_name] ?? c.field_name}
              </span>
            </div>
            <div className="px-4 py-3 text-base" style={{ borderRadius: radius(20), backgroundColor: alpha(theme.text_color, 0.04), border: `1px solid ${alpha(theme.text_color, 0.12)}`, color: alpha(theme.text_color, 0.4) }}>
              {c.placeholder || ' '}
            </div>
          </div>
        )
      }
      case 'QUESTION': {
        const c = comp.content as QuestionContent
        return (
          <div className="space-y-3">
            <p className="text-xl font-semibold tracking-tight" style={{ color: c.color || undefined }}>{c.question}</p>
            {(c.options ?? []).map(opt => (
              <div key={opt.id}>
                <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderRadius: radius(20), backgroundColor: alpha(theme.text_color, 0.04), border: `1px solid ${alpha(theme.text_color, 0.12)}` }}>
                  <span className="text-base font-medium">{opt.label}</span>
                  <ArrowRight size={16} aria-hidden style={{ color: theme.accent_color }} />
                </div>
                {destinationChip(opt.next_page_id)}
              </div>
            ))}
          </div>
        )
      }
      case 'BUTTON': {
        const c = comp.content as ButtonContent
        return (
          <div>
            <div className="w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2"
              style={{ borderRadius: theme.border_radius, backgroundColor: c.bg_color || theme.button_color, color: c.text_color || theme.button_text_color }}>
              {c.label} <ArrowRight size={16} aria-hidden />
            </div>
            {c.action === 'submit'
              ? <span className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white font-sans"><CheckCircle2 size={10} aria-hidden /> Envia o lead</span>
              : destinationChip(c.next_page_id)}
          </div>
        )
      }
    }
  }

  const panelOpen = showDesign || !!selectedComponent
  // Página e bloco da mesma cor (ex.: tema Claro): a moldura some, como na página publicada.
  const seamless = !!theme.page_bg_color && theme.page_bg_color.toLowerCase() === theme.bg_color.toLowerCase()
  const fontUrl = googleFontUrl(theme.font_family)

  return (
    <div className="h-[100dvh] flex flex-col bg-linear-bg text-linear-text-primary font-sans">
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}

      {/* ── Barra superior ── */}
      <header className="border-b border-linear-border px-3 sm:px-5 h-14 flex items-center gap-3 bg-linear-surface/80 backdrop-blur-md z-50">
        <button onClick={handleExit} aria-label="Voltar para funis"
          className="flex items-center gap-1.5 h-9 px-2 rounded-md text-sm text-linear-text-secondary hover:text-linear-text-primary hover:bg-linear-surface-hover cursor-pointer transition-colors">
          <ChevronLeft size={16} aria-hidden />
          <span className="hidden sm:inline">Funis</span>
        </button>
        <div className="h-5 w-px bg-linear-border" />
        <input
          value={funnel.name}
          onChange={e => handleRename(e.target.value)}
          onBlur={e => { if (!e.target.value.trim()) handleRename(initialFunnel.name || 'Funil sem nome') }}
          aria-label="Nome do funil"
          className="min-w-0 flex-1 max-w-xs bg-transparent text-sm font-medium px-2 py-1.5 rounded-md outline-none hover:bg-linear-surface-hover focus-visible:bg-linear-surface focus-visible:ring-2 focus-visible:ring-linear-indigo/40 transition-colors"
          placeholder="Nome do funil"
        />

        <div className="hidden md:flex items-center gap-2 ml-auto" role="status" aria-live="polite">
          {saveStatus === 'saving' ? <Loader2 size={13} className="animate-spin text-linear-text-tertiary" aria-hidden />
            : <span className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-red-500'}`} aria-hidden />}
          <span className="text-xs text-linear-text-tertiary">
            {saveStatus === 'saved' ? 'Salvo' : saveStatus === 'saving' ? 'Salvando…' : 'Erro ao salvar'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto md:ml-4">
          <div role="radiogroup" aria-label="Tamanho da pré-visualização" className="hidden sm:flex items-center rounded-md border border-linear-border p-0.5">
            {([['desktop', Monitor, 'Computador'], ['mobile', Smartphone, 'Celular']] as const).map(([d, Icon, label]) => (
              <button key={d} role="radio" aria-checked={device === d} aria-label={label} title={label} onClick={() => setDevice(d)}
                className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-colors ${device === d ? 'bg-linear-surface-elevated text-linear-text-primary' : 'text-linear-text-tertiary hover:text-linear-text-primary'}`}>
                <Icon size={15} />
              </button>
            ))}
          </div>
          <button onClick={handlePreview} title="Abrir pré-visualização em nova aba"
            className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-linear-border text-xs font-medium text-linear-text-secondary hover:text-linear-text-primary hover:bg-linear-surface-hover cursor-pointer transition-colors">
            <Eye size={14} aria-hidden /> <span className="hidden sm:inline">Visualizar</span>
          </button>
          <button onClick={handlePublishClick} disabled={publishing}
            className={`flex items-center gap-1.5 h-9 px-4 rounded-md text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait ${
              funnel.status === 'published'
                ? 'border border-emerald-500/40 text-emerald-400 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5'
                : 'bg-linear-indigo text-white hover:brightness-110'}`}>
            {publishing ? <Loader2 size={14} className="animate-spin" aria-hidden /> : funnel.status === 'published' ? <Globe size={14} aria-hidden /> : null}
            {funnel.status === 'published' ? 'Publicado' : 'Publicar'}
          </button>
        </div>
      </header>

      {/* ── Etapas ── */}
      <nav aria-label="Etapas do funil" className="border-b border-linear-border px-3 sm:px-5 py-2 bg-linear-surface/40 flex items-center gap-2 overflow-x-auto">
        {pages.map((page, i) => {
          const active = activePageId === page.id
          return (
            <div key={page.id} className={`group flex items-center shrink-0 rounded-md border transition-colors ${active ? 'border-linear-indigo/60 bg-linear-indigo/10' : 'border-linear-border hover:border-linear-border-strong'}`}>
              {renamingPageId === page.id ? (
                <input
                  autoFocus
                  defaultValue={page.name}
                  aria-label={`Nome da etapa ${i + 1}`}
                  onBlur={e => handleRenamePage(page.id, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                    if (e.key === 'Escape') setRenamingPageId(null)
                  }}
                  className="h-8 w-36 bg-transparent px-2.5 text-xs outline-none"
                />
              ) : (
                <button
                  onClick={() => { setActivePageId(page.id); setSelectedComponentId(null) }}
                  onDoubleClick={() => setRenamingPageId(page.id)}
                  aria-current={active ? 'step' : undefined}
                  title="Clique duplo para renomear"
                  className={`h-8 pl-2.5 pr-2 flex items-center gap-1.5 text-xs font-medium whitespace-nowrap cursor-pointer ${active ? 'text-linear-text-primary' : 'text-linear-text-secondary hover:text-linear-text-primary'}`}
                >
                  <span className="tabular-nums text-linear-text-tertiary">{i + 1}</span>
                  {page.name}
                  {page.components.length > 0 && isDeadEnd(page) && i < pages.length - 1 && (
                    <AlertTriangle size={12} className="text-amber-400" aria-label="Etapa sem botão ou pergunta" />
                  )}
                </button>
              )}
              {active && renamingPageId !== page.id && pages.length > 1 && (
                <button onClick={() => setConfirmDeletePageId(page.id)} aria-label={`Excluir etapa ${page.name}`} title="Excluir etapa"
                  className="w-7 h-8 flex items-center justify-center text-linear-text-tertiary hover:text-red-400 cursor-pointer transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>
          )
        })}
        <button onClick={handleAddPage} aria-label="Adicionar etapa"
          className="shrink-0 h-8 px-2.5 flex items-center gap-1 rounded-md border border-dashed border-linear-border text-xs text-linear-text-secondary hover:text-linear-indigo hover:border-linear-indigo/60 cursor-pointer transition-colors">
          <Plus size={13} aria-hidden /> Etapa
        </button>
      </nav>

      {/* ── Área principal ── */}
      <div className="flex-1 flex overflow-hidden relative">
        <main
          className="flex-1 overflow-y-auto relative transition-colors duration-300"
          style={theme.page_bg_color
            // Fundo da página definido: o canvas mostra essa cor, como na página publicada.
            ? { backgroundColor: theme.page_bg_color }
            : { backgroundColor: '#0A0A0B', backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '24px 24px' }}
          onClick={() => setSelectedComponentId(null)}
        >
          <div className="px-4 pt-8 pb-40 flex justify-center">
            <div
              data-funnel-font
              className={`w-full transition-[max-width] duration-300 ${seamless ? '' : 'shadow-2xl shadow-black/50'}`}
              style={{
                maxWidth: mobile ? 390 : 640,
                backgroundColor: theme.bg_color,
                color: theme.text_color,
                ['--funnel-font' as string]: theme.font_family,
                borderRadius: mobile ? 32 : 16,
                border: seamless ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="px-5 sm:px-8 pt-6 pb-10">
                {/* Progresso, como na página publicada */}
                <div className="flex items-center gap-3 mb-8" aria-hidden>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: alpha(theme.text_color, 0.1) }}>
                    <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${((activeIndex + 1) / Math.max(pages.length, 1)) * 100}%`, backgroundColor: theme.accent_color }} />
                  </div>
                  <span className="text-xs tabular-nums" style={{ color: alpha(theme.text_color, 0.6) }}>{activeIndex + 1}/{pages.length}</span>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId={`page-${activePageId}`}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col min-h-[320px]">
                        {(activePage?.components ?? []).map((comp, index) => {
                          const selected = selectedComponentId === comp.id
                          return (
                            <Draggable key={comp.id} draggableId={comp.id} index={index}>
                              {(drag, snapshot) => (
                                <div
                                  ref={drag.innerRef}
                                  {...drag.draggableProps}
                                  onClick={e => { e.stopPropagation(); setSelectedComponentId(comp.id); setShowDesign(false) }}
                                  onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) { setSelectedComponentId(comp.id); setShowDesign(false) } }}
                                  tabIndex={0}
                                  role="button"
                                  aria-pressed={selected}
                                  aria-label={`${COMPONENT_PALETTE.find(p => p.type === comp.type)?.label} ${index + 1}`}
                                  className={`group relative -mx-3 mb-3 px-3 py-3 rounded-xl cursor-pointer outline-none transition-[box-shadow,background-color] duration-150 ${
                                    snapshot.isDragging ? 'ring-2 ring-linear-indigo bg-black/20'
                                      : selected ? 'ring-2 ring-linear-indigo'
                                      : 'hover:ring-1 hover:ring-linear-indigo/50 focus-visible:ring-2 focus-visible:ring-linear-indigo/70'}`}
                                >
                                  <div
                                    {...drag.dragHandleProps}
                                    aria-label="Arrastar para reordenar"
                                    className={`absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2 w-6 h-9 z-10 flex items-center justify-center rounded-md bg-linear-surface border border-linear-border text-linear-text-secondary cursor-grab active:cursor-grabbing transition-opacity ${selected || snapshot.isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
                                  >
                                    <GripVertical size={14} />
                                  </div>
                                  {selected && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 z-20" onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                                      <button type="button" onClick={e => { e.stopPropagation(); handleDuplicateComponent(comp) }} aria-label="Duplicar" title="Duplicar (Ctrl+D)"
                                        className="w-8 h-8 rounded-md bg-linear-surface border border-linear-border text-linear-text-secondary hover:text-linear-text-primary flex items-center justify-center cursor-pointer shadow">
                                        <Copy size={12} />
                                      </button>
                                      <button type="button" onClick={e => { e.stopPropagation(); handleDeleteComponent(comp) }} aria-label="Excluir" title="Excluir (Delete)"
                                        className="w-8 h-8 rounded-md bg-red-500 text-white hover:bg-red-600 flex items-center justify-center cursor-pointer shadow">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                  {renderComponentPreview(comp)}
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}

                        {(activePage?.components ?? []).length === 0 && (
                          <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed py-12 px-4"
                            style={{ borderColor: alpha(theme.text_color, 0.15) }} onClick={e => e.stopPropagation()}>
                            <p className="text-sm font-medium mb-1">Etapa vazia</p>
                            <p className="text-xs mb-5" style={{ color: alpha(theme.text_color, 0.6) }}>Comece adicionando um componente</p>
                            <div className="flex flex-wrap justify-center gap-2 font-sans">
                              {COMPONENT_PALETTE.map(item => (
                                <button key={item.type} onClick={() => handleAddComponent(item.type)} disabled={busy}
                                  className="flex items-center gap-1.5 h-9 px-3 rounded-md bg-linear-surface border border-linear-border text-xs text-linear-text-secondary hover:text-linear-text-primary hover:border-linear-indigo/60 cursor-pointer transition-colors disabled:opacity-50">
                                  <item.icon size={14} aria-hidden /> {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>
          </div>
        </main>

        {/* Dock — centralizado no canvas */}
        <div className="absolute bottom-6 left-0 right-0 lg:right-80 flex justify-center z-40 pointer-events-none">
          <div className="pointer-events-auto">
            <FloatingDock items={[
              ...COMPONENT_PALETTE.map(item => ({
                title: `Adicionar ${item.label.toLowerCase()}`,
                icon: <item.icon className="h-full w-full" />,
                onClick: () => { if (!busy) handleAddComponent(item.type) },
              })),
              { title: 'Design', icon: <Palette className="h-full w-full" />, onClick: () => { setSelectedComponentId(null); setShowDesign(true) } },
              { title: 'Assistente', icon: <Sparkles className="h-full w-full" />, onClick: () => setShowAIChat(true) },
            ]} />
          </div>
        </div>

        {/* Painel lateral: fixo no desktop, gaveta sobreposta em telas menores */}
        {panelOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-[65]" onClick={() => { setSelectedComponentId(null); setShowDesign(false) }} aria-hidden />}
        <aside
          aria-label="Propriedades"
          className={`bg-linear-surface border-l border-linear-border overflow-y-auto
            fixed inset-y-0 right-0 z-[70] w-full max-w-sm transition-transform duration-300
            ${panelOpen ? 'translate-x-0' : 'translate-x-full'}
            lg:static lg:z-auto lg:w-80 lg:max-w-none lg:translate-x-0 lg:bg-linear-surface/30`}
        >
          {showDesign ? (
            <ThemeEditor theme={funnel.theme} onUpdate={handleUpdateTheme} onClose={() => setShowDesign(false)} />
          ) : selectedComponent ? (
            <PropertyEditor
              key={selectedComponent.id}
              component={selectedComponent}
              pages={pages}
              activePageId={activePageId}
              onUpdate={content => handleUpdateComponent(selectedComponent.id, content)}
              onDuplicate={() => handleDuplicateComponent(selectedComponent)}
              onDelete={() => handleDeleteComponent(selectedComponent)}
              theme={theme}
            />
          ) : (
            <div className="h-full flex flex-col p-6">
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 rounded-full bg-linear-surface-elevated flex items-center justify-center mb-4 text-linear-text-tertiary border border-linear-border">
                  <MousePointer2 size={18} aria-hidden />
                </div>
                <p className="text-sm font-medium text-linear-text-secondary">Nenhum componente selecionado</p>
                <p className="text-xs text-linear-text-tertiary mt-2 leading-relaxed max-w-[220px]">
                  Clique em um componente na pré-visualização para editar, ou abra o Design para mudar cores e fontes.
                </p>
                <button onClick={() => setShowDesign(true)}
                  className="mt-5 flex items-center gap-2 h-9 px-3 rounded-md border border-linear-border text-xs text-linear-text-secondary hover:text-linear-text-primary hover:border-linear-indigo/60 cursor-pointer transition-colors">
                  <Palette size={14} aria-hidden /> Abrir design
                </button>
              </div>
              <dl className="text-[11px] text-linear-text-tertiary space-y-1.5 border-t border-linear-border pt-4">
                <div className="flex justify-between"><dt>Desselecionar</dt><dd><kbd className="font-mono">Esc</kbd></dd></div>
                <div className="flex justify-between"><dt>Excluir componente</dt><dd><kbd className="font-mono">Delete</kbd></dd></div>
                <div className="flex justify-between"><dt>Duplicar componente</dt><dd><kbd className="font-mono">Ctrl+D</kbd></dd></div>
                <div className="flex justify-between"><dt>Renomear etapa</dt><dd>clique duplo</dd></div>
              </dl>
            </div>
          )}
        </aside>
      </div>

      {/* Assistente */}
      <AnimatePresence>
        {showAIChat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAIChat(false)}>
            <motion.div initial={{ scale: 0.97 }} animate={{ scale: 1 }} exit={{ scale: 0.97 }}
              role="dialog" aria-modal="true" aria-label="Assistente do funil"
              className="relative w-full max-w-4xl h-[80vh] bg-linear-surface border border-linear-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowAIChat(false)} aria-label="Fechar assistente"
                className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors z-[110]">
                <X size={20} />
              </button>
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-linear-indigo" /></div>}>
                  <AnimatedAIChat onSend={handleAIChatSend} />
                </Suspense>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checagens antes de publicar */}
      <Modal open={!!publishIssues} onClose={() => setPublishIssues(null)} tone="warning" title="Revise antes de publicar">
        <ul className="text-sm text-linear-text-secondary text-left space-y-2 mb-6">
          {publishIssues?.map(issue => (
            <li key={issue} className="flex gap-2"><AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" aria-hidden />{issue}</li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row-reverse gap-2">
          <button onClick={() => doPublish('published')} className="flex-1 h-11 rounded-lg bg-linear-indigo text-white text-sm font-semibold hover:brightness-110 cursor-pointer transition">Publicar mesmo assim</button>
          <button onClick={() => setPublishIssues(null)} className="flex-1 h-11 rounded-lg border border-linear-border text-sm font-medium text-linear-text-secondary hover:bg-linear-surface-hover cursor-pointer transition-colors">Voltar e corrigir</button>
        </div>
      </Modal>

      {/* Excluir etapa */}
      <Modal open={!!confirmDeletePageId} onClose={() => setConfirmDeletePageId(null)} tone="danger" title="Excluir etapa?">
        <p className="text-sm text-linear-text-tertiary mb-6">
          A etapa “{pages.find(p => p.id === confirmDeletePageId)?.name}” e todos os seus componentes serão removidos. Botões e opções que apontam para ela passam a seguir para a próxima etapa.
        </p>
        <div className="flex flex-col sm:flex-row-reverse gap-2">
          <button onClick={() => confirmDeletePageId && handleDeletePage(confirmDeletePageId)} disabled={deletingPage}
            className="flex-1 h-11 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 cursor-pointer transition-colors disabled:opacity-50">
            {deletingPage ? 'Excluindo…' : 'Excluir etapa'}
          </button>
          <button onClick={() => setConfirmDeletePageId(null)} className="flex-1 h-11 rounded-lg border border-linear-border text-sm font-medium text-linear-text-secondary hover:bg-linear-surface-hover cursor-pointer transition-colors">Cancelar</button>
        </div>
      </Modal>
    </div>
  )
}

function Modal({ open, onClose, title, tone, children }: {
  open: boolean; onClose: () => void; title: string; tone: 'warning' | 'danger'; children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]" />
          <motion.div
            role="alertdialog" aria-modal="true" aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-md bg-linear-surface border border-linear-border rounded-2xl z-[301] shadow-2xl p-6"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${tone === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-400'}`}>
              <AlertTriangle size={22} aria-hidden />
            </div>
            <h2 id="modal-title" className="text-lg font-semibold text-linear-text-primary tracking-tight mb-2">{title}</h2>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
