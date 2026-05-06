'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Funnel, FunnelPage, FunnelTheme } from '@/types'

interface FunnelRendererProps {
  funnel: Funnel
  pages: FunnelPage[]
}

const DEFAULT_THEME: FunnelTheme = {
  bg_color: "#020203",
  text_color: "#FFFFFF",
  accent_color: "#5E6ADA",
  button_color: "#5E6ADA",
  button_text_color: "#FFFFFF",
  font_family: "'Inter', sans-serif",
  border_radius: "24px",
  animation_type: "blur"
}

export default function FunnelRenderer({ funnel, pages }: FunnelRendererProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [direction, setDirection] = useState(0)
  
  const theme = funnel.theme || DEFAULT_THEME
  const currentPage = pages[currentPageIndex]

  const handleNext = (nextPageId?: string | null) => {
    setDirection(1)
    if (nextPageId) {
      const nextIndex = pages.findIndex(p => p.id === nextPageId)
      if (nextIndex !== -1) {
        setCurrentPageIndex(nextIndex)
        return
      }
    }
    
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }

  const handleBack = () => {
    setDirection(-1)
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
    }
  }

  const handleSubmit = async (finalAnswers?: Record<string, any>) => {
    setIsSubmitting(true)
    const allAnswers = { ...answers, ...(finalAnswers || {}) }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnel_id: funnel.id,
          answers: allAnswers,
          source: typeof document !== 'undefined' ? document.referrer : 'direct'
        })
      })

      if (!res.ok) throw new Error('Failed to send lead')
      
      setIsFinished(true)
    } catch (err) {
      toast.error('An error occurred while sending your answers.')
      setIsSubmitting(false)
    }
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      filter: theme.animation_type === 'blur' ? 'blur(10px)' : 'none'
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      filter: 'blur(0px)'
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      filter: theme.animation_type === 'blur' ? 'blur(10px)' : 'none'
    })
  }

  const spring = {
    type: "spring",
    stiffness: 300,
    damping: 30
  }

  if (isFinished) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6 text-center"
        style={{ backgroundColor: theme.bg_color, color: theme.text_color, fontFamily: theme.font_family }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md p-12 bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
          style={{ borderRadius: theme.border_radius }}
        >
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)] border border-emerald-500/20">
              <CheckCircle2 size={56} />
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4 tracking-tight leading-tight">All set!</h2>
          <p className="opacity-60 text-lg leading-relaxed">Your information has been received. Our team will reach out shortly.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-700 relative overflow-hidden"
      style={{ backgroundColor: theme.bg_color, color: theme.text_color, fontFamily: theme.font_family }}
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-20 animate-pulse" 
          style={{ backgroundColor: theme.accent_color, transition: 'background-color 1s ease' }} 
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-10 animate-pulse" 
          style={{ backgroundColor: theme.accent_color, animationDelay: '1s', transition: 'background-color 1s ease' }} 
        />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center relative z-10">
        {/* Progress Bar - Linear Style */}
        <div className="w-full h-1 bg-white/[0.05] rounded-full mb-20 overflow-hidden backdrop-blur-sm border border-white/[0.03]">
          <motion.div 
            className="h-full shadow-[0_0_40px_rgba(255,255,255,0.3)] relative"
            style={{ backgroundColor: theme.accent_color }}
            initial={{ width: 0 }}
            animate={{ width: `${((currentPageIndex + 1) / pages.length) * 100}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </motion.div>
        </div>

        <div className="w-full relative min-h-[500px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentPageIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 },
                filter: { duration: 0.4 }
              }}
              className="w-full space-y-12"
            >
              {(currentPage as any)?.fluxaleads_components?.map((comp: any) => (
                <div key={comp.id} className="w-full">
                  {comp.type === 'HEADING' && (
                    <motion.h2 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`font-bold tracking-tighter leading-[1] mb-2 ${
                        comp.content.size === 'h1' ? 'text-7xl md:text-8xl' : 
                        comp.content.size === 'h2' ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl'
                      }`}
                    >
                      {comp.content.text}
                    </motion.h2>
                  )}

                  {comp.type === 'TEXT' && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="opacity-70 text-xl md:text-2xl leading-relaxed max-w-xl mb-8"
                    >
                      {comp.content.text}
                    </motion.p>
                  )}

                  {comp.type === 'INPUT' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-4 w-full"
                    >
                       <label className="block text-[11px] font-bold uppercase tracking-[0.4em] opacity-40 ml-1">
                        {comp.content.label} {comp.content.required && <span style={{ color: theme.accent_color }}>*</span>}
                      </label>
                      <input 
                        type={comp.content.field_name === 'email' ? 'email' : 'text'}
                        placeholder={comp.content.placeholder}
                        required={comp.content.required}
                        className="w-full p-6 text-xl md:text-3xl bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.06] backdrop-blur-3xl border border-white/[0.08] focus:border-white/40 focus:outline-none transition-all duration-500 shadow-2xl placeholder:opacity-20 font-medium"
                        style={{ borderRadius: theme.border_radius, color: theme.text_color, boxShadow: `0 0 0 0 ${theme.accent_color}20` }}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [comp.content.field_name]: e.target.value }))}
                      />
                    </motion.div>
                  )}

                  {comp.type === 'QUESTION' && (
                    <div className="space-y-8 w-full">
                      <h3 className="text-2xl font-semibold tracking-tight opacity-90">{comp.content.question}</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {comp.content.options?.map((opt: any, idx: number) => (
                          <motion.button
                            key={opt.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.05 }}
                            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => {
                              setAnswers(prev => ({ ...prev, [comp.content.question]: opt.label }))
                              handleNext(opt.next_page_id)
                            }}
                            className="p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.06] text-left group flex justify-between items-center shadow-xl hover:shadow-2xl transition-all duration-500 hover:bg-white/[0.05]"
                            style={{ borderRadius: theme.border_radius }}
                          >
                            <span className="text-2xl font-semibold opacity-70 group-hover:opacity-100 transition-all group-hover:translate-x-1">{opt.label}</span>
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all transform group-hover:rotate-[-45deg]">
                              <ArrowRight size={24} className="opacity-40 group-hover:opacity-100 transition-all" style={{ color: theme.accent_color }} />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {comp.type === 'BUTTON' && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSubmitting}
                      onClick={() => {
                        if (comp.content.action === 'submit') {
                          handleSubmit()
                        } else {
                          handleNext(comp.content.next_page_id)
                        }
                      }}
                      className="w-full py-8 text-2xl font-bold shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] transition-all flex items-center justify-center gap-4 mt-4 hover:brightness-110 active:scale-[0.98]"
                      style={{ 
                        borderRadius: theme.border_radius, 
                        backgroundColor: theme.button_color,
                        color: theme.button_text_color
                      }}
                    >
                      {isSubmitting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          {comp.content.label}
                          <ArrowRight size={22} />
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="w-full mt-24 pt-10 flex items-center justify-between opacity-30 text-[10px] font-bold uppercase tracking-[0.4em] border-t border-white/5">
          {currentPageIndex > 0 ? (
            <button 
              onClick={handleBack}
              className="flex items-center gap-3 hover:opacity-100 transition-opacity group"
            >
              <ArrowLeft size={14} className="transform group-hover:-translate-x-1 transition-transform" /> Back
            </button>
          ) : <div />}
          
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-current" />
            Fluxa Sales
          </div>
        </div>
      </div>
    </div>
  )
}
