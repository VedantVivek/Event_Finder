import { NextRequest, NextResponse } from 'next/server'
import { getEvents } from '@/lib/eventsProvider'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || '0')
    const pageSize = Number(searchParams.get('pageSize') || '12')

    const result = await getEvents({
      lat: searchParams.get('lat') || undefined,
      lng: searchParams.get('lng') || undefined,
      city: searchParams.get('city') || undefined,
      countryCode: searchParams.get('countryCode') || undefined,
      keyword: searchParams.get('keyword') || undefined,
      radius: searchParams.get('radius') || undefined,
      page: Number.isFinite(page) ? page : 0,
      pageSize: Number.isFinite(pageSize) ? pageSize : 12,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch events'
    return NextResponse.json(
      { error: message, events: [], total: 0, page: 0, hasMore: false, infiniteScroll: true },
      { status: 502 }
    )
  }
}
