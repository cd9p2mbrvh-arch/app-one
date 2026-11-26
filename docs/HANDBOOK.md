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

**Expo Go's gear button** sits in the top-right corner of the screen. The app keeps
that corner empty while it runs in Expo Go, so nothing of ours is hidden behind it.

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

- **Name** (e.g. "Confidence") and an idea for its **icon** and **colour** (a light
  colour for its glossy icon tile; Claude can suggest one).
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
  `peace/voice2/s014.wav` (Claude can give you a full list to record). Claude
  packs them into the app's narration files (one "audio sprite" per narrator and
  theme — previews allow at most 1,000 files, so lines are packed together).
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

### 4.7 Choosing the session length (Time tab)

- Sessions can be **5 to 30 minutes** long (default 10). The wheel shows only
  5, 10, 15, 20, 25 and 30, spread around the whole wheel with no empty part
  (30 sits next to 5), so each minute gets as much room as possible. The limits are
  `MIN_DURATION_MIN` / `MAX_DURATION_MIN` in `src/content/manifest.ts`.
- **Current design — rotating wheel** (since 25 Nov 2026): the whole wheel turns
  under a fixed marker at the top; the number under the marker (also shown big in
  the middle) is the time. Turn anticlockwise to add time, clockwise to remove it
  (to flip this, change `WHEEL_DIRECTION` in `src/components/dial/wheelMath.ts`);
  tap a number to turn straight to it. It settles on the nearest minute. A firm
  haptic click plays the moment each minute line reaches the marker, the
  strongest one every 5 minutes.
- **Previous design — clock dial** (kept in the code): a clock face where one
  circle is 30 minutes; tap anywhere to jump there or drag the knob.
- **To switch back to the clock dial**, ask Claude: "switch the Time tab back to
  the clock dial". It is a one-line change: `TIME_PICKER` at the top of
  `src/app/home.tsx`, from `'rotatingWheel'` to `'clockDial'`. The app exactly as
  it was before the redesign is also saved on GitHub as the branch
  `saved/time-picker-clock-dial`.

### 4.8 Music tab design

- **Current design — glossy list** (since 25 Nov 2026): one row per track, as
  before, but each row is a soft rounded card with a glossy, glowing icon tile in
  the track's own colour. When you pick another track the highlight fades quickly
  from the old row to the new one (it simply switches when Reduce Motion is on).
- **Previous design — plain list of rows** is kept in the code. To switch back,
  ask Claude "switch the Music tab back to the plain list", or change
  `MUSIC_STYLE` at the top of `src/app/home.tsx` from `'glossy'` to `'classic'`.
- A two-column card grid with filter buttons was tried on 25 Nov 2026 and dropped.

### 4.9 Tab bar look (experiment)

- **Current — glass:** the Theme · Narrator · Music · Time bar is see-through
  frosted glass; the active tab sits on a brighter glass pill with its name in the
  look's main colour.
- **Previous — solid:** a filled colour pill on a card-coloured bar. To switch
  back, ask Claude "switch the tab bar back to solid", or change `TABS_STYLE` at
  the top of `src/app/home.tsx` from `'glass'` to `'solid'`.

### 4.10 Glass look across the app

- **Current — glass:** cards, lists, the tab bar, text fields, small round
  buttons, the profile page, About and the pop-up sheets are soft,
  see-through frosted glass: a light see-through fill, a bright thin edge and a
  soft shadow. The main buttons (Next, Begin, Create profile…) are see-through
  glass in the look's main colour with a glossy shine, so they still stand out.
  Text is checked to stay easy to read on the glass in every
  look (automatic test).
- **Previous — chunky cards:** more solid cards with a 3D bottom edge. To switch
  back, ask Claude "switch the app back to the chunky cards", or change
  `UI_MATERIAL` in `src/theme/palettes.ts` from `'glass'` to `'chunky'`.

### 4.11 Launch intro and the About screen

- **Intro:** when the app starts, a 2-second intro shows the studio logo
  ("Michael apps", a placeholder logo for now) over softly drifting, blurred
  colours of the current time of day; then it fades and the app zooms in. The
  timing is in `INTRO` in `src/components/Intro.tsx`; the logo is `StudioLogo` in
  the same file (replace it with a real logo later).
- **About:** the round **i** button next to your name opens About: restore
  purchases, the health notice, privacy policy, support and the app version.

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

