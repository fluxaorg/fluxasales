'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreateFunnelButtonProps {
  orgId: string
  plan: string
  currentCount: number
  limit: number
}

const LIMITS: Record<string, number> = { TRIAL: 1, BASIC: 2, PRO: 5, ELITE: 10 }

export default function CreateFunnelButton({ orgId, plan, currentCount, limit }: CreateFunnelButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const planLimit = LIMITS[plan] ?? limit

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentCount >= planLimit) {
      toast.error(`${plan} plan limit reached (${planLimit} funnels).`)
      return
    }
    setLoading(true)
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).slice(2, 7)

    const { data: funnel, error } = await supabase
      .from('fluxaleads_funnels')
      .insert({ org_id: orgId, name: name.trim(), slug, status: 'draft' })
      .select().single()

    if (error || !funnel) {
      toast.error('Error creating funnel.')
      setLoading(false)
      return
    }

    await supabase.from('fluxaleads_pages').insert({
      funnel_id: funnel.id,
      name: 'Step 1',
      page_order: 0,
    })

    setLoading(false)
    setOpen(false)
    setName('')
    router.push(`/dashboard/funnels/${funnel.id}/builder`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-white text-[#0A0A0A] text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New funnel
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">New funnel</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest block mb-2">
                  Funnel Name
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  maxLength={80}
                  placeholder="Ex: Client Capture"
                  className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/30 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-white text-[#0A0A0A] text-sm font-semibold py-3 rounded-xl hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Creating...' : 'Create and Edit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
