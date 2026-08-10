import nodemailer from 'nodemailer'
import https from 'https'
import dns from 'dns'
import { URL } from 'url'

dns.setDefaultResultOrder('ipv4first')

export type WelcomeMailResult = {
  delivered: boolean
  provider: string
  note: string
  subject: string
  message: string
  to: string
}

function buildWelcomeContent(name: string, email: string) {
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

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 12px;color:#E11D48">Welcome to EventDazzle</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created successfully with this email: <strong>${email}</strong></p>
      <p>Thanks for joining us.<br/>— Team EventDazzle</p>
    </div>
  `

  return { subject, message, html }
}

function buildOtpContent(name: string, email: string, otp: string) {
  const subject = `${otp} is your EventDazzle login code`
  const message = `Hi ${name},

Your one-time login code for EventDazzle is: ${otp}

This code expires in 10 minutes. Do not share it with anyone.

If you did not request this, ignore this email.

— Team EventDazzle`

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 12px;color:#E11D48">EventDazzle login code</h2>
      <p>Hi ${name},</p>
      <p>Your one-time login code is:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#E11D48">${otp}</p>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>— Team EventDazzle</p>
    </div>
  `

  return { subject, message, html }
}

function buildLoginAlertContent(name: string, email: string) {
  const when = new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })
  const subject = 'New login to EventDazzle'
  const message = `Hi ${name},

Your EventDazzle account was just logged in using this email: ${email}

Time: ${when}

If this was you, no action is needed.

If you did not log in, secure your email account immediately.

— Team EventDazzle`

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 12px;color:#E11D48">New login detected</h2>
      <p>Hi ${name},</p>
      <p>Your EventDazzle account was logged in using <strong>${email}</strong></p>
      <p>Time: ${when}</p>
      <p>— Team EventDazzle</p>
    </div>
  `

  return { subject, message, html }
}

/** HTTPS GET that follows redirects (Apps Script POST redirects often return 405). */
function getUrlJson(targetUrl: string, timeoutMs = 25000, redirectsLeft = 5) {
  const parsed = new URL(targetUrl)

  return new Promise<{ ok: boolean; status: number; data: Record<string, unknown>; raw: string }>(
    (resolve, reject) => {
      const req = https.request(
        {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port || 443,
          path: parsed.pathname + parsed.search,
          method: 'GET',
          headers: { Accept: 'application/json,text/plain,*/*' },
          rejectUnauthorized: false,
          family: 4,
          timeout: timeoutMs,
        },
        (res) => {
          const location = res.headers.location
          if (location && res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
            res.resume()
            if (redirectsLeft <= 0) {
              reject(new Error('Too many redirects'))
              return
            }
            const nextUrl = new URL(location, targetUrl).toString()
            getUrlJson(nextUrl, timeoutMs, redirectsLeft - 1).then(resolve).catch(reject)
            return
          }

          let raw = ''
          res.on('data', (chunk) => {
            raw += chunk
          })
          res.on('end', () => {
            let data: Record<string, unknown> = {}
            try {
              data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
            } catch {
              data = { raw }
            }
            resolve({ ok: (res.statusCode || 500) < 400, status: res.statusCode || 500, data, raw })
          })
        }
      )

      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Gmail mailer timed out'))
      })
      req.end()
    }
  )
}

/** HTTPS JSON POST to a host/path (Brevo / Resend). */
function postJson(
  hostname: string,
  path: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  timeoutMs = 20000
) {
  const payload = JSON.stringify(body)

  return new Promise<{ ok: boolean; status: number; data: Record<string, unknown> }>((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        rejectUnauthorized: false,
        family: 4,
        timeout: timeoutMs,
      },
      (res) => {
        let raw = ''
        res.on('data', (chunk) => {
          raw += chunk
        })
        res.on('end', () => {
          let data: Record<string, unknown> = {}
          try {
            data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
          } catch {
            data = { raw }
          }
          resolve({ ok: (res.statusCode || 500) < 400, status: res.statusCode || 500, data })
        })
      }
    )

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`${hostname} timed out`))
    })
    req.write(payload)
    req.end()
  })
}

/**
 * Send via YOUR Gmail using Google Apps Script (HTTPS).
 * Works when smtp.gmail.com ports 465/587 are blocked.
 */
async function sendWithGmailAppsScript(to: string, subject: string, message: string, html: string) {
  const baseUrl = process.env.GMAIL_APPS_SCRIPT_URL?.trim()
  if (!baseUrl) return null

  const secret = process.env.GMAIL_SCRIPT_SECRET?.trim() || ''
  const fromName =
    process.env.EMAIL_FROM?.match(/^(.*?)</)?.[1]?.trim() ||
    process.env.GMAIL_FROM_NAME?.trim() ||
    'EventDazzle'

  const u = new URL(baseUrl)
  u.searchParams.set('secret', secret)
  u.searchParams.set('to', to)
  u.searchParams.set('subject', subject)
  u.searchParams.set('message', message)
  u.searchParams.set('html', html)
  u.searchParams.set('fromName', fromName)

  const result = await getUrlJson(u.toString())

  if (!result.ok || result.data.ok === false) {
    throw new Error(
      (result.data.error as string) ||
        result.raw?.slice(0, 200) ||
        `Gmail Apps Script failed (${result.status})`
    )
  }

  return { provider: 'gmail', note: 'sent via your Gmail (Apps Script)' }
}

async function sendWithBrevo(to: string, subject: string, message: string, html: string) {
  const key = process.env.BREVO_API_KEY?.trim()
  if (!key) return null

  const smtpUser = process.env.SMTP_USER?.trim() || ''
  const fromMatch = process.env.EMAIL_FROM?.match(/^(.*?)<([^>]+)>$/)
  const from = fromMatch
    ? { name: fromMatch[1].trim() || 'EventDazzle', email: fromMatch[2].trim() }
    : { name: 'EventDazzle', email: smtpUser }

  if (!from.email) return null

  const result = await postJson(
    'api.brevo.com',
    '/v3/smtp/email',
    { 'api-key': key },
    {
      sender: from,
      to: [{ email: to }],
      subject,
      textContent: message,
      htmlContent: html,
    }
  )

  if (!result.ok) {
    throw new Error(
      (result.data.message as string) || (result.data.code as string) || `Brevo failed (${result.status})`
    )
  }

  return { provider: 'brevo', note: 'sent via Brevo' }
}

async function sendWithSmtpOnce(
  to: string,
  subject: string,
  message: string,
  html: string,
  host: string,
  port: number
) {
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '')
  if (!user || !pass) return null

  const from = process.env.EMAIL_FROM?.trim() || `EventDazzle <${user}>`

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
    family: 4,
  } as nodemailer.TransportOptions)

  await transporter.sendMail({ from, to, subject, text: message, html, replyTo: user })
  return { provider: 'smtp', note: `sent via Gmail SMTP ${host}:${port}` }
}

async function sendWithSmtp(to: string, subject: string, message: string, html: string) {
  if (process.env.DISABLE_SMTP === '1') return null

  const attempts = [
    { host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com', port: Number(process.env.SMTP_PORT || 587) },
    { host: 'smtp.gmail.com', port: 587 },
    { host: 'smtp.gmail.com', port: 465 },
  ]

  let lastError: Error | null = null
  for (const attempt of attempts) {
    try {
      const result = await sendWithSmtpOnce(to, subject, message, html, attempt.host, attempt.port)
      if (result) return result
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('SMTP failed')
    }
  }

  if (lastError) throw lastError
  return null
}

async function sendEmail(
  to: string,
  subject: string,
  message: string,
  html: string,
  _name: string
): Promise<WelcomeMailResult> {
  const errors: string[] = []

  // 1) Your Gmail over HTTPS (works when SMTP ports are blocked)
  try {
    const gmail = await sendWithGmailAppsScript(to, subject, message, html)
    if (gmail) return { delivered: true, provider: gmail.provider, note: gmail.note, subject, message, to }
  } catch (err) {
    errors.push(`Gmail: ${err instanceof Error ? err.message : 'failed'}`)
  }

  // 2) Direct Gmail SMTP (works on networks that allow 465/587)
  try {
    const smtp = await sendWithSmtp(to, subject, message, html)
    if (smtp) return { delivered: true, provider: smtp.provider, note: smtp.note, subject, message, to }
  } catch (err) {
    errors.push(`SMTP: ${err instanceof Error ? err.message : 'failed'}`)
  }

  // 3) Optional third-party only if configured
  try {
    const brevo = await sendWithBrevo(to, subject, message, html)
    if (brevo) return { delivered: true, provider: brevo.provider, note: brevo.note, subject, message, to }
  } catch (err) {
    errors.push(`Brevo: ${err instanceof Error ? err.message : 'failed'}`)
  }

  return {
    delivered: false,
    provider: 'none',
    note:
      errors.join(' | ') ||
      'Gmail not configured. Set GMAIL_APPS_SCRIPT_URL (see scripts/gmail-otp-mailer.gs)',
    subject,
    message,
    to,
  }
}

export async function sendWelcomeEmail(name: string, email: string) {
  const { subject, message, html } = buildWelcomeContent(name, email)
  return sendEmail(email, subject, message, html, name)
}

export async function sendOtpEmail(name: string, email: string, otp: string) {
  const { subject, message, html } = buildOtpContent(name, email, otp)
  return sendEmail(email, subject, message, html, name)
}

export async function sendLoginAlertEmail(name: string, email: string) {
  const { subject, message, html } = buildLoginAlertContent(name, email)
  return sendEmail(email, subject, message, html, name)
}