| What                                         | XP                             |
| -------------------------------------------- | ------------------------------ |
| Each minute of a completed session           | 10                             |
| Completing the session                       | +25                            |
| First session of the day (that earns XP)     | +15                            |
| Morning, noon and night completed on one day | +50 (once a day, on the third) |
| Each full minute of a session ended early    | 5 (no completion bonus)        |
| Sessions shorter than one minute             | 0                              |

A meditation day runs from **05:00 to 05:00**, so a session at 1 am still counts
as that night. Times of day follow the real clock (morning 05–11, noon 11–18,
night 18–05).

**Progress and history:** tap your **name or symbol** at the top of the main
screen to see your level, total XP, sessions and minutes, today's morning / noon /
night progress, and every past session with its date, length and XP. The ⇄ icon
next to it switches profile.

**Locked screen:** sessions are set up to keep playing with the screen locked and
show on the lock screen as "Now playing". If it ever stops when locked, tell
Claude whether the music, the voice or both stopped.

Levels: level 2 at 100 XP, level 3 at 300, level 4 at 600, level 5 at 1000
(each level needs 100 more than the previous step). Progress is saved per profile.

> Narration plays from **audio clips** on its own player, next to the music — the
> same way real recordings will play, and the reliable way to keep playing with
> the screen locked. The clips are currently **robotic placeholders** made with an
> offline text-to-speech engine (one voice for all narrators, made to sound
> different by speed and pitch). Narrator samples on the Narrator tab still use the
> phone's built-in voices.

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

### Website (support page and privacy policy)

- The stores need two web links: a **privacy policy** and a **support page**.
  They live in the `site/` folder and are published for free with GitHub Pages
  at **https://cd9p2mbrvh-arch.github.io/app-one/** (support) and
  **https://cd9p2mbrvh-arch.github.io/app-one/privacy/** (privacy policy).
- The pages are built from the same texts the app shows (`npm run legal:export`),
  so they always match; a test checks this. Every push to `main` that changes
  `site/` republishes them automatically.
- Your developer name and support e-mail (in `src/config/appInfo.ts`) appear on
  both pages once filled in.
- Later you can add your own domain (about $10–15 per year) without changing the
  pages.

### Store approval checklist (researched November 2026)

**You (accounts, forms, listings):**

- [ ] Apple Developer Program ($99/year). Individual: your name is shown as seller; organisation: needs a D-U-N-S number.
- [ ] Google Play developer account ($25 once). Personal accounts must run a **closed test with 12 testers for 14 days** before production; organisation accounts need a D-U-N-S number but skip that test.
- [ ] Publish the privacy policy (`docs/PRIVACY_POLICY.md`) on a public web page; put its address in `src/config/appInfo.ts` (`privacyPolicyUrl`) and in both store listings.
- [ ] Support e-mail: put it in `src/config/appInfo.ts` (`supportEmail`) and the store listings. Also fill in `developer`.
- [ ] Final app name (unique on both stores), icon (1024 × 1024), screenshots of the app in use (mark paid items as paid), Google feature graphic (1024 × 500), descriptions without medical claims.
- [ ] Apple: paid-apps agreement, tax and bank details; in-app products; App Privacy ("Data Not Collected"); age rating questionnaire; export compliance ("no encryption").
- [ ] Google: payments profile; in-app products; Data safety (no data collected or shared); content rating; target audience (not children); ads (none); **Health apps declaration** (meditation apps are in scope); **foreground service declaration** for background audio (short video of starting a session).
- [ ] Review notes for Apple: what makes the app different (animated time-of-day scenes, XP and levels, narrator characters, local profiles) — meditation is a crowded category (guideline 4.3).

**Claude (app changes):**

- [x] About screen (the "i" button next to your name): restore purchases, health notice, privacy policy, support, version.
- [x] Privacy policy text (in the app and in `docs/PRIVACY_POLICY.md`; `npm run legal:export` refreshes the web copy).
- [x] Health theme note ("not medical advice").
- [ ] Real in-app purchases (Apple / Google) with local prices, instead of the demo.
- [ ] Final name, bundle IDs, icon, splash, "no encryption" flag, build mode for store builds.
- [ ] iPhone only or iPhone + iPad (decide before the first release — iPad support cannot be removed later).
- [ ] Check the privacy manifest in the first real build; accessibility pass.
- [ ] Verify background audio with the screen locked in a TestFlight build.

