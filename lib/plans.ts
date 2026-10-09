import type { User } from '@supabase/supabase-js'

/** Planos gravados no banco + UNLIMITED, que é exclusivo do super admin (não é gravado). */
export type PlanId = 'TRIAL' | 'BASIC' | 'PRO' | 'ELITE' | 'UNLIMITED'

export const DB_PLANS = ['TRIAL', 'BASIC', 'PRO', 'ELITE'] as const

export const PLAN_LABEL: Record<PlanId, string> = {
  TRIAL: 'Trial',
  BASIC: 'Basic',
  PRO: 'Pro',
  ELITE: 'Elite',
  UNLIMITED: 'Ilimitado',
}

export const FUNNEL_LIMITS: Record<PlanId, number> = {
  TRIAL: 1,
  BASIC: 2,
  PRO: 5,
  ELITE: 10,
  UNLIMITED: Infinity,
}

/**
 * Papel guardado em app_metadata (só a service role altera; o usuário não consegue editar).
 * Chave com prefixo porque o Auth é compartilhado com outros sistemas do mesmo projeto Supabase.
 */
export const ROLE_KEY = 'fluxa_role'
export const SUPER_ADMIN = 'super_admin'

export function isSuperAdmin(user: Pick<User, 'app_metadata'> | null | undefined) {
  return user?.app_metadata?.[ROLE_KEY] === SUPER_ADMIN
}

/** Plano efetivo: super admin é sempre ilimitado, independentemente do que está no banco. */
export function effectivePlan(dbPlan: string | null | undefined, user?: Pick<User, 'app_metadata'> | null): PlanId {
  if (isSuperAdmin(user)) return 'UNLIMITED'
  return (DB_PLANS as readonly string[]).includes(dbPlan ?? '') ? (dbPlan as PlanId) : 'TRIAL'
}

/** Recursos do Elite (equipe, tempo real) — o ilimitado também tem. */
export function hasEliteFeatures(plan: string | null | undefined) {
  return plan === 'ELITE' || plan === 'UNLIMITED'
}

export function funnelLimit(plan: string | null | undefined) {
  return FUNNEL_LIMITS[(plan as PlanId)] ?? 1
}

export function formatLimit(n: number) {
  return Number.isFinite(n) ? String(n) : 'ilimitados'
}
