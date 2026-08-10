'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

async function trySendWelcomeEmail(name: string, email: string) {
  const subject = 'Welcome to EventDazzle — your account is ready'
  const message = `Hi ${name},

Welcome to EventDazzle!

Your account has been created successfully with this email: ${email}

You can now:
• Search concerts, comedy, sports and festivals near you
• Book Front / Middle / Back zone tickets
• Create and share your own events after login

Thanks for joining us.
— Team EventDazzle`

  const preview = { to: email, subject, message }

  // Server SMTP — short timeout so UI never hangs
  try {
    const res = await withTimeout(
      fetch('/api/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      }),
      8000,
      'Server email'
    )
    const data = await res.json()
    if (res.ok && data.delivered) {
      return { delivered: true, preview: data.preview || preview, note: data.providerNote || 'Email sent' }
    }
  } catch {
    // continue
  }

  // Browser FormSubmit — short timeout
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 7000)
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        name,
        email,
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        message,
      }),
    })
    clearTimeout(timer)

    if (res.ok) {
      return {
        delivered: true,
        preview,
        note: 'Email request accepted. Check Inbox/Spam. If asked to activate FormSubmit, click the link once.',
      }
    }
  } catch {
    // continue
  }

  return {
    delivered: false,
    preview,
    note: 'Account created, but email could not be sent on this network (mail ports blocked). Try again later on hotspot.',
  }
}

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill all fields')
      return
    }

    setLoading(true)

    try {
      // Always create account first — never block signup on email
      localStorage.setItem(
        'eventdazzle_user',
        JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        })
      )

      const result = await trySendWelcomeEmail(name.trim(), email.trim())

      const mailbox = JSON.parse(localStorage.getItem('eventdazzle_mailbox') || '[]')
      mailbox.unshift({
        ...result.preview,
        at: new Date().toISOString(),
        delivered: result.delivered,
      })
      localStorage.setItem('eventdazzle_mailbox', JSON.stringify(mailbox.slice(0, 20)))

      setInfo(
        result.delivered
          ? `Account created. Welcome email sent to ${email.trim()}. Check Inbox/Spam.`
          : `Account created successfully. ${result.note}`
      )

      setTimeout(() => {
        router.push('/events')
        router.refresh()
      }, 1000)
    } catch (err) {
      // Account already saved — still let them in
      setInfo('Account created. Continuing...')
      setTimeout(() => {
        router.push('/events')
        router.refresh()
      }, 700)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-center min-h-screen w-full bg-surface-soft p-5">
      <div className="w-full max-w-md rounded-3xl border border-surface-line bg-white p-8 shadow-sm">
        <h1 className="h3-bold mb-2 text-center">Create account</h1>
        <p className="p-regular-16 mb-8 text-center text-grey-600">
          Join EventDazzle — we&apos;ll try to email your inbox right away
        </p>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2">
            <span className="p-medium-14">Full name</span>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="p-medium-14">Email</span>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="p-medium-14">Password</span>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              required
            />
          </label>

          {error ? <p className="p-regular-14 text-red-500">{error}</p> : null}
          {info ? <p className="p-regular-14 text-green-700">{info}</p> : null}

          <Button type="submit" size="lg" className="button mt-2 w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <p className="p-regular-14 mt-6 text-center text-grey-600">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-primary-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
