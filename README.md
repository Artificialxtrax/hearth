# Hearth

Hearth is a prototype marketplace for homeowners who cannot buy coverage and the underwriters who would price it. A homeowner posts a request. Underwriters bid an annual premium. The order book shows the best bid, the spread, and implied annual risk: premium divided by coverage.

The lead example is wildfire coverage in Pacific Palisades, Malibu, Altadena, and nearby fire-zone ZIPs. Seeded rows are fictional and labeled **Demo**.

Hearth does not sell or bind insurance. Bids are non-binding indications of interest. No payment is processed. A real policy would be issued by a licensed carrier or broker.

## Run locally

No hosted database is required. The desk keeps a seeded in-memory book for the life of the dev server.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

```bash
npm test
npm run lint
npm run build
```

`npm run db:setup` does not contact a hosted database unless `HEARTH_REMOTE=1` is set on purpose. The local demo does not need it.

Production start listens on `process.env.PORT` (default `10000`) and `0.0.0.0`:

```bash
npm run build
PORT=10000 npm start
```

`GET /healthz` returns `200` and the body `ok`.

## Render

`render.yaml` is a free Node web service named `hearth` in Oregon. It deploys from `main`. Build is `npm install && npm run build`. Start is `npm start`. No database and no environment secrets are required. The demo desk stays in memory for the life of the process.

## Get my quotes

Open `/quotes`. The short intake is prefilled from a posted risk when you arrive with `?request=`, or from your own open request when you are signed in as a homeowner. **Get my quotes** ranks two sources:

1. Underwriters on this desk who opted into the state and risk, or who already bid on a similar one. Those cards say **Ready to quote**. Requesting one writes a quote request on their Profile.
2. A curated directory of real U.S. homeowners carriers in `data/carriers.json`, with public product-page URLs and a source on each entry. Those cards say **Likely to quote**. The button opens that public page in a new tab. Hearth has not been told they will take the home.

Premium ranges are estimates. If `OPENAI_API_KEY` or `XAI_API_KEY` is set, the fit lines can be rewritten by that model. With no key, a deterministic ranker still fills the page.

## Try the desk

1. Sign in as Elena Voss (homeowner) or open your own homeowner desk. There is no password.
2. Post a coverage request, or open the seeded Pacific Palisades wildfire book.
3. Sign out and enter as June Adler, Tomás Reeve, Naomi Chen, or Leo Park.
4. Submit an indication. The order book updates for anyone else looking at the same request.
5. Switch back to the homeowner and accept an indication. That records interest. It does not issue a policy.

## Phone

The app is a progressive web app. In mobile Safari or Chrome, use Add to Home Screen. A service worker keeps a small offline shell; the book itself needs a connection.

## Scripts

- `npm run dev` — Next.js on port 43123
- `npm run db:setup` — schema and demo seed
- `npm test` — order-book math
- `npm run lint` — ESLint
- `npm run icons` — regenerate the PWA icons
