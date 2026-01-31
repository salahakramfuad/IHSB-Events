'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface DatePickerProps {
  value: string // Date string in YYYY-MM-DD format
  onChange: (date: string) => void
  disabled?: boolean
  required?: boolean
  minDate?: Date
}

export default function DatePicker({
  value,
  onChange,
  disabled,
  required,
  minDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value + 'T12:00:00') : new Date()
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value + 'T12:00:00'))
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
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

  return (
    <div className="relative">
      <div
        ref={inputRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 pl-11 border border-slate-200 rounded-xl bg-white transition-all cursor-pointer flex items-center ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300'
        } ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''}`}
      >
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {displayDate}
        </span>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Hidden input for form validation */}
      <input
        type="hidden"
        value={value}
        required={required && !value}
      />

      {isOpen && !disabled && (
        <div
          ref={calendarRef}
          className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[300px]"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <span className="font-semibold text-slate-900">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-slate-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
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
                    aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                    ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md'
                        : isToday
                          ? 'bg-indigo-100 text-indigo-700 font-semibold'
                          : isDisabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                const today = format(new Date(), 'yyyy-MM-dd')
                onChange(today)
                setIsOpen(false)
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                const tomorrowString = format(tomorrow, 'yyyy-MM-dd')
                onChange(tomorrowString)
                setIsOpen(false)
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Tomorrow
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
