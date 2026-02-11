import Link from 'next/link'
import Image from 'next/image'
import PublicHeaderNav from './PublicHeaderNav'

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-lg font-semibold text-slate-900 transition hover:text-amber-600"
        >
          <Image
            src="/logo.png"
            alt="IHSB Events"
            width={36}
            height={36}
            className="rounded-lg object-contain"
            priority
          />
          IHSB Events
        </Link>
        <PublicHeaderNav />
      </div>
    </header>
  )
}

