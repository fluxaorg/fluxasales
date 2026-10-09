'use client'

import { useState, useEffect, useMemo } from 'react'
import Script from 'next/script'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { Funnel, FunnelPage, FunnelComponent, InputContent, QuestionContent, ButtonContent, HeadingContent, TextContent } from '@/types'
import { resolveTheme, googleFontUrl, alpha, inputAnswerKey, isLight } from '@/lib/funnel-theme'

interface FunnelRendererProps {
  funnel: Funnel
  pages: FunnelPage[]
  metaPixelId?: string | null
  /** Rascunho aberto pelo dono: navega normalmente, mas não grava lead. */
  isDraft?: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateInput(c: InputContent, value: string): string | null {
  const v = value.trim()
  if (!v) return c.required ? 'Campo obrigatório' : null
  if (c.field_name === 'email' && !EMAIL_RE.test(v)) return 'Digite um e-mail válido'
  if (c.field_name === 'phone' && v.replace(/\D/g, '').length < 8) return 'Digite um telefone válido'
  return null
}

export default function FunnelRenderer({ funnel, pages, metaPixelId, isDraft = false }: FunnelRendererProps) {
  const theme = resolveTheme(funnel.theme)
  const reduceMotion = useReducedMotion()
  const pixelId = metaPixelId?.replace(/\D/g, '') || null

  const [currentPageId, setCurrentPageId] = useState(pages[0]?.id ?? '')
  const [history, setHistory] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [direction, setDirection] = useState(1)

  const currentIndex = Math.max(0, pages.findIndex(p => p.id === currentPageId))
  const currentPage = pages[currentIndex]
  const components = currentPage?.components ?? []

  useEffect(() => {
    if (isFinished && pixelId && !isDraft) {
      const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq
      fbq?.('track', 'Lead')
    }
  }, [isFinished, pixelId, isDraft])

  const fontUrl = googleFontUrl(theme.font_family)

  // Valida os campos da etapa atual antes de avançar ou enviar.
  const validateCurrentPage = () => {
    const next: Record<string, string> = {}
    for (const comp of components) {
      if (comp.type !== 'INPUT') continue
      const c = comp.content as InputContent
      const err = validateInput(c, answers[inputAnswerKey(c)] ?? '')
      if (err) next[comp.id] = err
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (extra: Record<string, string> = {}) => {
    const allAnswers = { ...answers, ...extra }
    if (isDraft) {
      toast('Modo rascunho: o lead não foi salvo. Publique o funil para capturar leads.', { icon: 'ℹ️' })
      setIsFinished(true)
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnel_id: funnel.id,
          answers: allAnswers,
          source: document.referrer || 'direct',
        }),
      })
      if (res.status === 429) throw new Error('Muitas tentativas. Aguarde um minuto e tente novamente.')
      if (!res.ok) throw new Error('Não foi possível enviar suas respostas. Tente novamente.')
      setIsFinished(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro de conexão.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Avança para a etapa indicada, para a próxima na ordem, ou envia se for a última.
  const goNext = (nextPageId: string | null | undefined, extra: Record<string, string> = {}) => {
    const target = (nextPageId && pages.some(p => p.id === nextPageId))
      ? nextPageId
      : pages[currentIndex + 1]?.id
    if (!target) {
      handleSubmit(extra)
      return
    }
    setDirection(1)
    setErrors({})
    setHistory(h => [...h, currentPageId])
    setCurrentPageId(target)
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  const goBack = () => {
    if (history.length === 0) return
    setDirection(-1)
    setErrors({})
    setCurrentPageId(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
  }

  const handleButton = (c: ButtonContent) => {
    if (!validateCurrentPage()) return
    if (c.action === 'submit') handleSubmit()
    else goNext(c.next_page_id)
  }

  const handleOption = (c: QuestionContent, opt: QuestionContent['options'][number]) => {
    if (!validateCurrentPage()) return
    const extra = { [c.question]: opt.label }
    setAnswers(prev => ({ ...prev, ...extra }))
    goNext(opt.next_page_id, extra)
  }

  const variants = useMemo(() => {
    if (reduceMotion || theme.animation_type === 'none') {
      return { enter: { opacity: 1 }, center: { opacity: 1 }, exit: { opacity: 1 } }
    }
    const offset = (d: number) => (theme.animation_type === 'slide' || theme.animation_type === 'blur' ? d * 60 : 0)
    return {
      enter: (d: number) => ({
        opacity: 0,
        x: offset(d),
        y: theme.animation_type === 'bounce' ? 24 : 0,
        filter: theme.animation_type === 'blur' ? 'blur(8px)' : 'blur(0px)',
      }),
      center: { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' },
      exit: (d: number) => ({
        opacity: 0,
        x: -offset(d),
        filter: theme.animation_type === 'blur' ? 'blur(8px)' : 'blur(0px)',
      }),
    }
  }, [reduceMotion, theme.animation_type])

  const transition = theme.animation_type === 'bounce'
    ? { type: 'spring' as const, stiffness: 260, damping: 18 }
    : { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }

  const surface = alpha(theme.text_color, 0.04)
  const surfaceHover = alpha(theme.text_color, 0.08)
  const border = alpha(theme.text_color, 0.12)

  const renderComponent = (comp: FunnelComponent) => {
    switch (comp.type) {
      case 'HEADING': {
        const c = comp.content as HeadingContent
        const Tag = (['h1', 'h2', 'h3'].includes(c.size) ? c.size : 'h2') as 'h1' | 'h2' | 'h3'
        const size = c.size === 'h1' ? 'text-4xl sm:text-6xl' : c.size === 'h3' ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'
        return <Tag className={`${size} font-bold tracking-tight leading-[1.1] text-balance`} style={{ color: c.color || undefined }}>{c.text}</Tag>
      }
      case 'TEXT': {
        const c = comp.content as TextContent
        return <p className="text-lg sm:text-xl leading-relaxed whitespace-pre-line" style={{ color: c.color || alpha(theme.text_color, 0.75) }}>{c.text}</p>
      }
      case 'INPUT': {
        const c = comp.content as InputContent
        const key = inputAnswerKey(c)
        const error = errors[comp.id]
        const id = `field-${comp.id}`
        return (
          <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium" style={{ color: c.color || alpha(theme.text_color, 0.8) }}>
              {c.label}{c.required && <span aria-hidden style={{ color: theme.accent_color }}> *</span>}
            </label>
            <input
              id={id}
              type={c.field_name === 'email' ? 'email' : c.field_name === 'phone' ? 'tel' : 'text'}
              inputMode={c.field_name === 'phone' ? 'tel' : c.field_name === 'email' ? 'email' : undefined}
              autoComplete={c.field_name === 'email' ? 'email' : c.field_name === 'name' ? 'name' : c.field_name === 'phone' ? 'tel' : 'off'}
              placeholder={c.placeholder}
              required={c.required}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              value={answers[key] ?? ''}
              onChange={e => {
                setAnswers(prev => ({ ...prev, [key]: e.target.value }))
                if (error) setErrors(prev => { const n = { ...prev }; delete n[comp.id]; return n })
              }}
              onKeyDown={e => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                const btn = components.find(x => x.type === 'BUTTON')
                if (btn) handleButton(btn.content as ButtonContent)
              }}
              className="w-full px-5 py-4 text-base sm:text-lg outline-none transition-[border-color,box-shadow] duration-200 placeholder:opacity-40"
              style={{
                borderRadius: `min(${theme.border_radius}, 20px)`,
                color: theme.text_color,
                backgroundColor: surface,
                border: `1px solid ${error ? '#F87171' : border}`,
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px ${alpha(theme.accent_color, 0.35)}` }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
            />
            {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-400">{error}</p>}
          </div>
        )
      }
      case 'QUESTION': {
        const c = comp.content as QuestionContent
        return (
          <fieldset className="space-y-4">
            <legend className="text-xl sm:text-2xl font-semibold tracking-tight mb-4" style={{ color: c.color || undefined }}>{c.question}</legend>
            <div className="grid grid-cols-1 gap-3">
              {(c.options ?? []).map(opt => {
                const selected = answers[c.question] === opt.label
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleOption(c, opt)}
                    className="group min-h-[56px] px-5 py-4 text-left flex justify-between items-center gap-4 cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
                    style={{
                      borderRadius: `min(${theme.border_radius}, 20px)`,
                      backgroundColor: selected ? alpha(theme.accent_color, 0.15) : surface,
                      border: `1px solid ${selected ? theme.accent_color : border}`,
                      ['--tw-ring-color' as string]: theme.accent_color,
                    }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.backgroundColor = surfaceHover }}
                    onMouseLeave={e => { if (!selected) e.currentTarget.style.backgroundColor = surface }}
                  >
                    <span className="text-base sm:text-lg font-medium">{opt.label}</span>
                    <ArrowRight size={20} aria-hidden className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: theme.accent_color }} />
                  </button>
                )
              })}
            </div>
          </fieldset>
        )
      }
      case 'BUTTON': {
        const c = comp.content as ButtonContent
        return (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleButton(c)}
            className="w-full min-h-[56px] py-4 px-6 text-lg font-semibold flex items-center justify-center gap-3 cursor-pointer transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-wait"
            style={{
              borderRadius: theme.border_radius,
              backgroundColor: c.bg_color || theme.button_color,
              color: c.text_color || theme.button_text_color,
              ['--tw-ring-color' as string]: theme.accent_color,
              ['--tw-ring-offset-color' as string]: theme.bg_color,
            }}
          >
            {isSubmitting ? <Loader2 size={22} className="animate-spin" aria-label="Enviando" /> : <>{c.label}<ArrowRight size={20} aria-hidden /></>}
          </button>
        )
      }
    }
  }

  // Com fundo da página definido, o conteúdo vira um bloco (bg_color) sobre essa camada.
  const hasPageBg = !!theme.page_bg_color
  // Bloco da mesma cor da página (ex.: tema Claro): sem sombra nem borda, tudo contínuo.
  const seamless = hasPageBg && theme.page_bg_color!.toLowerCase() === theme.bg_color.toLowerCase()
  const pageColor = theme.page_bg_color || theme.bg_color
  const cardRadius = theme.border_radius === '999px' ? '32px' : `min(${theme.border_radius}, 32px)`
  const asCard = hasPageBg && !seamless
  const cardStyle: React.CSSProperties | undefined = asCard
    ? { backgroundColor: theme.bg_color, borderRadius: cardRadius, border: `1px solid ${alpha(theme.text_color, 0.08)}`, boxShadow: '0 24px 64px -24px rgba(0,0,0,0.35)' }
    : undefined

  const shell = (children: React.ReactNode) => (
    <div
      className="min-h-[100dvh] flex flex-col items-center px-4 sm:px-6 relative overflow-x-hidden"
      data-funnel-font
      style={{ backgroundColor: pageColor, color: theme.text_color, ['--funnel-font' as string]: theme.font_family }}
    >
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}
      {pixelId && !isDraft && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      )}
      {/* Brilho de destaque só em fundos escuros; em fundos claros ele "suja" o branco. */}
      {!isLight(pageColor) && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full blur-[120px] opacity-20" style={{ backgroundColor: theme.accent_color }} />
          <div className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] rounded-full blur-[140px] opacity-10" style={{ backgroundColor: theme.accent_color }} />
        </div>
      )}
      {isDraft && (
        <div className="relative z-20 mt-4 rounded-full px-4 py-1.5 text-xs font-medium" style={{ backgroundColor: alpha(theme.accent_color, 0.15), color: theme.text_color, border: `1px solid ${alpha(theme.accent_color, 0.4)}` }}>
          Pré-visualização de rascunho — leads não são salvos
        </div>
      )}
      {children}
    </div>
  )

  if (pages.length === 0 || !currentPage) {
    return shell(
      <div className="relative z-10 flex-1 flex items-center justify-center text-center">
        <p style={{ color: alpha(theme.text_color, 0.6) }}>Este funil ainda não tem conteúdo.</p>
      </div>
    )
  }

  if (isFinished) {
    return shell(
      <div className="relative z-10 flex-1 flex items-center justify-center py-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="max-w-md w-full p-10 text-center"
          style={{ borderRadius: cardRadius, backgroundColor: seamless ? 'transparent' : hasPageBg ? theme.bg_color : surface, border: seamless ? 'none' : `1px solid ${border}` }}
        >
          <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: alpha(theme.accent_color, 0.15), color: theme.accent_color }}>
            <CheckCircle2 size={44} aria-hidden />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-3">Tudo certo!</h2>
          <p className="text-base leading-relaxed" style={{ color: alpha(theme.text_color, 0.7) }}>
            Recebemos suas respostas. Em breve entraremos em contato.
          </p>
        </motion.div>
      </div>
    )
  }

  return shell(
    <div className={`relative z-10 w-full max-w-xl flex-1 flex flex-col ${asCard ? 'justify-center py-6 sm:py-12' : 'py-8 sm:py-12'}`}>
      <div className={asCard ? 'flex flex-col p-6 sm:p-10' : 'flex-1 flex flex-col'} style={cardStyle}>
      {/* Progresso */}
      <div className="flex items-center gap-3 mb-10 sm:mb-16">
        <div
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: alpha(theme.text_color, 0.1) }}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={pages.length}
          aria-valuenow={currentIndex + 1}
          aria-label={`Etapa ${currentIndex + 1} de ${pages.length}`}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: theme.accent_color }}
            initial={false}
            animate={{ width: `${((currentIndex + 1) / pages.length) * 100}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <span className="text-xs tabular-nums" style={{ color: alpha(theme.text_color, 0.6) }}>{currentIndex + 1}/{pages.length}</span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPageId}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="w-full space-y-8"
          >
            {components.map(comp => <div key={comp.id}>{renderComponent(comp)}</div>)}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-12 pt-6 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${alpha(theme.text_color, 0.08)}`, color: alpha(theme.text_color, 0.55) }}>
        {history.length > 0 ? (
          <button type="button" onClick={goBack} className="flex items-center gap-2 min-h-[44px] pr-3 cursor-pointer hover:opacity-100 transition-opacity">
            <ArrowLeft size={14} aria-hidden /> Voltar
          </button>
        ) : <span />}
        <span>Feito com Fluxa</span>
      </div>
      </div>
    </div>
  )
}
