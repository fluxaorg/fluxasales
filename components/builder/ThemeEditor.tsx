'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { FunnelTheme } from '@/types'
import { Palette, Type, Layout, Zap, AlertTriangle, X } from 'lucide-react'
import { resolveTheme, FONT_OPTIONS, THEME_PRESETS, contrastRatio, isHex, googleFontUrl } from '@/lib/funnel-theme'

interface ThemeEditorProps {
  theme: Partial<FunnelTheme> | null | undefined
  onUpdate: (theme: FunnelTheme) => void
  onClose: () => void
}

function Section({ icon: Icon, title, children }: { icon: typeof Palette; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-medium text-linear-text-secondary">
        <Icon size={14} aria-hidden className="text-linear-text-tertiary" /> {title}
      </h3>
      {children}
    </section>
  )
}

export function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const valid = isHex(draft)
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-linear-surface border border-linear-border">
      <span className="relative w-9 h-9 shrink-0 rounded-md border border-linear-border overflow-hidden cursor-pointer" style={{ backgroundColor: value }}>
        <input type="color" aria-label={`Escolher cor: ${label}`} value={isHex(value) && value.length === 7 ? value : '#000000'} onChange={e => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        <label htmlFor={id} className="text-[11px] text-linear-text-tertiary">{label}</label>
        <input
          id={id}
          value={draft}
          onChange={e => {
            const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
            setDraft(v)
            if (isHex(v)) onChange(v)
          }}
          aria-invalid={!valid}
          spellCheck={false}
          className={`bg-transparent text-sm font-mono uppercase outline-none ${valid ? 'text-linear-text-primary' : 'text-red-400'}`}
        />
      </div>
    </div>
  )
}

export function ContrastWarning({ a, b, what }: { a: string; b: string; what: string }) {
  const ratio = contrastRatio(a, b)
  if (ratio === null || ratio >= 4.5) return null
  return (
    <p className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-2">
      <AlertTriangle size={13} aria-hidden className="shrink-0 mt-px" />
      Contraste baixo entre {what} ({ratio.toFixed(1)}:1). O recomendado é pelo menos 4.5:1 para leitura confortável.
    </p>
  )
}

