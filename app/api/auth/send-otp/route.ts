import { NextRequest, NextResponse } from 'next/server'
import { sendOtpEmail } from '@/lib/mail'
import { createOtp } from '@/lib/otpStore'

export async function POST(req: NextRequest) {
  try {
    const { email, name } = (await req.json()) as { email?: string; name?: string }

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()
    const displayName = name?.trim() || trimmedEmail.split('@')[0] || 'User'
    const otp = createOtp(trimmedEmail, displayName)

    const result = await sendOtpEmail(displayName, trimmedEmail, otp)

    if (!result.delivered) {
      // Local/dev networks often block Gmail SMTP (465/587). Still issue the OTP
      // so sign-in works — shown on-screen and logged in the terminal.
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[EventDazzle] Dev OTP for ${trimmedEmail}: ${otp}`)
        return NextResponse.json({
          success: true,
          message: `Email could not be sent (${result.note}). Use this code: ${otp}`,
          devOtp: otp,
        })
      }

      return NextResponse.json(
        { error: result.note || 'Could not send OTP email. Check SMTP settings in .env.local' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${trimmedEmail}. Check your inbox (and spam folder).`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send OTP'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
