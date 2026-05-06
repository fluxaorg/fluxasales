'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Lead } from '@/types'
import {
  Download,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Layers,
  Users,
  AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LeadsClientProps {
  leads: Lead[]
  total: number
  page: number
  pageSize: number
  funnels: { id: string; name: string }[]
  funnelMap: Record<string, string>
  orgId: string
  funnelFilter: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return new Date(dateStr).toLocaleDateString('pt-BR')
  if (hours > 0) return `${hours}h`
  if (mins > 0) return `${mins}m`
  return 'now'
}

export default function LeadsClient({
  leads: initialLeads,
  total,
  page,
  pageSize,
  funnels,
  funnelMap,
  orgId,
  funnelFilter,
}: LeadsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [leads, setLeads] = useState(initialLeads)
  const [exporting, setExporting] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const totalPages = Math.ceil(total / pageSize)

  const handleFilterChange = (funnelId: string) => {
    const params = new URLSearchParams()
    if (funnelId) params.set('funnel', funnelId)
    params.set('page', '0')
    router.push(`/dashboard/leads?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (funnelFilter) params.set('funnel', funnelFilter)
    params.set('page', String(newPage))
    router.push(`/dashboard/leads?${params.toString()}`)
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    const { error } = await supabase.from('fluxaleads_leads').delete().eq('id', id)
    setDeleting(false)
    if (error) { toast.error('Erro ao excluir.'); return }
    setLeads(prev => prev.filter(l => l.id !== id))
    setConfirmDeleteId(null)
    setSelectedLead(null)
    toast.success('Lead excluído.')
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const supa = createClient()
      let query = supa
        .from('fluxaleads_leads')
        .select('email, name, phone, funnel_id, custom_fields, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (funnelFilter) query = query.eq('funnel_id', funnelFilter)

      const { data } = await query
      if (!data || data.length === 0) { toast.error('Nenhum lead para exportar.'); return }

      const customKeys = new Set<string>()
      for (const row of data) {
        for (const key of Object.keys(row.custom_fields ?? {})) customKeys.add(key)
      }

      const headers = ['email', 'name', 'phone', 'funnel_name', 'created_at', ...Array.from(customKeys)]
      const rows = data.map(row => [
        row.email ?? '',
        row.name ?? '',
        row.phone ?? '',
        funnelMap[row.funnel_id] ?? row.funnel_id,
        row.created_at,
        ...Array.from(customKeys).map(k => (row.custom_fields?.[k] as string) ?? ''),
      ])

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exportado!')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-linear-border">
        <div>
          <div className="flex items-center gap-2 text-linear-text-quaternary mb-2">
            <Users size={14} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Gestão de Audiência</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-linear-text-primary">Leads</h1>
          <p className="text-linear-text-tertiary mt-2 text-sm">
            Total de <span className="text-linear-indigo font-medium">{total}</span> oportunidades capturadas.
          </p>
        </div>
        
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="group flex items-center gap-2 bg-linear-surface border border-linear-border px-4 py-2 rounded-lg text-xs font-medium text-linear-text-secondary hover:border-linear-indigo/40 hover:text-linear-indigo transition-all disabled:opacity-50"
        >
          <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-2 bg-linear-surface/30 rounded-xl border border-linear-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-linear-text-quaternary" />
          <input 
            type="text" 
            placeholder="Filtrar por nome ou email..."
            className="w-full pl-10 pr-4 py-2 bg-transparent text-sm text-linear-text-secondary placeholder:text-linear-text-quaternary outline-none border-none focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={14} className="text-linear-text-quaternary ml-2" />
          <select
            value={funnelFilter}
            onChange={e => handleFilterChange(e.target.value)}
            className="bg-transparent border-none text-xs font-medium text-linear-text-tertiary focus:ring-0 cursor-pointer hover:text-linear-text-secondary transition-colors pr-8"
          >
            <option value="" className="bg-linear-surface">Todos os funis</option>
            {funnels.map(f => (
              <option key={f.id} value={f.id} className="bg-linear-surface">{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-linear-border rounded-2xl overflow-hidden bg-linear-surface/20 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-linear-border bg-linear-surface/40">
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-linear-text-quaternary">Identificação</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-linear-text-quaternary">Origem / Funil</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-linear-text-quaternary">Data</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-linear-text-quaternary text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linear-border/50">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Users size={40} className="mb-4" />
                      <p className="text-sm font-medium">Nenhum lead encontrado</p>
                      <p className="text-xs mt-1">Publique um funil e comece a capturar dados.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-linear-surface-hover/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-linear-indigo/10 border border-linear-indigo/20 flex items-center justify-center text-linear-indigo font-bold text-sm">
                          {lead.email?.[0]?.toUpperCase() || lead.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-linear-text-secondary group-hover:text-linear-text-primary transition-colors">
                            {lead.name || 'Sem nome'}
                          </p>
                          <p className="text-xs text-linear-text-quaternary mt-0.5">{lead.email || 'Sem email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs text-linear-text-secondary font-medium">
                          {funnelMap[lead.funnel_id] || 'Funil desconhecido'}
                        </span>
                        <span className="text-[10px] text-linear-text-quaternary uppercase tracking-wider mt-1">
                          {lead.source || 'direct'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs text-linear-text-secondary">{timeAgo(lead.created_at)}</span>
                        <span className="text-[10px] text-linear-text-quaternary mt-1">
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(lead.id) }}
                          className="p-2 text-linear-text-quaternary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight size={16} className="text-linear-text-quaternary" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-linear-border flex items-center justify-between bg-linear-surface/20">
            <span className="text-[11px] text-linear-text-quaternary font-mono">
              PAGE {page + 1} OF {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="p-1.5 rounded-md border border-linear-border text-linear-text-tertiary hover:bg-linear-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-md border border-linear-border text-linear-text-tertiary hover:bg-linear-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Drawer (Overlay) */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-linear-bg border-l border-linear-border z-[201] shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-semibold text-linear-text-primary">Detalhes do Lead</h3>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-2 text-linear-text-quaternary hover:text-linear-text-primary transition-colors"
                >
                  <ChevronRight size={24} className="rotate-180" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Basic Info */}
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-linear-surface/40 border border-linear-border">
                  <div className="w-16 h-16 rounded-2xl bg-linear-indigo/10 border border-linear-indigo/20 flex items-center justify-center text-linear-indigo text-2xl font-bold">
                    {selectedLead.email?.[0].toUpperCase() || '?'}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-linear-text-primary">{selectedLead.name || 'Sem nome'}</h4>
                    <p className="text-linear-text-tertiary">{selectedLead.email || 'Email não informado'}</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-linear-border space-y-1">
                    <span className="text-[10px] font-mono text-linear-text-quaternary uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={12} /> Criado em
                    </span>
                    <p className="text-sm font-medium text-linear-text-secondary">
                      {new Date(selectedLead.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-linear-border space-y-1">
                    <span className="text-[10px] font-mono text-linear-text-quaternary uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={12} /> Funnel
                    </span>
                    <p className="text-sm font-medium text-linear-text-secondary truncate">
                      {funnelMap[selectedLead.funnel_id] || '—'}
                    </p>
                  </div>
                </div>

                {/* Custom Fields (The real answers) */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-mono text-linear-text-quaternary uppercase tracking-widest">Respostas e Campos Personalizados</h5>
                  <div className="space-y-2">
                    {Object.entries(selectedLead.custom_fields || {}).length > 0 ? (
                      Object.entries(selectedLead.custom_fields || {}).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1 p-4 rounded-xl bg-linear-surface/20 border border-linear-border/50">
                          <span className="text-[11px] font-medium text-linear-indigo/80 capitalize">{key.replace(/_/g, ' ')}</span>
                          <p className="text-sm text-linear-text-secondary leading-relaxed">{String(value)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-linear-text-quaternary italic py-4">Sem respostas adicionais.</p>
                    )}
                  </div>
                </div>

                <div className="pt-8 flex gap-3">
                  <button 
                    onClick={() => setConfirmDeleteId(selectedLead.id)}
                    className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all"
                  >
                    Excluir Lead
                  </button>
                  <button 
                    className="flex-1 py-3 rounded-xl bg-linear-surface border border-linear-border text-linear-text-secondary text-xs font-medium hover:bg-linear-surface-hover transition-all"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedLead, null, 2))
                      toast.success('Copiado para a área de transferência')
                    }}
                  >
                    Copy JSON
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
              <h4 className="text-xl font-semibold text-linear-text-primary tracking-tight mb-2">Excluir Lead?</h4>
              <p className="text-sm text-linear-text-tertiary mb-8">
                Esta ação é irreversível. Todas as informações deste contato serão removidas.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deleting}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {deleting ? 'Excluindo...' : 'Sim, Excluir'}
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
    </div>
  )
}
