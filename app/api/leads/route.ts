import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import crypto from 'crypto'

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number, resetAt: number }>()

const schema = z.object({
  funnel_id: z.string().uuid(),
  answers: z.record(z.string().max(300), z.union([z.string().max(2000), z.number(), z.boolean(), z.null()]))
    .refine(a => Object.keys(a).length <= 60, 'Too many fields'),
  source: z.string().max(200).optional()
})

// Criado sob demanda (não no carregamento do módulo): o build da Vercel carrega esta rota
// e quebrava com "supabaseUrl is required" quando as variáveis não estavam disponíveis.
let adminClient: SupabaseClient | null = null
function getAdmin() {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
    adminClient = createClient(url, key)
  }
  return adminClient
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'anonymous'
  
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
    const { data: funnel, error: funnelError } = await getAdmin()
      .from('fluxaleads_funnels')
      .select('id, org_id, status, name')
      .eq('id', validatedData.funnel_id)
      .single()

    if (funnelError || funnel.status !== 'published') {
      return NextResponse.json({ error: 'Funnel not found or not published' }, { status: 404 })
    }

    // Hash IP for privacy
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex')

    // Extract common fields if present in answers
    const pick = (k: string) => {
      const v = validatedData.answers[k]
      return typeof v === 'string' && v.trim() ? v.trim() : null
    }
    const email = pick('email')?.toLowerCase() ?? null
    const name = pick('name')
    const phone = pick('phone')

    // Insert lead
    const { data: lead, error: leadError } = await getAdmin()
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

    // Aguarda os webhooks (timeout de 5s cada): em serverless, promessas soltas podem ser encerradas antes do envio.
    await triggerWebhooks(funnel.org_id, { ...lead, funnel_name: funnel.name })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('API Leads Error:', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function triggerWebhooks(orgId: string, lead: Record<string, unknown>) {
  const { data: webhooks } = await getAdmin()
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
