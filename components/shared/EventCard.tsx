import EventImage from '@/components/shared/EventImage'
import Link from 'next/link'
import { AppEvent } from '@/lib/ticketmaster'

type EventCardProps = {
  event: AppEvent
}

const EventCard = ({ event }: EventCardProps) => {
  const startDate = new Date(event.startDateTime).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  const priceLabel = event.isFree
    ? 'FREE'
    : event.price === 'Check site'
      ? 'Tickets'
      : /^\d+(\.\d+)?$/.test(event.price)
        ? `₹${event.price} onwards`
        : event.price

  const sourceLabel =
    event.source === 'ticketmaster'
      ? 'Live'
      : event.source === 'bushdrum'
        ? 'Live IN'
        : event.source === 'community'
          ? 'Community'
          : null

  return (
    <Link
      href={`/events/${encodeURIComponent(event._id)}`}
      className="group flex w-full max-w-[400px] flex-col overflow-hidden rounded-2xl border border-surface-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-grey-50">
        <EventImage
          src={event.imageUrl}
          category={event.category?.name}
          title={event.title}
          alt={event.title}
          fill
          className="object-cover object-center transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold capitalize text-white">
            {event.category?.name || 'Event'}
          </span>
          {sourceLabel ? (
            <span className="rounded-full bg-emerald-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              {sourceLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-sm font-medium text-primary-500">{startDate}</p>
        <h3 className="line-clamp-2 min-h-[48px] text-base font-semibold text-black md:text-lg">
          {event.title}
        </h3>
        <p className="line-clamp-1 text-sm text-grey-500">{event.location}</p>
        {event.city ? <p className="text-xs text-grey-400">{event.city}</p> : null}
        {event.vibeTags?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {event.vibeTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-grey-100 px-2 py-0.5 text-[10px] font-medium text-grey-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-sm font-semibold text-black">{priceLabel}</p>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-500">
            Zones
          </span>
        </div>
      </div>
    </Link>
  )
}

export default EventCard
