import { FunnelTheme } from '@/types'

export const DEFAULT_THEME: FunnelTheme = {
  bg_color: '#020203',
  text_color: '#FFFFFF',
  accent_color: '#5E6ADA',
  button_color: '#5E6ADA',
  button_text_color: '#FFFFFF',
  font_family: 'Inter, sans-serif',
  border_radius: '24px',
  animation_type: 'blur',
  page_bg_color: null,
}

// Funis antigos podem ter tema nulo ou parcial (ex.: só bg_color) — sempre completa com o padrão.
export function resolveTheme(theme?: Partial<FunnelTheme> | null): FunnelTheme {
  return { ...DEFAULT_THEME, ...(theme ?? {}) }
}

export const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'DM Sans', value: 'DM Sans, sans-serif' },
  { label: 'Outfit', value: 'Outfit, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Playfair Display', value: 'Playfair Display, serif' },
]

export function fontName(fontFamily: string) {
  return fontFamily.split(',')[0].replace(/['"]/g, '').trim()
}

export function googleFontUrl(fontFamily: string) {
  const name = fontName(fontFamily)
  if (!name) return null
  return `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function isHex(v: string) {
  return HEX.test(v)
}

function toRgb(hex: string): [number, number, number] | null {
  if (!isHex(hex)) return null
  let h = hex.slice(1)
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

/** Cor com transparência a partir de um hex (para bordas/superfícies que acompanham o tema). */
export function alpha(hex: string, a: number) {
  const rgb = toRgb(hex)
  return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})` : hex
}

/** Cor clara (ex.: branco, bege) — usada para dispensar brilhos e sombras feitos para fundos escuros. */
export function isLight(hex: string) {
  const rgb = toRgb(hex)
  return rgb ? luminance(rgb) > 0.5 : false
}

function luminance([r, g, b]: [number, number, number]) {
  const c = [r, g, b].map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

/** Razão de contraste WCAG entre duas cores hex (1–21). null se alguma cor for inválida. */
export function contrastRatio(a: string, b: string) {
  const ra = toRgb(a), rb = toRgb(b)
  if (!ra || !rb) return null
  const [l1, l2] = [luminance(ra), luminance(rb)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

export const THEME_PRESETS: { name: string; theme: Partial<FunnelTheme> }[] = [
  { name: 'Noite', theme: { bg_color: '#020203', text_color: '#FFFFFF', accent_color: '#5E6ADA', button_color: '#5E6ADA', button_text_color: '#FFFFFF', page_bg_color: null } },
  // Claro: página e bloco brancos, sem sombra/borda, texto e botão pretos para contraste máximo.
  { name: 'Claro', theme: { bg_color: '#FFFFFF', text_color: '#0A0A0A', accent_color: '#0A0A0A', button_color: '#0A0A0A', button_text_color: '#FFFFFF', page_bg_color: '#FFFFFF' } },
  { name: 'Oceano', theme: { bg_color: '#081421', text_color: '#F1F5F9', accent_color: '#38BDF8', button_color: '#0EA5E9', button_text_color: '#04111D', page_bg_color: null } },
  { name: 'Floresta', theme: { bg_color: '#061A11', text_color: '#ECFDF5', accent_color: '#34D399', button_color: '#10B981', button_text_color: '#022C1C', page_bg_color: null } },
  { name: 'Vinho', theme: { bg_color: '#1C0A0F', text_color: '#FDF2F4', accent_color: '#F43F5E', button_color: '#E11D48', button_text_color: '#FFFFFF', page_bg_color: null } },
  { name: 'Areia', theme: { bg_color: '#F5EFE6', text_color: '#292524', accent_color: '#B45309', button_color: '#B45309', button_text_color: '#FFFFFF', page_bg_color: null } },
]

/** Normaliza um nome em slug de URL (remove acentos). */
export function slugify(name: string) {
  const base = name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 48)
  return `${base || 'funil'}-${Math.random().toString(36).slice(2, 7)}`
}

/** Chave usada para guardar a resposta de um campo (campos "custom" usam o rótulo para não colidirem). */
export function inputAnswerKey(content: { field_name: string; label: string }) {
  return content.field_name === 'custom' ? (content.label || 'campo') : content.field_name
}
