import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Users,
  Pencil,
  User,
  Banknote,
} from 'lucide-react'
import type { Event } from '@/types/event'
import type { Registration } from '@/types/registration'
import EventLogo from '@/components/EventLogo'
import { getOptimizedImageUrl } from '@/lib/cloudinary'
import { parseEventDates, formatEventDates, isEventUpcoming } from '@/lib/dateUtils'
import dynamic from 'next/dynamic'
import ExportRegistrationsButton from './registrations/ExportRegistrationsButton'
import ExpandableSection from './ExpandableSection'
import WinnersSection from './WinnersSection'

const RegistrationsTableWithSearch = dynamic(
  () => import('./registrations/RegistrationsTableWithSearch'),
  { loading: () => <div className="h-64 animate-pulse rounded-2xl bg-slate-100" /> }
)

interface EventDetailWithEditProps {
  event: Event
  registrations: Registration[]
  canEdit: boolean
  isSuperAdmin: boolean
}

function getAmountForReg(event: Event, reg: Registration): number {
  if (!event.isPaid || reg.paymentStatus !== 'completed') return 0
  const cats = event.categories
  const catAmounts = event.categoryAmounts
  if (Array.isArray(cats) && cats.length > 0 && catAmounts && reg.category) {
    return typeof catAmounts[reg.category] === 'number' ? catAmounts[reg.category]! : (event.amount ?? 0)
  }
  return typeof event.amount === 'number' ? event.amount : 0
}

