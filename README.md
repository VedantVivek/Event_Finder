# Event Dazzle

## Project Overview

Event Dazzle is a web application for discovering and booking tickets for local events such as concerts, comedy shows, workshops, seminars, and festivals. It uses live event APIs and location-based search to find events near you and offers a seamless booking experience with zone-based tickets, UPI & card payments, and smart event recommendations.

Built with **Next.js** and **TypeScript**, using **Email OTP authentication**, **Stripe + UPI** for payments, and **MongoDB** (optional) for order persistence.

---

## Features

- **Event Listings** — Browse concerts, comedy, workshops, sports, food festivals, and more
- **Live Event Feeds** — Ticketmaster (global + India) and Bushdrum (India) APIs
- **Location-Based Search** — Find nearby events using GPS or city selection (7 Indian metros)
- **Infinite Scroll** — Continuous event browsing without pagination clicks
- **Zone-Based Tickets** — Front (Premium), Middle (Standard), Back (Economy) with live seat counts
- **Event Trail** — Smart follow-up event suggestions to plan your entire evening
- **Vibe Tags** — Mood-based labels (e.g. High energy, Date night, Free entry)
- **Nearby Venues** — Metro stations, restaurants & shops near event venues (OpenStreetMap)
- **User Authentication** — Secure email OTP login and sign-up
- **Ticket Booking** — Integrated Stripe (card) and UPI QR (GPay / Paytm / PhonePe) payments
- **Community Events** — Users can create and publish their own events
- **Responsive Design** — Mobile-friendly UI built with Tailwind CSS

---

## Technologies Used

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Authentication:** Email OTP (Nodemailer SMTP)
- **Payment Gateway:** Stripe, UPI QR
- **Database:** MongoDB (optional — for orders & users)
- **APIs:** Ticketmaster Discovery API, Bushdrum API, OpenStreetMap (Nominatim + Overpass)
- **Other Tools:** Git, GitHub, VS Code

---

## How to Run

1. **Clone the repository:**

```bash
git clone https://github.com/anveshas/Event-Dazzle.git
```

2. **Navigate to the project directory:**

```bash
cd Event-Dazzle
```

3. **Install dependencies:**

```bash
npm install
```

4. **Set up environment variables:**

Create a `.env.local` file in the root directory and add your API keys:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Ticketmaster (required for live events)
TICKETMASTER_API_KEY=your_ticketmaster_api_key

# Stripe (card payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# UPI (GPay / Paytm QR payments)
UPI_ID=yourname@paytm
UPI_MERCHANT_NAME=EventDazzle

# Email OTP — Gmail (recommended on networks that block SMTP)
# Your ISP blocks smtp.gmail.com:465/587, so use Google Apps Script (still YOUR Gmail):
# 1) Open scripts/gmail-otp-mailer.gs and follow the setup comments
# 2) Deploy as Web app → paste URL below
GMAIL_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
GMAIL_SCRIPT_SECRET=choose_a_long_random_secret
EMAIL_FROM=EventDazzle <your_email@gmail.com>

# Optional: direct Gmail SMTP (works only if ports 465/587 are open)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
DISABLE_SMTP=0

# MongoDB (optional)
MONGODB_URI=your_mongodb_connection_string
```

5. **Start the development server:**

```bash
npm run dev
```

6. **Open the app:**

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
app/
  (root)/          # Pages — home, events, checkout, payment, profile
  (auth)/          # Sign-in & sign-up (OTP)
  api/             # REST APIs — events, auth, payments, webhooks
components/        # Reusable UI components
lib/               # Core logic — events, tickets, payments, images
constants/         # Curated India city events & config
public/assets/     # Images, icons, category SVGs
```

---

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with search & categories |
| `/events` | Browse & discover events |
| `/events/[id]` | Event detail, zones, trail, nearby |
| `/events/[id]/checkout` | Order review |
| `/events/[id]/payment` | UPI QR or Stripe payment |
| `/events/create` | Create your own event |
| `/profile` | User profile & created events |
| `/sign-in` | Email OTP login |

---

## How EventDazzle Differs from District

| Feature | EventDazzle | District |
|---------|-------------|----------|
| Focus | Events-only discovery & booking | Full lifestyle app (movies, dining, stores) |
| Zone tickets | Front / Middle / Back with live counts | Standard seat categories |
| Event Trail | Follow-up event suggestions | Not available |
| Vibe tags | Auto mood labels on events | Category filters only |
| Community events | Users can create events | Promoter listings only |
| Live APIs | Ticketmaster + Bushdrum multi-feed | Single official inventory |

---

## Author

**Vedant Vivek**

---

## License

This project is for educational and portfolio purposes.
