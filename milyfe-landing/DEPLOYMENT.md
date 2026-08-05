# MiLyfe.fun Landing Page — Optimal Launch Setup

## What this is
A static landing page that behaves like app onboarding:

- Hero + clear founding-citizen call to action
- Multi-step signup wizard
- Local draft saving in the visitor browser
- Citizen path selection: join/start/bring/build
- Circle formation details
- Role and contribution capture
- Five-principle Charter agreement
- Final review with invite code
- Optional JSON submission to a form endpoint

Main file: `index.html`

---

## Fastest launch

### 1. Upload the file
Upload `index.html` to the web root for `milyfe.fun`.

Good static hosting options:

- Cloudflare Pages
- Netlify
- Vercel
- GitHub Pages
- Your current cPanel/shared hosting web root

No app server is required.

---

## Form capture configuration

Open `index.html` and find:

```js
const FORM_ENDPOINT = "";
const THANK_YOU_URL = "";
const SITE_NAME = "MiLyfe.fun Founding Circle";
```

Set `FORM_ENDPOINT` to your form collector URL.

Recommended no-backend choices:

1. **Formspree** — quickest and simple.
2. **Basin** — simple form collection.
3. **Tally / Typeform embed fallback** — easier admin UI, less custom.
4. **Google Apps Script** — free Google Sheet capture.
5. **Airtable automation webhook** — good for tagging Circles and follow-up.
6. **Custom endpoint** — best later when you build Vault/ID properly.

Until `FORM_ENDPOINT` is set, the page does **not** send signup data anywhere. It saves the draft locally and downloads a JSON summary for testing.

---

## Recommended signup data table

Create these fields in Airtable, Google Sheets, or your CRM:

| Field | Purpose |
|---|---|
| `submittedAt` | Signup timestamp |
| `inviteCode` | Generated founding citizen code |
| `name` | Citizen name |
| `email` | Primary contact |
| `phone` | Optional SMS/phone |
| `location` | City/state/country for Circle matching |
| `referral` | Source or inviter |
| `path` | Join / start / bring group / build |
| `circleName` | Proposed Circle or community |
| `circleSize` | Readiness size |
| `focus` | Wealth, Health, Food, Housing, Education, Safety, Environment, Governance |
| `why` | First problem to solve |
| `roles` | Contributions offered |
| `availability` | Weekly capacity |
| `contactPref` | Preferred follow-up channel |
| `charter` | Five Charter principles accepted |
| `consent` | Contact consent |

---

## Optimal follow-up automation

Use tags from the form:

- `path = Start a new Circle` → send Circle Starter Kit + schedule steward call.
- `path = Join a local Circle` → match by location and focus.
- `path = Bring an existing group` → send group intake form.
- `path = Build the system` → send builder/contributor onboarding.
- `circleSize = 7-13` or higher → prioritize for first assembly.
- `roles includes Legal/Finance/Ops` → flag as core formation support.

Suggested email sequence:

1. **Immediate:** “You are on the founding list” + invite code.
2. **Day 1:** Charter and Circle explanation.
3. **Day 3:** Choose/confirm role.
4. **Day 5:** Invite to founding call or local Circle.
5. **Day 8:** First assembly agenda.
13. **Day 13:** Circle launch checkpoint.

---

## Suggested landing page headline tests

Current headline:

> Our new Govt starts now.

Safer alternatives if platforms flag “government” language:

- “Our new self-governance starts now.”
- “Founding Circles start now.”
- “Build the government you can leave, own, and improve.”

---

## Legal/compliance caution

This page is community onboarding. If MiLyfe will create a legal government entity, political committee, nonprofit, cooperative, treasury, token sale, or public-benefit organization, consult qualified legal, election, tax, securities, and privacy counsel before collecting money or making official claims.

---

## Recommended DNS/security settings

- Force HTTPS.
- Add a redirect from `www.milyfe.fun` to `milyfe.fun` or vice versa.
- Use a privacy-first analytics option, if any: Plausible, Umami, or Cloudflare Web Analytics.
- Avoid third-party trackers on the first version.
- Add a real privacy/contact page before paid traffic.

---

## Files

- `index.html` — the landing page.
- `DEPLOYMENT.md` — this setup guide.
