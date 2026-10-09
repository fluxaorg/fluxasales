import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient, SupabaseClient, User } from '@supabase/supabase-js'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin, DB_PLANS } from '@/lib/plans'
import { slugify } from '@/lib/funnel-theme'

// Administração de acessos ao Fluxa. Só o super admin (app_metadata.fluxa_role) usa estas rotas.
// Importante: o Auth deste projeto Supabase é compartilhado com outros sistemas — por isso nunca
// apagamos usuários do Auth; "remover acesso" apaga apenas a organização do Fluxa.

let adminClient: SupabaseClient | null = null
function getAdmin() {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
    adminClient = createAdminClient(url, key, { auth: { persistSession: false } })
  }
  return adminClient
}

async function requireSuperAdmin(): Promise<User | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  if (!isSuperAdmin(user)) return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  return user
}

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status })

/** Procura um usuário do Auth pelo e-mail (paginando, pois o Auth é compartilhado e pode ser grande). */
async function findAuthUserByEmail(email: string) {
  const admin = getAdmin()
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const found = data.users.find(u => u.email?.toLowerCase() === email)
    if (found) return found
    if (data.users.length < 1000) return null
  }
  return null
}

// ── Listar acessos ──
export async function GET() {
  const me = await requireSuperAdmin()
  if (me instanceof NextResponse) return me
  const admin = getAdmin()

  const { data: orgs, error } = await admin
    .from('fluxaleads_organizations')
    .select('id, user_id, name, slug, created_at, fluxaleads_subscriptions(plan, status), fluxaleads_funnels(count)')
    .order('created_at', { ascending: true })
  if (error) return fail(error.message, 500)

  const users = await Promise.all((orgs ?? []).map(async org => {
    const { data } = await admin.auth.admin.getUserById(org.user_id)
    const u = data.user
    const sub = Array.isArray(org.fluxaleads_subscriptions) ? org.fluxaleads_subscriptions[0] : org.fluxaleads_subscriptions
    const funnels = (org.fluxaleads_funnels as unknown as { count: number }[] | null)?.[0]?.count ?? 0
    return {
      user_id: org.user_id,
      org_id: org.id,
      org_name: org.name,
      email: u?.email ?? '(usuário removido do Auth)',
      name: (u?.user_metadata?.full_name as string | undefined) ?? null,
      plan: (sub as { plan?: string } | null)?.plan ?? 'TRIAL',
      super_admin: isSuperAdmin(u),
      funnels,
      last_sign_in_at: u?.last_sign_in_at ?? null,
      created_at: org.created_at,
      is_me: org.user_id === me.id,
    }
  }))

  return NextResponse.json({ users })
}

// ── Criar acesso ──
const createSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome.').max(80),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(72).optional().or(z.literal('')),
  org_name: z.string().trim().max(80).optional(),
  plan: z.enum(DB_PLANS),
})

export async function POST(req: NextRequest) {
  const me = await requireSuperAdmin()
  if (me instanceof NextResponse) return me
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Dados inválidos.')
  const { name, email, password, org_name, plan } = parsed.data
  const admin = getAdmin()

  // 1. Usuário do Auth: cria, ou reaproveita se o e-mail já existir em outro sistema do mesmo banco.
  let user = await findAuthUserByEmail(email)
  let existed = true
  if (!user) {
    if (!password) return fail('Defina uma senha para o novo usuário.')
    existed = false
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })
    if (error || !data.user) return fail(error?.message ?? 'Não foi possível criar o usuário.', 500)
    user = data.user
  }

  // 2. Já tem acesso ao Fluxa?
  const { data: existingOrg } = await admin.from('fluxaleads_organizations').select('id').eq('user_id', user.id).maybeSingle()
  if (existingOrg) return fail('Este e-mail já tem acesso ao Fluxa.', 409)

  // 3. Organização + assinatura
  const { data: org, error: orgError } = await admin
    .from('fluxaleads_organizations')
    .insert({ user_id: user.id, name: org_name || name, slug: slugify(org_name || name) })
    .select('id')
    .single()
  if (orgError || !org) {
    if (!existed) await admin.auth.admin.deleteUser(user.id) // desfaz o usuário recém-criado
    return fail(orgError?.message ?? 'Não foi possível criar a organização.', 500)
  }

  const { error: subError } = await admin.from('fluxaleads_subscriptions').insert({ org_id: org.id, plan, status: 'active' })
  if (subError) {
    await admin.from('fluxaleads_organizations').delete().eq('id', org.id)
    if (!existed) await admin.auth.admin.deleteUser(user.id)
    return fail(subError.message, 500)
  }

  return NextResponse.json({
    ok: true,
    existed,
    message: existed
      ? 'Este e-mail já tinha conta em outro sistema do mesmo banco: o acesso ao Fluxa foi liberado e a senha atual dele foi mantida.'
      : 'Usuário criado.',
  })
}

// ── Alterar plano / redefinir senha ──
const patchSchema = z.object({
  user_id: z.string().uuid(),
  plan: z.enum(DB_PLANS).optional(),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(72).optional(),
})

export async function PATCH(req: NextRequest) {
  const me = await requireSuperAdmin()
  if (me instanceof NextResponse) return me
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Dados inválidos.')
  const { user_id, plan, password } = parsed.data
  const admin = getAdmin()

  if (plan) {
    const { data: org } = await admin.from('fluxaleads_organizations').select('id').eq('user_id', user_id).single()
    if (!org) return fail('Organização não encontrada.', 404)
    const { error } = await admin.from('fluxaleads_subscriptions')
      .upsert({ org_id: org.id, plan, status: 'active', updated_at: new Date().toISOString() }, { onConflict: 'org_id' })
    if (error) return fail(error.message, 500)
  }

  if (password) {
    const { error } = await admin.auth.admin.updateUserById(user_id, { password })
    if (error) return fail(error.message, 500)
  }

  return NextResponse.json({ ok: true })
}

// ── Remover acesso (apaga a organização e tudo dela; o usuário do Auth é mantido) ──
export async function DELETE(req: NextRequest) {
  const me = await requireSuperAdmin()
  if (me instanceof NextResponse) return me
  const userId = new URL(req.url).searchParams.get('user_id')
  if (!userId || !z.string().uuid().safeParse(userId).success) return fail('user_id inválido.')
  if (userId === me.id) return fail('Você não pode remover o seu próprio acesso.')

  const { error } = await getAdmin().from('fluxaleads_organizations').delete().eq('user_id', userId)
  if (error) return fail(error.message, 500)
  return NextResponse.json({ ok: true })
}
