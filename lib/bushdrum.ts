import https from 'https'
import { AppEvent } from '@/lib/ticketmaster'
import { getEventImage, isRealImageUrl, normalizeImageUrl } from '@/lib/eventImages'

type BushdrumVenue = {
  name?: string
  address?: string | null
  city?: string | null
  lat?: number | null
  lng?: number | null
}

type BushdrumEvent = {
  id: number
  title: string
  url?: string | null
  summary?: string | null
  summary_en?: string | null
  image_url?: string | null
  start_time?: string | null
  end_time?: string | null
  category?: string | null
  is_free?: boolean
  price_min?: number | null
  currency?: string | null
  city_hint?: string | null
  venue?: BushdrumVenue | null
}

type BushdrumListResponse = {
  events?: BushdrumEvent[]
  total?: number
}

function fetchJson<T>(url: string): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        agent: new https.Agent({ rejectUnauthorized: false }),
        headers: {
          Accept: 'application/json',
          'User-Agent': 'EventFinder/1.0 (local-dev)',
        },
      },
      (response) => {
        let body = ''
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => {
          try {
            resolve({
              status: response.statusCode || 500,
              data: body ? (JSON.parse(body) as T) : ({} as T),
            })
          } catch (error) {
            reject(error)
          }
        })
      }
    )
    request.on('error', reject)
  })
}

function mapBushdrumEvent(event: BushdrumEvent): AppEvent {
  const start = event.start_time || new Date().toISOString()
  const end = event.end_time || start
  const price =
    typeof event.price_min === 'number'
      ? String(event.price_min)
      : event.is_free
        ? '0'
        : 'Check site'

  const location = [event.venue?.name, event.venue?.address, event.venue?.city || event.city_hint]
    .filter(Boolean)
    .join(', ')

  return {
    _id: `bd_${event.id}`,
    title: event.title,
    description:
      event.summary_en ||
      event.summary ||
      `${event.title} happening in ${event.city_hint || 'your city'}.`,
    location: location || 'Location TBA',
    imageUrl: isRealImageUrl(event.image_url)
      ? normalizeImageUrl(event.image_url)!
      : getEventImage(event.category, null, event.title),
    startDateTime: start,
    endDateTime: end,
    price,
    isFree: Boolean(event.is_free) || event.price_min === 0,
    url: event.url || '#',
    category: {
      _id: (event.category || 'event').toLowerCase(),
      name: event.category || 'Event',
    },
    organizer: {
      _id: 'bushdrum',
      firstName: 'Local',
      lastName: 'Events',
    },
    city: event.venue?.city || event.city_hint || undefined,
    country: 'India',
    countryCode: 'IN',
    lat: typeof event.venue?.lat === 'number' ? event.venue.lat : undefined,
    lng: typeof event.venue?.lng === 'number' ? event.venue.lng : undefined,
    source: 'bushdrum',
  }
}

function isUpcoming(event: BushdrumEvent) {
  if (!event.start_time) return false
  const start = new Date(event.start_time).getTime()
  const now = Date.now()
  const max = now + 1000 * 60 * 60 * 24 * 365 * 5 // next 5 years
  return start >= now - 1000 * 60 * 60 * 24 && start <= max
}

export async function fetchBushdrumEvents(params: {
  citySlug: string
  keyword?: string
  size?: number
  offset?: number
}): Promise<{ events: AppEvent[]; total: number; source: string; hasMore: boolean }> {
  const limit = Math.min(params.size || 24, 40)
  const offset = params.offset || 0
  const search = new URLSearchParams({
    city: params.citySlug,
    limit: String(limit + offset),
    date_from: new Date().toISOString().slice(0, 10),
  })
  if (params.keyword) search.set('q', params.keyword)

  const url = `https://bushdrum.com/api/events?${search.toString()}`
  const { status, data } = await fetchJson<BushdrumListResponse>(url)

  if (status >= 400) {
    throw new Error(`India events error (${status})`)
  }

  const raw = (data.events || []).filter(isUpcoming)
  const sliced = raw.slice(offset, offset + limit)
  const events = sliced.map(mapBushdrumEvent)

  return {
    events,
    total: data.total || raw.length,
    source: 'bushdrum',
    hasMore: offset + limit < raw.length,
  }
}

export async function fetchBushdrumEventById(id: string): Promise<AppEvent | null> {
  const numericId = id.replace(/^bd_/, '')
  const { status, data } = await fetchJson<BushdrumEvent>(
    `https://bushdrum.com/api/events/${numericId}`
  )

  if (status === 404) return null
  if (status >= 400) throw new Error(`India events error (${status})`)
  return mapBushdrumEvent(data)
}

export function resolveIndiaCitySlug(city?: string): string | null {
  if (!city) return null
  const normalized = city.toLowerCase().trim()
  if (['delhi', 'new delhi', 'noida', 'gurgaon', 'gurugram', 'ghaziabad'].some((c) => normalized.includes(c))) {
    return 'delhi'
  }
  if (['mumbai', 'bombay'].some((c) => normalized.includes(c))) return 'mumbai'
  if (['bangalore', 'bengaluru'].some((c) => normalized.includes(c))) return 'bangalore'
  if (['chennai', 'madras'].some((c) => normalized.includes(c))) return 'chennai'
  if (normalized.includes('hyderabad')) return 'hyderabad'
  if (normalized.includes('pune')) return 'pune'
  if (['kolkata', 'calcutta'].some((c) => normalized.includes(c))) return 'kolkata'
  return 'delhi'
}

export function isInIndia(lat: number, lng: number) {
  return lat >= 6.5 && lat <= 37.5 && lng >= 68 && lng <= 97.5
}

export function nearestIndiaCitySlug(lat: number, lng: number) {
  // Only India city currently available in Bushdrum public index
  if (!isInIndia(lat, lng)) return null
  return 'delhi'
}
