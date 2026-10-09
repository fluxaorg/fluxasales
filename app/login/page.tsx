'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full rounded-lg border-0 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30',
        'focus:outline-none focus:ring-1 focus:ring-indigo-400/40 focus:bg-white/10 transition-all duration-300',
        className
      )}
      {...props}
    />
  )
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10])
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setIsLoading(false)
    } else {
      toast.success('Bem-vindo de volta!')
      router.push('/dashboard/funnels')
      router.refresh()
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { toast.error('Digite seu email primeiro.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    })
    if (error) toast.error(error.message)
    else toast.success('Email de recuperação enviado!')
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard/funnels` },
    })
  }

  return (
    <div className="min-h-screen w-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Background gradient — indigo/blue instead of purple */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/40 via-blue-800/40 to-black" />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Top radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-indigo-400/20 blur-[80px]" />
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full bg-indigo-300/20 blur-[60px]"
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90vh] h-[90vh] rounded-t-full bg-blue-500/15 blur-[60px]"
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', delay: 1 }}
      />

      {/* Ambient glow spots */}
      <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse opacity-40" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10 px-4"
        style={{ perspective: 1500 }}
      >
        <motion.div
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 10 }}
          className="relative"
        >
          <div className="relative group">
            {/* Card glow */}
            <motion.div
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  '0 0 10px 2px rgba(99,102,241,0.05)',
                  '0 0 20px 6px rgba(99,102,241,0.12)',
                  '0 0 10px 2px rgba(99,102,241,0.05)',
                ],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
            />

            {/* Traveling light beams */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
              <motion.div
                className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-70"
                animate={{ left: ['-50%', '100%'], opacity: [0.3, 0.8, 0.3] }}
                transition={{ left: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }, opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror' } }}
              />
              <motion.div
                className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-indigo-400 to-transparent opacity-70"
                animate={{ top: ['-50%', '100%'] }}
                transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 0.6 }}
              />
              <motion.div
                className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70"
                animate={{ right: ['-50%', '100%'] }}
                transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.2 }}
              />
              <motion.div
                className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-70"
                animate={{ bottom: ['-50%', '100%'] }}
                transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.8 }}
              />
              {/* Corner dots */}
              {['top-0 left-0', 'top-0 right-0', 'bottom-0 right-0', 'bottom-0 left-0'].map((pos, i) => (
                <motion.div
                  key={pos}
                  className={`absolute ${pos} h-[6px] w-[6px] rounded-full bg-white/50 blur-[1px]`}
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2 + i * 0.3, repeat: Infinity, repeatType: 'mirror', delay: i * 0.4 }}
                />
              ))}
            </div>

            {/* Glass card */}
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05] shadow-2xl overflow-hidden">
              {/* Inner grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                  backgroundSize: '30px 30px',
                }}
              />

              {/* Header */}
              <div className="text-center space-y-1 mb-5">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="mx-auto w-12 h-12 rounded-2xl overflow-hidden border border-white/10"
                >
                  <img src="/logo.png" alt="Fluxa Sales" className="w-full h-full object-cover" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                >
                  Bem-vindo de volta
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/60 text-xs"
                >
                  Entre na sua conta Fluxa Sales
                </motion.p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <motion.div className="space-y-3">
                  {/* Email */}
                  <motion.div
                    className={`relative ${focusedInput === 'email' ? 'z-10' : ''}`}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === 'email' ? 'text-indigo-300' : 'text-white/40'}`} />
                      <Input
                        type="email"
                        placeholder="Endereço de email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                        className="pl-10 pr-3"
                        required
                      />
                      {focusedInput === 'email' && (
                        <motion.div
                          layoutId="input-highlight"
                          className="absolute inset-0 bg-indigo-500/5 -z-10 rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    className={`relative ${focusedInput === 'password' ? 'z-10' : ''}`}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === 'password' ? 'text-indigo-300' : 'text-white/40'}`} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                        className="pl-10 pr-10"
                        required
                      />
                      <div
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 cursor-pointer"
                      >
                        {showPassword
                          ? <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                          : <EyeOff className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Remember me + forgot password */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="appearance-none h-4 w-4 rounded border border-white/20 bg-white/5 checked:bg-indigo-500 checked:border-indigo-500 focus:outline-none transition-all duration-200"
                      />
                      {rememberMe && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center text-white pointer-events-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                    <label htmlFor="remember-me" className="text-xs text-white/60 hover:text-white/80 transition-colors cursor-pointer">
                      Lembrar de mim
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-white/60 hover:text-white transition-colors duration-200"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {/* Sign in button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group/btn mt-2"
                >
                  <div className="absolute inset-0 bg-indigo-400/20 rounded-lg blur-lg opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  <div className="relative overflow-hidden bg-white text-black font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -z-10"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
                      style={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.3s ease' }}
                    />
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="w-4 h-4 border-2 border-black/70 border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-sm font-medium">
                          Entrar
                          <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {/* Divider */}
                <div className="relative flex items-center my-1">
                  <div className="flex-grow border-t border-white/[0.06]" />
                  <motion.span
                    className="mx-3 text-xs text-white/40"
                    animate={{ opacity: [0.7, 0.9, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    ou
                  </motion.span>
                  <div className="flex-grow border-t border-white/[0.06]" />
                </div>

                {/* Google sign in */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full relative group/google"
                >
                  <div className="absolute inset-0 bg-white/5 rounded-lg blur opacity-0 group-hover/google:opacity-70 transition-opacity duration-300" />
                  <div className="relative overflow-hidden bg-white/5 text-white font-medium h-10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-white/80 group-hover/google:text-white transition-colors text-xs">
                      Entrar com Google
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 1, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.button>

                {/* Sign up */}
                <motion.p
                  className="text-center text-xs text-white/60 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Não tem uma conta?{' '}
                  <Link href="/#pricing" className="relative inline-block group/signup">
                    <span className="relative z-10 text-white group-hover/signup:text-white/70 transition-colors duration-300 font-medium">
                      Criar conta
                    </span>
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white group-hover/signup:w-full transition-all duration-300" />
                  </Link>
                </motion.p>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Back to site */}
        <div className="text-center mt-5">
          <Link href="/" className="text-xs text-white/20 hover:text-white/50 transition-colors">
            ← Voltar para o site
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
