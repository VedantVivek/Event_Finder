import https from 'https'
import { getCityCoords } from '@/constants/indiaCityEvents'

export type NearbyPlace = {
  name: string
  type: 'metro' | 'restaurant' | 'cafe' | 'shopping'
  distanceMeters: number
  address?: string
  lat: number
  lng: number
}

type GeocodeResult = { lat: number; lng: number; displayName: string }

function fetchText(url: string, headers: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'EventDazzle/1.0 (event discovery app)',
          Accept: 'application/json',
          ...headers,
        },
        // Local antivirus SSL inspection often breaks strict verify
        agent: new https.Agent({ rejectUnauthorized: false }),
        family: 4,
      },
      (response) => {
        let body = ''
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => {
          if ((response.statusCode || 500) >= 400) {
            reject(new Error(`HTTP ${response.statusCode}`))
            return
          }
          resolve(body)
        })
      }
    )
    request.on('error', reject)
    request.setTimeout(10000, () => {
      request.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

async function nominatimSearch(q: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
  try {
    const raw = await fetchText(url)
    const data = JSON.parse(raw) as Array<{ lat: string; lon: string; display_name: string }>
    if (!data?.length) return null
    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      displayName: data[0].display_name,
    }
  } catch {
    return null
  }
}

export async function geocodeVenue(
  query: string,
  city?: string,
  countryHint?: string
): Promise<GeocodeResult | null> {
  const country =
    countryHint ||
    (city && getCityCoords(city) ? 'India' : undefined)

  const attempts = [
    [query, city, country].filter(Boolean).join(', '),
    [query, city].filter(Boolean).join(', '),
    query,
    city && country ? `${city}, ${country}` : city,
  ].filter((q, i, arr): q is string => Boolean(q) && arr.indexOf(q) === i)

  for (const q of attempts) {
    const hit = await nominatimSearch(q)
    if (hit) return hit
  }

  // Last resort: known India city center
  const cityCoords = getCityCoords(city)
  if (cityCoords) {
    return {
      lat: cityCoords.lat,
      lng: cityCoords.lng,
      displayName: `${query || cityCoords.label}, ${cityCoords.label}, India`,
    }
  }

  return null
}

async function overpassSearch(lat: number, lng: number, radiusMeters: number, filters: string[]) {
  const inner = filters.map((f) => `${f}(around:${radiusMeters},${lat},${lng});`).join('')
  const query = `[out:json][timeout:15];(${inner});out body 30;`
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
  const raw = await fetchText(url)
  const data = JSON.parse(raw) as {
    elements?: Array<{
      id: number
      lat?: number
      lon?: number
      center?: { lat: number; lon: number }
      tags?: Record<string, string>
    }>
  }
  return data.elements || []
}

export async function fetchNearbyPlaces(params: {
  location: string
  city?: string
  country?: string
  lat?: number
  lng?: number
}): Promise<{ coords: GeocodeResult; places: NearbyPlace[] }> {
  let coords: GeocodeResult | null = null

  if (
    typeof params.lat === 'number' &&
    typeof params.lng === 'number' &&
    Number.isFinite(params.lat) &&
    Number.isFinite(params.lng)
  ) {
    coords = { lat: params.lat, lng: params.lng, displayName: params.location || 'Venue' }
  } else {
    coords = await geocodeVenue(params.location, params.city, params.country)
  }

  if (!coords) {
    throw new Error('Could not locate venue on map')
  }

  const { lat, lng } = coords
  const places: NearbyPlace[] = []

  const [metroElements, foodElements, shopElements] = await Promise.all([
    overpassSearch(lat, lng, 1500, [
      'node["railway"="station"]',
      'node["station"="subway"]',
      'node["public_transport"="station"]',
    ]).catch(() => []),
    overpassSearch(lat, lng, 800, [
      'node["amenity"="restaurant"]',
      'node["amenity"="cafe"]',
      'node["amenity"="fast_food"]',
    ]).catch(() => []),
    overpassSearch(lat, lng, 600, [
      'node["shop"="mall"]',
      'node["shop"="department_store"]',
      'node["shop"="supermarket"]',
    ]).catch(() => []),
  ])

  for (const el of metroElements) {
    const plat = el.lat ?? el.center?.lat
    const plng = el.lon ?? el.center?.lon
    if (plat == null || plng == null) continue
    const name = el.tags?.name
    if (!name) continue
    places.push({
      name,
      type: 'metro',
      distanceMeters: Math.round(haversineMeters(lat, lng, plat, plng)),
      address: el.tags?.['addr:street'] || el.tags?.['addr:full'],
      lat: plat,
      lng: plng,
    })
  }

  for (const el of foodElements) {
    const plat = el.lat ?? el.center?.lat
    const plng = el.lon ?? el.center?.lon
    if (plat == null || plng == null) continue
    const name = el.tags?.name
    if (!name) continue
    const amenity = el.tags?.amenity || 'restaurant'
    places.push({
      name,
      type: amenity === 'cafe' ? 'cafe' : 'restaurant',
      distanceMeters: Math.round(haversineMeters(lat, lng, plat, plng)),
      address: el.tags?.['addr:street'] || el.tags?.['addr:full'],
      lat: plat,
      lng: plng,
    })
  }

  for (const el of shopElements) {
    const plat = el.lat ?? el.center?.lat
    const plng = el.lon ?? el.center?.lon
    if (plat == null || plng == null) continue
    const name = el.tags?.name
    if (!name) continue
    places.push({
      name,
      type: 'shopping',
      distanceMeters: Math.round(haversineMeters(lat, lng, plat, plng)),
      address: el.tags?.['addr:street'] || el.tags?.['addr:full'],
      lat: plat,
      lng: plng,
    })
  }

  const deduped = new Map<string, NearbyPlace>()
  for (const place of places.sort((a, b) => a.distanceMeters - b.distanceMeters)) {
    const key = `${place.type}-${place.name}`
    if (!deduped.has(key)) deduped.set(key, place)
  }

  const sorted = Array.from(deduped.values()).sort((a, b) => a.distanceMeters - b.distanceMeters)

  return {
    coords,
    places: sorted.slice(0, 12),
  }
}
