function generateRandomSuffix(length: number = 5): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

export function generateRegistrationId(date: Date = new Date()): string {
  const datePart = formatDate(date)
  const randomSuffix = generateRandomSuffix(5)
  return `REG-${datePart}-${randomSuffix}`
}
