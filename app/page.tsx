import { Metadata } from 'next'
import { Mail, Phone } from 'lucide-react'
import { getPublicEvents } from '@/app/events/actions'
import RealtimeEventsList from '@/components/RealtimeEventsList'
import PublicHeader from '@/components/PublicHeader'

export const metadata: Metadata = {
  title: 'IHSB Events',
  description: 'Discover upcoming IHSB events. Register for workshops and activities.',
}

export const revalidate = 60

export default async function HomePage() {
  const initialEvents = await getPublicEvents()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-amber-50/30 pb-24 sm:pb-28">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <section id="events-list">
          <RealtimeEventsList initialEvents={initialEvents} />
        </section>
      </main>

      {/* Always visible at bottom of viewport */}
      <section
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-indigo-100 bg-white/95 px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur sm:px-6"
        aria-label="Collaborate and contact"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <p className="text-base font-semibold text-slate-800 sm:text-lg">
            Want to collaborate?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            <a
              href="mailto:contact@ihsb.com"
              className="inline-flex items-center gap-2 text-slate-600 transition hover:text-indigo-600"
            >
              <Mail className="h-5 w-5 shrink-0" aria-hidden />
              <span>contact@ihsb.com</span>
            </a>
            <a
              href="tel:+1234567890"
              className="inline-flex items-center gap-2 text-slate-600 transition hover:text-indigo-600"
            >
              <Phone className="h-5 w-5 shrink-0" aria-hidden />
              <span>+1 (234) 567-890</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
