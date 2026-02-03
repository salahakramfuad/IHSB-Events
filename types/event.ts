export type Event = {
  id: string
  title: string
  date: string | string[]
  time?: string
  location: string
  description: string
  fullDescription?: string
  image?: string
  /** Optional logo URL; if absent, initials from title are shown */
  logo?: string
  eligibility?: string
  venue?: string
  agenda?: string
  tags?: string[]
  /** Optional categories; if set, registrants must choose one when registering */
  categories?: string[]
  /** Color theme for registration PDFs: indigo, purple, blue, emerald, amber, rose */
  colorTheme?: string
  /** If true, registration requires bKash payment */
  isPaid?: boolean
  /** Amount in BDT (used when isPaid and no categories, or as fallback) */
  amount?: number
  /** Per-category amounts in BDT. When set, overrides amount for events with categories. Use 0 for free category. */
  categoryAmounts?: Record<string, number>
  /** ISO date when awardee results were published; null = not published */
  resultsPublishedAt?: string | null
  /** Contact persons for the event (name, phone, position) */
  contactPersons?: { name: string; phone: string; position?: string }[]
  /** If true, attach registration PDF to confirmation email; otherwise email only */
  sendPdfOnRegistration?: boolean
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  createdByName?: string
  createdByEmail?: string
}
