import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BuilderClient from '@/components/builder/BuilderClient'
import { effectivePlan } from '@/lib/plans'

export default async function BuilderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: funnel } = await supabase
    .from('fluxaleads_funnels')
    .select('*, fluxaleads_pages(*, fluxaleads_components(*))')
    .eq('id', params.id)
    .single()

  if (!funnel) return notFound()

  // Sort pages and components
  const sortedPages = (funnel.fluxaleads_pages || [])
    .sort((a: any, b: any) => a.page_order - b.page_order)
    .map((p: any) => ({
      ...p,
      components: (p.fluxaleads_components || []).sort((a: any, b: any) => a.component_order - b.component_order)
    }))

  // Fetch plan
  const { data: sub } = await supabase
    .from('fluxaleads_subscriptions')
    .select('plan')
    .eq('org_id', funnel.org_id)
    .single()

  return (
    <BuilderClient 
      funnel={funnel} 
      initialPages={sortedPages} 
      plan={effectivePlan(sub?.plan, user)}
    />
  )
}
