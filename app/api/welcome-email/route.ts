import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/mail'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { name, email } = (await req.json()) as { name?: string; email?: string }

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const result = await Promise.race([
      sendWelcomeEmail(name.trim(), email.trim()),
      new Promise<Awaited<ReturnType<typeof sendWelcomeEmail>>>((resolve) =>
        setTimeout(
          () =>
            resolve({
              delivered: false,
              provider: 'timeout',
              note: 'Email sending timed out on this network',
              subject: 'Welcome to EventDazzle — your account is ready',
              message: '',
              to: email.trim(),
            }),
          10000
        )
      ),
    ])

    if (!result.delivered) {
      return NextResponse.json(
        {
          error: 'Could not send email to your inbox on this network.',
          providerNote: result.note,
          preview: {
            to: result.to,
            subject: result.subject,
            message: result.message,
          },
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      delivered: true,
      provider: result.provider,
      providerNote: result.note,
      preview: {
        to: result.to,
        subject: result.subject,
        message: result.message,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not send welcome email' },
      { status: 500 }
    )
  }
}
