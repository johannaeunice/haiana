# Haiana landing page

## Brevo configuration

Create `.env.local` for local development:

```env
BREVO_API_KEY=your_brevo_api_key
BREVO_CONTACTS_FALLBACK=1
```

`BREVO_API_KEY` is required for the live contact count and subscriptions.
`BREVO_CONTACTS_FALLBACK` is optional and defaults to `1`.

The API key is only read by server-side routes and must never use a `VITE_` prefix.

## Local testing

Install dependencies and start Vite:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

Local API routes:

- `GET /api/brevo-count`
- `GET /api/brevo-count?refresh=1`
- `POST /api/brevo-subscribe`

The local Vite route bypasses reCAPTCHA but still creates or updates the contact
through the Brevo Contacts API and explicitly assigns list ID `2`.

Without `BREVO_API_KEY`, the count route returns the configured fallback and the
subscription route returns an error without creating a false success state.

## Vercel testing

Add these environment variables in the Vercel project settings for Preview and
Production:

```text
BREVO_API_KEY
BREVO_CONTACTS_FALLBACK=1
```

Deploy the project. Vercel automatically exposes the functions under `api/`.

Verify the count:

```text
https://your-domain.example/api/brevo-count?refresh=1
```

The response should include:

```json
{
  "brevoContacts": 1,
  "fallback": false,
  "listId": 2
}
```

Submit the landing-page form with a real test address, then verify:

1. The browser console shows a successful `/api/brevo-subscribe` response.
2. The contact exists in Brevo list `Les Premiers Haiana` with list ID `2`.
3. `/api/brevo-count?refresh=1` increases when the submitted contact is new.
4. The displayed counter animates to the refreshed value.
