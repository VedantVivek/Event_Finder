import https from 'https'
import { getEventImage } from '@/lib/eventImages'

export type EventSource = 'ticketmaster' | 'bushdrum' | 'local' | 'community'

export type AppEvent = {
  _id: string
  title: string
  description: string
  location: string
  imageUrl: string
  startDateTime: string
  endDateTime: string
  price: string
  isFree: boolean
  url: string
  category: { _id: string; name: string }
  organizer: { _id: string; firstName: string; lastName: string }
  distance?: string
  city?: string
  country?: string
  countryCode?: string
  lat?: number
  lng?: number
  source?: EventSource
  vibeTags?: string[]
}

/** Normalize country name / code to ISO-3166 alpha-2 for Ticketmaster. */
export function toCountryCode(country?: string | null): string | undefined {
  if (!country?.trim()) return undefined
  const raw = country.trim()
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase()

  const key = raw.toLowerCase()
  const map: Record<string, string> = {
    india: 'IN',
    'united states': 'US',
    'united states of america': 'US',
    usa: 'US',
    'u.s.': 'US',
    'u.s.a.': 'US',
    'united kingdom': 'GB',
    uk: 'GB',
    england: 'GB',
    'great britain': 'GB',
    canada: 'CA',
    australia: 'AU',
    germany: 'DE',
    france: 'FR',
    singapore: 'SG',
    'united arab emirates': 'AE',
    uae: 'AE',
  }
  return map[key]
}

type TicketmasterImage = {
  url: string
  width?: number
  height?: number
  ratio?: string
}

type TicketmasterEvent = {
  id: string
  name: string
  url?: string
  info?: string
  pleaseNote?: string
  images?: TicketmasterImage[]
  dates?: {
    start?: {
      dateTime?: string
      localDate?: string
      localTime?: string
    }
    end?: {
      dateTime?: string
      localDate?: string
    }
  }
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>
  classifications?: Array<{
    segment?: { name?: string }
    genre?: { name?: string }
  }>
  _embedded?: {
    venues?: Array<{
      name?: string
      city?: { name?: string }
      state?: { name?: string; stateCode?: string }
      country?: { name?: string; countryCode?: string }
      address?: { line1?: string }
      location?: { latitude?: string; longitude?: string }
      distance?: number
      units?: string
    }>
    attractions?: Array<{ name?: string }>
  }
}

type TicketmasterResponse = {
  _embedded?: {
    events?: TicketmasterEvent[]
  }
  page?: {
    totalElements?: number
    totalPages?: number
    number?: number
    size?: number
  }
}

function pickImage(images?: TicketmasterImage[], category?: string, title?: string) {
  if (!images?.length) return getEventImage(category, null, title)

  const valid = images.filter((img) => img.url?.trim())
  if (!valid.length) return getEventImage(category, null, title)

  const preferred =
    valid.find((img) => img.ratio === '16_9' && (img.width || 0) >= 1024) ||
    valid.find((img) => img.ratio === '16_9' && (img.width || 0) >= 640) ||
    valid.find((img) => img.ratio === '16_9') ||
    valid.sort((a, b) => (b.width || 0) - (a.width || 0))[0]

  const url = preferred?.url?.trim()
  if (!url) return getEventImage(category, null, title)

  const httpsUrl = url.startsWith('http://') ? `https://${url.slice(7)}` : url
  return httpsUrl
}

