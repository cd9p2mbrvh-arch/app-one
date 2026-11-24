# App One — Owner's Handbook

A plain-language guide to running, previewing, updating and growing App One.
It is kept up to date as the app changes (see the change log at the end).

> **Tip for working with Claude:** start a new session by saying
> _"Read docs/HANDBOOK.md and docs/PLAN.md first."_ Those two files hold
> everything decided so far.

---

## 1. Where everything lives

| What                        | Where                                                    | Notes                                                     |
| --------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| The code (source of truth)  | GitHub: `cd9p2mbrvh-arch/app-one`                        | Every change is saved there as a "commit" with a message. |
| Previews for your phone     | Expo account **pavulon**, project **app-one** (expo.dev) | Each published preview gets its own QR code.              |
| Claude's work environment   | Claude Code cloud environment **app-one**                | Has access to Expo; installs the project automatically.   |
| Product decisions           | `docs/PLAN.md`                                           | What the app does and why.                                |
| This guide                  | `docs/HANDBOOK.md`                                       |                                                           |
| Content list (themes, etc.) | `src/content/manifest.ts`                                | Themes, narrators, music, unlock levels, prices.          |
| Affirmation lines           | `src/content/lines/en/<theme>.json`                      | Currently **placeholders**.                               |
| Music files                 | `assets/music/`                                          | Currently **placeholders**.                               |

**Secrets:** the Expo access token is stored in the cloud environment's secure
settings, never in the code. If you ever think it leaked, delete it on
expo.dev → Account settings → Access tokens, and create a new one.

---

## 2. Trying the app on your iPhone

1. Install **Expo Go** from the App Store and log in with the same Expo account
   (you used GitHub to sign in).
2. Open the QR code Claude sends, point the iPhone **Camera** at it, and tap
   **Open in Expo Go**.
3. Each new QR code is a new version. Old QR codes keep showing old versions.

**If something looks wrong:** close Expo Go completely (swipe it away) and scan
again. In Expo Go you can also shake the phone → **Reload**.

**Temporary test buttons** (they will be removed before release):

- Top-left round button: cycles the background **Auto → Morning → Noon → Night**.
- "Reset demo purchases" link at the bottom of the profile picker.

---

## 3. How we work together

1. You describe what you want (as you have been doing — screenshots help).
2. Claude builds it in small steps, runs the automatic checks (300+ tests),
   checks it visually, saves each finished step to GitHub, publishes a preview
   and sends you a QR code.
3. You try it on your phone and give feedback.

Every change is reversible: GitHub keeps the full history, so "go back to how
the narrator screen looked yesterday" is always possible.

---

## 4. Adding content

You provide the material; Claude wires it in, tests it and publishes a preview.
Placeholders are already in place, so real content simply replaces them.

### 4.1 A new theme

Give Claude:

- **Name** (e.g. "Confidence") and an idea for its **icon**.
- **100 shared lines** — read by every narrator.
- **30 extra lines per narrator** (if you want narrator-specific lines).
- Later: the **recordings** of those lines for each narrator (see 4.5).

A spreadsheet is the easiest format:

| theme      | line id | text                              |
| ---------- | ------- | --------------------------------- |
| confidence | s001    | I trust myself completely.        |
| confidence | s002    | I speak with a calm, clear voice. |

Shared lines use ids `s001`–`s100`; a narrator's own lines use `v001`–`v030`.

**A theme with its own narrator and/or music.** A theme can come with a specific
narrator, a specific music track, or both (for example a "Sleep Story" always
read by one narrator over one soundtrack). While that theme is selected, the
Narrator and Music tabs show **"Set by this theme"** instead of the choices —
even if that narrator or music is normally locked or paid, because it comes with
the theme. When the user picks another theme, their own choices come back.
To set this up, just tell Claude which narrator and/or music the theme uses.

### 4.2 A new narrator

Give Claude:

- **Name** and a **short description** (e.g. "Warm and gentle").
- **How it unlocks:** free, at a **level** (e.g. level 3), or **paid** (e.g. $1).
- **Portrait image:** PNG, portrait orientation, at least **1024 × 1280 px**,
  person centred, plain or transparent background.
