# Stride

Local tracker for three fields: **DSA**, **system design**, and **AI engineering**.

Roadmaps are markdown. Bundled files in `src/roadmaps/` load on boot after you sign in. Drop any other `.md` onto the window and it is parsed into modules, a course of action, and progress bars. Checking an item or logging a drop writes a daily record. The coach watches consistency, not hero days.

## Run

```bash
cd stride
npm install
npm run dev
```

## Python lab

The **Lab** tab runs code on the Python already installed on this laptop (`/usr/bin/python3` here). No paid compiler, no cloud.

- Bind is localhost via the Vite app (`/api/python/run`)
- 8 second timeout, isolated from work environment variables
- Optional stdin for `input()`
- Ctrl+Enter to run; **Log as DSA drop** after a green run

Override the binary with `STRIDE_PYTHON=/path/to/python npm run dev` if you want a personal venv. Do not point it at a work virtualenv.

## Where data lives (personal, not work)

Do **not** put this in Peakflo, work GCP, work Firestore, company Mongo, or a work Google login.

| Store | What | Use it? |
| --- | --- | --- |
| **Personal IndexedDB** | Live tickets, courses, PINs. Fast cache. | **Yes.** Lost if you clear site data. |
| **Personal Google Drive** (`Stride/accounts.json` + `Stride/<profileId>.json`) | Survives cache clear and new devices. | **Yes — personal Gmail only.** |
| **JSON export** | Manual backup you download | **Yes.** |
| Laptop `data/` JSON | Local Vite only (`localhost:5174`) | Laptop backup. Not on Vercel. |
| Firestore / Gist | Not implemented | **Not until you explicitly ask.** |
| Work cloud / work Google | Employer systems | **Never.** |

The live site writes IndexedDB first, then syncs **that Google account’s** Drive ~4 seconds after you stop editing, and again when you hide the tab (switch app, lock phone). Do not rely on closing the tab alone. Continue with Google **logs you into that Gmail’s Stride**. Picking a different Gmail opens that account — it does not load the previous person’s tickets onto the new Drive.

### Google Drive (free)

From `stride/`:

```bash
gcloud auth login   # personal Gmail only — abort if it is peakflo.co
./scripts/setup-google-oauth.sh
```

That creates a personal Cloud project and enables Drive. Google still requires one Console click for the Web client ID (there is no public API for that). The script opens the URL, then writes `.env.local`.

Manual equivalent:

1. Google Cloud Console → new project (or personal one) → enable **Google Drive API**.
2. Credentials → **Create credentials → OAuth client ID → Web application**.
3. Authorized JavaScript origins:
   - `http://localhost:5174`
   - `https://stride-ten-psi.vercel.app` (and any custom domain)
4. OAuth consent screen: **External**, publishing status **Testing**, test user = your **personal** Gmail. Do not add a billing account.
5. Copy the client ID into `stride/.env.local`:

```
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

6. Same variable in Vercel → Project → Settings → Environment Variables → Production (and Preview). Redeploy. Vite bakes this in at **build** time.
7. In the app: **Continue with Google**. That signs you into the Stride account for that Gmail and creates a `Stride` folder on that personal Drive. A different Gmail is a different Stride.

Python Lab still only runs on localhost.

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

## How to use it

1. Create a profile with your name and career field (AI engineering on the resume). Optional PIN if the laptop is shared.
2. Keep the daily floor small enough for a tired Tuesday (default: 3 DSA problems, 1 design topic, 1 AI block).
3. Log a drop when you finish work, or check items on the track page.
4. Export JSON every week to a personal folder.
5. Log out when you walk away.

Replace the starter roadmaps in `src/roadmaps/` with your own lists and restart the app.
