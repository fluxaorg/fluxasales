'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { FunnelComponent, FunnelPage, FunnelTheme, HeadingContent, TextContent, InputContent, QuestionContent, ButtonContent, ComponentContent } from '@/types'
import { Heading, Type, MousePointer2, HelpCircle, CheckCircle2, Plus, Trash2, ChevronDown, Copy, Palette } from 'lucide-react'
import { ColorInput, ContrastWarning } from './ThemeEditor'

interface PropertyEditorProps {
  component: FunnelComponent
  pages: FunnelPage[]
  activePageId: string
  onUpdate: (content: ComponentContent) => void
  onDuplicate: () => void
  onDelete: () => void
  /** Tema do funil: cor padrão mostrada quando o bloco não tem cor própria. */
  theme: FunnelTheme
}

const TYPE_META: Record<FunnelComponent['type'], { label: string; icon: typeof Heading }> = {
  HEADING:  { label: 'Título',   icon: Heading },
  TEXT:     { label: 'Texto',    icon: Type },
  INPUT:    { label: 'Campo',    icon: MousePointer2 },
  QUESTION: { label: 'Pergunta', icon: HelpCircle },
  BUTTON:   { label: 'Botão',    icon: CheckCircle2 },
}

// Rótulo e placeholder sugeridos por tipo de campo.
const INPUT_DEFAULTS: Record<InputContent['field_name'], { label: string; placeholder: string }> = {
  email:  { label: 'Seu melhor e-mail', placeholder: 'voce@email.com' },
  name:   { label: 'Seu nome',          placeholder: 'Como podemos te chamar?' },
  phone:  { label: 'Seu WhatsApp',      placeholder: '(11) 99999-9999' },
  custom: { label: 'Sua resposta',      placeholder: 'Digite aqui...' },
}
const KNOWN_LABELS = new Set(['', 'email', 'e-mail', ...Object.values(INPUT_DEFAULTS).map(d => d.label.toLowerCase())])
const KNOWN_PLACEHOLDERS = new Set(['', ...Object.values(INPUT_DEFAULTS).map(d => d.placeholder.toLowerCase())])

/** Ao trocar o tipo, troca também rótulo/placeholder — mas só se ainda forem textos padrão, nunca os escritos pelo usuário. */
function inputTypePatch(c: InputContent, field_name: InputContent['field_name']) {
  const d = INPUT_DEFAULTS[field_name]
  return {
    field_name,
    ...(KNOWN_LABELS.has(c.label.trim().toLowerCase()) && { label: d.label }),
    ...(KNOWN_PLACEHOLDERS.has(c.placeholder.trim().toLowerCase()) && { placeholder: d.placeholder }),
  }
}

const fieldClass ='w-full bg-linear-surface border border-linear-border rounded-md px-3 py-2 text-sm text-linear-text-primary placeholder:text-linear-text-quaternary outline-none focus-visible:border-linear-indigo focus-visible:ring-2 focus-visible:ring-linear-indigo/30 transition-[border-color,box-shadow] duration-150'

function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => React.ReactNode }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-linear-text-secondary mb-1.5">{label}</label>
      {children(id)}
      {hint && <p className="text-[11px] text-linear-text-tertiary mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  )
}

function Select({ id, value, onChange, options }: {
  id?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={e => onChange(e.target.value)} className={`${fieldClass} appearance-none pr-8 cursor-pointer`}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} aria-hidden className="absolute right-3 top-1/2 -translate-y-1/2 text-linear-text-tertiary pointer-events-none" />
    </div>
  )
}

/** Cor do bloco com volta para a cor do tema. value null = herda do tema. */
function ColorOverride({ label, value, fallback, onChange }: {
  label: string; value: string | null | undefined; fallback: string; onChange: (v: string | null) => void
}) {
  return (
    <div className="space-y-1.5">
      <ColorInput label={label} value={value || fallback} onChange={onChange} />
      {value ? (
        <button type="button" onClick={() => onChange(null)}
          className="text-[11px] text-linear-text-secondary hover:text-linear-text-primary hover:underline underline-offset-2 cursor-pointer">
          Voltar para a cor do tema
        </button>
      ) : (
        <p className="text-[11px] text-linear-text-tertiary">Usando a cor do tema</p>
      )}
    </div>
  )
}

