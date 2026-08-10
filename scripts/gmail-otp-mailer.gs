/**
 * EventDazzle — Gmail OTP mailer (Google Apps Script)
 *
 * SETUP:
 * 1. Open https://script.google.com as vedantvivek496@gmail.com
 * 2. Paste this file into the project (replace all code)
 * 3. Project Settings → Script properties → Add:
 *      SECRET = (same value as GMAIL_SCRIPT_SECRET in .env.local)
 * 4. Deploy → Manage deployments → Edit (pencil) → New version → Deploy
 *    OR Deploy → New deployment → Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Copy Web app URL into .env.local → GMAIL_APPS_SCRIPT_URL
 * 6. Restart npm run dev
 */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  )
}

function sendMail_(data) {
  const expected = PropertiesService.getScriptProperties().getProperty('SECRET') || ''
  if (expected && data.secret !== expected) {
    return { ok: false, error: 'Unauthorized — set Script property SECRET to match GMAIL_SCRIPT_SECRET' }
  }

  const to = String(data.to || '').trim()
  const subject = String(data.subject || '').trim()
  const message = String(data.message || '')
  const html = String(data.html || message)
  const fromName = String(data.fromName || 'EventDazzle')

  if (!to || !subject) {
    return { ok: false, error: 'Missing to or subject' }
  }

  GmailApp.sendEmail(to, subject, message, {
    htmlBody: html,
    name: fromName,
  })

  return { ok: true, provider: 'gmail' }
}

function doGet(e) {
  try {
    const p = (e && e.parameter) || {}
    // Health check when no "to" is provided
    if (!p.to) {
      return ContentService.createTextOutput('EventDazzle Gmail mailer is running')
    }
    return json_(
      sendMail_({
        secret: p.secret || '',
        to: p.to || '',
        subject: p.subject || '',
        message: p.message || '',
        html: p.html || p.message || '',
        fromName: p.fromName || 'EventDazzle',
      })
    )
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) })
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json_({ ok: false, error: 'Empty body' })
    }
    const data = JSON.parse(e.postData.contents)
    return json_(sendMail_(data))
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) })
  }
}