function mapTicketmasterEvent(event: TicketmasterEvent): AppEvent {
  const venue = event._embedded?.venues?.[0]
  const priceMin = event.priceRanges?.[0]?.min
  const currency = event.priceRanges?.[0]?.currency || 'USD'
  const isFree = priceMin === 0
  const price =
    typeof priceMin === 'number'
      ? `${currency === 'USD' ? '$' : ''}${priceMin}${currency !== 'USD' ? ` ${currency}` : ''}`
      : 'Check site'

  const locationParts = [
    venue?.name,
    venue?.address?.line1,
    venue?.city?.name,
    venue?.state?.name,
    venue?.country?.name,
  ].filter(Boolean)

  const start =
    event.dates?.start?.dateTime ||
    (event.dates?.start?.localDate
      ? `${event.dates.start.localDate}T${event.dates.start.localTime || '00:00:00'}`
      : new Date().toISOString())

  const end =
    event.dates?.end?.dateTime ||
    event.dates?.end?.localDate ||
    start

  const categoryName =
    event.classifications?.[0]?.segment?.name ||
    event.classifications?.[0]?.genre?.name ||
    'Event'

  const attraction = event._embedded?.attractions?.[0]?.name
  const lat = venue?.location?.latitude ? Number(venue.location.latitude) : undefined
  const lng = venue?.location?.longitude ? Number(venue.location.longitude) : undefined
  const countryCode =
    venue?.country?.countryCode?.toUpperCase() || toCountryCode(venue?.country?.name)

  return {
    _id: event.id,
    title: event.name,
    description:
      event.info ||
      event.pleaseNote ||
      `${event.name} at ${venue?.name || 'a great venue'}. Get tickets and join the experience.`,
    location: locationParts.join(', ') || 'Location TBA',
    imageUrl: pickImage(event.images, categoryName, event.name),
    startDateTime: start,
    endDateTime: end,
    price: isFree ? '0' : String(priceMin ?? 'Check site'),
    isFree,
    url: event.url || '#',
    category: { _id: categoryName.toLowerCase(), name: categoryName },
    organizer: {
      _id: 'ticketmaster',
      firstName: attraction || 'Ticketmaster',
      lastName: attraction ? '' : 'Events',
    },
    distance:
      typeof venue?.distance === 'number'
        ? `${venue.distance.toFixed(1)} ${venue.units || 'miles'}`
        : undefined,
    city: venue?.city?.name,
    country: venue?.country?.name,
    countryCode,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    source: 'ticketmaster',
  }
}

function getApiKey() {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key) {
    throw new Error('TICKETMASTER_API_KEY is missing in .env.local')
  }
  return key
}

// Windows/antivirus SSL interception can break Node fetch Ã¢â‚¬â€ use a tolerant agent locally
function fetchTicketmasterJson<T>(url: string): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { agent: new https.Agent({ rejectUnauthorized: false }) },
      (response) => {
        let body = ''
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => {
          try {
            const status = response.statusCode || 500
            if (!body) {
              resolve({ status, data: {} as T })
              return
            }
            resolve({ status, data: JSON.parse(body) as T })
          } catch (error) {
            reject(error)
          }
        })
      }
    )

    request.on('error', reject)
  })
}

export async function fetchNearbyEvents(params: {
  lat?: string
  lng?: string
  city?: string
  countryCode?: string
  keyword?: string
  radius?: string
  size?: number
  page?: number
}): Promise<{
  events: AppEvent[]
  source: string
  total: number
  page: number
  hasMore: boolean
}> {
  const apiKey = getApiKey()
  const page = params.page ?? 0
  const search = new URLSearchParams({
    apikey: apiKey,
    size: String(params.size || 12),
    page: String(page),
    sort: 'date,asc',
  })

  if (params.lat && params.lng) {
    search.set('latlong', `${params.lat},${params.lng}`)
    search.set('radius', params.radius || '50')
    search.set('unit', 'km')
  } else if (params.city) {
    search.set('city', params.city)
    if (params.countryCode) search.set('countryCode', params.countryCode)
  } else {
    search.set('city', 'New York')
    search.set('countryCode', 'US')
  }

  if (params.keyword) search.set('keyword', params.keyword)

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${search.toString()}`
  const { status, data } = await fetchTicketmasterJson<TicketmasterResponse>(url)

  if (status >= 400) {
    throw new Error(`Ticketmaster error (${status}): ${JSON.stringify(data)}`)
  }

  const events = (data._embedded?.events || []).map(mapTicketmasterEvent)
  const totalPages = data.page?.totalPages ?? 1
  const currentPage = data.page?.number ?? page

  return {
    events,
    source: 'ticketmaster',
    total: data.page?.totalElements || events.length,
    page: currentPage,
    hasMore: currentPage + 1 < totalPages,
  }
}

export async function fetchEventById(id: string): Promise<AppEvent | null> {
  const apiKey = getApiKey()
  const url = `https://app.ticketmaster.com/discovery/v2/events/${id}.json?apikey=${apiKey}`
  const { status, data } = await fetchTicketmasterJson<TicketmasterEvent>(url)

  if (status === 404) return null
  if (status >= 400) {
    throw new Error(`Ticketmaster error (${status}): ${JSON.stringify(data)}`)
  }

  return mapTicketmasterEvent(data)
}
