'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { label: 'Recursos', href: '/recursos' },
  { label: 'Como funciona', href: '/como-funciona' },
  { label: 'Preços', href: '/#pricing' },
  { label: 'Contato', href: '/contato' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const handlePricingClick = (e: React.MouseEvent, href: string) => {
    if (href === '/#pricing' && pathname === '/') {
      e.preventDefault()
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-apple-border py-3'
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Fluxa Sales" className="w-8 h-8 rounded-xl object-cover" />
            <span className="text-xl font-bold text-apple-ink tracking-tight">Fluxa <span className="font-black">Sales</span></span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={(e) => handlePricingClick(e, href)}
                className={`text-[13px] font-medium transition-colors ${
                  pathname === href
                    ? 'text-apple-blue'
                    : 'text-apple-ink/70 hover:text-apple-blue'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] font-medium text-apple-ink/80 hover:text-apple-ink transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/#pricing"
              onClick={(e) => pathname === '/' && (e.preventDefault(), document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }))}
              className="bg-apple-blue hover:bg-apple-blue-focus text-white rounded-full px-5 py-2 text-[13px] font-semibold transition-all shadow-sm"
            >
              Começar grátis
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-apple-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-apple-border overflow-hidden"
            >
              <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4">
                {navLinks.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="text-[15px] font-medium text-apple-ink/80 hover:text-apple-blue transition-colors"
                  >
                    {label}
                  </Link>
                ))}
                <div className="flex gap-3 pt-2 border-t border-apple-border">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-full border border-apple-border text-[13px] font-medium text-apple-ink"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/#pricing"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-full bg-apple-blue text-white text-[13px] font-semibold"
                  >
                    Começar grátis
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
