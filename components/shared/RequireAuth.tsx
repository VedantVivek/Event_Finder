'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const PUBLIC_PATHS = ['/sign-in', '/sign-up']

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    const user = localStorage.getItem('eventdazzle_user')

    if (isPublic) {
      setAuthed(true)
      setReady(true)
      return
    }

    if (!user) {
      setAuthed(false)
      setReady(true)
      return
    }

    setAuthed(true)
    setReady(true)
  }, [pathname])

  if (!ready) {
    return (
      <div className="flex-center min-h-[50vh]">
        <p className="p-medium-16 text-grey-600">Checking login...</p>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="wrapper my-16 max-w-xl text-center">
        <h2 className="h3-bold mb-3">Login required</h2>
        <p className="p-regular-16 mb-6 text-grey-600">
          Please login first to search and browse events.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="button">
            <Link href="/sign-in">Login</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="button">
            <Link href="/sign-up">Create account</Link>
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
