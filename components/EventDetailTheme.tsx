'use client'

import { useState, useEffect, useRef } from 'react'

const DEFAULT_ACCENT = '220 70% 50%' // fallback hsl (blue-ish)

function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function getDominantHslFromImageUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 32
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(DEFAULT_ACCENT)
          return
        }
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data
        let r = 0
        let g = 0
        let b = 0
        let count = 0
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3]
          if (alpha > 128) {
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
            count++
          }
        }
        if (count === 0) {
          resolve(DEFAULT_ACCENT)
          return
        }
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)
        const hsl = rgbToHsl(r, g, b)
        resolve(hsl)
      } catch {
        resolve(DEFAULT_ACCENT)
      }
    }
    img.onerror = () => resolve(DEFAULT_ACCENT)
    img.src = url
  })
}

interface EventDetailThemeProps {
  imageUrl: string | null
  children: React.ReactNode
}

export default function EventDetailTheme({ imageUrl, children }: EventDetailThemeProps) {
  const [accentHsl, setAccentHsl] = useState(DEFAULT_ACCENT)
  const extracted = useRef(false)

  useEffect(() => {
    if (!imageUrl || extracted.current) return
    extracted.current = true
    getDominantHslFromImageUrl(imageUrl).then(setAccentHsl)
  }, [imageUrl])

  const style = {
    ['--event-accent' as string]: accentHsl,
  } as React.CSSProperties

  return (
    <div className="event-detail-theme min-h-screen" style={style}>
      {/* Hero: full-width event photo */}
      <div className="relative w-full">
        {imageUrl ? (
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-slate-200 sm:aspect-[3/1]">
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
              aria-hidden
            />
          </div>
        ) : (
          <div className="aspect-[21/9] w-full bg-slate-200 sm:aspect-[3/1]" aria-hidden />
        )}
      </div>

      {/* Content below hero */}
      <div className="relative -mt-16 mx-auto max-w-6xl px-4 pb-24 sm:-mt-24">
        {children}
      </div>
    </div>
  )
}
