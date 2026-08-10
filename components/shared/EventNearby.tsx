'use client'

import { useEffect, useState } from 'react'

type NearbyPlace = {
  name: string
  type: 'metro' | 'restaurant' | 'cafe' | 'shopping'
  distanceMeters: number
  address?: string
}

type NearbyData = {
  venue: string
  lat: number
  lng: number
  metro: NearbyPlace[]
  outlets: NearbyPlace[]
  source: string
}

type EventNearbyProps = {
  eventId: string
  location?: string
  city?: string
  country?: string
  lat?: number
  lng?: number
}

const TYPE_LABEL: Record<NearbyPlace['type'], string> = {
  metro: 'Metro',
  restaurant: 'Restaurant',
  cafe: 'Café',
  shopping: 'Shopping',
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export default function EventNearby({
  eventId,
  location,
  city,
  country,
  lat,
  lng,
}: EventNearbyProps) {
  const [data, setData] = useState<NearbyData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams()
    if (location) params.set('location', location)
    if (city) params.set('city', city)
    if (country) params.set('country', country)
    if (typeof lat === 'number' && Number.isFinite(lat)) params.set('lat', String(lat))
    if (typeof lng === 'number' && Number.isFinite(lng)) params.set('lng', String(lng))

    const qs = params.toString()
    fetch(`/api/events/${encodeURIComponent(eventId)}/nearby${qs ? `?${qs}` : ''}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Could not load nearby places')
        setData(json)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load nearby places')
      })
      .finally(() => setLoading(false))
  }, [eventId, location, city, country, lat, lng])

  if (loading) {
    return (
      <div className="rounded-2xl border border-surface-line bg-grey-50 p-5">
        <p className="text-sm text-grey-500">Loading map & nearby places...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm text-amber-800">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const pad = 0.02
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${data.lng - pad}%2C${data.lat - pad * 0.75}%2C${data.lng + pad}%2C${data.lat + pad * 0.75}&layer=mapnik&marker=${data.lat}%2C${data.lng}`

  return (
    <div className="space-y-5 rounded-2xl border border-surface-line p-5">
      <div>
        <h2 className="text-lg font-semibold">Location & nearby</h2>
        <p className="mt-1 text-sm text-grey-500">
          {data.venue}
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-surface-line">
          <iframe
            title="Event venue map"
            src={embedSrc}
            className="h-56 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <a
          href={`https://www.openstreetmap.org/?mlat=${data.lat}&mlon=${data.lng}#map=16/${data.lat}/${data.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-primary-500 hover:underline"
        >
          Open full map →
        </a>
      </div>

      {data.metro.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-grey-500">
            Nearest metro / transit
          </h3>
          <ul className="space-y-2">
            {data.metro.map((place) => (
              <li
                key={`metro-${place.name}`}
                className="flex items-start justify-between gap-3 rounded-xl bg-primary-50/60 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{place.name}</p>
                  {place.address ? <p className="text-xs text-grey-500">{place.address}</p> : null}
                </div>
                <span className="shrink-0 text-xs font-semibold text-primary-600">
                  {formatDistance(place.distanceMeters)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-grey-500">No metro/transit found within 1.5 km.</p>
      )}

      {data.outlets.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-grey-500">
            Nearby restaurants & outlets
          </h3>
          <ul className="space-y-2">
            {data.outlets.map((place) => (
              <li
                key={`${place.type}-${place.name}`}
                className="flex items-start justify-between gap-3 rounded-xl bg-grey-50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{place.name}</p>
                  <p className="text-xs text-grey-500">{TYPE_LABEL[place.type]}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-grey-600">
                  {formatDistance(place.distanceMeters)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-grey-500">No nearby outlets found within walking distance.</p>
      )}
    </div>
  )
}