export default function PropertyEditor({ component, pages, activePageId, onUpdate, onDuplicate, onDelete, theme }: PropertyEditorProps) {
  const [content, setContent] = useState<Record<string, unknown>>(component.content as unknown as Record<string, unknown>)
  const pending = useRef<{ timer: NodeJS.Timeout; next: Record<string, unknown> } | null>(null)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    setContent(component.content as unknown as Record<string, unknown>)
  }, [component.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Ao trocar de componente ou desmontar, envia a edição pendente em vez de perdê-la.
  useEffect(() => () => {
    if (pending.current) {
      clearTimeout(pending.current.timer)
      onUpdateRef.current(pending.current.next as unknown as ComponentContent)
      pending.current = null
    }
  }, [component.id])

  const update = (patch: Record<string, unknown>) => {
    const next = { ...content, ...patch }
    setContent(next)
    if (pending.current) clearTimeout(pending.current.timer)
    pending.current = {
      next,
      timer: setTimeout(() => {
        pending.current = null
        onUpdateRef.current(next as unknown as ComponentContent)
      }, 300),
    }
  }

  // Destinos possíveis: qualquer etapa exceto a atual (evita loop infinito).
  const pageOptions = [
    { value: '', label: 'Próxima etapa (na ordem)' },
    ...pages.filter(p => p.id !== activePageId).map(p => ({ value: p.id, label: `${pages.indexOf(p) + 1}. ${p.name}` })),
  ]

  const meta = TYPE_META[component.type]

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-linear-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-linear-indigo/10 border border-linear-indigo/20 flex items-center justify-center text-linear-indigo">
          <meta.icon size={16} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-linear-text-primary">{meta.label}</p>
          <p className="text-[11px] text-linear-text-tertiary">Propriedades do componente</p>
        </div>
        <button type="button" onClick={onDuplicate} aria-label="Duplicar componente" title="Duplicar (Ctrl+D)"
          className="w-9 h-9 rounded-md flex items-center justify-center text-linear-text-tertiary hover:text-linear-text-primary hover:bg-linear-surface-hover cursor-pointer transition-colors">
          <Copy size={15} />
        </button>
        <button type="button" onClick={onDelete} aria-label="Excluir componente" title="Excluir (Delete)"
          className="w-9 h-9 rounded-md flex items-center justify-center text-linear-text-tertiary hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      <div className="p-5 space-y-5 overflow-y-auto">
        {component.type === 'HEADING' && (() => {
          const c = content as unknown as HeadingContent
          return <>
            <Field label="Texto do título">
              {id => <textarea id={id} rows={3} value={c.text} onChange={e => update({ text: e.target.value })} className={`${fieldClass} resize-none`} />}
            </Field>
            <Field label="Tamanho">
              {id => (
                <div id={id} role="radiogroup" className="grid grid-cols-3 gap-1.5">
                  {([['h1', 'Grande'], ['h2', 'Médio'], ['h3', 'Pequeno']] as const).map(([v, l]) => (
                    <button key={v} type="button" role="radio" aria-checked={c.size === v} onClick={() => update({ size: v })}
                      className={`py-2 text-xs rounded-md border cursor-pointer transition-colors ${c.size === v ? 'bg-linear-indigo text-white border-linear-indigo' : 'bg-linear-surface border-linear-border text-linear-text-secondary hover:border-linear-indigo/50'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </Field>
          </>
        })()}

        {component.type === 'TEXT' && (() => {
          const c = content as unknown as TextContent
          return (
            <Field label="Conteúdo" hint="Quebras de linha são mantidas na página publicada.">
              {id => <textarea id={id} rows={6} value={c.text} onChange={e => update({ text: e.target.value })} className={`${fieldClass} resize-y min-h-[120px]`} />}
            </Field>
          )
        })()}

        {component.type === 'INPUT' && (() => {
          const c = content as unknown as InputContent
          return <>
            <Field label="Tipo de dado" hint={c.field_name === 'custom' ? 'Campos personalizados são salvos com o rótulo como nome.' : 'Nome, e-mail e telefone aparecem como colunas na lista de leads.'}>
              {id => (
                <Select id={id} value={c.field_name} onChange={v => update(inputTypePatch(c, v as InputContent['field_name']))} options={[
                  { value: 'email', label: 'E-mail' },
                  { value: 'name', label: 'Nome' },
                  { value: 'phone', label: 'Telefone' },
                  { value: 'custom', label: 'Personalizado' },
                ]} />
              )}
            </Field>
            <Field label="Rótulo">
              {id => <input id={id} value={c.label} onChange={e => update({ label: e.target.value })} className={fieldClass} />}
            </Field>
            <Field label="Texto de exemplo (placeholder)">
              {id => <input id={id} value={c.placeholder} onChange={e => update({ placeholder: e.target.value })} className={fieldClass} />}
            </Field>
            <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-linear-surface border border-linear-border cursor-pointer">
              <span>
                <span className="block text-sm text-linear-text-primary">Obrigatório</span>
                <span className="block text-[11px] text-linear-text-tertiary">Impede avançar sem preencher</span>
              </span>
              <button type="button" role="switch" aria-checked={c.required} onClick={() => update({ required: !c.required })}
                className={`relative w-10 h-6 shrink-0 rounded-full cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-linear-indigo/50 ${c.required ? 'bg-linear-indigo' : 'bg-linear-surface-hover border border-linear-border'}`}>
                <span className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow transition-[left] duration-200 ${c.required ? 'left-[20px]' : 'left-[3px]'}`} />
              </button>
            </label>
          </>
        })()}

        {component.type === 'QUESTION' && (() => {
          const c = content as unknown as QuestionContent
          const options = c.options ?? []
          return <>
            <Field label="Pergunta">
              {id => <textarea id={id} rows={2} value={c.question} onChange={e => update({ question: e.target.value })} className={`${fieldClass} resize-none`} />}
            </Field>
            <div>
              <p className="text-xs font-medium text-linear-text-secondary mb-1.5">Opções de resposta</p>
              <p className="text-[11px] text-linear-text-tertiary mb-3 leading-relaxed">Ao clicar numa opção o visitante avança. Use o destino para criar caminhos diferentes.</p>
              <div className="space-y-2.5">
                {options.map((opt, i) => (
                  <div key={opt.id} className="p-3 rounded-lg border border-linear-border bg-linear-surface space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] tabular-nums text-linear-text-tertiary w-4">{i + 1}</span>
                      <input
                        aria-label={`Texto da opção ${i + 1}`}
                        value={opt.label}
                        onChange={e => update({ options: options.map((o, j) => j === i ? { ...o, label: e.target.value } : o) })}
                        className="flex-1 bg-transparent text-sm text-linear-text-primary outline-none border-b border-linear-border focus:border-linear-indigo transition-colors pb-1"
                        placeholder={`Opção ${i + 1}`}
                      />
                      <button
                        type="button"
                        disabled={options.length <= 1}
                        onClick={() => update({ options: options.filter((_, j) => j !== i) })}
                        aria-label={`Remover opção ${i + 1}`}
                        title={options.length <= 1 ? 'A pergunta precisa de ao menos 1 opção' : 'Remover opção'}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-linear-text-tertiary hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-linear-text-tertiary"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <Select
                      value={opt.next_page_id ?? ''}
                      onChange={v => update({ options: options.map((o, j) => j === i ? { ...o, next_page_id: v || null } : o) })}
                      options={pageOptions}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => update({ options: [...options, { id: crypto.randomUUID(), label: `Opção ${options.length + 1}`, next_page_id: null }] })}
                  className="w-full min-h-[40px] border border-dashed border-linear-border rounded-lg text-xs font-medium text-linear-text-secondary hover:text-linear-indigo hover:border-linear-indigo/50 cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={14} aria-hidden /> Adicionar opção
                </button>
              </div>
            </div>
          </>
        })()}

        {component.type === 'BUTTON' && (() => {
          const c = content as unknown as ButtonContent
          return <>
            <Field label="Texto do botão">
              {id => <input id={id} value={c.label} onChange={e => update({ label: e.target.value })} className={fieldClass} />}
            </Field>
            <Field label="Ao clicar" hint={c.action === 'submit' ? 'Valida os campos e salva o lead. Use na última etapa.' : 'Na última etapa, o botão também envia o lead.'}>
              {id => (
                <Select id={id} value={c.action} onChange={v => update({ action: v, next_page_id: v === 'submit' ? null : c.next_page_id })} options={[
                  { value: 'next_page', label: 'Ir para outra etapa' },
                  { value: 'submit', label: 'Enviar e capturar lead' },
                ]} />
              )}
            </Field>
            {c.action === 'next_page' && (
              <Field label="Destino">
                {id => <Select id={id} value={c.next_page_id ?? ''} onChange={v => update({ next_page_id: v || null })} options={pageOptions} />}
              </Field>
            )}
          </>
        })()}

        {/* Cores do bloco selecionado — atalho para não precisar abrir o Design */}
        <section className="space-y-3 pt-5 border-t border-linear-border">
          <h3 className="flex items-center gap-2 text-xs font-medium text-linear-text-secondary">
            <Palette size={14} aria-hidden className="text-linear-text-tertiary" /> Cores
          </h3>
          {component.type === 'BUTTON' ? (() => {
            const c = content as unknown as ButtonContent
            return <>
              <ColorOverride label="Cor do botão" value={c.bg_color} fallback={theme.button_color} onChange={v => update({ bg_color: v })} />
              <ColorOverride label="Cor do texto do botão" value={c.text_color} fallback={theme.button_text_color} onChange={v => update({ text_color: v })} />
              <ContrastWarning a={c.text_color || theme.button_text_color} b={c.bg_color || theme.button_color} what="botão e seu texto" />
            </>
          })() : (() => {
            const c = content as { color?: string | null }
            const label = component.type === 'INPUT' ? 'Cor do rótulo' : component.type === 'QUESTION' ? 'Cor da pergunta' : 'Cor do texto'
            return <>
              <ColorOverride label={label} value={c.color} fallback={theme.text_color} onChange={v => update({ color: v })} />
              <ContrastWarning a={c.color || theme.text_color} b={theme.bg_color} what="texto e fundo" />
            </>
          })()}
        </section>
      </div>
    </div>
  )
}
