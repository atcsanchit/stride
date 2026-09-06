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

Do **not** put this in Peakflo, work GCP, work Firestore, company Mongo, or a work Google login. This machine already has job accounts; mixing them is how personal interview prep leaks into employer systems.

| Store | What | Use it? |
| --- | --- | --- |
| **Personal IndexedDB** (`stride-personal-accounts`, `stride-personal-<profileId>`) | Profiles, PIN hash, roadmaps, drops | **Yes — default.** Stays in this browser. Isolated per profile. |
| **JSON export** (`name-date.stride.json`) | Full backup you download | **Yes — keep in a personal folder** (`~/Documents`, personal Drive, USB). Not company Drive. |
| Work cloud (Peakflo / GCP / Firestore / Mongo) | Employer data | **Never.** |
| Work Google / SSO | Job identity | **Never.** A Stride profile is a local name + optional PIN. |

Logout clears the session. Data stays on this device until you delete the profile or clear site data. Use a **personal Chrome profile** if this laptop also has a work Google profile, so browser sync and extensions stay separate.

If you already logged drops before login existed, the first profile you create will pick up that legacy `stride-tracker` database and then remove it.

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
