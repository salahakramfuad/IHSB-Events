/**
 * Returns a Cloudinary-optimized URL with f_auto, q_auto, and optional dimensions.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options?: { w?: number; h?: number; q?: string }
): string | undefined {
  if (!url?.includes('res.cloudinary.com')) return url ?? undefined
  const [base, rest] = url.split('/image/upload/')
  if (!base || !rest) return url ?? undefined
  const transforms = [
    'f_auto',
    'q_auto',
    options?.w ? `w_${options.w}` : '',
    options?.h ? `h_${options.h}` : '',
    options?.q ? `q_${options.q}` : '',
  ]
    .filter(Boolean)
    .join(',')
  return `${base}/image/upload/${transforms}/${rest}`
}
