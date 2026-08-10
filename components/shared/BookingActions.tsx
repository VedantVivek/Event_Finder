'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

type BookingActionsProps = {
  eventId: string
  officialUrl?: string
}

const BookingActions = ({ eventId, officialUrl }: BookingActionsProps) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const goCheckout = () => {
    const user = localStorage.getItem('eventdazzle_user')
    if (!user) {
      router.push('/sign-in')
      return
    }
    setLoading(true)
    router.push(`/events/${eventId}/checkout`)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button size="lg" className="button" onClick={goCheckout} disabled={loading}>
        {loading ? 'Opening...' : 'Book Tickets'}
      </Button>
      {officialUrl && officialUrl !== '#' ? (
        <Button asChild size="lg" variant="outline" className="button">
          <Link href={officialUrl} target="_blank" rel="noreferrer">
            Official Page
          </Link>
        </Button>
      ) : null}
    </div>
  )
}

export default BookingActions
