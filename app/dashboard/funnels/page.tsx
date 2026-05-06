import { createClient } from '@/lib/supabase/server'
import FunnelsList from '@/components/dashboard/FunnelsList'

const PLAN_LIMITS: Record<string, number> = { TRIAL: 1, BASIC: 2, PRO: 5, ELITE: 10 }

export default async function FunnelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: org } = await supabase
    .from('fluxaleads_organizations')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!org) return null

  const { data: sub } = await supabase
    .from('fluxaleads_subscriptions')
    .select('plan')
    .eq('org_id', org.id)
    .single()

  const plan = sub?.plan ?? 'TRIAL'
  const limit = PLAN_LIMITS[plan] ?? 1

  const { data: collabFunnels } = await supabase
    .from('fluxaleads_funnel_collaborators')
    .select('funnel_id')
    .eq('user_email', user.email)

  const collabIds = (collabFunnels || []).map(c => c.funnel_id)

  const { data: funnels } = await supabase
    .from('fluxaleads_funnels')
    .select('*')
    .or(`org_id.eq.${org.id}${collabIds.length > 0 ? `,id.in.(${collabIds.join(',')})` : ''}`)
    .order('created_at', { ascending: false })

  const { data: leads } = await supabase
    .from('fluxaleads_leads')
    .select('funnel_id')
    .eq('org_id', org.id)

  const leadCounts: Record<string, number> = {}
  for (const l of leads ?? []) {
    leadCounts[l.funnel_id] = (leadCounts[l.funnel_id] ?? 0) + 1
  }

  return (
    <FunnelsList 
      funnels={funnels ?? []} 
      leadCounts={leadCounts}
      orgId={org.id}
      plan={plan}
      limit={limit}
    />
  )
}
