'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import NavItems from './NavItems'
import MobileNav from './MobileNav'

type DemoUser = {
  name: string
  email: string
}

const Header = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<DemoUser | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('eventdazzle_user')
      setUser(raw ? (JSON.parse(raw) as DemoUser) : null)
    } catch {
      setUser(null)
    }
  }, [pathname])

  const logout = () => {
    localStorage.removeItem('eventdazzle_user')
    setUser(null)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-line bg-white/95 backdrop-blur">
      <div className="wrapper flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/assets/images/logo.svg"
            width={120}
            height={36}
            alt="EventDazzle logo"
            priority
            className="h-9 w-auto object-contain"
          />
        </Link>

        {user ? (
          <nav className="md:flex-between hidden w-full max-w-md">
            <NavItems />
          </nav>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          {user ? (
            <>
              <Button asChild size="sm" variant="outline" className="hidden rounded-full sm:inline-flex">
                <Link href="/events">Explore</Link>
              </Button>
              <p className="hidden p-medium-14 text-grey-600 sm:block">{user.name}</p>
              <Button className="rounded-full" size="lg" variant="outline" onClick={logout}>
                Logout
              </Button>
              <MobileNav />
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="rounded-full" size="lg">
                <Link href="/sign-in">Login</Link>
              </Button>
              <Button asChild className="rounded-full" size="lg">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
