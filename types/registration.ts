export type Registration = {
  id: string
  registrationId: string
  name: string
  email: string
  phone: string
  school: string
  note?: string
  /** 1–20 = featured position; null = no position */
  position: number | null
  createdAt: Date | string
}

/** Public-facing featured applicant (position 1–20) */
export type FeaturedApplicant = {
  position: number
  name: string
  school?: string
}
