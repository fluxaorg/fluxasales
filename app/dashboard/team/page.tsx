import { createClient } from '@/lib/supabase/server'
import TeamClient from '@/components/dashboard/TeamClient'
import { redirect } from 'next/navigation'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch org and plan
  const { data: org } = await supabase
    .from('fluxaleads_organizations')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!org) {
    return <div>Organização não encontrada.</div>
  }

  const { data: sub } = await supabase
    .from('fluxaleads_subscriptions')
    .select('plan')
    .eq('org_id', org.id)
    .single()

  const { data: members } = await supabase
    .from('fluxaleads_team_members')
    .select('*')
    .eq('org_id', org.id)
    .order('created_at', { ascending: true })

  return (
    <TeamClient 
      initialMembers={members || []} 
      orgId={org.id} 
      plan={sub?.plan || 'TRIAL'} 
    />
  )
}
