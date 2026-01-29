export function parseEventDates(date: string | string[] | undefined): string[] {
  if (!date) return []
  if (Array.isArray(date)) return date
  if (typeof date === 'string' && date.includes(',')) {
    return date.split(',').map((d) => d.trim()).filter((d) => d.length > 0)
  }
  return [date]
}

export function formatEventDates(dates: string[], formatType: 'short' | 'long' = 'long'): string {
  if (dates.length === 0) return 'No date set'
  if (dates.length === 1) {
    const date = new Date(dates[0])
    return formatType === 'short'
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
  if (dates.length === 2) {
    const date1 = new Date(dates[0])
    const date2 = new Date(dates[dates.length - 1])
    return `${date1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${date2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  const firstDate = new Date(dates[0])
  const lastDate = new Date(dates[dates.length - 1])
  return `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${dates.length} dates)`
}

export function getFirstEventDate(date: string | string[] | undefined): Date | null {
  const dates = parseEventDates(date)
  if (dates.length === 0) return null
  const sortedDates = [...dates].sort()
  return new Date(sortedDates[0])
}

export function getLastEventDate(date: string | string[] | undefined): Date | null {
  const dates = parseEventDates(date)
  if (dates.length === 0) return null
  const sortedDates = [...dates].sort()
  return new Date(sortedDates[sortedDates.length - 1])
}

export function hasEventPassed(date: string | string[] | undefined): boolean {
  const dates = parseEventDates(date)
  if (dates.length === 0) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return dates.every((d) => {
    const eventDate = new Date(d)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate < now
  })
}

export function isEventUpcoming(date: string | string[] | undefined): boolean {
  const dates = parseEventDates(date)
  if (dates.length === 0) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return dates.some((d) => {
    const eventDate = new Date(d)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate >= now
  })
}
