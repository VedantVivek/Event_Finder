import {
  getLocalEventById,
  getLocalEventsByCity,
  nearestCityFromCoords,
  normalizeCityKey,
  localIndiaEvents,
} from '@/constants/indiaCityEvents'
import {
  fetchBushdrumEventById,
  fetchBushdrumEvents,
  isInIndia,
  resolveIndiaCitySlug,
} from '@/lib/bushdrum'
import { getEventImage, normalizeImageUrl } from '@/lib/eventImages'
import { withVibeTags } from '@/lib/eventVibes'
import { AppEvent, fetchEventById, fetchNearbyEvents, toCountryCode } from '@/lib/ticketmaster'

export type EventsResult = {
  events: AppEvent[]
  total: number
  source: string
  message?: string
  page: number
  hasMore: boolean
  infiniteScroll: boolean
}

const INDIA_CITIES = ['delhi', 'mumbai', 'bangalore', 'chennai', 'hyderabad', 'pune', 'kolkata']
const TM_TIMEOUT_MS = 12000

function withImages(events: AppEvent[]): AppEvent[] {
  return withVibeTags(
    events.map((event) => ({
      ...event,
      imageUrl: getEventImage(
        event.category?.name,
        normalizeImageUrl(event.imageUrl),
        event.title
      ),
    }))
  )
}

