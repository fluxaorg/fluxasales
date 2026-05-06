import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import NavigationProgress from '@/components/ui/NavigationProgress'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Fluxa Sales — High-Conversion Funnels',
  description: 'Capture qualified leads with high-conversion interactive funnels.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" translate="no" className={`notranslate ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        <NavigationProgress />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '14px',
              borderRadius: '12px',
              background: '#1A1A1C',
              color: '#F7F8F8',
              border: '1px solid rgba(255,255,255,0.08)',
            },
          }}
        />
      </body>
    </html>
  )
}
