import { APP_INFO } from '@/config/appInfo';

/**
 * The privacy policy — the single source for the in-app Privacy screen and for
 * docs/PRIVACY_POLICY.md (the web version for the store listings), which is
 * exported with `npm run legal:export`. A test checks that the two match.
 *
 * Keep it true: update it whenever the app starts handling data differently
 * (for example analytics, accounts, or a purchase service).
 */
export const PRIVACY_POLICY_UPDATED = '24 November 2026';

export type PolicySection = { heading: string; paragraphs: string[] };

const contact = APP_INFO.supportEmail || '[support e-mail]';

export const PRIVACY_POLICY: PolicySection[] = [
  {
    heading: 'Summary',
    paragraphs: [
      `${APP_INFO.name} does not collect, share or sell any personal data. There are no accounts, no ads, no analytics and no tracking. Everything you create in the app stays on your device.`,
    ],
  },
  {
    heading: 'What the app stores, and where',
    paragraphs: [
      'The app keeps the following only on your device, so it can work: the profiles you create (name and symbol), your progress (XP, level, sessions and minutes), the history of your meditations (date, theme, narrator, music, length and XP), your choices for the next session, and which paid narrators or music are unlocked.',
      'This information is not sent to us or to anyone else. We cannot see it.',
    ],
  },
  {
    heading: 'Permissions',
    paragraphs: [
      'The app does not ask for access to your microphone, camera, photos, contacts or location. It plays audio, including in the background while a session is running.',
    ],
  },
  {
    heading: 'Purchases',
    paragraphs: [
      'Paid narrators and music are bought through the App Store (Apple) or Google Play (Google). They handle payment under their own privacy policies; we do not receive your payment details. Your device tells the app which items you own so it can unlock them, and so purchases can be restored.',
    ],
  },
  {
    heading: 'Deleting your data',
    paragraphs: [
      'You can delete a profile, with its progress and history, in the app (switch profile, then the pencil next to the profile, then Delete profile). Deleting the app removes all of its data from your device.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      `${APP_INFO.name} is not directed at children under 13, and we do not knowingly collect information from children. As the app collects no personal data, none is collected from anyone.`,
    ],
  },
  {
    heading: 'Health',
    paragraphs: [
      `${APP_INFO.name} is meant for relaxation and wellbeing. It is not medical advice and does not diagnose, treat or prevent any condition. If you have health concerns, talk to a doctor.`,
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'If the app ever starts handling data differently, this policy will be updated first, with a new date at the top.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [`${APP_INFO.developer}. Questions about privacy: ${contact}.`],
  },
];

/** The policy as Markdown, for publishing on the web. */
export function privacyPolicyMarkdown(): string {
  const parts = [
    `# ${APP_INFO.name} — Privacy Policy`,
    `_Last updated: ${PRIVACY_POLICY_UPDATED}_`,
    ...PRIVACY_POLICY.flatMap((s) => [`## ${s.heading}`, ...s.paragraphs]),
  ];
  return parts.join('\n\n') + '\n';
}
