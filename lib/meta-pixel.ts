/**
 * Valida o ID do Meta Pixel digitado pelo usuário.
 * O ID é só numérico (normalmente 15 ou 16 dígitos); aceitamos espaços/colagens com lixo e limpamos.
 * Vazio = remover o pixel.
 */
export function parsePixelId(raw: string): { value: string | null; error: string | null } {
  const trimmed = raw.trim()
  if (!trimmed) return { value: null, error: null }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 20 || /[a-z]/i.test(trimmed)) {
    return { value: null, error: 'ID inválido. O Pixel ID tem só números (ex.: 123456789012345) — veja em Gerenciador de Eventos > Fontes de dados.' }
  }
  return { value: digits, error: null }
}
