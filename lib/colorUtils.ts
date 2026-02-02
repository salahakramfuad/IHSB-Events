/**
 * Convert hex to HSL string for CSS (e.g. "220 70% 50%").
 * Used for event theming on server components.
 */
export function hexToHsl(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6 && clean.length !== 3) return '220 70% 50%'
  let r = 0
  let g = 0
  let b = 0
  if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16)
    g = parseInt(clean.slice(2, 4), 16)
    b = parseInt(clean.slice(4, 6), 16)
  } else {
    r = parseInt(clean[0] + clean[0], 16)
    g = parseInt(clean[1] + clean[1], 16)
    b = parseInt(clean[2] + clean[2], 16)
  }
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

/** Light background color from hex (very subtle tint, ~6% opacity) */
export function hexToLightBg(hex: string): string {
  const hsl = hexToHsl(hex)
  return `hsl(${hsl} / 0.06)`
}
