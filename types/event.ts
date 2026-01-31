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
  /** ISO date when awardee results were published; null = not published */
  resultsPublishedAt?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  createdByName?: string
  createdByEmail?: string
}
