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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-white to-amber-50/50 pb-24 sm:pb-28">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <section id="events-list">
          <RealtimeEventsList initialEvents={initialEvents} />
        </section>
      </main>

      {/* Always visible at bottom of viewport */}
      <section
        className="fixed bottom-0 left-0 right-0 z-10 border-t-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-4 shadow-[0_-4px_12px_-2px_rgba(99,102,241,0.15)] backdrop-blur sm:px-6"
        aria-label="Collaborate and contact"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <p className="text-base font-semibold text-indigo-900 sm:text-lg">
            Want to collaborate?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            <a
              href="mailto:contact@ihsb.com"
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-slate-700 transition hover:bg-indigo-100 hover:text-indigo-700"
            >
              <Mail className="h-5 w-5 shrink-0" aria-hidden />
              <span>contact@ihsb.com</span>
            </a>
            <a
              href="tel:+1234567890"
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-slate-700 transition hover:bg-indigo-100 hover:text-indigo-700"
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
