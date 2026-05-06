'use client'

import { useTheme } from '@/lib/theme'

interface PageLayoutProps {
  label?: string
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}

export default function PageLayout({ label, title, description, action, children }: PageLayoutProps) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <div className="space-y-8 pb-12">
      {/* Header with bottom divider */}
      <div
        className="pb-6"
        style={{ borderBottom: `1px solid ${isLight ? 'rgba(0,102,204,0.12)' : 'rgba(255,255,255,0.07)'}` }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            {label && (
              <p
                className="text-[10px] font-mono uppercase tracking-[0.25em] mb-2 flex items-center gap-2"
                style={{ color: isLight ? '#0066CC' : '#62666d' }}
              >
                {label}
              </p>
            )}
            <h1
              className="text-4xl font-semibold tracking-tight"
              style={{ color: isLight ? '#1D1D1F' : '#f7f8f8' }}
            >
              {title}
            </h1>
            {description && (
              <p
                className="mt-2 text-sm"
                style={{ color: isLight ? '#6E6E73' : '#8a8f98' }}
              >
                {description}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}
