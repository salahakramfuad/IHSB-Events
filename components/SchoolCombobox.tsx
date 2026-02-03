'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type School = {
  id: string
  name: string
  createdAt: string
}

interface SchoolComboboxProps {
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  className?: string
  required?: boolean
  disabled?: boolean
}

export default function SchoolCombobox({
  value,
  onChange,
  id = 'school',
  placeholder = 'Select or type school name',
  className = '',
  required = false,
  disabled = false,
}: SchoolComboboxProps) {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    let cancelled = false
    fetch('/api/schools')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setSchools(Array.isArray(data) ? data : [])
      })
      .catch(() => setSchools([]))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const query = inputValue.trim().toLowerCase()
  const filtered = query
    ? schools.filter((s) => s.name.toLowerCase().includes(query))
    : schools
  const exactMatch = query && schools.some((s) => s.name.toLowerCase() === query)
  const showAddOption = query && !exactMatch

  const handleSelect = useCallback(
    (name: string) => {
      onChange(name)
      setInputValue(name)
      setOpen(false)
    },
    [onChange]
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed'

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        required={required}
        disabled={disabled}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay to allow click on dropdown item
          setTimeout(() => setOpen(false), 150)
        }}
        className={inputClass}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        role="combobox"
      />
      {open && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {loading ? (
            <li className="px-4 py-3 text-sm text-slate-500">Loading schools…</li>
          ) : (
            <>
              {filtered.map((school) => (
                <li
                  key={school.id}
                  role="option"
                  tabIndex={-1}
                  className="cursor-pointer px-4 py-2.5 text-sm text-slate-900 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                  onClick={() => handleSelect(school.name)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {school.name}
                </li>
              ))}
              {showAddOption && (
                <li
                  role="option"
                  tabIndex={-1}
                  className="cursor-pointer border-t border-slate-100 px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                  onClick={() => handleSelect(inputValue.trim())}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  Add &quot;{inputValue.trim()}&quot; as new school
                </li>
              )}
              {!loading && filtered.length === 0 && !showAddOption && (
                <li className="px-4 py-3 text-sm text-slate-500">
                  {query ? 'No matching schools. Type to add a new one.' : 'No schools yet. Type to add one.'}
                </li>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  )
}
