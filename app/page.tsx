import Navbar from '@/components/landing/Navbar'
import HeroNew from '@/components/landing/HeroNew'
import Marquee from '@/components/landing/Marquee'
import StatsSection from '@/components/landing/StatsSection'
import HowItWorks from '@/components/landing/HowItWorks'
import Features from '@/components/landing/Features'
import ForWhomSection from '@/components/landing/ForWhomSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import Pricing from '@/components/landing/Pricing'
import FAQ from '@/components/landing/FAQ'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroNew />
      <Marquee />
      <StatsSection />
      <HowItWorks />
      <Features />
      <ForWhomSection />
      <TestimonialsSection />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
}
