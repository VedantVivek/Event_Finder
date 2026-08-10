'use client'

import { useEffect, useState } from 'react'
import { TicketTierId } from '@/lib/tickets'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'

type UpiQrPaymentProps = {
  eventId: string
  eventTitle: string
  tierName: string
  tierId: TicketTierId
  quantity: number
  amount: number
  onSuccess: (utr?: string) => void
  onError: (message: string) => void
}

type UpiPayload = {
  upiUri: string
  upiId: string
  payeeName: string
  amount: string
  note: string
}

export default function UpiQrPayment({
  eventId,
  eventTitle,
  tierName,
  tierId,
  quantity,
  amount,
  onSuccess,
  onError,
}: UpiQrPaymentProps) {
  const [payload, setPayload] = useState<UpiPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [utr, setUtr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams({
      amount: String(amount),
      eventTitle,
      tierName,
      quantity: String(quantity),
    })

    fetch(`/api/payment/upi?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not load UPI QR')
        setPayload(data)
      })
      .catch((err) => {
        onError(err instanceof Error ? err.message : 'UPI payment unavailable')
      })
      .finally(() => setLoading(false))
  }, [amount, eventTitle, onError, quantity, tierName])

  const copyUpiId = async () => {
    if (!payload?.upiId) return
    try {
      await navigator.clipboard.writeText(payload.upiId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      onError('Could not copy UPI ID')
    }
  }

  const confirmPayment = async () => {
    setConfirming(true)
    try {
      const { bookTickets, clearPendingBooking } = await import('@/lib/tickets')
      bookTickets(eventId, tierId, quantity)
      clearPendingBooking()
      onSuccess(utr.trim() || undefined)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not confirm booking')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return <p className="p-medium-16 text-grey-500">Generating UPI QR code...</p>
  }

  if (!payload) return null

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="rounded-2xl border border-surface-line bg-white p-4 shadow-sm">
        <QRCode value={payload.upiUri} size={220} level="M" />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {['Google Pay', 'Paytm', 'PhonePe'].map((app) => (
          <span
            key={app}
            className="rounded-full bg-grey-100 px-3 py-1 text-xs font-semibold text-grey-700"
          >
            {app}
          </span>
        ))}
      </div>

      <p className="text-center text-sm text-grey-600">
        Scan with <strong>GPay</strong> or <strong>Paytm</strong> · Amount{' '}
        <strong className="text-primary-500">₹{payload.amount}</strong>
      </p>

      <div className="w-full rounded-2xl bg-grey-50 p-4 text-sm">
        <div className="flex-between mb-2">
          <span className="text-grey-500">UPI ID</span>
          <button type="button" onClick={copyUpiId} className="text-xs font-semibold text-primary-500">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="font-mono font-semibold">{payload.upiId}</p>
        <p className="mt-2 text-grey-500">Payee: {payload.payeeName}</p>
        <p className="mt-1 text-grey-500">Note: {payload.note}</p>
      </div>

      <label className="flex w-full flex-col gap-2">
        <span className="text-sm font-medium">UPI transaction ref (optional)</span>
        <input
          className="input-field"
          placeholder="e.g. 123456789012"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
        />
      </label>

      <Button size="lg" className="button w-full" onClick={confirmPayment} disabled={confirming}>
        {confirming ? 'Confirming...' : "I've completed UPI payment"}
      </Button>

      <p className="text-center text-xs text-grey-400">
        After paying via QR, tap confirm. Works with GPay, Paytm, PhonePe &amp; any UPI app.
      </p>
    </div>
  )
}
