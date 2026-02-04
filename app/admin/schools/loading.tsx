export default function SchoolsLoading() {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-8 w-40 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-10 w-28 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="h-5 w-5 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
        <div className="h-10 w-[200px] rounded-xl bg-slate-200 animate-pulse" />
      </div>

      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-3 h-10 w-10 rounded-xl bg-slate-200 animate-pulse" />
            <div className="mb-4 h-4 w-24 rounded bg-slate-200 animate-pulse" />
            <div className="h-8 w-16 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 h-4 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="h-48 w-48 rounded-full bg-slate-200 animate-pulse" />
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 h-4 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="h-48 w-48 rounded-full bg-slate-200 animate-pulse" />
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="h-10 w-full max-w-sm rounded-xl bg-slate-200 animate-pulse" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3.5">
          <div className="flex gap-4">
            <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
            <div className="ml-auto h-4 w-24 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-5 w-5 rounded bg-slate-200 animate-pulse" />
              <div className="h-4 flex-1 rounded bg-slate-200 animate-pulse" />
              <div className="h-4 w-12 rounded bg-slate-200 animate-pulse" />
              <div className="h-4 w-12 rounded bg-slate-200 animate-pulse" />
              <div className="h-8 w-16 rounded-lg bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
