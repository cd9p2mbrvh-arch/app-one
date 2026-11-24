# App One — Product & Technical Plan

Living document. Update it when a decision changes.

## Product decisions (agreed)

| Topic             | Decision                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Accounts          | None. Up to 4 local profiles per device, no PIN.                                                                               |
| App start         | Opens the last-used profile; a "Switch" button leads to the profile picker.                                                    |
| Flow              | Theme → Voice → Music → Duration (3–60 min wheel with haptics) → Session.                                                      |
| Themes            | Abundance, Peace of Mind, Health, Gratitude. Data-driven, so more can be added.                                                |
| Lines             | 100 shared lines per theme (read by every voice) + ~30 voice-specific lines per theme.                                         |
| Gap between lines | Random 10–20 s, measured from the **end** of the previous line.                                                                |
| Pool exhaustion   | Reshuffle and continue; never replay any of the most recent ~50 lines.                                                         |
| Session end       | Music fades out, XP is saved, completion screen shown (iOS forbids closing the app).                                           |
| Ending early      | Allowed; earns reduced XP (see below).                                                                                         |
| Voices            | ~6 voices bundled in the base app; more voices sold as paid downloadable packs (DLC).                                          |
| Audio             | Placeholder TTS audio for now; real recordings replace it later (same file layout).                                            |
| Languages         | English only at launch. Architecture supports 6 languages; non-English content is a separate download.                         |
| Kids              | Not targeted. A possible separate kids app later.                                                                              |
| Health theme      | Show a "not medical advice" note.                                                                                              |
| Visual style      | Palette "Fog": cool white + blue-gray, neutral theme cards with icons (may change; see `src/theme/palettes.ts`). Font: Nunito. |

## XP & levels (v1, to be refined)

- Completed session: **10 XP / minute + 25 XP completion bonus**.
- Ended early: **5 XP / full minute listened**, no bonus. Under 1 minute earns nothing.
- First session of the day: **+15 XP**.
- Level n → n+1 costs **100 × n XP** (100, 200, 300, …).
- Home shows an animated bar from the previous XP to the new XP after a session.

## Tech stack

Expo (managed, SDK 58) · React Native · TypeScript · Expo Router · expo-audio · expo-haptics ·
react-native-reanimated · Zustand + AsyncStorage · Jest + React Native Testing Library ·
Maestro (E2E) · ESLint + Prettier · GitHub Actions · EAS Build.

Later, for DLC: in-app purchases (StoreKit / Play Billing via a library such as RevenueCat)
and a content CDN. Purchases are restored via the store account, so no app login is needed.

## Content architecture

Content is organised as **packs** described by a manifest, so base content, voice DLC and
language packs all use the same code path:

```
content pack = { id, language, kind: 'base' | 'voice' | 'language', themes?, voices?, music?, lines }
audio path   = <pack>/<language>/<theme>/<voice>/<lineId>.m4a
```

- Shared lines: `lineId = s001…s100`; voice-specific lines: `lineId = v001…v030`.
- Base pack is bundled with the app; other packs are downloaded and verified (checksum) later.
- Line texts live in the manifest too, so subtitles or accessibility captions stay possible.

## Screens

Profile Picker · Home (level, XP bar, Start, Switch) · Theme · Voice (preview) · Music (preview) ·
Duration wheel · Session Player (breathing visual, timer, pause, end) · Session Complete · Settings.

## Milestones

| #     | Milestone                                                                          |
| ----- | ---------------------------------------------------------------------------------- |
| M0    | Scaffold: Expo + TS, Jest, ESLint, Prettier, CI, git                               |
| M1    | Design system: palette tokens, typography, chunky button, cards; Expo Router shell |
| M2    | Profiles: create / select / edit / delete, last-used profile, persistence          |
| M3    | Content manifest + placeholder TTS audio generator + manifest validation           |
| M4    | Theme, voice, music selection screens with previews                                |
| M5    | Duration wheel with haptics                                                        |
| M6    | Line scheduler (pure logic, unit-tested)                                           |
| M7    | Audio engine + session player                                                      |
| M8    | Background audio, interruptions, lock screen                                       |
| M9    | XP / levels, completion screen, home progress bar                                  |
| M10   | Polish, accessibility, icon, splash, store builds                                  |
| Later | DLC store + downloads, language packs, streaks, reminders                          |

## Testing

- Unit: scheduler, XP maths, storage migrations, manifest validation.
- Component: wizard flow, profile limit, wheel bounds.
- E2E (Maestro): create profile → short session → XP gained.
- Manual on real devices (owner's iPhone via Expo Go / dev build): audio, haptics, lock screen.

## Security & privacy

- No network calls, analytics or third-party SDKs in the MVP; "Data Not Collected" store labels.
- No runtime permissions requested.
- Local storage only, versioned schema with migrations; validate profile names.
- `npm audit` in CI, pinned dependencies, no secrets in the repo, signing keys stored in EAS.
- Future DLC: validate receipts with the store, verify downloaded packs with checksums.

## Known accepted issues

- `npm audit --omit=dev` reports 3 moderate advisories in `minimatch` via `@expo/fingerprint`
  (build-time tooling, not shipped in the app). The only offered fix downgrades Expo; revisit on
  the next SDK upgrade.
