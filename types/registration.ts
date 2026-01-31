export type Registration = {
  id: string
  registrationId: string
  name: string
  email: string
  phone: string
  school: string
  note?: string
  /** Category chosen when event has categories */
  category?: string
  /** 1–20 = featured position; null = no position */
  position: number | null
  /** ISO date when result email was sent; null = not yet notified */
  resultNotifiedAt?: string | null
  createdAt: Date | string
}

/** Public-facing featured applicant (position 1–20) */
export type FeaturedApplicant = {
  position: number
  name: string
  school?: string
}
