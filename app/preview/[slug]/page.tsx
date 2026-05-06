import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FunnelRenderer from '@/components/builder/FunnelRenderer'

export default async function PreviewPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  // Fetch funnel
  const { data: funnel } = await supabase
    .from('fluxaleads_funnels')
    .select(`
      *,
      fluxaleads_organizations(meta_pixel_id),
      fluxaleads_pages(
        *,
        fluxaleads_components(*)
      )
    `)
    .eq('slug', params.slug)
    .single()

  if (!funnel || funnel.status !== 'published') {
    return notFound()
  }

  // Sort pages and components
  const sortedPages = funnel.fluxaleads_pages?.sort((a: any, b: any) => a.page_order - b.page_order) || []
  
  sortedPages.forEach((page: any) => {
    page.fluxaleads_components?.sort((a: any, b: any) => a.component_order - b.component_order)
  })

  return (
    <div className="min-h-screen">
      {/* Meta Pixel tracking would go here */}
      <FunnelRenderer 
        funnel={funnel} 
        pages={sortedPages} 
      />
    </div>
  )
}
