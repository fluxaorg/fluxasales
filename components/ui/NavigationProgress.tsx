'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function NavigationProgress() {
  const pathname   = usePathname()
  const prevPath   = useRef(pathname)
  const [loading, setLoading]   = useState(false)
  const [progress, setProgress] = useState(0)
  const timers = useRef<NodeJS.Timeout[]>([])

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  // Link click → start bar
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a')
      if (!a) return
      const href = a.getAttribute('href') ?? ''
      if (!href || href.startsWith('#') || href.startsWith('mailto') || href.includes('://')) return
      if (href === pathname) return

      clearTimers()
      setLoading(true)
      setProgress(15)
      timers.current.push(setTimeout(() => setProgress(40), 150))
      timers.current.push(setTimeout(() => setProgress(65), 400))
      timers.current.push(setTimeout(() => setProgress(82), 800))
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [pathname])

  // Pathname changed → complete bar
  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname
    clearTimers()
    setProgress(100)
    timers.current.push(setTimeout(() => { setLoading(false); setProgress(0) }, 350))
  }, [pathname])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.2 } }}
          className="fixed top-0 left-0 right-0 z-[9998] h-[2px] pointer-events-none"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #6366f1, #a5b4fc, #818cf8)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: [0.4, 0, 0.2, 1], duration: 0.4 }}
          />
          {/* Shimmer glow */}
          <motion.div
            className="absolute right-0 top-0 h-full w-24 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(165,180,252,0.8))' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
