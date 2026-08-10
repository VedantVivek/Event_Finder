'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import InfiniteEventList from '@/components/shared/InfiniteEventList'
import { Button } from '@/components/ui/button'
import { getCreatedEventsForCity, mergeEvents } from '@/lib/createdEvents'
import { AppEvent } from '@/lib/ticketmaster'

type CityOption = {
  label: string
  city: string
  countryCode: string
}

const CITY_OPTIONS: CityOption[] = [
  { label: 'Near me (GPS)', city: '', countryCode: '' },
  { label: 'Mumbai, IN', city: 'Mumbai', countryCode: 'IN' },
  { label: 'New Delhi, IN', city: 'Delhi', countryCode: 'IN' },
  { label: 'Bangalore, IN', city: 'Bangalore', countryCode: 'IN' },
  { label: 'Chennai, IN', city: 'Chennai', countryCode: 'IN' },
  { label: 'Hyderabad, IN', city: 'Hyderabad', countryCode: 'IN' },
  { label: 'Pune, IN', city: 'Pune', countryCode: 'IN' },
  { label: 'Kolkata, IN', city: 'Kolkata', countryCode: 'IN' },
  { label: 'New York, US', city: 'New York', countryCode: 'US' },
  { label: 'London, UK', city: 'London', countryCode: 'GB' },
]

type NearbyEventsProps = {
  showFilters?: boolean
  title?: string
}

type FetchContext = {
  city?: string
  countryCode?: string
  useGps?: boolean
  keyword?: string
}

