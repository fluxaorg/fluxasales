# FLÜXA LEADS — REDESIGN COMPLETO + BUG FIXES
# Para: Claude Code (VS Code / Windsurf)
# Projeto: C:\Users\Eliezer\Desktop\Fluxa Leads
# Executar TUDO na ordem exata descrita abaixo

---

## PASSO 0 — BAIXAR OS DESIGN SYSTEMS (FAZER PRIMEIRO)

Antes de qualquer código, execute os comandos abaixo no terminal do projeto.
Eles baixam os DESIGN.md do Apple e do Linear diretamente do repositório oficial.

```bash
# Baixar Apple DESIGN.md
curl -fsSL "https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/apple/DESIGN.md" -o DESIGN-apple.md

# Baixar Linear DESIGN.md
curl -fsSL "https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/linear.app/DESIGN.md" -o DESIGN-linear.md
```

Leia AMBOS os arquivos antes de escrever qualquer linha de CSS ou JSX.
Eles são a lei do design deste projeto.

**Resumo do que extrair de cada um:**

**Apple DESIGN.md — aplicar em:**
- Background: branco puro (#FFFFFF) ou preto (#000000) na Landing Page
- Tipografia: Inter como substituto do SF Pro (sem serifa, tracking negativo)
- Headlines: 56px, weight 600, line-height 1.07, letter-spacing -0.28px
- Body: 17px, weight 400, line-height 1.47, letter-spacing -0.374px
- Glassmorphism no navbar: backdrop-blur-xl, bg-white/80 ou bg-black/70
- Sombras: UMA sombra suave (box-shadow: 0 4px 24px rgba(0,0,0,0.08))
- NUNCA usar bordas em cards — Apple não usa borders visíveis
- NUNCA usar border-radius > 12px exceto em pills
- Imagens full-bleed, produtos sem fundo
- Espaçamento generoso — muito whitespace

**Linear DESIGN.md — aplicar em:**
- Fundo do app/dashboard: #0F0F10 (quase preto)
- Surface cards: #1A1A1C
- Borders sutis: rgba(255,255,255,0.06)
- Accent: roxo Linear (#5E6AD2) para elementos de destaque no dashboard
- Tipografia ultra-compact, weights 400/500 no body
- Spacing denso: 4px grid system
- Sidebar: fundo escuro, ícones compactos, sem decoração excessiva

---

## PASSO 1 — INSTALAR DEPENDÊNCIAS

```bash
# shadcn/ui (já iniciado pelo Jaison, mas confirmar)
npx shadcn@latest init --yes 2>/dev/null || true

# Componentes do 21st.dev via shadcn MCP
npx shadcn@latest add https://21st.dev/r/ravikatiyar162/floating-icons-hero-section
npx shadcn@latest add https://21st.dev/r/deepaksslibra/fluid-menu
npx shadcn@latest add https://21st.dev/r/koustubhayadiyala36/morphing-card-stack
npx shadcn@latest add https://21st.dev/r/easemize/multi-type-ripple-buttons
npx shadcn@latest add https://21st.dev/r/moumensoliman/expanding-search-dock-shadcnui

# Dependências adicionais
npm install framer-motion lucide-react clsx tailwind-merge
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**IMPORTANTE:** Substituir @hello-pangea/dnd por @dnd-kit.
O @hello-pangea/dnd quebra com React Strict Mode mesmo com reactStrictMode: false.
@dnd-kit é mais moderno, leve, e funciona perfeitamente.

---

## PASSO 2 — BUG FIX CRÍTICO: DRAG AND DROP

### O problema
@hello-pangea/dnd não está funcionando no projeto atual.

### A solução
Substituir completamente por @dnd-kit/core + @dnd-kit/sortable.

### Reescrever components/builder/BuilderClient.tsx

O builder deve usar @dnd-kit. A estrutura é:

```tsx
// Exemplo de como usar @dnd-kit no builder
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Componente arrastável individual
function SortableComponent({ comp, ... }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: comp.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Handle de drag separado dos clicks de seleção */}
      <div {...listeners} style={{ cursor: 'grab' }}>
        ⠿
      </div>
      {/* Conteúdo clicável para selecionar */}
      <div onClick={() => onSelect(comp.id)}>
        {renderPreview(comp)}
      </div>
    </div>
  )
}

