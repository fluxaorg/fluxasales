'use client'

import { useState } from 'react'
import { Sparkles, X, Send, User as Bot, Zap as Wand2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AIAssistantButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-[360px] z-[200] rounded-[28px] overflow-hidden bg-linear-surface border border-linear-border shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-linear-surface-elevated border-b border-linear-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-linear-indigo flex items-center justify-center shadow-[0_0_15px_rgba(94,106,210,0.4)]">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-linear-text-primary tracking-tight">Arquiteto de Funis IA</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-linear-text-quaternary font-mono uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setOpen(false)} 
                className="p-1.5 rounded-lg text-linear-text-quaternary hover:text-linear-text-primary hover:bg-linear-surface transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-6 h-[320px] flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-indigo blur-[30px] opacity-20" />
                <div className="relative w-16 h-16 rounded-2xl bg-linear-surface border border-linear-border flex items-center justify-center shadow-xl">
                  <Wand2 size={28} className="text-linear-indigo" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="text-linear-text-secondary font-medium">Como posso ajudar hoje?</h5>
                <p className="text-xs text-linear-text-quaternary leading-relaxed max-w-[240px]">
                  Posso sugerir perguntas, otimizar sua copy ou até criar um novo funil baseado no seu nicho.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 w-full">
                {[
                  'Sugerir perguntas para Leads de Imóveis',
                  'Otimizar meu funil de Consultoria',
                ].map((prompt) => (
                  <button 
                    key={prompt}
                    className="w-full py-2.5 px-4 rounded-xl bg-linear-bg border border-linear-border text-[11px] text-linear-text-tertiary text-left hover:border-linear-indigo/40 hover:text-linear-text-secondary transition-all"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 bg-linear-bg border border-linear-border rounded-2xl p-2 focus-within:border-linear-indigo/50 transition-all shadow-inner">
                <input 
                  disabled 
                  placeholder="Mensagem para a IA..."
                  className="flex-1 bg-transparent text-sm text-linear-text-secondary outline-none px-2 placeholder:text-linear-text-quaternary" 
                />
                <button className="w-10 h-10 rounded-xl bg-linear-indigo/10 text-linear-indigo flex items-center justify-center hover:bg-linear-indigo hover:text-white transition-all">
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-center text-linear-text-quaternary mt-3 font-mono">DESENVOLVIDO PELA FLUXA INTELLIGENCE</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(!open)}
        className="hidden md:flex fixed bottom-7 right-7 z-[201] items-center gap-2.5 px-4 py-3 rounded-2xl transition-all"
        style={{
          background: 'rgba(15,15,18,0.88)',
          border: '1px solid rgba(99,102,241,0.3)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(99,102,241,0.2)',
        }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ opacity: 0, rotate: -45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 45 }}>
              <X size={16} style={{ color: '#a5b4fc' }} />
            </motion.div>
          ) : (
            <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Sparkles size={15} style={{ color: '#a5b4fc' }} />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="text-[13px] font-semibold" style={{ color: '#e0e4ff' }}>
          {open ? 'Fechar' : 'Eli IA'}
        </span>
      </motion.button>
    </>
  )
}
