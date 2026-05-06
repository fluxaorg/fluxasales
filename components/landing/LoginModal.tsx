'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface LoginModalProps {
  onClose: () => void
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const overlayRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos.'
        : error.message)
      return
    }
    router.push('/dashboard/funnels')
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard/funnels`,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setResetSent(true)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-text/70 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-cream border border-dark-text"
        style={{ boxShadow: '8px 8px 0px #6B1F2C' }}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-dark-text">
          <span className="font-serif text-2xl text-dark-text">
            {resetMode ? 'Recuperar senha' : 'Entrar'}
          </span>
          <button
            onClick={onClose}
            className="text-dark-text/50 hover:text-dark-text transition-colors text-2xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="px-8 py-8">
          {resetMode ? (
            resetSent ? (
              <div className="text-center py-4">
                <p className="text-dark-text font-medium">Email enviado!</p>
                <p className="text-dark-text/60 text-sm mt-2">
                  Verifique sua caixa de entrada para redefinir sua senha.
                </p>
                <button
                  onClick={() => { setResetMode(false); setResetSent(false) }}
                  className="mt-6 btn-outline w-full"
                >
                  Voltar ao login
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-dark-text/60 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full border border-dark-text bg-cream px-4 py-3 text-sm font-sans outline-none focus:border-wine focus:ring-1 focus:ring-wine"
                    placeholder="seu@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-brutalist w-full disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send recovery link'}
                </button>
                <button
                  type="button"
                  onClick={() => setResetMode(false)}
                  className="w-full text-center text-sm text-dark-text/50 hover:text-dark-text transition-colors"
                >
                  Back to sign in
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-dark-text/60 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full border border-dark-text bg-cream px-4 py-3 text-sm font-sans outline-none focus:border-wine focus:ring-1 focus:ring-wine"
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-dark-text/60 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full border border-dark-text bg-cream px-4 py-3 text-sm font-sans outline-none focus:border-wine focus:ring-1 focus:ring-wine"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-brutalist w-full disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <button
                type="button"
                onClick={() => setResetMode(true)}
                className="w-full text-center text-sm text-dark-text/50 hover:text-dark-text transition-colors"
              >
                Esqueci minha senha
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
