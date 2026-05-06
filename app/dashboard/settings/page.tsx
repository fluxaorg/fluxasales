import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/dashboard/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: org } = await supabase
    .from('fluxaleads_organizations')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!org) return null

  const { data: webhooks } = await supabase
    .from('fluxaleads_webhooks')
    .select('*')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  return (
    <SettingsClient 
      orgId={org.id}
      metaPixelId={org.meta_pixel_id || ''}
      webhooks={webhooks || []}
    />
  )
}