// No canvas principal:
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={components.map(c => c.id)}
    strategy={verticalListSortingStrategy}
  >
    {components.map(comp => (
      <SortableComponent key={comp.id} comp={comp} ... />
    ))}
  </SortableContext>
</DndContext>
```

**handleDragEnd deve:**
1. Usar arrayMove para reordenar localmente (instantâneo, sem delay)
2. Atualizar component_order no Supabase em background (fire and forget)
3. NÃO bloquear a UI durante o save

---

## PASSO 3 — BUG FIX: LEADS NÃO APARECEM NA DASHBOARD

### O problema
A tabela em /dashboard/leads não renderiza leads mesmo com dados no banco.
(Export CSV funciona porque vai direto ao Supabase; a tabela não.)

### Diagnóstico
O campo `answers` não existe na tabela — os dados ficam em `custom_fields`.
O tipo `Lead` em types/index.ts pode estar incorreto.

### A solução

1. Verificar o tipo correto em `types/index.ts`:

```typescript
export interface Lead {
  id: string
  funnel_id: string
  org_id: string
  email: string | null
  name: string | null
  phone: string | null
  custom_fields: Record<string, unknown>  // SEM campo "answers"
  source: string | null
  ip_hash: string | null
  created_at: string
}
```

2. Em `app/dashboard/leads/page.tsx`, confirmar que o select inclui todos os campos:

```typescript
const { data: leads, count } = await service
  .from('fluxaleads_leads')
  .select('id, email, name, phone, funnel_id, custom_fields, source, created_at', { count: 'exact' })
  .eq('org_id', org.id)
  .order('created_at', { ascending: false })
  .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
```

3. Em `components/dashboard/LeadsClient.tsx`, garantir que a tabela renderiza
   quando leads.length > 0 e que não há erros de tipo que silenciem o render.

---

## PASSO 4 — BUG FIX: REMOVER DELAY / PERFORMANCE

### Problemas de performance

**4a. Remover debounce excessivo do builder**
No BuilderClient, o auto-save usa debounce de 1500ms.
Reduzir para **800ms** e usar `useCallback` com cleanup correto.

**4b. Remover reactStrictMode: false do next.config.mjs**
Não é necessário com @dnd-kit. Pode voltar ao padrão.

**4c. Otimizar queries do Supabase**
Todas as queries server-side devem usar `createServiceClient` (service role)
que bypassa RLS e é mais rápido que o client anon.

**4d. Adicionar loading states instantâneos**
Usar `useOptimistic` ou estado local para atualização imediata na UI
antes do Supabase confirmar o save. O usuário não deve esperar.

**4e. Prefetch de rotas do dashboard**
Em todos os `<Link>` do sidebar, adicionar `prefetch={true}`.

---

## PASSO 5 — NOVA SIDEBAR (SUBSTITUIR COMPLETAMENTE)

Substituir `components/dashboard/Sidebar.tsx` pelo código abaixo.
Este é o design exato que o Cavanha quer — retrátil, compacta, expande ao hover.

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Funnel,         // use GitBranch se Funnel não existir
  Users,
  BarChart2,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard/funnels',   label: 'Funis',          icon: GitBranch },
  { href: '/dashboard/leads',     label: 'Leads',          icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics',      icon: BarChart2 },
  { href: '/dashboard/settings',  label: 'Configurações',  icon: Settings },
]

interface SidebarProps {
  userEmail: string | undefined
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Sessão encerrada.')
    router.push('/')
    router.refresh()
  }

  const initial = userEmail?.charAt(0).toUpperCase() ?? 'U'

  return (
    <aside
      className="fixed left-4 top-4 bottom-4 z-[150] flex flex-col"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? '220px' : '68px',
        transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="flex flex-col h-full overflow-hidden bg-[#0F0F10] items-center"
        style={{
          borderRadius: '20px',
          padding: '20px 0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center mb-8 flex-shrink-0 w-full" style={{ minHeight: '40px' }}>
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{ width: '68px', minWidth: '68px' }}
          >
            {/* Ícone compacto quando collapsed */}
            <div
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center"
              style={{
                opacity: expanded ? 0 : 1,
                transition: 'opacity 0.2s ease',
                position: expanded ? 'absolute' : 'relative',
              }}
            >
              <span className="text-black font-bold text-xs">FL</span>
            </div>
          </div>
          {/* Nome completo quando expanded */}
          <div
            style={{
              opacity: expanded ? 1 : 0,
              transform: expanded ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'opacity 0.25s ease 0.05s, transform 0.25s ease 0.05s',
              paddingLeft: '16px',
              pointerEvents: expanded ? 'auto' : 'none',
            }}
          >
            <span className="text-white font-semibold text-sm tracking-tight whitespace-nowrap">
              Flüxa Leads
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 flex-1 w-full px-2 overflow-hidden">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                title={!expanded ? label : undefined}
                className={`
                  flex items-center h-[42px] rounded-[14px] transition-all duration-200 w-full
                  ${isActive
                    ? 'bg-white text-black'
                    : 'text-zinc-500 hover:text-white hover:bg-white/8'
                  }
                `}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ width: '68px', minWidth: '68px' }}
                >
                  <Icon
                    style={{ width: '18px', height: '18px' }}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                <span
                  className="overflow-hidden whitespace-nowrap text-[13px] font-medium"
                  style={{
                    maxWidth: expanded ? '140px' : '0px',
                    opacity: expanded ? 1 : 0,
                    transition: 'max-width 0.3s ease, opacity 0.2s ease',
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom: user + logout */}
        <div
          className="flex flex-col gap-1 flex-shrink-0 mt-4 pt-4 w-full px-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Avatar */}
          <div className="flex items-center h-[42px] w-full">
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{ width: '68px', minWidth: '68px' }}
            >
              <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold">
                {initial}
              </div>
            </div>
            <div
              className="overflow-hidden flex flex-col"
              style={{
                opacity: expanded ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
            >
              <span className="text-white text-[12px] font-medium truncate max-w-[120px]">
                {userEmail?.split('@')[0] ?? 'Usuário'}
              </span>
              <span className="text-zinc-600 text-[10px]">Admin</span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center h-[42px] rounded-[14px] text-zinc-600 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200 w-full"
          >
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{ width: '68px', minWidth: '68px' }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
            </div>
            <span
              className="overflow-hidden whitespace-nowrap text-[13px] font-medium"
              style={{
                maxWidth: expanded ? '140px' : '0px',
                opacity: expanded ? 1 : 0,
                transition: 'max-width 0.3s ease, opacity 0.2s ease',
              }}
            >
              Sair
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}
```

