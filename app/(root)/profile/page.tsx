'use client'

import EventImage from '@/components/shared/EventImage'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import RequireAuth from '@/components/shared/RequireAuth'

type DemoUser = { name: string; email: string }

type CreatedEvent = {
  _id: string
  title: string
  description: string
  location: string
  category: string
  price: string
  isFree: boolean
  startDateTime: string
  imageUrl: string
  city: string
}

type MailItem = {
  to: string
  subject: string
  message: string
  at: string
  delivered?: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<DemoUser | null>(null)
  const [events, setEvents] = useState<CreatedEvent[]>([])
  const [mailbox, setMailbox] = useState<MailItem[]>([])

  useEffect(() => {
    const raw = localStorage.getItem('eventdazzle_user')
    if (!raw) {
      router.push('/sign-in')
      return
    }
    setUser(JSON.parse(raw) as DemoUser)
    setEvents(JSON.parse(localStorage.getItem('eventdazzle_created_events') || '[]') as CreatedEvent[])
    setMailbox(JSON.parse(localStorage.getItem('eventdazzle_mailbox') || '[]') as MailItem[])
  }, [router])

  return (
    <RequireAuth>
      {!user ? (
        <section className="wrapper my-16">
          <p className="p-medium-16">Loading profile...</p>
        </section>
      ) : (
        <>
          <section className="bg-primary-50 py-8">
            <div className="wrapper flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="h3-bold">My Profile</h3>
                <p className="p-regular-16 text-grey-600">
                  {user.name} · {user.email}
                </p>
              </div>
              <Button asChild size="lg" className="button">
                <Link href="/events/create">Create Event</Link>
              </Button>
            </div>
          </section>

          <section className="wrapper my-8 space-y-10">
            <div>
              <h4 className="p-bold-20 mb-4">Welcome emails</h4>
              {mailbox.length === 0 ? (
                <div className="rounded-2xl border border-surface-line bg-white p-6 text-sm text-grey-500">
                  No welcome emails yet. Create a new account from Sign Up to receive one.
                </div>
              ) : (
                <ul className="space-y-3">
                  {mailbox.map((mail, index) => (
                    <li key={`${mail.at}-${index}`} className="rounded-2xl border border-surface-line bg-white p-5">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{mail.subject}</p>
                        <span className="text-xs text-grey-400">
                          {new Date(mail.at).toLocaleString('en-IN')}
                          {mail.delivered ? ' · sent' : ' · saved'}
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-grey-500">To: {mail.to}</p>
                      <pre className="whitespace-pre-wrap rounded-xl bg-grey-50 p-3 text-sm text-grey-600">
                        {mail.message}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="p-bold-20 mb-6">My created events</h4>
              {events.length === 0 ? (
                <div className="rounded-2xl bg-grey-50 p-10 text-center">
                  <p className="p-medium-16 mb-4">You haven&apos;t created any events yet.</p>
                  <Button asChild className="button">
                    <Link href="/events/create">Create your first event</Link>
                  </Button>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => (
                    <li key={event._id} className="overflow-hidden rounded-2xl border border-surface-line bg-white">
                      <div className="relative aspect-[16/9] w-full">
                        <EventImage
                          src={event.imageUrl}
                          category={event.category}
                          title={event.title}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-2 p-4">
                        <p className="p-medium-16 line-clamp-2">{event.title}</p>
                        <p className="p-regular-14 text-grey-600">
                          {event.city} · {event.category}
                        </p>
                        <p className="p-regular-14 text-grey-500">
                          {new Date(event.startDateTime).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                        <p className="p-semibold-14 text-primary-500">
                          {event.isFree ? 'FREE' : `₹${event.price} onwards`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button asChild variant="outline" className="button">
              <Link href="/events">Browse all events</Link>
            </Button>
          </section>
        </>
      )}
    </RequireAuth>
  )
}
