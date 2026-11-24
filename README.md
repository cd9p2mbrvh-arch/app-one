# App One

A wellness app for guided affirmation meditations, for iOS and Android. Built with Expo (React Native) and TypeScript.

## Getting started

```bash
npm install
npm start          # then scan the QR code with Expo Go on your phone
```

## Scripts

| Command             | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `npm start`         | Start the Expo dev server                                |
| `npm test`          | Run unit and component tests (Jest)                      |
| `npm run typecheck` | TypeScript check                                         |
| `npm run lint`      | ESLint                                                   |
| `npm run format`    | Format all files with Prettier                           |
| `npm run check`     | Everything CI runs: typecheck, lint, format check, tests |

## Principles

- Offline-first: no accounts, no network calls, no analytics in the MVP.
- Content (themes, voices, music, lines) is data-driven via a manifest.
- Session logic (line scheduling, XP) is kept in pure, unit-tested functions.
