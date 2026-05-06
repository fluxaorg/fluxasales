import { createClient } from '@/lib/supabase/server'
import LeadsClient from '@/components/dashboard/LeadsClient'
import { redirect } from 'next/navigation'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { funnel?: string; page?: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: org } = await supabase
    .from('fluxaleads_organizations')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!org) return <div>Organization not found.</div>

  const funnelFilter = searchParams.funnel || ''
  const page = parseInt(searchParams.page || '0')
  const pageSize = 15

  // Fetch funnels for filter
  const { data: funnels } = await supabase
    .from('fluxaleads_funnels')
    .select('id, name')
    .eq('org_id', org.id)

  const funnelMap: Record<string, string> = {}
  funnels?.forEach(f => { funnelMap[f.id] = f.name })

  // Fetch Leads with total count
  let query = supabase
    .from('fluxaleads_leads')
    .select('*, fluxaleads_funnels(name)', { count: 'exact' })
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  if (funnelFilter) {
    query = query.eq('funnel_id', funnelFilter)
  }

  const { data: leads, count } = await query.range(page * pageSize, (page + 1) * pageSize - 1)

  return (
    <LeadsClient 
      leads={leads as any || []} 
      total={count || 0}
      page={page}
      pageSize={pageSize}
      funnels={funnels || []}
      funnelMap={funnelMap}
      orgId={org.id}
      funnelFilter={funnelFilter}
    />
  )
}
