'use client'

import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const defaultTime = '9:00 AM - 5:00 PM'
  const [startHour, setStartHour] = useState('9')
  const [startMinute, setStartMinute] = useState('00')
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>('AM')
  const [endHour, setEndHour] = useState('5')
  const [endMinute, setEndMinute] = useState('00')
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>('PM')
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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
    'flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all'

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 pl-11 border border-slate-200 rounded-xl bg-white transition-all cursor-pointer flex items-center ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300'
        } ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''}`}
      >
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <span className="text-slate-900">{displayValue}</span>
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[320px]">
          {/* Start Time */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Start Time
            </label>
            <div className="flex items-center gap-2">
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className={selectClass}
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
              <span className="text-slate-500 font-medium">:</span>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(e.target.value)}
                className={selectClass}
              >
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
              <select
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value as 'AM' | 'PM')}
                className={selectClass}
              >
                {periods.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* End Time */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              End Time
            </label>
            <div className="flex items-center gap-2">
              <select
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className={selectClass}
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
              <span className="text-slate-500 font-medium">:</span>
              <select
                value={endMinute}
                onChange={(e) => setEndMinute(e.target.value)}
                className={selectClass}
              >
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
              <select
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value as 'AM' | 'PM')}
                className={selectClass}
              >
                {periods.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Done button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