**IMPORTANTE:** O dashboard layout deve ter padding-left para acomodar a sidebar:
```tsx
// app/dashboard/layout.tsx
<div className="flex min-h-screen bg-[#0F0F10]">
  <Sidebar userEmail={user.email} />
  <main className="flex-1 overflow-auto" style={{ paddingLeft: '84px' }}>
    {children}
  </main>
</div>
```
(84px = 68px sidebar collapsed + 16px margem lateral)

---

## PASSO 6 — REDESIGN: LANDING PAGE (APPLE AESTHETIC)

Reescrever `app/page.tsx` e todos os componentes em `components/landing/`.

### Design rules (extraídas do Apple DESIGN.md):
- Fundo: #FFFFFF (branco puro) em seções claras, #000000 em seções escuras
- Tipografia: Inter (tracking negativo, tight line-height)
- Headlines: clamp(48px, 6vw, 72px), weight 600, letter-spacing -0.5px, line-height 1.07
- Body: 17px, weight 400, letter-spacing -0.374px, line-height 1.47
- Cor de texto principal: #1d1d1f (quase preto, não preto puro)
- Cor de texto secundário: #6e6e73
- Botões primários: fundo #0066CC (azul Apple) ou fundo preto, sem border-radius exagerado (6px)
- Navbar: backdrop-blur-xl, bg-white/80, border-bottom: 1px solid rgba(0,0,0,0.08)
- Sem sombras pesadas — apenas box-shadow: 0 2px 8px rgba(0,0,0,0.08) onde necessário
- Sections alternadas: branco → preto → branco → preto

### Estrutura da nova Landing Page:

**Navbar (fixo no topo):**
- Logo: "Flüxa Leads" — Inter, 17px, weight 600, color #1d1d1f
- Links centrais: Como funciona | Recursos | Preços
- Botão direita: "Entrar" (ghost) + "Começar grátis" (filled, #0066CC)
- Glassmorphism: backdrop-blur-xl, bg-white/80, border-b rgba(0,0,0,0.08)

**Hero Section — usar componente FloatingIconsHeroSection do 21st.dev:**
- Instalar com: `npx shadcn@latest add https://21st.dev/r/ravikatiyar162/floating-icons-hero-section`
- Customizar com: headline "Funis que convertem.", sub "Capture leads qualificados em minutos.", botão "Começar grátis"
- Fundo: #000000
- Ícones flutuantes: usar ícones de funil, gráfico, webhook, cursor
- Typography: 72px, weight 600, branco

**Marquee bar (entre hero e como funciona):**
- Fundo: #F5F5F7 (cinza Apple)
- Texto: features do produto em loop
- Separador: ponto cinza

**Como funciona (3 steps) — fundo branco:**
- Cards sem borda, apenas sombra suave
- Números grandes em cinza claro atrás do título
- Hover: translateY(-4px), sem border

**Features (3 cards) — fundo #000:**
- Cards com fundo #1C1C1E (cinza Apple escuro)
- Sem bordas visíveis — apenas shadow interno
- Ícone + título + descrição

**Pricing (2 planos) — fundo branco:**
- Layout side by side
- Plano PRO com fundo #0066CC (azul Apple)
- Features em lista com checkmark azul

**FAQ — fundo #F5F5F7:**
- Accordion simples, sem borda
- Fonte: 17px, weight 500

**CTA Final — fundo #000:**
- Headline grande, centralizado
- Botão branco em fundo preto

**Footer:**
- Fundo #F5F5F7
- Links organizados em grid 4 colunas
- Copyright + "Tecnology by Flüxa" em **bold** + "by Grupo WKS" em **bold**

---

## PASSO 7 — REDESIGN: DASHBOARD (LINEAR AESTHETIC)

Reescrever páginas do dashboard com estética do Linear.

### Design rules (extraídas do Linear DESIGN.md):
- Background: #0F0F10
- Surface/Cards: #1A1A1C
- Borders: 1px solid rgba(255,255,255,0.06)
- Texto primário: #FFFFFF
- Texto secundário: rgba(255,255,255,0.4)
- Accent: #5E6AD2 (roxo Linear)
- Font: Inter, compact, tracking -0.2px
- Border-radius: 8px nos cards, 6px nos inputs
- Sem sombras pesadas — apenas borders sutis

### Página: /dashboard/funnels

**Lista de funis — usar MorphingCardStack do 21st.dev:**
```bash
npx shadcn@latest add https://21st.dev/r/koustubhayadiyala36/morphing-card-stack
```
- Se o usuário tem 1 funil: card único estático
- Se tem 2+ funis: stack de cards animado que mostra todos
- Card de funil: nome, status badge, lead count, botões de ação
- Botão "Novo funil": no canto superior direito, botão com ripple effect

**Botões de ação — usar MultiTypeRippleButtons:**
```bash
npx shadcn@latest add https://21st.dev/r/easemize/multi-type-ripple-buttons
```
- "Publicar": ripple verde
- "Salvar": ripple azul
- "Deletar": ripple vermelho
- "Cancelar": ripple cinza

**Search bar — usar ExpandingSearchDock:**
```bash
npx shadcn@latest add https://21st.dev/r/moumensoliman/expanding-search-dock-shadcnui
```
- Colocar no topo direito de cada página do dashboard
- Permite buscar funis, leads

---

## PASSO 8 — REDESIGN: BUILDER

O builder deve ter estética Linear (dark) com melhorias de UX.

### Layout:
- Background do canvas: #0A0A0B (quase preto)
- Painel esquerdo (componentes): #1A1A1C com borda sutil
- Painel direito (propriedades): #1A1A1C com borda sutil
- Canvas central: fundo xadrez sutil (para indicar área de trabalho)

### Navegação de etapas — usar FluidMenu do 21st.dev:
```bash
npx shadcn@latest add https://21st.dev/r/deepaksslibra/fluid-menu
```
- As etapas (pages) do funil devem aparecer como itens do FluidMenu
- O menu fica no topo do canvas, animado e fluido
- Clicar em cada item seleciona a etapa correspondente
- Botão "+ Etapa" como último item do menu

### Componentes no canvas:
- Cards com borda: 1px solid rgba(255,255,255,0.08)
- Quando selecionado: border-color: #5E6AD2 (roxo Linear)
- Handle de drag: ícone ⠿ visível apenas no hover

### Botões do header do builder (Publicar, Salvar, Despublicar):
- Usar MultiTypeRippleButtons (instalado no passo 7)

---

## PASSO 9 — PÁGINA ANALYTICS (PLACEHOLDER)

Criar `app/dashboard/analytics/page.tsx`:

```tsx
// Página de analytics — placeholder funcional e bonito
export default function AnalyticsPage() {
  return (
    <div className="p-8 min-h-screen bg-[#0F0F10]">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-white font-semibold text-3xl tracking-tight mb-1">
          Analytics
        </h1>
        <p className="text-zinc-500 text-sm">
          Integração com Meta Pixel em breve.
        </p>
      </div>

      {/* Stats grid — placeholder */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {['Total de Leads', 'Taxa de Conversão', 'Funis Ativos'].map((label, i) => (
          <div
            key={label}
            className="rounded-xl p-6"
            style={{
              background: '#1A1A1C',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">{label}</p>
            <p className="text-white text-3xl font-semibold">—</p>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div
        className="rounded-xl p-8 flex items-center justify-center"
        style={{
          background: '#1A1A1C',
          border: '1px solid rgba(255,255,255,0.06)',
          minHeight: '320px',
        }}
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[#5E6AD2]/20 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-6 h-6 text-[#5E6AD2]" />
          </div>
          <p className="text-white font-medium mb-2">Em breve</p>
          <p className="text-zinc-500 text-sm max-w-xs">
            Quando o Pixel do Meta estiver configurado, você verá dados de
            pageviews, leads e conversões aqui.
          </p>
        </div>
      </div>

      {/* Coming soon features */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {[
          { title: 'Funil de Conversão', desc: 'Veja onde os usuários abandonam.' },
          { title: 'Origem dos Leads', desc: 'Organic, pago, direto, social.' },
          { title: 'Heatmap de Cliques', desc: 'Quais opções são mais escolhidas.' },
          { title: 'A/B Testing', desc: 'Compare variações do mesmo funil.' },
        ].map(item => (
          <div
            key={item.title}
            className="rounded-xl p-5"
            style={{
              background: '#1A1A1C',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-[#5E6AD2] uppercase tracking-widest">Em breve</span>
            </div>
            <p className="text-white text-sm font-medium mb-1">{item.title}</p>
            <p className="text-zinc-500 text-xs">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## PASSO 10 — BOTÃO FLUTUANTE: IA PARA FUNIS (PLACEHOLDER)

Criar `components/dashboard/AIAssistantButton.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Sparkles, X, Send } from 'lucide-react'