const NearbyEvents = ({ showFilters = true, title }: NearbyEventsProps) => {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Loading live events...')
  const [keyword, setKeyword] = useState('')
  const [selectedCity, setSelectedCity] = useState('Mumbai, IN')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [infiniteScroll, setInfiniteScroll] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fetchContextRef = useRef<FetchContext>({ city: 'Mumbai', countryCode: 'IN' })
  const eventsRef = useRef<AppEvent[]>([])
  eventsRef.current = events

  const fetchPage = useCallback(async (options: FetchContext, pageNum: number, previous: AppEvent[]) => {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    params.set('pageSize', '12')
    if (options.keyword) params.set('keyword', options.keyword)

    let cityForCreated = options.city || 'Mumbai'

    if (options.useGps) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'))
            return
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
          })
        })
        params.set('lat', String(position.coords.latitude))
        params.set('lng', String(position.coords.longitude))
        cityForCreated = 'Delhi'
      } catch {
        params.set('city', 'Mumbai')
        params.set('countryCode', 'IN')
        cityForCreated = 'Mumbai'
      }
    } else {
      params.set('city', options.city || 'Mumbai')
      params.set('countryCode', options.countryCode || 'IN')
      cityForCreated = options.city || 'Mumbai'
    }

    const response = await fetch(`/api/events?${params.toString()}`, { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not load events')

    const created =
      pageNum === 0 ? getCreatedEventsForCity(cityForCreated, options.keyword) : []
    const base = pageNum === 0 ? data.events || [] : [...previous, ...(data.events || [])]
    const merged = mergeEvents(base, created)

    return { merged, data, createdCount: created.length }
  }, [])

  const loadEvents = (options: FetchContext, reset = true) => {
    fetchContextRef.current = options
    const pageNum = reset ? 0 : page

    startTransition(async () => {
      setError('')
      if (reset) {
        setStatus('Loading live events...')
        setPage(0)
      }

      try {
        const result = await fetchPage(options, pageNum, [])
        if (!result) return

        setEvents(result.merged)
        setTotal(result.merged.length)
        setHasMore(Boolean(result.data.hasMore))
        setInfiniteScroll(Boolean(result.data.infiniteScroll))
        setPage(pageNum)
        setStatus(
          result.createdCount > 0
            ? `${result.data.message || 'Live events loaded'} (including ${result.createdCount} you created)`
            : result.data.message || 'Live events loaded'
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load events')
        if (reset) {
          setEvents([])
          setTotal(0)
        }
        setStatus('Could not load events')
      }
    })
  }

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || isPending) return
    const nextPage = page + 1
    setLoadingMore(true)

    fetchPage(fetchContextRef.current, nextPage, eventsRef.current)
      .then((result) => {
        if (!result) return
        setEvents(result.merged)
        setTotal(result.merged.length)
        setHasMore(Boolean(result.data.hasMore))
        setPage(nextPage)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load more events')
      })
      .finally(() => setLoadingMore(false))
  }, [fetchPage, hasMore, isPending, loadingMore, page])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cityParam = params.get('city')
    const keywordParam = params.get('keyword') || ''
    if (keywordParam) setKeyword(keywordParam)

    if (cityParam) {
      const option =
        CITY_OPTIONS.find((item) => item.city.toLowerCase() === cityParam.toLowerCase()) ||
        CITY_OPTIONS.find((item) => item.label.toLowerCase().includes(cityParam.toLowerCase()))

      if (option && option.city) {
        setSelectedCity(option.label)
        loadEvents({
          city: option.city,
          countryCode: option.countryCode || 'IN',
          keyword: keywordParam || undefined,
        })
        return
      }
    }

    loadEvents({ city: 'Mumbai', countryCode: 'IN', keyword: keywordParam || undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onCityChange = (label: string) => {
    setSelectedCity(label)
    const option = CITY_OPTIONS.find((item) => item.label === label)
    if (!option) return

    if (option.label === 'Near me (GPS)') {
      loadEvents({ useGps: true, keyword: keyword || undefined })
      return
    }

    loadEvents({
      city: option.city,
      countryCode: option.countryCode,
      keyword: keyword || undefined,
    })
  }

  const onSearch = () => {
    const option = CITY_OPTIONS.find((item) => item.label === selectedCity)
    if (!option || option.label === 'Near me (GPS)') {
      loadEvents({ useGps: true, keyword: keyword || undefined })
      return
    }
    loadEvents({
      city: option.city,
      countryCode: option.countryCode,
      keyword: keyword || undefined,
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {title ? <h2 className="h3-bold">{title}</h2> : null}

      <div className="rounded-2xl border border-primary-500/20 bg-primary-50/50 px-4 py-3">
        <p className="text-sm text-grey-700">
          <span className="font-semibold text-primary-600">EventDazzle vs typical apps:</span>{' '}
          live feeds from Ticketmaster & Bushdrum, zone-based seat transparency, vibe tags, and{' '}
          <span className="font-medium">Event Trail</span> follow-up suggestions when you pick an event.
        </p>
      </div>

      {showFilters ? (
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search concerts, workshops, seminars..."
            className="input-field w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch()
            }}
          />
          <select
            className="select-field w-full !text-black md:max-w-xs"
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            style={{ color: '#111111', backgroundColor: '#ffffff', WebkitTextFillColor: '#111111' }}
          >
            {CITY_OPTIONS.map((option) => (
              <option
                key={option.label}
                value={option.label}
                style={{ color: '#111111', backgroundColor: '#ffffff' }}
              >
                {option.label}
              </option>
            ))}
          </select>
          <Button className="button" onClick={onSearch} disabled={isPending}>
            {isPending ? 'Searching...' : 'Search'}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="p-medium-16 text-grey-600">{status}</p>
        {total > 0 ? (
          <p className="p-regular-14 text-grey-500">
            {total} events shown
            {infiniteScroll && hasMore ? ' · scroll for more' : ''}
            {keyword ? ' · search mode (pagination off)' : ''}
          </p>
        ) : null}
        {error ? <p className="p-regular-14 text-red-500">{error}</p> : null}
      </div>

      {isPending && events.length === 0 ? (
        <div className="flex-center wrapper min-h-[160px] w-full rounded-[14px] bg-grey-50 py-20 text-center">
          <p className="p-medium-16">Loading live events...</p>
        </div>
      ) : (
        <InfiniteEventList
          events={events}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          infiniteScroll={infiniteScroll}
          emptyTitle="No events found"
          emptyStateSubtext="Try Mumbai, Delhi, or Bangalore — or clear your search for infinite browse"
        />
      )}
    </div>
  )
}

export default NearbyEvents
