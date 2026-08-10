import { NextRequest, NextResponse } from 'next/server'
import { sendLoginAlertEmail } from '@/lib/mail'
import { verifyOtp } from '@/lib/otpStore'

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = (await req.json()) as { email?: string; otp?: string }

    if (!email?.trim() || !otp?.trim()) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()
    const result = verifyOtp(trimmedEmail, otp.trim())

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 401 })
    }

    const alert = await sendLoginAlertEmail(result.name, trimmedEmail)

    return NextResponse.json({
      success: true,
      user: { name: result.name, email: trimmedEmail },
      loginAlertSent: alert.delivered,
      message: alert.delivered
        ? 'Login successful. A security email was sent to your inbox.'
        : 'Login successful.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OTP verification failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
