import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import FunnelRenderer from '@/components/builder/FunnelRenderer'
import { FunnelPage, FunnelComponent } from '@/types'

export default async function PreviewPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  // Pela RLS, visitantes só enxergam funis publicados; rascunhos só voltam para quem pode editá-los.
  const { data: funnel } = await supabase
    .from('fluxaleads_funnels')
    .select(`
      *,
      fluxaleads_pages(
        *,
        fluxaleads_components(*)
      )
    `)
    .eq('slug', params.slug)
    .single()

  if (!funnel) return notFound()

  const isDraft = funnel.status !== 'published'

  // O Pixel é lido no servidor, com a service role: visitantes não têm (nem devem ter) acesso
  // à tabela de organizações, que guarda o user_id do dono. Só o ID do pixel chega ao navegador.
  const { data: org } = await createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .from('fluxaleads_organizations')
    .select('meta_pixel_id')
    .eq('id', funnel.org_id)
    .single()

  type PageRow = Omit<FunnelPage, 'components'> & { fluxaleads_components: FunnelComponent[] | null }
  const pages: FunnelPage[] = ((funnel.fluxaleads_pages ?? []) as PageRow[])
    .sort((a, b) => a.page_order - b.page_order)
    .map(({ fluxaleads_components, ...page }) => ({
      ...page,
      components: (fluxaleads_components ?? []).sort((a, b) => a.component_order - b.component_order),
    }))

  return (
    <FunnelRenderer
      funnel={funnel}
      pages={pages}
      metaPixelId={org?.meta_pixel_id ?? null}
      isDraft={isDraft}
    />
  )
}
