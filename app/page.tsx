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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>
}) {
  const initialEvents = await getPublicEvents()
  const { payment: paymentStatus } = await searchParams

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/70 via-white to-rose-50/50 pb-24 sm:pb-28">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {paymentStatus === 'failed' && (
          <div className="mb-6 rounded-2xl border-2 border-red-200/80 bg-red-50/95 p-4 text-center">
            <p className="font-semibold text-red-800">Payment failed</p>
            <p className="mt-1 text-sm text-red-700">Please try registering again when you visit the event.</p>
          </div>
        )}
        {paymentStatus === 'cancelled' && (
          <div className="mb-6 rounded-2xl border-2 border-amber-200/80 bg-amber-50/95 p-4 text-center">
            <p className="font-semibold text-amber-800">Payment cancelled</p>
            <p className="mt-1 text-sm text-amber-700">You can register again when ready.</p>
          </div>
        )}
        {paymentStatus === 'success' && (
          <div className="mb-6 rounded-2xl border-2 border-emerald-200/80 bg-emerald-50/95 p-4 text-center">
            <p className="font-semibold text-emerald-800">Registration complete!</p>
            <p className="mt-1 text-sm text-emerald-700">A confirmation email has been sent to your inbox.</p>
          </div>
        )}
        <p className="mb-10 text-center text-lg text-slate-600 sm:text-xl">
          Discover events and <span className="font-semibold text-amber-600">celebrate</span> with us.
        </p>
        <section id="events-list">
          <RealtimeEventsList initialEvents={initialEvents} />
        </section>
      </main>

      {/* Always visible at bottom */}
      <section
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-amber-200/60 bg-white/90 px-4 py-4 backdrop-blur sm:px-6"
        aria-label="Collaborate and contact"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <p className="text-base font-semibold text-slate-800 sm:text-lg">
            Want to collaborate?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            <a
              href="mailto:contact@ihsb.com"
              className="inline-flex items-center gap-2 text-slate-600 transition hover:text-amber-600"
            >
              <Mail className="h-5 w-5 shrink-0" aria-hidden />
              <span>contact@ihsb.com</span>
            </a>
            <a
              href="tel:+1234567890"
              className="inline-flex items-center gap-2 text-slate-600 transition hover:text-amber-600"
            >
              <Phone className="h-5 w-5 shrink-0" aria-hidden />
              <span>+1 (234) 567-890</span>
            </a>
          </div>
        </div>
        <a
          href="https://github.com/salahakramfuad"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 transition hover:text-amber-600 sm:right-6"
        >
          Built by Mohammad Salah
        </a>
      </section>
    </div>
  )
}
