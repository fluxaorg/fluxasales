'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { BarChart2, TrendingUp, Users, GitBranch, Loader } from 'lucide-react'

interface DayData { name: string; leads: number }

export default function AnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading]         = useState(true)
  const [totalLeads, setTotalLeads]   = useState(0)
  const [totalFunnels, setTotalFunnels] = useState(0)
  const [publishedFunnels, setPublishedFunnels] = useState(0)
  const [chartData, setChartData]     = useState<DayData[]>([])
  const [timeRange, setTimeRange]     = useState<7 | 30>(7)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: org } = await supabase.from('fluxaleads_organizations').select('id').eq('user_id', user.id).single()
      if (!org) return

      const since = new Date()
      since.setDate(since.getDate() - timeRange)

      const [funnelRes, leadRes, publishedRes] = await Promise.all([
        supabase.from('fluxaleads_funnels').select('*', { count: 'exact', head: true }).eq('org_id', org.id),
        supabase.from('fluxaleads_leads').select('created_at').eq('org_id', org.id).gte('created_at', since.toISOString()),
        supabase.from('fluxaleads_funnels').select('*', { count: 'exact', head: true }).eq('org_id', org.id).eq('status', 'published'),
      ])

      setTotalFunnels(funnelRes.count ?? 0)
      setPublishedFunnels(publishedRes.count ?? 0)

      const leads = leadRes.data ?? []
      setTotalLeads(leads.length)

      // Group by day
      const days: Record<string, number> = {}
      for (let i = timeRange - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        days[key] = 0
      }
      leads.forEach(l => {
        const key = new Date(l.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        if (key in days) days[key]++
      })
      setChartData(Object.entries(days).map(([name, leads]) => ({ name, leads })))
      setLoading(false)
    }
    load()
  }, [timeRange])

  const avgLeads = chartData.length ? (totalLeads / chartData.length).toFixed(1) : '0'

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-linear-text-quaternary mb-2">
            <BarChart2 size={14} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Desempenho Geral</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-linear-text-primary">Análises</h1>
          <p className="text-linear-text-tertiary mt-2 text-sm">
            Acompanhe seus leads e taxas de conversão em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-linear-surface border border-linear-border p-1 rounded-lg">
          {([7, 30] as const).map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${timeRange === r ? 'bg-linear-indigo text-white' : 'text-linear-text-tertiary hover:text-linear-text-secondary'}`}
            >
              {r === 7 ? '7 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader size={24} className="animate-spin text-linear-indigo" />
        </div>
      ) : (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total de Leads', value: String(totalLeads), icon: Users, color: 'text-linear-indigo' },
              { label: 'Média por Dia', value: avgLeads, icon: TrendingUp, color: 'text-emerald-500' },
              { label: 'Funis Criados', value: String(totalFunnels), icon: GitBranch, color: 'text-orange-500' },
              { label: 'Funis Publicados', value: String(publishedFunnels), icon: BarChart2, color: 'text-purple-500' },
            ].map(stat => (
              <div key={stat.label} className="bg-linear-surface/30 border border-linear-border rounded-2xl p-6 hover:border-linear-indigo/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-linear-bg border border-linear-border ${stat.color}`}>
                    <stat.icon size={18} />
                  </div>
                </div>
                <p className="text-linear-text-quaternary text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-linear-text-primary mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Área */}
            <div className="lg:col-span-2 bg-linear-surface/30 border border-linear-border rounded-2xl p-6">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-linear-text-primary">Leads por Dia</h3>
                <p className="text-[10px] text-linear-text-quaternary mt-0.5">Volume de captura nos últimos {timeRange} dias</p>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5E6AD2" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5E6AD2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B6B6B' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B6B6B' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A1A1C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#E4E4E6' }} labelFormatter={v => `Dia ${v}`} formatter={(v: any) => [`${v} leads`, '']} />
                    <Area type="monotone" dataKey="leads" stroke="#5E6AD2" strokeWidth={2} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Barras */}
            <div className="bg-linear-surface/30 border border-linear-border rounded-2xl p-6">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-linear-text-primary">Distribuição</h3>
                <p className="text-[10px] text-linear-text-quaternary mt-0.5">Leads por período</p>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B6B6B' }} dy={8} />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#1A1A1C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} formatter={(v: any) => [`${v} leads`, '']} />
                    <Bar dataKey="leads" fill="#5E6AD2" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Vazio */}
          {totalLeads === 0 && (
            <div className="bg-linear-surface/20 border border-dashed border-linear-border rounded-2xl py-16 text-center">
              <BarChart2 size={32} className="mx-auto mb-4 text-linear-text-quaternary opacity-40" />
              <p className="text-sm text-linear-text-quaternary">Nenhum lead capturado ainda neste período.</p>
              <p className="text-xs text-linear-text-quaternary/60 mt-1">Publique um funil e comece a capturar dados.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
