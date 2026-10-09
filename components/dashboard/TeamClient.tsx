'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users,
  UserPlus,
  Mail,
  Trash2,
  Shield,
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface TeamMember {
  id: string
  email: string
  role: string
  created_at: string
}

interface TeamClientProps {
  initialMembers: TeamMember[]
  orgId: string
  plan: string
}

export default function TeamClient({ initialMembers, orgId, plan }: TeamClientProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [newEmail, setNewEmail] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const supabase = createClient()

  const isElite = plan === 'ELITE'
  const memberLimit = 2 // Elite allows 2 extra members

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isElite) {
      toast.error('Apenas o plano ELITE permite adicionar membros à equipe.')
      return
    }

    if (members.length >= memberLimit) {
      toast.error(`Limite atingido. O plano ELITE permite até ${memberLimit} membros adicionais.`)
      return
    }

    setIsAdding(true)
    const { data, error } = await supabase
      .from('fluxaleads_team_members')
      .insert({ org_id: orgId, email: newEmail.trim().toLowerCase(), role: 'member' })
      .select()
      .single()

    setIsAdding(false)

    if (error) {
      if (error.code === '23505') {
        toast.error('Este email já faz parte da sua equipe.')
      } else {
        toast.error('Erro ao adicionar membro.')
      }
      return
    }

    setMembers([...members, data])
    setNewEmail('')
    toast.success('Membro convidado com sucesso!')
  }

  const handleRemoveMember = async (id: string) => {
    const { error } = await supabase
      .from('fluxaleads_team_members')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao remover membro.')
      return
    }

    setMembers(members.filter(m => m.id !== id))
    toast.success('Membro removido da equipe.')
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-linear-text-quaternary mb-2">
            <Users size={14} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Gestão de Equipe</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-linear-text-primary flex items-center gap-3">
            Sua Equipe
            {isElite && (
              <span className="bg-linear-indigo/10 text-linear-indigo text-[10px] px-2 py-0.5 rounded-full border border-linear-indigo/20 flex items-center gap-1">
                <Sparkles size={10} />
                Recurso Elite
              </span>
            )}
          </h1>
          <p className="text-linear-text-tertiary mt-2 text-sm">
            {members.length} de {memberLimit} colaboradores adicionais.
          </p>
        </div>

        {isElite && members.length < memberLimit && (
          <form onSubmit={handleAddMember} className="flex items-center gap-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-linear-text-quaternary" size={16} />
              <input
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                className="bg-linear-surface/20 border border-linear-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-linear-text-secondary outline-none focus:border-linear-indigo/50 transition-all min-w-[240px]"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="bg-linear-indigo text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-linear-violet transition-all flex items-center gap-2 shadow-lg shadow-linear-indigo/20 disabled:opacity-50"
            >
              {isAdding ? <Zap size={16} className="animate-pulse" /> : <UserPlus size={16} />}
              Invite
            </button>
          </form>
        )}
      </div>

      {!isElite ? (
        <div className="bg-linear-surface/20 border border-dashed border-linear-border rounded-[32px] p-12 text-center">
          <div className="w-16 h-16 bg-linear-indigo/10 border border-linear-indigo/20 rounded-2xl flex items-center justify-center text-linear-indigo mx-auto mb-6">
            <Shield size={32} />
          </div>
          <h3 className="text-xl font-semibold text-linear-text-primary mb-3">Faça Upgrade para o Plano Elite</h3>
          <p className="text-linear-text-tertiary text-sm mb-8 max-w-md mx-auto">
            Gestão de equipe e colaboração em tempo real são exclusivos para assinantes do plano Elite. Adicione colaboradores e trabalhem juntos nos mesmos funis.
          </p>
          <button className="bg-linear-indigo text-white px-8 py-3 rounded-xl font-bold transition-all shadow-xl shadow-linear-indigo/20">
            Fazer Upgrade
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {members.map((member) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-linear-surface/20 border border-linear-border rounded-[32px] p-6 group hover:border-linear-indigo/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-linear-bg border border-linear-border flex items-center justify-center text-linear-text-secondary">
                    <Users size={20} />
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-linear-text-quaternary hover:text-red-400 rounded-lg hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-lg font-semibold text-linear-text-primary truncate mb-1">
                  {member.email.split('@')[0]}
                </p>
                <p className="text-xs text-linear-text-tertiary mb-4 truncate">{member.email}</p>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full w-fit border border-emerald-500/20">
                  <CheckCircle2 size={10} />
                  Active
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {members.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 py-20 text-center bg-linear-surface/10 border border-dashed border-linear-border rounded-[32px]">
              <div className="w-12 h-12 rounded-full bg-linear-surface border border-linear-border flex items-center justify-center mx-auto mb-4 text-linear-text-quaternary">
                <Users size={20} />
              </div>
              <p className="text-linear-text-secondary font-medium">Nenhum membro convidado</p>
              <p className="text-xs text-linear-text-quaternary mt-1">Convide seu primeiro colaborador acima.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