function dedupeEvents(events: AppEvent[]): AppEvent[] {
  const seen = new Map<string, AppEvent>()
  for (const event of events) {
    const key = event._id || `${event.title}-${event.startDateTime}`
    if (!seen.has(key)) seen.set(key, event)
  }
  return Array.from(seen.values())
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

function markLocal(events: AppEvent[]): AppEvent[] {
  return events.map((e) => ({ ...e, source: e.source || 'local' }))
}

async function fetchIndiaLivePage(params: {
  city?: string
  cityKey: string
  keyword?: string
  page: number
  pageSize: number
}): Promise<{ events: AppEvent[]; hasMore: boolean; sources: string[] }> {
  const sources: string[] = []
  const slug = resolveIndiaCitySlug(params.city || params.cityKey) || params.cityKey || 'delhi'

  if (params.page === 0 && !params.keyword) {
    const local = markLocal(getLocalEventsByCity(params.cityKey || 'mumbai'))
    let live: AppEvent[] = []

    try {
      const bd = await withTimeout(
        fetchBushdrumEvents({ citySlug: slug, keyword: params.keyword, size: params.pageSize }),
        TM_TIMEOUT_MS
      )
      live = bd.events
      if (live.length) sources.push('bushdrum')
    } catch {
      // Bushdrum optional — Ticketmaster India fills in below
    }

    try {
      const tm = await withTimeout(
        fetchNearbyEvents({
          city: params.city,
          countryCode: 'IN',
          keyword: params.keyword,
          size: params.pageSize,
          page: 0,
        }),
        TM_TIMEOUT_MS
      )
      if (tm.events.length) sources.push('ticketmaster')
      const merged = dedupeEvents([...live, ...local, ...tm.events])
      return {
        events: merged.slice(0, params.pageSize),
        hasMore: tm.hasMore || merged.length > params.pageSize,
        sources: sources.length ? sources : ['local'],
      }
    } catch {
      const merged = dedupeEvents([...live, ...local])
      return {
        events: merged.slice(0, params.pageSize),
        hasMore: merged.length > params.pageSize,
        sources: live.length ? ['bushdrum', 'local'] : ['local'],
      }
    }
  }

  // Page 2+ or keyword search → Ticketmaster India pagination
  const tm = await withTimeout(
    fetchNearbyEvents({
      city: params.city,
      countryCode: 'IN',
      keyword: params.keyword,
      size: params.pageSize,
      page: params.page,
    }),
    TM_TIMEOUT_MS
  )
  sources.push('ticketmaster')
  return { events: tm.events, hasMore: tm.hasMore, sources }
}

async function fetchGlobalPage(params: {
  lat?: string
  lng?: string
  city?: string
  countryCode?: string
  keyword?: string
  radius?: string
  page: number
  pageSize: number
}): Promise<{ events: AppEvent[]; hasMore: boolean; sources: string[] }> {
  const tm = await withTimeout(
    fetchNearbyEvents({
      lat: params.lat,
      lng: params.lng,
      city: params.city,
      countryCode: params.countryCode,
      keyword: params.keyword,
      radius: params.radius || '80',
      size: params.pageSize,
      page: params.page,
    }),
    TM_TIMEOUT_MS
  )
  return { events: tm.events, hasMore: tm.hasMore, sources: ['ticketmaster'] }
}

export async function getEvents(params: {
  lat?: string
  lng?: string
  city?: string
  countryCode?: string
  keyword?: string
  radius?: string
  page?: number
  pageSize?: number
}): Promise<EventsResult> {
  const page = Math.max(0, params.page ?? 0)
  const pageSize = Math.min(24, Math.max(6, params.pageSize ?? 12))
  const keyword = params.keyword?.trim()
  const infiniteScroll = !keyword
  const lat = params.lat ? Number(params.lat) : undefined
  const lng = params.lng ? Number(params.lng) : undefined
  const countryCode = (toCountryCode(params.countryCode) || params.countryCode || '').toUpperCase()
  const city = params.city?.trim()
  const cityKey = normalizeCityKey(city)

  const isIndiaContext =
    countryCode === 'IN' ||
    INDIA_CITIES.includes(cityKey) ||
    (typeof lat === 'number' && typeof lng === 'number' && isInIndia(lat, lng))

  try {
    if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      if (isInIndia(lat, lng)) {
        const nearest = nearestCityFromCoords(lat, lng)
        const result = await fetchIndiaLivePage({
          city: nearest,
          cityKey: nearest,
          keyword,
          page,
          pageSize,
        })
        return {
          events: withImages(result.events),
          total: result.events.length,
          source: result.sources.join('+'),
          page,
          hasMore: result.hasMore,
          infiniteScroll,
          message:
            page === 0
              ? `Live events near you (${nearest[0].toUpperCase()}${nearest.slice(1)}) — zone tickets with seat counts.`
              : `Loading more live events near ${nearest}.`,
        }
      }

      const result = await fetchGlobalPage({
        lat: params.lat,
        lng: params.lng,
        keyword,
        radius: params.radius,
        page,
        pageSize,
      })
      return {
        events: withImages(result.events),
        total: result.events.length,
        source: 'ticketmaster',
        page,
        hasMore: result.hasMore,
        infiniteScroll,
        message:
          result.events.length > 0
            ? 'Live Ticketmaster events near your location.'
            : 'No nearby live events — try another city.',
      }
    }

    if (isIndiaContext) {
      const result = await fetchIndiaLivePage({
        city,
        cityKey: cityKey || 'mumbai',
        keyword,
        page,
        pageSize,
      })
      return {
        events: withImages(result.events),
        total: result.events.length,
        source: result.sources.join('+'),
        page,
        hasMore: result.hasMore,
        infiniteScroll,
        message:
          page === 0
            ? `Live events in ${city || cityKey || 'India'} — see Front, Middle & Back zones before you book.`
            : `More events in ${city || cityKey}.`,
      }
    }

    const result = await fetchGlobalPage({
      city,
      countryCode: countryCode || undefined,
      keyword,
      radius: params.radius,
      page,
      pageSize,
    })
    return {
      events: withImages(result.events),
      total: result.events.length,
      source: 'ticketmaster',
      page,
      hasMore: result.hasMore,
      infiniteScroll,
      message: `Live Ticketmaster events${city ? ` in ${city}` : ''}.`,
    }
  } catch {
    const fallback = withImages(
      keyword
        ? localIndiaEvents.filter((e) =>
            `${e.title} ${e.description} ${e.location}`.toLowerCase().includes(keyword.toLowerCase())
          )
        : getLocalEventsByCity(cityKey || 'mumbai')
    )
    const start = page * pageSize
    const slice = fallback.slice(start, start + pageSize)
    return {
      events: slice,
      total: fallback.length,
      source: 'local-fallback',
      page,
      hasMore: start + pageSize < fallback.length,
      infiniteScroll,
      message: 'Live feed unavailable — showing curated India events.',
    }
  }
}

export async function getEventById(id: string): Promise<AppEvent | null> {
  const decoded = decodeURIComponent(id)

  const local =
    getLocalEventById(decoded) ||
    getLocalEventById(decoded.startsWith('local_') ? decoded : `local_${decoded}`) ||
    localIndiaEvents.find((e) => e._id === decoded) ||
    null

  if (local) {
    return withImages([{ ...local, source: 'local' }])[0]
  }

  if (decoded.startsWith('bd_')) {
    try {
      const bd = await fetchBushdrumEventById(decoded)
      if (bd) return withImages([bd])[0]
    } catch {
      // fall through
    }
  }

  try {
    const tm = await withTimeout(fetchEventById(decoded), TM_TIMEOUT_MS)
    if (tm) return withImages([tm])[0]
  } catch {
    // fall through
  }

  return null
}

export async function getEventsPoolForTrail(params: {
  city?: string
  countryCode?: string
  lat?: string
  lng?: string
}): Promise<AppEvent[]> {
  const result = await getEvents({
    ...params,
    page: 0,
    pageSize: 24,
  })

  let pool = [...result.events]

  if (result.hasMore) {
    const page2 = await getEvents({ ...params, page: 1, pageSize: 24 })
    pool = dedupeEvents([...pool, ...page2.events])
  }

  return pool
}
