'use client'

import { useEffect, useRef } from 'react'
import { AppEvent } from '@/lib/ticketmaster'
import Collection from './Collection'

type InfiniteEventListProps = {
  events: AppEvent[]
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  infiniteScroll: boolean
  emptyTitle?: string
  emptyStateSubtext?: string
}

const InfiniteEventList = ({
  events,
  hasMore,
  loadingMore,
  onLoadMore,
  infiniteScroll,
  emptyTitle,
  emptyStateSubtext,
}: InfiniteEventListProps) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!infiniteScroll || !hasMore || loadingMore) return

    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore()
      },
      { rootMargin: '240px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [infiniteScroll, hasMore, loadingMore, onLoadMore])

  return (
    <>
      <Collection data={events} emptyTitle={emptyTitle} emptyStateSubtext={emptyStateSubtext} />

      {infiniteScroll && events.length > 0 ? (
        <div ref={sentinelRef} className="flex w-full flex-col items-center gap-3 py-8">
          {loadingMore ? (
            <p className="p-medium-16 text-grey-500">Loading more live events...</p>
          ) : hasMore ? (
            <p className="p-regular-14 text-grey-400">Scroll for more</p>
          ) : (
            <p className="p-regular-14 text-grey-400">You&apos;ve reached the end — explore another city!</p>
          )}
        </div>
      ) : null}
    </>
  )
}

export default InfiniteEventList
