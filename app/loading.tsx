import PublicHeader from '@/components/PublicHeader'

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-2 h-6 w-24 rounded-full bg-slate-200 animate-pulse" />
          <div className="mx-auto h-10 w-72 max-w-full rounded-lg bg-slate-200 animate-pulse" />
          <div className="mx-auto mt-3 h-5 w-96 max-w-full rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
              <div className="aspect-[16/10] bg-slate-200 animate-pulse" />
              <div className="space-y-2 p-5">
                <div className="h-5 w-3/4 rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