export default function EventDetailWithEdit({
  event,
  registrations,
  canEdit,
  isSuperAdmin,
}: EventDetailWithEditProps) {
  const dates = parseEventDates(event.date)
  const dateStr = dates.length > 0 ? formatEventDates(dates, 'long') : 'TBA'
  const venue = event.venue || event.location || 'TBA'
  const upcoming = isEventUpcoming(event.date)
  const hasImage =
    event.image?.trim() &&
    (event.image.startsWith('http') || event.image.startsWith('/'))

  const winners = registrations
    .filter((r) => r.position != null && r.position >= 1 && r.position <= 20)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  const hasCategories = Array.isArray(event.categories) && event.categories.length > 0
  const winnersByCategory = hasCategories
    ? winners.reduce<Record<string, typeof winners>>((acc, w) => {
        const cat = w.category?.trim() || 'Uncategorized'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(w)
        return acc
      }, {})
    : null
  const categoryOrder = hasCategories && winnersByCategory
    ? [...(event.categories ?? []).filter((c) => winnersByCategory[c]), ...Object.keys(winnersByCategory).filter((k) => !(event.categories ?? []).includes(k))]
    : []

  const totalAmountCollected = event.isPaid
    ? registrations.reduce((sum, r) => sum + getAmountForReg(event, r), 0)
    : 0
  const paidCount = registrations.filter((r) => r.paymentStatus === 'completed').length

  const collapsedSummary = (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
      <span className="inline-flex items-center gap-2">
        <Calendar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        {dateStr}
      </span>
      {event.time && (
        <span className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          {event.time}
        </span>
      )}
      <span className="inline-flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        {venue}
      </span>
      <span className="inline-flex items-center gap-2">
        <Users className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
      </span>
    </div>
  )

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Events
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{event.title}</h1>
        </div>
        {canEdit && (
          <Link
            href={`/admin/events/${event.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit event
          </Link>
        )}
      </div>

      <ExpandableSection
        header="Event Details"
        defaultExpanded={true}
        collapsedSummary={collapsedSummary}
      >
        <>
          {hasImage && (
            <div className="relative aspect-[21/9] w-full overflow-hidden bg-slate-100">
              <Image
                src={getOptimizedImageUrl(event.image, { w: 1024 }) ?? event.image!}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
              <div className="absolute left-6 top-6">
                <EventLogo title={event.title} logo={event.logo} size="md" className="shadow-lg" />
              </div>
            </div>
          )}
          <div className="p-6 sm:p-8">
            {!hasImage && (
              <div className="mb-6">
                <EventLogo title={event.title} logo={event.logo} size="lg" />
              </div>
            )}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  upcoming
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {upcoming ? 'Upcoming' : 'Past'}
              </span>
              {event.categories && event.categories.length > 0 && (
                <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                  {event.categories.length} {event.categories.length === 1 ? 'category' : 'categories'}
                </span>
              )}
            </div>
            <p className="mb-4 text-slate-600">{event.description}</p>
            <p className="mb-6 flex items-center gap-2 text-sm text-slate-500">
              <User className="h-4 w-4 shrink-0" aria-hidden />
              Created by {event.createdByName || '—'}
            </p>
            {event.fullDescription && (
              <div className="mb-6 rounded-xl bg-slate-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-700">
                  Full description
                </h3>
                <p className="whitespace-pre-wrap text-sm text-slate-600">
                  {event.fullDescription}
                </p>
              </div>
            )}
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar
                  className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                  aria-hidden
                />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Date
                  </dt>
                  <dd className="text-slate-900">{dateStr}</dd>
                </div>
              </div>
              {event.time && (
                <div className="flex items-start gap-3">
                  <Clock
                    className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Time
                    </dt>
                    <dd className="text-slate-900">{event.time}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin
                  className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                  aria-hidden
                />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Location / Venue
                  </dt>
                  <dd className="text-slate-900">{venue}</dd>
                </div>
              </div>
              {Array.isArray(event.contactPersons) &&
                event.contactPersons.length > 0 &&
                event.contactPersons
                  .filter((p) => (p.name ?? '').trim() || (p.phone ?? '').trim())
                  .map((cp, i) => (
                    <div key={i} className="flex items-start gap-3 sm:col-span-2">
                      <Phone
                        className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                        aria-hidden
                      />
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Contact
                        </dt>
                        <dd className="text-slate-900">
                          {cp.name?.trim() ? (
                            <>
                              {cp.name.trim()}
                              {cp.position?.trim() && (
                                <span className="ml-1.5 text-slate-500">({cp.position.trim()})</span>
                              )}
                              {cp.phone?.trim() && (
                                <a
                                  href={`tel:${cp.phone.trim().replace(/\D/g, '')}`}
                                  className="ml-2 text-indigo-600 hover:underline"
                                >
                                  {cp.phone.trim()}
                                </a>
                              )}
                            </>
                          ) : (
                            cp.phone?.trim() && (
                              <a
                                href={`tel:${cp.phone.trim().replace(/\D/g, '')}`}
                                className="text-indigo-600 hover:underline"
                              >
                                {cp.position?.trim() ? `${cp.position.trim()}: ` : ''}
                                {cp.phone.trim()}
                              </a>
                            )
                          )}
                        </dd>
                      </div>
                    </div>
                  ))}
            </dl>
            {event.categories && event.categories.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {event.categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      </ExpandableSection>

      <WinnersSection
        event={event}
        winners={winners}
        winnersByCategory={winnersByCategory}
        categoryOrder={categoryOrder}
        hasCategories={!!hasCategories}
        canEdit={canEdit}
      />

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Registrations</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-6 py-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Users className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {registrations.length}
              </p>
              <p className="text-sm text-slate-500">Total registrations</p>
            </div>
          </div>
          {event.isPaid && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-6 py-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Banknote className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  ৳{totalAmountCollected.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">
                  Total collected ({paidCount} paid)
                </p>
              </div>
            </div>
          )}
          <ExportRegistrationsButton
            event={event}
            eventId={event.id}
            eventTitle={event.title}
            registrations={registrations}
          />
        </div>
      </section>

      <section>
        <RegistrationsTableWithSearch
          eventId={event.id}
          event={event}
          registrations={registrations}
          canEdit={canEdit}
          isSuperAdmin={isSuperAdmin}
          eventCategories={event.categories}
        />
      </section>
    </div>
  )
}
