/**
 * Event images: prefer real API URLs, then category photos (verified Unsplash),
 * then local SVG assets that always load.
 */

/** Local SVGs — guaranteed to work offline */
const CATEGORY_SVG: Record<string, string> = {
  concert: '/assets/events/concert.svg',
  music: '/assets/events/music.svg',
  festival: '/assets/events/festival.svg',
  comedy: '/assets/events/comedy.svg',
  food: '/assets/events/food.svg',
  tech: '/assets/events/tech.svg',
  conference: '/assets/events/conference.svg',
  sports: '/assets/events/sports.svg',
  workshop: '/assets/events/workshop.svg',
  theatre: '/assets/events/theatre.svg',
  nightlife: '/assets/events/nightlife.svg',
  movie: '/assets/events/movie.svg',
  market: '/assets/events/market.svg',
  default: '/assets/events/default.svg',
}

/** Verified HTTP 200 Unsplash URLs only */
const CATEGORY_PHOTOS: Record<string, string[]> = {
  concert: [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=900&q=80&auto=format&fit=crop',
  ],
  music: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80&auto=format&fit=crop',
  ],
  festival: [
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=900&q=80&auto=format&fit=crop',
  ],
  comedy: [
    'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80&auto=format&fit=crop',
  ],
  food: [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80&auto=format&fit=crop',
  ],
  tech: [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&q=80&auto=format&fit=crop',
  ],
  conference: [
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560439514-4e9645039924?w=900&q=80&auto=format&fit=crop',
  ],
  sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80&auto=format&fit=crop',
  ],
  workshop: [
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80&auto=format&fit=crop',
  ],
  theatre: [
    'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&q=80&auto=format&fit=crop',
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80&auto=format&fit=crop',
  ],
  movie: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=80&auto=format&fit=crop',
  ],
  default: [
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=900&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900&q=80&auto=format&fit=crop',
  ],
}

const ARTIST_OVERRIDES: Array<{ match: RegExp; image: string }> = [
  { match: /arijit/i, image: '/assets/artists/arijit.svg' },
  { match: /zakir/i, image: '/assets/artists/zakir.svg' },
  { match: /anubhav|bassi/i, image: '/assets/events/comedy.svg' },
  { match: /virat|kohli/i, image: '/assets/artists/virat.svg' },
]

function hashString(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function normalizeImageUrl(url?: string | null): string | null {
  if (!url?.trim()) return null
  let normalized = url.trim()
  if (normalized.startsWith('//')) normalized = `https:${normalized}`
  if (normalized.startsWith('http://')) normalized = `https://${normalized.slice(7)}`
  return normalized
}

export function isRealImageUrl(url?: string | null): boolean {
  const normalized = normalizeImageUrl(url)
  if (!normalized) return false
  if (normalized.startsWith('/assets/')) return false
  if (normalized.includes('placeholder') || normalized.includes('via.placeholder')) return false
  return /^https?:\/\//i.test(normalized)
}

function resolveCategoryKey(category?: string | null, title?: string) {
  const key = (category || '').toLowerCase()
  const text = `${key} ${title || ''}`.toLowerCase()

  if (text.includes('comedy') || text.includes('stand-up') || text.includes('standup')) return 'comedy'
  if (text.includes('festival') || text.includes('holi') || text.includes('puja')) return 'festival'
  if (text.includes('food') || text.includes('biryani') || text.includes('truck')) return 'food'
  if (text.includes('workshop') || text.includes('seminar') || text.includes('literature')) return 'workshop'
  if (text.includes('conference') || text.includes('tech') || text.includes('startup')) return 'conference'
  if (text.includes('sport') || text.includes('cricket') || text.includes('football')) return 'sports'
  if (text.includes('theatre') || text.includes('drama')) return 'theatre'
  if (text.includes('night') || text.includes('dj') || text.includes('club')) return 'nightlife'
  if (text.includes('movie') || text.includes('film')) return 'movie'
  if (text.includes('market') || text.includes('bazaar')) return 'market'
  if (text.includes('concert') || text.includes('live')) return 'concert'
  if (text.includes('music') || text.includes('acoustic') || text.includes('indie')) return 'music'

  if (CATEGORY_SVG[key]) return key
  return 'default'
}

function pickCategoryPhoto(category?: string | null, seed?: string) {
  const bucket = resolveCategoryKey(category, seed)
  const photos = CATEGORY_PHOTOS[bucket] || CATEGORY_PHOTOS.default
  const index = hashString(seed || bucket) % photos.length
  return photos[index]
}

/** Guaranteed local fallback — always loads */
export function getCategorySvg(category?: string | null, title?: string) {
  const key = resolveCategoryKey(category, title)
  return CATEGORY_SVG[key] || CATEGORY_SVG.default
}

export function getDefaultEventImage(category?: string | null, title?: string) {
  return getCategorySvg(category, title)
}

export function getEventImage(
  category?: string | null,
  fallback?: string | null,
  seedOrTitle?: string
) {
  const normalizedFallback = normalizeImageUrl(fallback)

  // 1) Real remote images from Ticketmaster / Bushdrum / uploads
  if (isRealImageUrl(normalizedFallback)) return normalizedFallback!

  const text = `${seedOrTitle || ''} ${category || ''}`

  // 2) Named local artist / category assets
  for (const item of ARTIST_OVERRIDES) {
    if (item.match.test(text)) return item.image
  }

  // 3) Explicit local asset path
  if (fallback?.startsWith('/assets/')) return fallback

  // 4) Category photo (unique per event via title seed)
  return pickCategoryPhoto(category, seedOrTitle || fallback || category || 'event')
}
