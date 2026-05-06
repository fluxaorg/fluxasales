import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import crypto from 'crypto'

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number, resetAt: number }>()

const schema = z.object({
  funnel_id: z.string().uuid(),
  answers: z.record(z.string(), z.unknown()),
  source: z.string().max(200).optional()
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous'
  
  // Rate limiting check
  const now = Date.now()
  const limit = rateLimitMap.get(ip)
  
  if (limit && now < limit.resetAt) {
    if (limit.count >= 10) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    limit.count++
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 })
  }

  try {
    const body = await req.json()
    const validatedData = schema.parse(body)

    // Verify funnel exists and is published
    const { data: funnel, error: funnelError } = await supabaseAdmin
      .from('fluxaleads_funnels')
      .select('id, org_id, status')
      .eq('id', validatedData.funnel_id)
      .single()

    if (funnelError || funnel.status !== 'published') {
      return NextResponse.json({ error: 'Funnel not found or not published' }, { status: 404 })
    }

    // Hash IP for privacy
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex')

    // Extract common fields if present in answers
    const email = (validatedData.answers.email as string) || null
    const name = (validatedData.answers.name as string) || null
    const phone = (validatedData.answers.phone as string) || null

    // Insert lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('fluxaleads_leads')
      .insert({
        funnel_id: validatedData.funnel_id,
        org_id: funnel.org_id,
        email,
        name,
        phone,
        custom_fields: validatedData.answers,
        source: validatedData.source || 'direct',
        ip_hash: ipHash
      })
      .select()
      .single()

    if (leadError) throw leadError

    // Trigger Webhooks (Fire and Forget)
    triggerWebhooks(funnel.org_id, lead)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('API Leads Error:', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function triggerWebhooks(orgId: string, lead: any) {
  const { data: webhooks } = await supabaseAdmin
    .from('fluxaleads_webhooks')
    .select('url, secret')
    .eq('org_id', orgId)
    .eq('active', true)
    .eq('event_type', 'lead_created')

  if (!webhooks) return

  const promises = webhooks.map(async (webhook) => {
    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret || '',
        },
        body: JSON.stringify({
          event: 'lead_created',
          data: lead,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(5000)
      })
    } catch (e) {
      console.error(`Webhook failed for ${webhook.url}:`, e)
    }
  })

  await Promise.allSettled(promises)
}
