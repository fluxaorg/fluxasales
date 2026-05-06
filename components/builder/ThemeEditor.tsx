'use client'

import { useState, useEffect, useRef } from 'react'
import { FunnelTheme } from '@/types'
import { 
  Palette,
  Type,
  Layout,
  MousePointer2,
  Zap
} from 'lucide-react'

interface ThemeEditorProps {
  theme: FunnelTheme
  onUpdate: (theme: FunnelTheme) => void
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-linear-text-quaternary mb-2">
    {children}
  </label>
)

const ColorInput = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-linear-surface/40 border border-linear-border">
    <div className="relative w-10 h-10 rounded-lg border border-linear-border overflow-hidden cursor-pointer shadow-sm">
      <input 
        type="color" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="absolute inset-[-5px] w-[200%] h-[200%] cursor-pointer"
      />
    </div>
    <div className="flex flex-col flex-1">
      <span className="text-[10px] font-mono text-linear-text-quaternary uppercase">{label}</span>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="bg-transparent text-sm font-mono text-linear-text-secondary outline-none"
      />
    </div>
  </div>
)

export default function ThemeEditor({ theme, onUpdate }: ThemeEditorProps) {
  const [localTheme, setLocalTheme] = useState<FunnelTheme>(theme)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLocalTheme(theme)
  }, [theme])

  const update = (patch: Partial<FunnelTheme>) => {
    const next = { ...localTheme, ...patch }
    setLocalTheme(next)
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    
    debounceTimer.current = setTimeout(() => {
      onUpdate(next)
    }, 400)
  }

  return (
    <div className="flex flex-col h-full bg-linear-surface/20">
      <div className="p-6 border-b border-linear-border bg-linear-surface/40 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-linear-indigo/10 border border-linear-indigo/20 flex items-center justify-center text-linear-indigo">
          <Palette size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-linear-indigo">Branding</span>
          <span className="text-xs font-medium text-linear-text-secondary">Funnel Aesthetics</span>
        </div>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto">
        {/* Colors */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette size={14} className="text-linear-text-quaternary" />
            <Label>Color Palette</Label>
          </div>
          <ColorInput label="Background" value={localTheme.bg_color} onChange={v => update({ bg_color: v })} />
          <ColorInput label="Text" value={localTheme.text_color} onChange={v => update({ text_color: v })} />
          <ColorInput label="Accent" value={localTheme.accent_color} onChange={v => update({ accent_color: v })} />
          <ColorInput label="Button" value={localTheme.button_color} onChange={v => update({ button_color: v })} />
          <ColorInput label="Button Text" value={localTheme.button_text_color} onChange={v => update({ button_text_color: v })} />
        </div>

        {/* Style */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Layout size={14} className="text-linear-text-quaternary" />
            <Label>Layout & Borders</Label>
          </div>
          <div>
            <Label>Corner Radius</Label>
            <div className="grid grid-cols-4 gap-2">
              {['0px', '12px', '24px', '999px'].map(r => (
                <button
                  key={r}
                  onClick={() => update({ border_radius: r })}
                  className={`py-2 text-[10px] rounded-lg border transition-all ${localTheme.border_radius === r ? 'bg-linear-indigo text-white border-linear-indigo' : 'bg-linear-surface border-linear-border text-linear-text-tertiary hover:border-linear-indigo/30'}`}
                >
                  {r === '999px' ? 'Full' : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Type size={14} className="text-linear-text-quaternary" />
            <Label>Typography</Label>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: 'Inter (Apple Style)', value: 'Inter, sans-serif' },
              { label: 'Roboto', value: 'Roboto, sans-serif' },
              { label: 'Playfair Display (Serif)', value: 'Playfair Display, serif' },
              { label: 'Outfit (Modern)', value: 'Outfit, sans-serif' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => update({ font_family: f.value })}
                className={`p-3 text-left text-xs rounded-xl border transition-all ${localTheme.font_family === f.value ? 'bg-linear-indigo/5 border-linear-indigo text-linear-indigo font-bold' : 'bg-linear-surface border-linear-border text-linear-text-tertiary hover:border-linear-indigo/30'}`}
                style={{ fontFamily: f.value }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Animations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-linear-text-quaternary" />
            <Label>Effects & Animations</Label>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: 'None', value: 'none' },
              { label: 'Fade In / Out', value: 'fade' },
              { label: 'Side Slide', value: 'slide' },
              { label: 'Bounce (Subtle)', value: 'bounce' },
              { label: 'Soft Blur (Apple)', value: 'blur' },
            ].map(a => (
              <button
                key={a.value}
                onClick={() => update({ animation_type: a.value as any })}
                className={`p-3 text-left text-xs rounded-xl border transition-all ${localTheme.animation_type === a.value ? 'bg-linear-indigo/5 border-linear-indigo text-linear-indigo font-bold' : 'bg-linear-surface border-linear-border text-linear-text-tertiary hover:border-linear-indigo/30'}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
