export type Event = {
  id: string
  title: string
  date: string | string[]
  time?: string
  location: string
  description: string
  fullDescription?: string
  image?: string
  eligibility?: string
  venue?: string
  agenda?: string
  tags?: string[]
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  createdByName?: string
  createdByEmail?: string
}
