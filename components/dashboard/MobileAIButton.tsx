'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MobileAIButton() {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSend = () => {
    if (!msg.trim()) return
    toast('Em breve! O Eli vai te ajudar a criar e otimizar funis.', { icon: '⚡' })
    setMsg('')
    setOpen(false)
  }

  return (
    <>
      {/* Trigger — fixed top right, rounded rectangle */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 right-4 z-[199] flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg"
        style={{
          background: 'rgba(22,22,26,0.92)',
          border: '1px solid rgba(99,102,241,0.35)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Sparkles size={14} className="text-indigo-400" />
        <span className="text-[12px] font-semibold text-white">Eli IA</span>
      </motion.button>

      {/* Chat sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[301] rounded-t-[28px] overflow-hidden"
              style={{ background: 'rgba(16,16,20,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-5 pb-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Sparkles size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Eli IA</p>
                    <p className="text-[10px] text-white/40">Assistente de funis da Fluxa Sales</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="ml-auto text-white/30 hover:text-white/70">
                    <X size={18} />
                  </button>
                </div>

                {/* Suggestions */}
                <div className="space-y-2 mb-4">
                  {[
                    'Otimizar meu funil de leads',
                    'Criar perguntas para consultoria',
                    'Qual plano é melhor para mim?',
                  ].map(s => (
                    <button key={s} onClick={() => setMsg(s)}
                      className="w-full text-left px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.03] text-xs text-white/60 hover:text-white hover:border-indigo-400/30 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2 pb-safe">
                  <input
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Pergunte algo ao Eli..."
                    className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-indigo-400/40"
                  />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend}
                    className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30"
                  >
                    <Send size={16} className="text-white" />
                  </motion.button>
                </div>
                <div className="h-6" /> {/* Safe area */}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
