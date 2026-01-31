import Image from 'next/image'

function getInitials(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return '?'
  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const first = words[0][0]
    const second = words[1][0]
    return (first + second).toUpperCase()
  }
  if (trimmed.length >= 2) {
    return trimmed.slice(0, 2).toUpperCase()
  }
  return trimmed[0].toUpperCase()
}

function isValidLogoUrl(url?: string | null): boolean {
  if (!url?.trim()) return false
  const u = url.trim()
  return u.startsWith('http') || u.startsWith('/')
}

interface EventLogoProps {
  title: string
  logo?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { container: 'h-10 w-10 text-sm', img: 40 },
  md: { container: 'h-14 w-14 text-base', img: 56 },
  lg: { container: 'h-20 w-20 text-2xl', img: 80 },
}

export default function EventLogo({
  title,
  logo,
  size = 'md',
  className = '',
}: EventLogoProps) {
  const dims = sizes[size]
  const hasLogo = isValidLogoUrl(logo)

  if (hasLogo) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ${dims.container} ${className}`}
      >
        <Image
          src={logo!}
          alt={`${title} logo`}
          width={dims.img}
          height={dims.img}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  const initials = getInitials(title)
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-700 ${dims.container} ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  )
}
