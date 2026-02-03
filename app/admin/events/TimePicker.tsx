'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Clock } from 'lucide-react'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  /** When true, show simple text input for quicker editing */
  simple?: boolean
}

export default function TimePicker({ value, onChange, disabled, simple = false }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const defaultTime = '9:00 AM - 5:00 PM'
  const [startHour, setStartHour] = useState('9')
  const [startMinute, setStartMinute] = useState('00')
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>('AM')
  const [endHour, setEndHour] = useState('5')
  const [endMinute, setEndMinute] = useState('00')
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>('PM')
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 8, left: rect.left })
    }
  }, [isOpen])

  useEffect(() => {
    const timeToParse = value || defaultTime
    const match = timeToParse.match(
      /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
    )
    if (match) {
      setStartHour(match[1])
      setStartMinute(match[2])
      setStartPeriod(match[3].toUpperCase() as 'AM' | 'PM')
      setEndHour(match[4])
      setEndMinute(match[5])
      setEndPeriod(match[6].toUpperCase() as 'AM' | 'PM')
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const formatTime = () => {
    return `${startHour}:${startMinute} ${startPeriod} - ${endHour}:${endMinute} ${endPeriod}`
  }

  const handleTimeChange = () => {
    const timeString = formatTime()
    onChange(timeString)
  }

  useEffect(() => {
    if (isOpen) {
      handleTimeChange()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startHour, startMinute, startPeriod, endHour, endMinute, endPeriod])

  useEffect(() => {
    if (!value) {
      const defaultTimeString = formatTime()
      onChange(defaultTimeString)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  const minutes = ['00', '15', '30', '45']
  const periods: ('AM' | 'PM')[] = ['AM', 'PM']

  const displayValue = value || defaultTime

  const selectClass =
    'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

  if (simple) {
    return (
      <div className="relative">
        <Clock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g. 9:00 AM - 5:00 PM"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex w-full cursor-pointer items-center rounded-xl border bg-white px-4 py-3 pl-11 transition-all ${
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-slate-300'
        } ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
            : 'border-slate-200'
        }`}
      >
        <Clock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <span className="font-medium text-slate-900">{displayValue}</span>
      </div>

      {isOpen &&
        !disabled &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] min-w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            style={{ top: position.top, left: position.left }}
          >
          <div className="space-y-4 p-4">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Start time
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className={selectClass}
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-slate-400">:</span>
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  className={selectClass}
                >
                  {minutes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={startPeriod}
                  onChange={(e) => setStartPeriod(e.target.value as 'AM' | 'PM')}
                  className={selectClass}
                >
                  {periods.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">to</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                End time
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className={selectClass}
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-slate-400">:</span>
                <select
                  value={endMinute}
                  onChange={(e) => setEndMinute(e.target.value)}
                  className={selectClass}
                >
                  {minutes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={endPeriod}
                  onChange={(e) => setEndPeriod(e.target.value as 'AM' | 'PM')}
                  className={selectClass}
                >
                  {periods.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: 'Morning', sh: '9', sm: '00', sp: 'AM' as const, eh: '12', em: '00', ep: 'PM' as const },
                { label: 'Afternoon', sh: '2', sm: '00', sp: 'PM' as const, eh: '5', em: '00', ep: 'PM' as const },
                { label: 'Full day', sh: '9', sm: '00', sp: 'AM' as const, eh: '5', em: '00', ep: 'PM' as const },
              ].map(({ label, sh, sm, sp, eh, em, ep }) => (
                <button
                  key={label}
                  type="button"
                  title={
                    label === 'Morning'
                      ? '9:00 AM - 12:00 PM'
                      : label === 'Afternoon'
                        ? '2:00 PM - 5:00 PM'
                        : '9:00 AM - 5:00 PM'
                  }
                  onClick={() => {
                    setStartHour(sh)
                    setStartMinute(sm)
                    setStartPeriod(sp)
                    setEndHour(eh)
                    setEndMinute(em)
                    setEndPeriod(ep)
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Done
            </button>
          </div>
        </div>,
          document.body
        )}
    </div>
  )
}
