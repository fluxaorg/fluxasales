export const AVATARS = [
  { bg: 'from-violet-500 to-indigo-600', symbol: '⚡' },
  { bg: 'from-blue-500 to-cyan-500',     symbol: '🔷' },
  { bg: 'from-emerald-500 to-teal-500',  symbol: '◆'  },
  { bg: 'from-orange-500 to-pink-500',   symbol: '★'  },
  { bg: 'from-pink-500 to-rose-500',     symbol: '◉'  },
  { bg: 'from-amber-500 to-orange-500',  symbol: '▲'  },
  { bg: 'from-indigo-500 to-purple-600', symbol: '◈'  },
  { bg: 'from-cyan-500 to-blue-500',     symbol: '⬟'  },
]

export function getAvatar(email = '') {
  let hash = 0
  for (let i = 0; i < email.length; i++)
    hash = ((hash << 5) - hash) + email.charCodeAt(i)
  return AVATARS[Math.abs(hash) % AVATARS.length]
}