export default function AIAssistantButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Chat window placeholder */}
      {open && (
        <div
          className="fixed bottom-24 right-6 w-80 z-50 rounded-2xl overflow-hidden"
          style={{
            background: '#1A1A1C',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#5E6AD2] flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-white text-sm font-medium">IA para Funis</span>
              <span className="text-xs text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">Em breve</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="p-4 min-h-[200px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#5E6AD2]/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-[#5E6AD2]" />
              </div>
              <p className="text-white text-sm font-medium mb-1">Assistente de Funis</p>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-[200px] mx-auto">
                Em breve você poderá criar funis completos com IA. Por enquanto, crie manualmente no builder.
              </p>
            </div>
          </div>

          {/* Input area — disabled */}
          <div
            className="px-4 pb-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}
          >
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <input
                disabled
                placeholder="Descreva seu funil..."
                className="flex-1 bg-transparent text-zinc-500 text-sm outline-none placeholder:text-zinc-600"
              />
              <button disabled className="text-zinc-600">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: open ? '#1A1A1C' : 'linear-gradient(135deg, #5E6AD2, #7C6FF7)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: open ? 'none' : '0 8px 24px rgba(94, 106, 210, 0.4)',
        }}
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Sparkles className="w-5 h-5 text-white" />
        )}
      </button>
    </>
  )
}
```

Adicionar ao `app/dashboard/layout.tsx` DENTRO do `<main>`:
```tsx
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'

// No return:
<main ...>
  {children}
  <AIAssistantButton />
