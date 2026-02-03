'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface DatePickerProps {
  value: string // Date string in YYYY-MM-DD format
  onChange: (date: string) => void
  disabled?: boolean
  required?: boolean
  minDate?: Date
  /** When true, show native date input for simpler editing */
  simple?: boolean
}

export default function DatePicker({
  value,
  onChange,
  disabled,
  required,
  minDate,
  simple = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value + 'T12:00:00') : new Date()
  )
  const triggerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value + 'T12:00:00'))
    }
  }, [value])

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 8, left: rect.left })
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        calendarRef.current &&
        !calendarRef.current.contains(target) &&
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

  const handleDateSelect = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    onChange(dateString)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const displayDate = value
    ? format(new Date(value + 'T12:00:00'), 'MMM d, yyyy')
    : 'Select date'

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth)

  const days: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth)
    if (direction === 'prev') {
      newDate.setMonth(month - 1)
    } else {
      newDate.setMonth(month + 1)
    }
    setCurrentMonth(newDate)
  }

  const isDateDisabled = (day: number) => {
    if (!minDate) return false
    const dayDate = new Date(year, month, day)
    const minDateStart = new Date(minDate)
    minDateStart.setHours(0, 0, 0, 0)
    dayDate.setHours(0, 0, 0, 0)
    return dayDate < minDateStart
  }

  if (simple) {
    return (
      <div className="relative">
        <Calendar className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 [color-scheme:light]"
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
        <Calendar className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <span className={value ? 'font-medium text-slate-900' : 'text-slate-400'}>
          {displayDate}
        </span>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear date"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input type="hidden" value={value} required={required && !value} />

      {isOpen &&
        !disabled &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={calendarRef}
            className="fixed z-[9999] min-w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            style={{ top: position.top, left: position.left }}
          >
          <div className="bg-slate-50/80 px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold text-slate-800">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="py-1.5 text-center text-xs font-medium text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const dayDate = new Date(year, month, day)
                const dateString = format(dayDate, 'yyyy-MM-dd')
                const isToday = dateString === format(new Date(), 'yyyy-MM-dd')
                const isSelected = value === dateString
                const isDisabled = isDateDisabled(day)

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !isDisabled && handleDateSelect(dayDate)}
                    disabled={isDisabled}
                    className={`
                      flex aspect-square items-center justify-center rounded-xl text-sm font-medium transition
                      ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : isToday
                            ? 'bg-indigo-50 font-semibold text-indigo-700 ring-1 ring-indigo-200'
                            : isDisabled
                              ? 'cursor-not-allowed text-slate-300'
                              : 'text-slate-700 hover:bg-slate-100'
                      }
                    `}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  onChange(format(new Date(), 'yyyy-MM-dd'))
                  setIsOpen(false)
                }}
                className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  onChange(format(tomorrow, 'yyyy-MM-dd'))
                  setIsOpen(false)
                }}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Tomorrow
              </button>
            </div>
          </div>
        </div>,
          document.body
        )}
    </div>
  )
}
