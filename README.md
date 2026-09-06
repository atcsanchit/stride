# Stride

Personal interview-prep tracker for **DSA**, **system design**, and **AI engineering**. Learning is production, not consumption: blurt first, apply the same day, write one sentence of what you learned.

Live: [https://stride-ten-psi.vercel.app](https://stride-ten-psi.vercel.app)  
Local: `http://localhost:5174`

This is a personal app. Do **not** put it in Peakflo, work GCP, work Firestore, company Mongo, or a work Google login.

## Run

```bash
cd stride
npm install
npm run dev
```

Vite is pinned to port **5174**. Copy `.env.example` to `.env.local` and set `VITE_GOOGLE_CLIENT_ID` (see Google below). Restart the dev server after changing it — Vite bakes env at build/start.

## Accounts

Google is the login, not a separate “link Drive” step.

1. **Continue with Google** (personal Gmail). That Gmail’s Drive is that person’s Stride.
2. A **different Gmail** opens that account. It does not load the previous Gmail’s tickets onto the new Drive.
3. **New accounts** then hit **What are you training?** Pick one or more courses. Only those show in Today, nav, and Revise.
4. Add or remove courses later under **Profile**. Progress stays on the device if you turn a course off and add it back. At least one course must stay on. Career focus (what the coach protects if DSA takes over) is also on Profile, among enabled courses.
5. **Username + PIN** is a this-browser fallback if you skip Google. Usernames are unique. Sign up never logs you into an existing name.

Existing accounts that already have tickets skip the course page once (all three courses stay on until you edit Profile).

## Where data lives

| Store | What | Use it? |
| --- | --- | --- |
| **Personal IndexedDB** | Live tickets, courses, PINs. Fast cache. | **Yes.** Lost if you clear **site data** (not the same as a normal cache clear). |
| **Personal Google Drive** (`Stride/accounts.json` + `Stride/<profileId>.json`) | Survives cache clear and new devices. | **Yes — personal Gmail only.** |
| **JSON export** | Manual backup you download | **Yes.** |
| Laptop `data/` JSON | Local Vite only (`localhost:5174`) | Laptop backup. Not on Vercel. Gitignored. |
| Firestore / Gist | Not implemented | **Not until you explicitly ask.** |
| Work cloud / work Google | Employer systems | **Never.** |

Tickets do **not** live in a Vercel database. The Hobby deploy is a static frontend. IndexedDB is first; Drive is the backup.

After you edit, Stride writes IndexedDB immediately, then pushes **that Google account’s** files ~4 seconds after you stop, and again when you hide the tab (switch app, lock phone). Do not rely on closing the tab alone. After a refresh, Google does not open by itself — click Continue.

Drive scope is `drive.file` (only files Stride created) plus email. Work `@peakflo.co` logins are rejected.

## Google (free)

OAuth consent stays **External + Testing**. Do not publish the app (that starts Google verification). Do not add a billing account.

### Local

```bash
gcloud auth login   # personal Gmail only — abort if it is peakflo.co
./scripts/setup-google-oauth.sh
```

Or by hand:

1. Personal GCP project → enable **Google Drive API**.
2. Credentials → **OAuth client ID → Web application**.
3. Authorized JavaScript origins:
   - `http://localhost:5174`
   - `https://stride-ten-psi.vercel.app`
4. Consent screen: **External**, **Testing**. **Test users** = every personal Gmail that should sign in (`atcsanchit@gmail.com`, `sanchitatc01@gmail.com`, …). Do not add `@peakflo.co`.
5. `stride/.env.local`:

```
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

The Web client ID is public. It is supposed to ship in the browser bundle. There is no client secret in this app.

### “Access blocked / 403 access_denied”

The app is in Testing. Google only lets in emails listed as **Test users**. Add the Gmail under [Audience](https://console.cloud.google.com/auth/audience) for the Stride project, wait a minute, try again.

### Vercel

Project → Settings → Environment Variables:

- Key: `VITE_GOOGLE_CLIENT_ID` (keep the `VITE_` prefix or the app will not see it).
- Type: **Config**, not **Secret**. Vercel rejects `VITE_*` as Secret because it is exposed to the browser. That is correct here.
- Environments: **Production** and **Preview**.
- **Redeploy** after saving. Vite only reads this at build time.

## How to use it

**Today** is the plan. One weekday happening (Erin Meryl cadence): start small, apply, blurt, ship, look back on Sunday.

- **Blurt** before notes. Cover the material, dump what you remember, then look.
- **Complete** needs “What I learned”. Watching a video does not mark the heatmap.
- **Tickets** are notes. Topics are tags, not the ticket title. Sprint tickets show on every day of the sprint. Spillover renames in place. Clone to the next day or sprint. You cannot delete a completed ticket.
- **DSA / design** do not require GitHub. **AI practicals** need GitHub (or other public) evidence.
- **Revise** is spaced retrieval on items you actually completed.
- **Lab** (localhost only) runs the Python on this laptop. See below.
- **Export** JSON to a personal folder now and then. **Log out** when you walk away.

Keep the daily floor small enough for a tired Tuesday (default: 3 DSA, 1 design, 1 AI block — only for courses you enabled).

Replace starter lists in `src/roadmaps/` with your own and restart.

## Python lab

The **Lab** tab runs code on the Python already installed on this laptop. No paid compiler, no cloud. It is **localhost only** — not on Vercel.

- Bind: Vite `/api/python/run`
- 8 second timeout, isolated from work environment variables
- Optional stdin for `input()`
- Ctrl+Enter to run; **Log as DSA drop** after a green run

Override the binary with `STRIDE_PYTHON=/path/to/python npm run dev`. Do not point it at a work virtualenv.

## Roadmap format

```md
---
track: dsa
title: My DSA list
---

# My DSA list

## Arrays
- [ ] Two Sum
- [x] Valid Anagram

## Sliding window
- Longest Substring Without Repeating Characters
```

- `track` must be `dsa`, `system-design`, or `ai-engineering`. If omitted, the filename is used (`dsa.md`, `system-design.md`, `ai-engineering.md`).
- `##` headings become skill modules with their own progress bars.
- Checklist and bullet items become the course.
- Re-dropping or editing a bundled file merges by title. Completed items stay completed.
- Drop any other `.md` onto the window while you are signed in.