- **A sample sentence** (played when someone taps the narrator), e.g.
  "Hello, I'm Aria. Breathe in slowly, and let yourself relax."
- **Recordings** of all shared lines + their own lines for every theme (4.5).

### 4.3 New music

Give Claude:

- **Name**, a **mood** description (e.g. "Ocean waves · Drone") and how it
  unlocks (free / level / paid).
- **The audio file:** it must **loop seamlessly** (the end flows into the
  start), ideally 1–5 minutes long, no fade-in/out. Any common format is fine
  (WAV preferred); Claude converts it.
- Keep it **quieter than the voice** — music sits underneath the narration.

### 4.4 Changing unlock levels or prices

Just tell Claude, e.g. "make Narrator 5 unlock at level 2" or "Music 6 costs
$2". Current setup:

| Item                     | Unlocks                          |
| ------------------------ | -------------------------------- |
| Narrators 1–3, Music 1–2 | Free                             |
| Narrator 4, Music 3      | Level 2                          |
| Narrator 5               | Level 3                          |
| Music 4                  | Level 4                          |
| Narrator 6               | Level 5                          |
| Narrators 7–9, Music 5–7 | **Paid, $1 each** (demo for now) |

### 4.5 Recording narration — specifications for the voice artist

- **One file per line**, named by theme, narrator and line id, e.g.
  `peace/voice2/s014.wav` (Claude can give you a full list to record).
- **Format:** WAV, 48 kHz, 24-bit, mono.
- **Room:** quiet, no echo; same microphone and distance for every session.
- **Delivery:** calm and slow; each line typically 2–8 seconds.
- **Edit:** trim silence to about 0.2 s before and after each line; no music,
  no effects.
- **Loudness:** consistent across all files (Claude normalises them to the
  same level when importing).
- Count: per narrator **100 shared + 30 own lines per theme** → 520 files per
  narrator for the 4 current themes.

### 4.6 Translations (planned: 6 languages)

English ships inside the app. Each additional language will be a **separate
download** inside the app. For each language you will need translated lines
(same spreadsheet layout, same line ids) and recordings in that language.
Interface text (buttons, titles) will also need translating — Claude will
prepare the list.

---

## 5. How a session works

- **Begin** zooms into the blur and the session starts: music fades in, and after
  a few seconds the narrator reads the first affirmation.
- Affirmations come in **random order without repeats**, with **10–20 seconds of
  quiet** after each one. In very long sessions, recently heard lines are kept to
  the end of the next round, so nothing repeats soon.
- The screen shows the scene, a **breathing circle** (4 s in, 4 s out), the
  **time left** and the **words being spoken**. The screen stays on.
- **Pause / Resume**, or **End session** (asks first and shows the XP you would get).
- At the end the music fades out and the **completion screen** shows the XP, the
  level bar filling up and any **level-up** with what it unlocked.

**XP (first version, easy to change):**

| What                                      | XP                      |
| ----------------------------------------- | ----------------------- |
| Each minute of a completed session        | 10                      |
| Completing the session                    | +25                     |
| First session of the day (that earns XP)  | +15                     |
| Each full minute of a session ended early | 5 (no completion bonus) |
| Sessions shorter than one minute          | 0                       |

Levels: level 2 at 100 XP, level 3 at 300, level 4 at 600, level 5 at 1000
(each level needs 100 more than the previous step). Progress is saved per profile.

> The narration currently uses the phone's built-in voices. When real recordings
> arrive they replace it without other changes.

## 6. Paid content and purchases

**Today:** paid narrators and music show a gold **$1** tag. Tapping
**Unlock for $1** opens a sheet marked **DEMO — no payment is made**; "Buy"
unlocks the item for every profile on the phone, for free.

**For real purchases, later:**

1. Join the **Apple Developer Program** ($99/year) and **Google Play Console**
   ($25 once).
2. In App Store Connect / Play Console: accept the paid-apps agreement, add tax
   and bank details, and create one product per paid item. Product ids to use:
   `narrator.voice7`, `narrator.voice8`, `narrator.voice9`, `music.music5`,
   `music.music6`, `music.music7`.
