'use client'

import { useState, useEffect, useRef } from 'react'
import { FunnelComponent, FunnelPage, HeadingContent, TextContent, InputContent, QuestionContent, ButtonContent, ComponentContent } from '@/types'
import { 
  ChevronRight, 
  Settings2, 
  Layers, 
  Type, 
  Plus, 
  Trash2, 
  ToggleLeft,
  ChevronDown
} from 'lucide-react'

interface PropertyEditorProps {
  component: FunnelComponent
  pages: FunnelPage[]
  onUpdate: (content: ComponentContent) => void
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-linear-text-quaternary mb-2">
    {children}
  </label>
)

const Input = ({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full bg-linear-surface border border-linear-border rounded-md px-3 py-2 text-sm text-linear-text-secondary placeholder:text-linear-text-quaternary/50 outline-none focus:border-linear-indigo/50 transition-all"
  />
)

const TextArea = ({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    rows={rows}
    className="w-full bg-linear-surface border border-linear-border rounded-md px-3 py-2 text-sm text-linear-text-secondary outline-none focus:border-linear-indigo/50 transition-all resize-none"
  />
)

const Select = ({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-linear-surface border border-linear-border rounded-md px-3 py-2 text-sm text-linear-text-secondary outline-none focus:border-linear-indigo/50 transition-all appearance-none pr-8"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-linear-text-quaternary pointer-events-none" />
  </div>
)

export default function PropertyEditor({ component, pages, onUpdate }: PropertyEditorProps) {
  const [content, setContent] = useState<Record<string, unknown>>(component.content as unknown as Record<string, unknown>)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setContent(component.content as unknown as Record<string, unknown>)
  }, [component.id])

  const update = (patch: Record<string, unknown>) => {
    const next = { ...content, ...patch }
    setContent(next)
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    
    debounceTimer.current = setTimeout(() => {
      onUpdate(next as unknown as ComponentContent)
    }, 400)
  }

  const pageOptions = [
    { value: '', label: '— Next in order —' },
    ...pages.map(p => ({ value: p.id, label: p.name })),
  ]

  return (
    <div className="flex flex-col h-full bg-linear-surface/20">
      <div className="p-6 border-b border-linear-border bg-linear-surface/40 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-linear-indigo/10 border border-linear-indigo/20 flex items-center justify-center text-linear-indigo">
          <Settings2 size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-linear-indigo">{component.type}</span>
          <span className="text-xs font-medium text-linear-text-secondary">Properties</span>
        </div>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto">
        {component.type === 'HEADING' && (() => {
          const c = content as unknown as HeadingContent
          return <>
            <div>
              <Label>Heading Text</Label>
              <TextArea value={c.text} onChange={v => update({ text: v })} />
            </div>
            <div>
              <Label>Size</Label>
              <Select
                value={c.size}
                onChange={v => update({ size: v })}
                options={[
                  { value: 'h1', label: 'H1 — Large' },
                  { value: 'h2', label: 'H2 — Medium' },
                  { value: 'h3', label: 'H3 — Small' },
                ]}
              />
            </div>
          </>
        })()}

        {component.type === 'TEXT' && (() => {
          const c = content as unknown as TextContent
          return <div>
            <Label>Text Content</Label>
            <TextArea value={c.text} onChange={v => update({ text: v })} rows={6} />
          </div>
        })()}

        {component.type === 'INPUT' && (() => {
          const c = content as unknown as InputContent
          return <>
            <div>
              <Label>Label</Label>
              <Input value={c.label} onChange={v => update({ label: v })} />
            </div>
            <div>
              <Label>Placeholder</Label>
              <Input value={c.placeholder} onChange={v => update({ placeholder: v })} />
            </div>
            <div>
              <Label>Field Type</Label>
              <Select
                value={c.field_name}
                onChange={v => update({ field_name: v })}
                options={[
                  { value: 'email', label: 'Email' },
                  { value: 'name', label: 'Name' },
                  { value: 'phone', label: 'Phone' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-linear-surface/40 border border-linear-border">
              <span className="text-xs text-linear-text-secondary font-medium">Required</span>
              <button
                onClick={() => update({ required: !c.required })}
                className={`w-8 h-4 rounded-full transition-colors relative ${c.required ? 'bg-linear-indigo' : 'bg-linear-surface-hover border border-linear-border'}`}
              >
                <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white transition-all ${c.required ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </div>
          </>
        })()}

        {component.type === 'QUESTION' && (() => {
          const c = content as unknown as QuestionContent
          return <>
            <div>
              <Label>Question</Label>
              <TextArea value={c.question} onChange={v => update({ question: v })} />
            </div>
            <div className="space-y-4">
              <Label>Answer Options</Label>
              <div className="space-y-3">
                {c.options.map((opt, i) => (
                  <div key={opt.id} className="p-4 rounded-xl border border-linear-border bg-linear-surface/40 space-y-3 group/opt">
                    <div className="flex items-center gap-2">
                      <input
                        value={opt.label}
                        onChange={e => {
                          const opts = c.options.map((o, j) => j === i ? { ...o, label: e.target.value } : o)
                          update({ options: opts })
                        }}
                        className="flex-1 bg-transparent text-sm text-linear-text-secondary outline-none border-b border-transparent focus:border-linear-indigo/30 transition-all pb-1"
                        placeholder={`Option ${i + 1}`}
                      />
                      <button
                        onClick={() => {
                          const opts = c.options.filter((_, j) => j !== i)
                          update({ options: opts })
                        }}
                        className="opacity-0 group-hover/opt:opacity-100 text-linear-text-quaternary hover:text-red-400 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-linear-text-quaternary uppercase tracking-wider">Destination:</p>
                      <Select
                        value={opt.next_page_id ?? ''}
                        onChange={v => {
                          const opts = c.options.map((o, j) => j === i ? { ...o, next_page_id: v || null } : o)
                          update({ options: opts })
                        }}
                        options={pageOptions}
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const opts = [...c.options, { id: crypto.randomUUID(), label: `Option ${c.options.length + 1}`, next_page_id: null }]
                    update({ options: opts })
                  }}
                  className="w-full border border-dashed border-linear-border py-2.5 rounded-xl text-xs font-medium text-linear-text-quaternary hover:text-linear-indigo hover:border-linear-indigo/40 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  <span>Add option</span>
                </button>
              </div>
            </div>
          </>
        })()}

        {component.type === 'BUTTON' && (() => {
          const c = content as unknown as ButtonContent
          return <>
            <div>
              <Label>Button Text</Label>
              <Input value={c.label} onChange={v => update({ label: v })} />
            </div>
            <div>
              <Label>Click Action</Label>
              <Select
                value={c.action}
                onChange={v => update({ action: v, next_page_id: v === 'submit' ? null : c.next_page_id })}
                options={[
                  { value: 'next_page', label: 'Go to step' },
                  { value: 'submit', label: 'Submit and capture lead' },
                ]}
              />
            </div>
            {c.action === 'next_page' && (
              <div>
                <Label>Destination Page</Label>
                <Select
                  value={c.next_page_id ?? ''}
                  onChange={v => update({ next_page_id: v || null })}
                  options={pageOptions}
                />
              </div>
            )}
          </>
        })()}
      </div>
    </div>
  )
}