**Already met:** builds with Xcode 26 / iOS 26 SDK (required since April 2026) and target Android 16 / API 36 (required from 31 August 2026) through Expo SDK 58 and EAS Build; background audio is an allowed use; no accounts, so account-deletion rules do not apply (profiles can be deleted in the app).

## 8. Before release — checklist of temporary things

- [ ] Remove the background preview button (top-left).
- [ ] Remove "Reset demo purchases".
- [ ] Fill in `src/config/appInfo.ts` (developer, support e-mail, privacy policy address).
- [ ] Remove the "Audio check" line under the session controls.
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

| Date       | What changed                                                                                                                                                                                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | Project set up; design system; time-of-day looks; profiles (up to 4).                                                                                                                                                                                                                   |
| 2026-11-24 | Session setup: theme squares, narrator character select, music list, clock dial for time.                                                                                                                                                                                               |
| 2026-11-24 | Haptics tuned; tab slide animation; Begin zoom-into-blur animation.                                                                                                                                                                                                                     |
| 2026-11-24 | Animated scenes: sunrise, beach sunset, moon and stars.                                                                                                                                                                                                                                 |
| 2026-11-24 | Paid narrators 7–9 and music 5–7 with a demo purchase sheet. This handbook created.                                                                                                                                                                                                     |
| 2026-11-24 | Random scene events about every 10 s (airplane, birds, fish, seagull, UFO, shooting star); shimmering stars; 3-second music previews.                                                                                                                                                   |
| 2026-11-24 | Burgundy noon accents; smoother birds; UFO appears, hovers and flies away; themes can now come with their own narrator and music (not used yet).                                                                                                                                        |
| 2026-11-24 | The session: narration in random order with 10–20 s gaps, looping music, breathing circle, pause/end, completion screen with XP and level-up; header shows real progress.                                                                                                               |
| 2026-11-24 | Sessions keep playing with the screen locked (lock-screen "Now playing"); +50 XP for morning, noon and night on one day; profile page with history; rarer UFO, calmer stars, clouds around the moon.                                                                                    |
| 2026-11-24 | Session narration now plays from audio clips (placeholder recordings) instead of the phone's speech engine, to keep working with the screen locked; temporary "Audio check" line added.                                                                                                 |
| 2026-11-24 | Settings & info screen (restore purchases, health notice, privacy policy, version); privacy policy written; Health theme note; store approval checklist added to this handbook.                                                                                                         |
| 2026-11-25 | The top-right corner stays empty in Expo Go (its gear button sits there); Settings & info moved to a row on the profile page.                                                                                                                                                           |
| 2026-11-25 | Time tab redesigned: the whole wheel turns under a fixed top marker (old clock dial kept, see 4.7); shortest session is now 5 minutes.                                                                                                                                                  |
| 2026-11-25 | Time wheel ticks exactly as each minute line reaches the marker; new font (Plus Jakarta Sans, less cartoonish); Music tab redesigned as soft 3D cards with filters (old list kept, see 4.8).                                                                                            |
| 2026-11-25 | Music tab back to a list, keeping the glossy glowing icons, with a quick fade on selection; filter buttons removed. Time wheel now adds time when turned anticlockwise.                                                                                                                 |
| 2026-11-25 | Theme tab: glossy, glowing icon tiles like the Music tab, each theme in its own light colour; quick fade on selection.                                                                                                                                                                  |
| 2026-11-25 | Tab bar experiment: see-through frosted glass with a glass pill on the active tab (old solid bar kept, see 4.9).                                                                                                                                                                        |
| 2026-11-25 | Soft frosted-glass look across the whole app (cards, lists, fields, sheets, profile page, settings); main buttons stay solid (see 4.10).                                                                                                                                                |
| 2026-11-26 | Small website (support page + privacy policy) in `site/`, published free with GitHub Pages; built from the same texts as the app.                                                                                                                                                       |
| 2026-11-26 | Next/Begin and other main buttons are see-through glass too; 2-second launch intro with a "Michael apps" logo; Settings & info became **About** (the "i" button next to your name); sessions are now 5–30 minutes with a number for every minute on the wheel and firmer haptic clicks. |
| 2026-11-26 | Time wheel: only 5, 10 … 30 shown, spread around the whole wheel (more room per minute for clearer clicks).                                                                                                                                                                             |
