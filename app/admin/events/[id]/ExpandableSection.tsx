'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandableSectionProps {
  header: string
  children: React.ReactNode
  collapsedSummary?: React.ReactNode
  defaultExpanded?: boolean
}

export default function ExpandableSection({
  header,
  children,
  collapsedSummary,
  defaultExpanded = true,
}: ExpandableSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <section className="mb-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-left transition hover:bg-slate-100"
      >
        <h2 className="text-sm font-semibold text-slate-700">{header}</h2>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" aria-hidden />
        )}
      </button>
      {expanded ? (
        children
      ) : collapsedSummary ? (
        <div className="p-4 sm:p-6">{collapsedSummary}</div>
      ) : null}
    </section>
  )
}
