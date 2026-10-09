'use client'

import { useCallback, useEffect, useId, useState } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Loader2, KeyRound, Trash2, Shield, X, AlertTriangle, RefreshCw, Eye, EyeOff, Wand2 } from 'lucide-react'
import { DB_PLANS, PLAN_LABEL, FUNNEL_LIMITS, formatLimit, PlanId } from '@/lib/plans'

interface AdminUser {
  user_id: string
  org_id: string
  org_name: string
  email: string
  name: string | null
  plan: string
  super_admin: boolean
  funnels: number
  last_sign_in_at: string | null
  created_at: string
  is_me: boolean
}

const inputClass = 'w-full bg-linear-bg border border-linear-border rounded-xl px-4 py-3 text-sm text-linear-text-primary placeholder:text-linear-text-quaternary outline-none focus-visible:border-linear-indigo focus-visible:ring-2 focus-visible:ring-linear-indigo/30 transition-[border-color,box-shadow]'

function randomPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, b => chars[b % chars.length]).join('') + '!'
}

async function api<T = unknown>(method: string, body?: unknown, query = ''): Promise<T> {
  const res = await fetch(`/api/admin/users${query}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Erro inesperado.')
  return data as T
}

function PasswordField({ value, onChange, required }: { value: string; onChange: (v: string) => void; required?: boolean }) {
  const id = useId()
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-linear-text-secondary">Senha{required ? '' : ' (opcional)'}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input id={id} type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} minLength={8}
            autoComplete="new-password" placeholder="Mínimo de 8 caracteres" className={`${inputClass} pr-11`} />
          <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-linear-text-tertiary hover:text-linear-text-primary cursor-pointer">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button type="button" onClick={() => { onChange(randomPassword()); setShow(true) }} title="Gerar senha forte"
          className="flex items-center gap-1.5 px-3 rounded-xl border border-linear-border text-xs font-medium text-linear-text-secondary hover:text-linear-text-primary hover:border-linear-indigo/50 cursor-pointer transition-colors">
          <Wand2 size={14} aria-hidden /> Gerar
        </button>
      </div>
    </div>
  )
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', org_name: '', plan: 'PRO' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [resetFor, setResetFor] = useState<AdminUser | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [removeFor, setRemoveFor] = useState<AdminUser | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const { users } = await api<{ users: AdminUser[] }>('GET')
      setUsers(users)
    } catch (e) {
      setLoadError((e as Error).message)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await api<{ message: string; existed: boolean }>('POST', form)
      toast.success(res.message, { duration: res.existed ? 8000 : 4000 })
      setForm({ name: '', email: '', password: '', org_name: '', plan: 'PRO' })
      setShowCreate(false)
      load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const changePlan = async (u: AdminUser, plan: string) => {
    setBusyId(u.user_id)
    try {
      await api('PATCH', { user_id: u.user_id, plan })
      setUsers(prev => prev?.map(x => x.user_id === u.user_id ? { ...x, plan } : x) ?? null)
      toast.success(`Plano de ${u.email} alterado para ${PLAN_LABEL[plan as PlanId]}.`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const doResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetFor) return
    setBusyId(resetFor.user_id)
    try {
      await api('PATCH', { user_id: resetFor.user_id, password: resetPassword })
      toast.success(`Senha de ${resetFor.email} redefinida.`)
      setResetFor(null)
      setResetPassword('')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const doRemove = async () => {
    if (!removeFor) return
    setBusyId(removeFor.user_id)
    try {
      await api('DELETE', undefined, `?user_id=${removeFor.user_id}`)
      setUsers(prev => prev?.filter(x => x.user_id !== removeFor.user_id) ?? null)
      toast.success(`Acesso de ${removeFor.email} removido.`)
      setRemoveFor(null)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-surface border border-linear-border flex items-center justify-center text-linear-indigo">
            <Shield size={18} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-linear-text-primary">Usuários do sistema</h2>
            <p className="text-xs text-linear-text-tertiary">Crie e gerencie quem acessa o Fluxa. Visível só para o administrador.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} aria-label="Atualizar lista"
            className="w-10 h-10 rounded-xl border border-linear-border flex items-center justify-center text-linear-text-secondary hover:text-linear-text-primary cursor-pointer transition-colors">
            <RefreshCw size={15} />
          </button>
          <button type="button" onClick={() => setShowCreate(s => !s)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-linear-indigo text-white text-sm font-semibold hover:brightness-110 cursor-pointer transition">
            <UserPlus size={16} aria-hidden /> Novo usuário
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.form
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            onSubmit={handleCreate}
            className="rounded-2xl border border-linear-border bg-linear-surface p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="space-y-1.5">
              <label htmlFor="nu-name" className="text-xs font-medium text-linear-text-secondary">Nome</label>
              <input id="nu-name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da pessoa" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="nu-email" className="text-xs font-medium text-linear-text-secondary">E-mail (login)</label>
              <input id="nu-email" required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="pessoa@empresa.com" className={inputClass} />
            </div>
            <PasswordField value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required />
            <div className="space-y-1.5">
              <label htmlFor="nu-org" className="text-xs font-medium text-linear-text-secondary">Empresa (opcional)</label>
              <input id="nu-org" value={form.org_name} onChange={e => setForm(f => ({ ...f, org_name: e.target.value }))} placeholder="Usa o nome se ficar em branco" className={inputClass} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-medium text-linear-text-secondary">Plano</span>
              <div role="radiogroup" aria-label="Plano" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DB_PLANS.map(p => (
                  <button key={p} type="button" role="radio" aria-checked={form.plan === p} onClick={() => setForm(f => ({ ...f, plan: p }))}
                    className={`rounded-xl border px-3 py-2.5 text-left cursor-pointer transition-colors ${form.plan === p ? 'border-linear-indigo bg-linear-indigo/10' : 'border-linear-border hover:border-linear-indigo/50'}`}>
                    <span className="block text-sm font-medium text-linear-text-primary">{PLAN_LABEL[p]}</span>
                    <span className="block text-[11px] text-linear-text-tertiary">{formatLimit(FUNNEL_LIMITS[p])} funis</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="md:col-span-2 text-[11px] text-linear-text-tertiary leading-relaxed">
              O login é compartilhado com os outros sistemas deste banco. Se o e-mail já tiver conta em algum deles, o acesso ao Fluxa é liberado mantendo a senha atual da pessoa.
            </p>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="h-10 px-4 rounded-xl border border-linear-border text-sm text-linear-text-secondary hover:bg-linear-surface-hover cursor-pointer transition-colors">Cancelar</button>
              <button type="submit" disabled={creating} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-linear-indigo text-white text-sm font-semibold hover:brightness-110 cursor-pointer transition disabled:opacity-60 disabled:cursor-wait">
                {creating && <Loader2 size={15} className="animate-spin" aria-hidden />} Criar acesso
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="rounded-2xl border border-linear-border bg-linear-surface overflow-hidden">
        {loadError ? (
          <p className="p-6 text-sm text-red-400">{loadError}</p>
        ) : users === null ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-linear-text-tertiary" aria-label="Carregando" /></div>
        ) : users.length === 0 ? (
          <p className="p-10 text-center text-sm text-linear-text-tertiary">Nenhum usuário ainda.</p>
        ) : (
          <ul className="divide-y divide-linear-border">
            {users.map(u => (
              <li key={u.user_id} className="p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-linear-text-primary truncate">{u.name || u.email}</span>
                    {u.super_admin && <span className="rounded-md bg-linear-indigo/15 text-linear-indigo px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Super admin</span>}
                    {u.is_me && <span className="rounded-md bg-white/5 text-linear-text-tertiary px-1.5 py-0.5 text-[10px] font-medium">você</span>}
                  </div>
                  <p className="text-xs text-linear-text-tertiary truncate">{u.email} · {u.org_name}</p>
                  <p className="text-[11px] text-linear-text-quaternary mt-0.5">
                    {u.funnels} funil{u.funnels === 1 ? '' : 's'} · {u.last_sign_in_at ? `último acesso ${new Date(u.last_sign_in_at).toLocaleDateString('pt-BR')}` : 'nunca acessou'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {u.super_admin ? (
                    <span className="h-9 px-3 flex items-center rounded-lg border border-linear-indigo/40 text-xs font-semibold text-linear-indigo">Plano Ilimitado</span>
                  ) : (
                    <label className="sr-only" htmlFor={`plan-${u.user_id}`}>Plano de {u.email}</label>
                  )}
                  {!u.super_admin && (
                    <select id={`plan-${u.user_id}`} value={u.plan} disabled={busyId === u.user_id} onChange={e => changePlan(u, e.target.value)}
                      className="h-9 rounded-lg border border-linear-border bg-linear-bg px-2.5 text-xs text-linear-text-primary cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-linear-indigo/40 disabled:opacity-50">
                      {DB_PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]} · {formatLimit(FUNNEL_LIMITS[p])} funis</option>)}
                    </select>
                  )}
                  <button type="button" onClick={() => { setResetFor(u); setResetPassword('') }}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-linear-border text-xs font-medium text-linear-text-secondary hover:text-linear-text-primary hover:border-linear-indigo/50 cursor-pointer transition-colors">
                    <KeyRound size={13} aria-hidden /> Senha
                  </button>
                  {!u.is_me && (
                    <button type="button" onClick={() => setRemoveFor(u)} aria-label={`Remover acesso de ${u.email}`}
                      className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-linear-border text-xs font-medium text-linear-text-secondary hover:text-red-400 hover:border-red-500/40 cursor-pointer transition-colors">
                      <Trash2 size={13} aria-hidden /> Remover
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Redefinir senha */}
      <AnimatePresence>
        {resetFor && (
          <Dialog title={`Nova senha para ${resetFor.email}`} onClose={() => setResetFor(null)}>
            <form onSubmit={doResetPassword} className="space-y-4">
              <PasswordField value={resetPassword} onChange={setResetPassword} required />
              <p className="text-[11px] text-amber-400/90 leading-relaxed">
                O login é compartilhado: a nova senha também passa a valer nos outros sistemas deste banco que usam esse e-mail.
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setResetFor(null)} className="h-10 px-4 rounded-xl border border-linear-border text-sm text-linear-text-secondary hover:bg-linear-surface-hover cursor-pointer">Cancelar</button>
                <button type="submit" disabled={resetPassword.length < 8 || busyId === resetFor.user_id}
                  className="h-10 px-5 rounded-xl bg-linear-indigo text-white text-sm font-semibold hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Salvar senha</button>
              </div>
            </form>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Remover acesso */}
      <AnimatePresence>
        {removeFor && (
          <Dialog title="Remover acesso?" onClose={() => setRemoveFor(null)} danger>
            <p className="text-sm text-linear-text-secondary leading-relaxed mb-5">
              <strong className="text-linear-text-primary">{removeFor.email}</strong> perde o acesso ao Fluxa e a organização
              “{removeFor.org_name}” é apagada com <strong className="text-linear-text-primary">{removeFor.funnels} funil(s), leads e webhooks</strong>.
              Isso não pode ser desfeito. A conta de login continua existindo para os outros sistemas.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRemoveFor(null)} className="h-10 px-4 rounded-xl border border-linear-border text-sm text-linear-text-secondary hover:bg-linear-surface-hover cursor-pointer">Cancelar</button>
              <button type="button" onClick={doRemove} disabled={busyId === removeFor.user_id}
                className="h-10 px-5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 cursor-pointer disabled:opacity-50">Remover acesso</button>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </section>
  )
}

function Dialog({ title, onClose, danger, children }: { title: string; onClose: () => void; danger?: boolean; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]" />
      <motion.div role="dialog" aria-modal="true" aria-label={title}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.15 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-md bg-linear-surface border border-linear-border rounded-2xl z-[301] shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-linear-text-primary">
            {danger && <AlertTriangle size={18} className="text-red-500" aria-hidden />} {title}
          </h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="w-8 h-8 -mr-2 -mt-1 rounded-lg flex items-center justify-center text-linear-text-tertiary hover:text-linear-text-primary cursor-pointer"><X size={16} /></button>
        </div>
        {children}
      </motion.div>
    </>
  )
}