</main>
```

---

## PASSO 11 — TAILWIND CONFIG ATUALIZADO

Atualizar `tailwind.config.ts` com as novas cores:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Apple palette (Landing Page)
        apple: {
          black: '#000000',
          white: '#FFFFFF',
          gray: '#F5F5F7',
          'text-primary': '#1d1d1f',
          'text-secondary': '#6e6e73',
          blue: '#0066CC',
          'surface-dark': '#1C1C1E',
        },
        // Linear palette (Dashboard)
        linear: {
          bg: '#0F0F10',
          surface: '#1A1A1C',
          border: 'rgba(255,255,255,0.06)',
          accent: '#5E6AD2',
          'text-primary': '#FFFFFF',
          'text-secondary': 'rgba(255,255,255,0.4)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        'apple-tight': '-0.374px',
        'apple-tighter': '-0.5px',
      },
      lineHeight: {
        'apple-headline': '1.07',
        'apple-body': '1.47',
      },
      borderRadius: {
        'apple': '12px',
        'linear': '8px',
      },
      backdropBlur: {
        'apple': '20px',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## PASSO 12 — GLOBAL CSS ATUALIZADO

Substituir `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* ── Apple Typography Base ── */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'cv11', 'ss01';
  letter-spacing: -0.374px;
}

/* ── Scrollbar Linear style ── */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

/* ── Apple Selection ── */
::selection { background: #0066CC; color: #FFFFFF; }

/* ── Marquee animation ── */
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee { animation: marquee 25s linear infinite; }

/* ── Apple glass nav ── */
.glass-nav {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(255,255,255,0.8);
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

/* ── Linear surface ── */
.surface {
  background: #1A1A1C;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
}

/* ── Smooth transitions ── */
* { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }

/* ── Remove tap highlight mobile ── */
* { -webkit-tap-highlight-color: transparent; }

/* ── Hide scrollbar sidebar ── */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
```

---

## PASSO 13 — NEXT.CONFIG.MJS FINAL

```javascript
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname)
    return config
  },
  // NÃO incluir reactStrictMode: false
  // @dnd-kit funciona com Strict Mode
}

export default nextConfig
```

---

## PASSO 14 — VERIFICAÇÃO FINAL

Depois de todas as mudanças:

```bash
# Verificar build
npm run build

# Se build passa, rodar dev
npm run dev
```

**Checklist do que deve funcionar:**
- [ ] LP carrega com estética Apple (branco, tipografia tight, glassmorphism navbar)
- [ ] Hero Section com FloatingIconsHeroSection animado
- [ ] Modal de login funciona (ESC fecha, login redireciona)
- [ ] Sidebar retrátil (expande no hover, colapsa no mouse leave)
- [ ] Dashboard com fundo #0F0F10 (dark Linear)
- [ ] Drag-and-drop no builder funciona (arrastar e soltar componentes)
- [ ] Botões usam MultiTypeRippleButtons
- [ ] FluidMenu nas etapas do funil
- [ ] MorphingCardStack na lista de funis (2+ funis)
- [ ] ExpandingSearchDock na barra de busca
- [ ] Página Analytics existe e é placeholder bonito
- [ ] Botão flutuante de IA no canto inferior direito
- [ ] Leads aparecem na tabela /dashboard/leads
- [ ] Sem delay perceptível nas interações

---

## OBSERVAÇÕES IMPORTANTES

1. **shadcn MCP já instalado** — Jaison já configurou o `.mcp.json`.
   Use o MCP para instalar componentes quando possível.

2. **Os DESIGN.md** ficam na raiz do projeto como `DESIGN-apple.md` e `DESIGN-linear.md`.
   Leia-os no início e aplique consistentemente.

3. **Sidebar da referência** — O arquivo `Sidebar.tsx` enviado pelo Cavanha
   é de outro projeto (BlindMaster/CRM de blindadoras). Não copiar a lógica
   de negócio (profiles, organizations, logo_url) — apenas o estilo visual
   (floating pill, expand on hover, dark theme, animações).

4. **Não mexer nas tabelas Supabase** — O schema `fluxaleads_*` está correto.
   Só corrigir os tipos TypeScript para bater com as colunas reais.

5. **Não implementar Stripe** — Permanece desabilitado.

6. **Não criar rota de signup público** — Usuários criados manualmente pelo Cavanha.

7. **Testar drag-and-drop** — Criar um funil de teste, adicionar 4-5 componentes
   e confirmar que arrastar para reordenar funciona antes de considerar done.

---

**FIM DO PROMPT. Execute na ordem. Pergunte ao Cavanha se surgir dúvida.**