export default function ThemeEditor({ theme, onUpdate, onClose }: ThemeEditorProps) {
  const [local, setLocal] = useState<FunnelTheme>(() => resolveTheme(theme))
  const timer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { setLocal(resolveTheme(theme)) }, [theme])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const update = (patch: Partial<FunnelTheme>) => {
    const next = { ...local, ...patch }
    setLocal(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onUpdate(next), 250)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Pré-carrega as fontes para a amostra dos botões */}
      {FONT_OPTIONS.map(f => <link key={f.value} rel="stylesheet" href={googleFontUrl(f.value)!} />)}

      <div className="px-5 py-4 border-b border-linear-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-linear-indigo/10 border border-linear-indigo/20 flex items-center justify-center text-linear-indigo">
          <Palette size={16} aria-hidden />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-linear-text-primary">Design do funil</p>
          <p className="text-[11px] text-linear-text-tertiary">Vale para todas as etapas</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar design"
          className="w-9 h-9 rounded-md flex items-center justify-center text-linear-text-tertiary hover:text-linear-text-primary hover:bg-linear-surface-hover cursor-pointer transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-5 space-y-7 overflow-y-auto">
        <Section icon={Zap} title="Temas prontos">
          <div className="grid grid-cols-3 gap-2">
            {THEME_PRESETS.map(p => {
              const active = local.bg_color.toLowerCase() === p.theme.bg_color!.toLowerCase() && local.button_color.toLowerCase() === p.theme.button_color!.toLowerCase()
              return (
                <button key={p.name} type="button" onClick={() => update(p.theme)} aria-pressed={active}
                  className={`group rounded-lg border p-1.5 cursor-pointer transition-colors ${active ? 'border-linear-indigo ring-1 ring-linear-indigo' : 'border-linear-border hover:border-linear-indigo/50'}`}>
                  <span className="flex h-10 items-end gap-1 rounded-md p-1.5" style={{ backgroundColor: p.theme.bg_color }}>
                    <span className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: p.theme.text_color, opacity: 0.8 }} />
                    <span className="h-3 w-4 rounded-sm" style={{ backgroundColor: p.theme.button_color }} />
                  </span>
                  <span className="block mt-1.5 text-[11px] text-linear-text-secondary">{p.name}</span>
                </button>
              )
            })}
          </div>
        </Section>

        <Section icon={Palette} title="Cores">
          <ColorInput label="Fundo do conteúdo" value={local.bg_color} onChange={v => update({ bg_color: v })} />
          <ColorInput label="Texto" value={local.text_color} onChange={v => update({ text_color: v })} />
          <ContrastWarning a={local.text_color} b={local.bg_color} what="texto e fundo do conteúdo" />
          <ColorInput label="Destaque" value={local.accent_color} onChange={v => update({ accent_color: v })} />
          <ColorInput label="Botão" value={local.button_color} onChange={v => update({ button_color: v })} />
          <ColorInput label="Texto do botão" value={local.button_text_color} onChange={v => update({ button_text_color: v })} />
          <ContrastWarning a={local.button_text_color} b={local.button_color} what="botão e seu texto" />
        </Section>

        <Section icon={Layout} title="Fundo da página">
          <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-linear-surface border border-linear-border cursor-pointer">
            <span>
              <span className="block text-sm text-linear-text-primary">Cor própria para o fundo</span>
              <span className="block text-[11px] text-linear-text-tertiary leading-relaxed">
                {local.page_bg_color ? 'O conteúdo fica num bloco sobre esta cor.' : 'Desligado: o fundo do conteúdo ocupa a página toda.'}
              </span>
            </span>
            <button type="button" role="switch" aria-checked={!!local.page_bg_color}
              onClick={() => update({ page_bg_color: local.page_bg_color ? null : '#E7E5E4' })}
              className={`relative w-10 h-6 shrink-0 rounded-full cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-linear-indigo/50 ${local.page_bg_color ? 'bg-linear-indigo' : 'bg-linear-surface-hover border border-linear-border'}`}>
              <span className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow transition-[left] duration-200 ${local.page_bg_color ? 'left-[20px]' : 'left-[3px]'}`} />
            </button>
          </label>
          {local.page_bg_color && (
            <ColorInput label="Fundo da página" value={local.page_bg_color} onChange={v => update({ page_bg_color: v })} />
          )}
        </Section>

        <Section icon={Layout} title="Arredondamento">
          <div role="radiogroup" aria-label="Arredondamento dos cantos" className="grid grid-cols-4 gap-1.5">
            {[['0px', 'Reto'], ['12px', 'Suave'], ['24px', 'Médio'], ['999px', 'Pílula']].map(([r, l]) => (
              <button key={r} type="button" role="radio" aria-checked={local.border_radius === r} onClick={() => update({ border_radius: r })}
                className={`flex flex-col items-center gap-1.5 py-2.5 text-[11px] rounded-md border cursor-pointer transition-colors ${local.border_radius === r ? 'bg-linear-indigo/10 text-linear-text-primary border-linear-indigo' : 'bg-linear-surface border-linear-border text-linear-text-secondary hover:border-linear-indigo/50'}`}>
                <span className="w-6 h-4 border-2 border-current" style={{ borderRadius: r === '999px' ? 999 : parseInt(r) / 3 }} />
                {l}
              </button>
            ))}
          </div>
        </Section>

        <Section icon={Type} title="Fonte">
          <div role="radiogroup" aria-label="Fonte" className="grid grid-cols-2 gap-1.5">
            {FONT_OPTIONS.map(f => {
              const active = local.font_family.replace(/['"]/g, '').startsWith(f.label)
              return (
                <button key={f.value} type="button" role="radio" aria-checked={active} onClick={() => update({ font_family: f.value })}
                  className={`px-3 py-2.5 text-left text-sm rounded-md border cursor-pointer transition-colors ${active ? 'bg-linear-indigo/10 border-linear-indigo text-linear-text-primary' : 'bg-linear-surface border-linear-border text-linear-text-secondary hover:border-linear-indigo/50'}`}
                  style={{ fontFamily: f.value }}>
                  {f.label}
                </button>
              )
            })}
          </div>
        </Section>

        <Section icon={Zap} title="Transição entre etapas">
          <div role="radiogroup" aria-label="Transição entre etapas" className="grid grid-cols-2 gap-1.5">
            {([
              ['blur', 'Desfoque'],
              ['fade', 'Esmaecer'],
              ['slide', 'Deslizar'],
              ['bounce', 'Salto'],
              ['none', 'Nenhuma'],
            ] as const).map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={local.animation_type === v} onClick={() => update({ animation_type: v })}
                className={`px-3 py-2.5 text-left text-xs rounded-md border cursor-pointer transition-colors ${local.animation_type === v ? 'bg-linear-indigo/10 border-linear-indigo text-linear-text-primary' : 'bg-linear-surface border-linear-border text-linear-text-secondary hover:border-linear-indigo/50'}`}>
                {l}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-linear-text-tertiary">Visitantes com &quot;reduzir movimento&quot; ativado no sistema veem a troca sem animação.</p>
        </Section>
      </div>
    </div>
  )
}
