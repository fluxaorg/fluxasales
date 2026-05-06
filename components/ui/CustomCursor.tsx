'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const [hovering, setHovering] = useState(false)
  const [clicking, setClicking] = useState(false)
  const [visible, setVisible] = useState(false)

  const mx = useMotionValue(-100)
  const my = useMotionValue(-100)

  // Ring — slower, magnetic feel
  const rx = useSpring(mx, { stiffness: 200, damping: 28, mass: 0.5 })
  const ry = useSpring(my, { stiffness: 200, damping: 28, mass: 0.5 })

  // Dot — snappy
  const dx = useSpring(mx, { stiffness: 800, damping: 50 })
  const dy = useSpring(my, { stiffness: 800, damping: 50 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mx.set(e.clientX)
      my.set(e.clientY)
      if (!visible) setVisible(true)
    }

    const checkHover = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      setHovering(!!el.closest('a, button, [role="button"], input, textarea, select, label'))
    }

    const down = () => setClicking(true)
    const up   = () => setClicking(false)
    const leave = () => setVisible(false)
    const enter = () => setVisible(true)

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseover', checkHover)
    document.addEventListener('mousedown', down)
    document.addEventListener('mouseup', up)
    document.addEventListener('mouseleave', leave)
    document.addEventListener('mouseenter', enter)
    return () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseover', checkHover)
      document.removeEventListener('mousedown', down)
      document.removeEventListener('mouseup', up)
      document.removeEventListener('mouseleave', leave)
      document.removeEventListener('mouseenter', enter)
    }
  }, [mx, my, visible])

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
        style={{
          x: rx, y: ry,
          translateX: '-50%', translateY: '-50%',
          border: '1.5px solid rgba(255,255,255,0.5)',
          mixBlendMode: 'difference',
        }}
        animate={{
          width:  hovering ? 44 : clicking ? 20 : 32,
          height: hovering ? 44 : clicking ? 20 : 32,
          opacity: visible ? 1 : 0,
          borderColor: hovering ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
          borderWidth: hovering ? 2 : 1.5,
        }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      />

      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full bg-white"
        style={{ x: dx, y: dy, translateX: '-50%', translateY: '-50%', mixBlendMode: 'difference' }}
        animate={{
          width:  hovering ? 6 : clicking ? 3 : 4,
          height: hovering ? 6 : clicking ? 3 : 4,
          opacity: visible ? 1 : 0,
          scale: clicking ? 0.5 : 1,
        }}
        transition={{ duration: 0.1 }}
      />
    </>
  )
}
