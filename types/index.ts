export type Plan = 'TRIAL' | 'BASIC' | 'PRO' | 'ELITE'

export const PLAN_FUNNEL_LIMITS: Record<Plan, number> = {
  TRIAL: 1,
  BASIC: 1,
  PRO: 5,
  ELITE: 12,
}

export type FunnelStatus = 'draft' | 'published'

export type ComponentType = 'HEADING' | 'TEXT' | 'INPUT' | 'QUESTION' | 'BUTTON'

export interface HeadingContent {
  text: string
  size: 'h1' | 'h2' | 'h3'
}

export interface TextContent {
  text: string
}

export interface InputContent {
  label: string
  placeholder: string
  field_name: 'email' | 'name' | 'phone' | 'custom'
  required: boolean
}

export interface QuestionOption {
  id: string
  label: string
  next_page_id: string | null
}

export interface QuestionContent {
  question: string
  options: QuestionOption[]
}

export interface ButtonContent {
  label: string
  action: 'next_page' | 'submit'
  next_page_id: string | null
}

export type ComponentContent =
  | HeadingContent
  | TextContent
  | InputContent
  | QuestionContent
  | ButtonContent

export interface FunnelComponent {
  id: string
  page_id: string
  type: ComponentType
  content: ComponentContent
  component_order: number
}

export interface FunnelPage {
  id: string
  funnel_id: string
  name: string
  page_order: number
  components: FunnelComponent[]
}

export interface FunnelTheme {
  bg_color: string
  text_color: string
  accent_color: string
  button_color: string
  button_text_color: string
  font_family: string
  border_radius: string
  animation_type: 'none' | 'fade' | 'slide' | 'bounce' | 'blur'
}

export interface Funnel {
  id: string
  org_id: string
  name: string
  slug: string
  status: FunnelStatus
  published_at: string | null
  created_at: string
  pages?: FunnelPage[]
  theme?: FunnelTheme
}

export interface Organization {
  id: string
  user_id: string
  name: string
  slug: string
  meta_pixel_id: string | null
}

export interface Subscription {
  id: string
  org_id: string
  plan: Plan
  status: string
}

export interface Lead {
  id: string
  funnel_id: string
  org_id: string
  email: string | null
  name: string | null
  phone: string | null
  custom_fields: Record<string, unknown>
  source: string | null
  ip_hash: string | null
  created_at: string
  funnel?: { name: string }
}

export interface Webhook {
  id: string
  org_id: string
  url: string
  event_type: string
  active: boolean
  secret: string
  created_at: string
}
