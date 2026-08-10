'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    setLoading(true)
    try {
      const name = email.split('@')[0] || 'User'
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send OTP')

      if (typeof data.devOtp === 'string' && data.devOtp.length === 6) {
        setOtp(data.devOtp)
      }
      setInfo(data.message || 'OTP sent to your email')
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Enter the 6-digit OTP from your email')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid OTP')

      localStorage.setItem('eventdazzle_user', JSON.stringify(data.user))
      setInfo(data.message || 'Login successful')

      setTimeout(() => {
        router.push('/events')
        router.refresh()
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = () => {
    localStorage.setItem(
      'eventdazzle_user',
      JSON.stringify({ name: 'Demo User', email: 'demo@eventdazzle.com' })
    )
    router.push('/events')
    router.refresh()
  }

  return (
    <div className="flex-center min-h-screen w-full bg-surface-soft p-5">
      <div className="w-full max-w-md rounded-3xl border border-surface-line bg-white p-8 shadow-sm">
        <p className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-primary-500">
          EventDazzle
        </p>
        <h1 className="h3-bold mb-2 text-center">Welcome back</h1>
        <p className="p-regular-16 mb-8 text-center text-grey-600">
          {step === 'email'
            ? 'Enter your email — we will send a one-time login code'
            : `Enter the 6-digit code sent to ${email}`}
        </p>

        {step === 'email' ? (
          <form className="flex flex-col gap-4" onSubmit={sendOtp}>
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

            {error ? <p className="p-regular-14 text-red-500">{error}</p> : null}
            {info ? <p className="p-regular-14 text-green-700">{info}</p> : null}

            <Button type="submit" size="lg" className="button mt-2 w-full" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP to Email'}
            </Button>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={verifyOtp}>
            <label className="flex flex-col gap-2">
              <span className="p-medium-14">One-time password (OTP)</span>
              <input
                className="input-field text-center text-2xl tracking-[0.4em]"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
              />
            </label>

            {error ? <p className="p-regular-14 text-red-500">{error}</p> : null}
            {info ? <p className="p-regular-14 text-green-700">{info}</p> : null}

            <Button type="submit" size="lg" className="button mt-2 w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="button w-full"
              onClick={() => {
                setStep('email')
                setOtp('')
                setError('')
              }}
            >
              Use a different email
            </Button>
          </form>
        )}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-grey-400/30" />
          <span className="p-regular-14 text-grey-500">or</span>
          <div className="h-px flex-1 bg-grey-400/30" />
        </div>

        <Button type="button" size="lg" variant="outline" className="button w-full" onClick={demoLogin}>
          Continue as Demo User (no OTP)
        </Button>

        <p className="p-regular-14 mt-6 text-center text-grey-600">
          New here?{' '}
          <Link href="/sign-up" className="text-primary-500">
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}
