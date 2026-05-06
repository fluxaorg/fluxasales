'use client'

import { useState, useEffect } from 'react'
import { Funnel, FunnelPage, FunnelComponent, InputContent, QuestionContent, ButtonContent, HeadingContent, TextContent } from '@/types'
import toast from 'react-hot-toast'

interface PreviewClientProps {
  funnel: Funnel
  pages: FunnelPage[]
  metaPixelId: string | null
}

export default function PreviewClient({ funnel, pages, metaPixelId }: PreviewClientProps) {
  const [currentPageId, setCurrentPageId] = useState(pages[0]?.id ?? '')
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<string[]>([])

  const currentPage = pages.find(p => p.id === currentPageId)
  const currentPageIndex = pages.findIndex(p => p.id === currentPageId)

  useEffect(() => {
    // Meta Pixel track Lead on submit
    if (submitted && metaPixelId && typeof window !== 'undefined') {
      const fbq = (window as Window & { fbq?: Function }).fbq
      if (fbq) fbq('track', 'Lead')
    }
  }, [submitted, metaPixelId])

  const goToPage = (pageId: string) => {
    setHistory(prev => [...prev, currentPageId])
    setCurrentPageId(pageId)
  }

  const goBack = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setCurrentPageId(prev)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnel_id: funnel.id,
          answers,
          source: document.referrer || 'direct',
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error sending data.')
        return
      }
      setSubmitted(true)
    } catch {
      toast.error('Connection error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleButtonAction = (comp: FunnelComponent) => {
    const c = comp.content as ButtonContent
    if (c.action === 'submit') {
      handleSubmit()
    } else {
      const nextId = c.next_page_id ?? pages[currentPageIndex + 1]?.id
      if (nextId) goToPage(nextId)
    }
  }

  const handleQuestionSelect = (option: { next_page_id: string | null; id: string; label: string }, question: string) => {
    setAnswers(prev => ({ ...prev, [question]: option.label }))
    const nextId = option.next_page_id ?? pages[currentPageIndex + 1]?.id
    if (nextId) goToPage(nextId)
  }

  const handleInputChange = (fieldName: string, value: string) => {
    setAnswers(prev => ({ ...prev, [fieldName]: value }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6">✓</div>
          <h1 className="font-serif text-4xl text-dark-text mb-4">Thank you!</h1>
          <p className="font-sans text-dark-text/60">
            Your responses have been received. We will be in touch soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {metaPixelId && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`,
          }}
        />
      )}

      <div className="min-h-screen bg-cream flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-dark-text/10">
          <div
            className="h-full bg-wine transition-all duration-500"
            style={{ width: `${((currentPageIndex + 1) / pages.length) * 100}%` }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg">
            {/* Step indicator */}
            <p className="font-mono text-xs uppercase tracking-widest text-wine mb-8">
              Step {currentPageIndex + 1} of {pages.length}
            </p>

            {/* Components */}
            <div className="space-y-6">
              {currentPage?.components.map((comp) => {
                switch (comp.type) {
                  case 'HEADING': {
                    const c = comp.content as HeadingContent
                    const Tag = c.size as 'h1' | 'h2' | 'h3'
                    const sizes = { h1: 'text-5xl', h2: 'text-4xl', h3: 'text-3xl' }
                    return (
                      <Tag key={comp.id} className={`font-serif ${sizes[c.size]} text-dark-text`}>
                        {c.text}
                      </Tag>
                    )
                  }
                  case 'TEXT': {
                    const c = comp.content as TextContent
                    return (
                      <p key={comp.id} className="font-sans text-dark-text/70 leading-relaxed">
                        {c.text}
                      </p>
                    )
                  }
                  case 'INPUT': {
                    const c = comp.content as InputContent
                    return (
                      <div key={comp.id}>
                        <label className="block font-mono text-xs uppercase tracking-widest text-dark-text/50 mb-2">
                          {c.label}{c.required && <span className="text-wine ml-1">*</span>}
                        </label>
                        <input
                          type={c.field_name === 'email' ? 'email' : c.field_name === 'phone' ? 'tel' : 'text'}
                          placeholder={c.placeholder}
                          value={(answers[c.field_name] as string) ?? ''}
                          onChange={e => handleInputChange(c.field_name, e.target.value)}
                          required={c.required}
                          className="w-full border border-dark-text bg-cream px-4 py-3 font-sans text-sm outline-none focus:border-wine focus:ring-1 focus:ring-wine"
                        />
                      </div>
                    )
                  }
                  case 'QUESTION': {
                    const c = comp.content as QuestionContent
                    return (
                      <div key={comp.id} className="space-y-3">
                        <p className="font-sans font-medium text-xl text-dark-text">{c.question}</p>
                        {c.options.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => handleQuestionSelect(opt, c.question)}
                            className={`w-full text-left border px-5 py-4 font-sans text-sm transition-all ${
                              answers[c.question] === opt.label
                                ? 'bg-wine text-cream border-wine'
                                : 'border-dark-text/20 text-dark-text hover:border-dark-text hover:bg-dark-text/5'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )
                  }
                  case 'BUTTON': {
                    const c = comp.content as ButtonContent
                    return (
                      <button
                        key={comp.id}
                        onClick={() => handleButtonAction(comp)}
                        disabled={submitting}
                        className="btn-brutalist text-base px-8 py-4 disabled:opacity-50"
                      >
                        {submitting ? 'Enviando...' : c.label}
                      </button>
                    )
                  }
                }
              })}
            </div>

            {/* Back button */}
            {history.length > 0 && (
              <button
                onClick={goBack}
                className="mt-8 font-sans text-sm text-dark-text/40 hover:text-dark-text transition-colors"
              >
                ← Voltar
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