3. Claude connects the app to the stores (likely through a service such as
   RevenueCat) and adds **Restore purchases**.
4. From then on previews need a **development build** instead of Expo Go
   (Expo Go cannot do real purchases). Claude will guide you through installing
   it once.

Prices are set in the stores (Apple uses price tiers, e.g. $0.99).

---

## 7. Releasing to the App Store and Google Play (later)

You will need:

- The developer accounts above.
- **App name**, **icon** (1024 × 1024 px), **screenshots**, a short and long
  **description**, a **privacy policy** web page (simple: the app collects no
  data), and a **support** e-mail.
- A **"not medical advice"** note for the Health theme.

Claude builds the store versions in the cloud (EAS Build), so no Mac is needed,
and can submit them (EAS Submit). Apple first sends builds to **TestFlight** for
testing before review.

**Updates after release:**

- Most changes (texts, lines, screens, music already in the app) can be sent as
  **over-the-air updates**: users get them next time they open the app, no store
  review needed.
- Changes to the app's native parts (new system features, new permissions) need
  a **new store version** and review.

---

## 8. Before release — checklist of temporary things

- [ ] Remove the background preview button (top-left).
- [ ] Remove "Reset demo purchases".
- [ ] Replace the demo purchase sheet with real store purchases.
- [ ] Replace placeholder **lines**, **narrator voices** (currently the phone's
      built-in speech), **portraits** and **music**.
- [ ] Final app name, icon and splash screen.
- [ ] Switch preview settings from Expo Go mode to store-build mode (Claude).
- [ ] Test sessions on a real phone with the screen locked and with headphones
      (background playback), and during a phone call (interruptions).

---

## 9. Troubleshooting

| Problem                                     | Try this                                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| QR code does nothing                        | Use the iPhone **Camera** app (not Expo Go's scanner) and tap the banner.                 |
| "Project is incompatible with this Expo Go" | Update Expo Go in the App Store (the app uses Expo SDK 58).                               |
| "You need to be signed in"                  | Log in to Expo Go with the same account as expo.dev (GitHub sign-in).                     |
| No sound                                    | Turn the volume up. (The silent switch is fine — the app plays anyway.)                   |
| No vibrations                               | iPhone Settings → Sounds & Haptics → **System Haptics** on.                               |
| Animations don't move                       | iPhone Settings → Accessibility → Motion → **Reduce Motion** is on (the app respects it). |
| Still seeing an old version                 | Close Expo Go completely and scan the newest QR code.                                     |

---

## 10. Glossary

- **Expo Go** — an app that runs App One previews without installing it from a store.
- **QR preview / EAS Update** — a published version of the app's code that Expo Go downloads.
- **Commit** — one saved step in the project history, with a description.
- **Repository (repo)** — the project's folder on GitHub, with its full history.
- **Development build** — a private test version of the app, needed once real purchases are added.
- **OTA update** — "over-the-air": an update users receive without a new store version.
- **Placeholder** — temporary content that will be replaced by the real thing.

---

## 11. Change log

| Date       | What changed                                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | Project set up; design system; time-of-day looks; profiles (up to 4).                                                                                                     |
| 2026-11-24 | Session setup: theme squares, narrator character select, music list, clock dial for time.                                                                                 |
| 2026-11-24 | Haptics tuned; tab slide animation; Begin zoom-into-blur animation.                                                                                                       |
| 2026-11-24 | Animated scenes: sunrise, beach sunset, moon and stars.                                                                                                                   |
| 2026-11-24 | Paid narrators 7–9 and music 5–7 with a demo purchase sheet. This handbook created.                                                                                       |
| 2026-11-24 | Random scene events about every 10 s (airplane, birds, fish, seagull, UFO, shooting star); shimmering stars; 3-second music previews.                                     |
| 2026-11-24 | Burgundy noon accents; smoother birds; UFO appears, hovers and flies away; themes can now come with their own narrator and music (not used yet).                          |
| 2026-11-24 | The session: narration in random order with 10–20 s gaps, looping music, breathing circle, pause/end, completion screen with XP and level-up; header shows real progress. |
