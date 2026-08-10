import { NextRequest, NextResponse } from 'next/server'
import { buildUpiPaymentUri, getUpiConfig } from '@/lib/upi'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const amount = Number(searchParams.get('amount'))
    const eventTitle = searchParams.get('eventTitle') || 'EventDazzle tickets'
    const tierName = searchParams.get('tierName') || ''
    const quantity = searchParams.get('quantity') || '1'

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const { upiId, payeeName, configured } = getUpiConfig()
    if (!configured) {
      return NextResponse.json(
        {
          error:
            'UPI not configured. Add UPI_ID=yourname@paytm (or @ybl for GPay) to .env.local and restart the server.',
          configured: false,
        },
        { status: 503 }
      )
    }

    const note = `${eventTitle} · ${tierName} x${quantity}`.slice(0, 80)
    const upiUri = buildUpiPaymentUri({
      upiId,
      payeeName,
      amount,
      transactionNote: note,
    })

    return NextResponse.json({
      configured: true,
      upiUri,
      upiId,
      payeeName,
      amount: amount.toFixed(2),
      currency: 'INR',
      note,
      apps: ['Google Pay', 'Paytm', 'PhonePe', 'BHIM'],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create UPI payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
