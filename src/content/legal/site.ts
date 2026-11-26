import { APP_INFO } from '@/config/appInfo';

import { PRIVACY_POLICY, PRIVACY_POLICY_UPDATED } from './privacyPolicy';

/**
 * The app's small public website (support page + privacy policy), published with
 * GitHub Pages from the `site/` folder. Built from the same texts the app shows,
 * by `npm run legal:export`; a test checks the files are up to date.
 */

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const hasDeveloper = !APP_INFO.developer.startsWith('[');

/** A sun in a glossy tile, like the app's icon tiles. */
const LOGO = `<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FB2E0"/><stop offset="1" stop-color="#2C6FA8"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="64" height="64" rx="19" fill="url(#t)"/><ellipse cx="27" cy="15" rx="20" ry="9" fill="url(#h)"/><circle cx="32" cy="33" r="9" fill="none" stroke="#fff" stroke-width="3.5"/><g stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M32 16v4M32 46v4M15 33h4M45 33h4M20 21l3 3M41 42l3 3M20 45l3-3M41 24l3-3"/></g></svg>`;

function page(opts: { title: string; description: string; root: string; body: string }) {
  const { title, description, root, body } = opts;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<link rel="stylesheet" href="${root}style.css">
</head>
<body>
<div class="sky" aria-hidden="true"><div class="sun"></div></div>
<header class="top">
  <a class="brand" href="${root}">${LOGO}<span>${escape(APP_INFO.name)}</span></a>
  <nav><a href="${root}">Support</a><a href="${root}privacy/">Privacy</a></nav>
</header>
<main>
${body}
</main>
<footer>© ${escape(hasDeveloper ? APP_INFO.developer : APP_INFO.name)}</footer>
</body>
</html>
`;
}

const contactHtml = APP_INFO.supportEmail
  ? `<a href="mailto:${escape(APP_INFO.supportEmail)}">${escape(APP_INFO.supportEmail)}</a>`
  : '<em>Support e-mail coming soon.</em>';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I restore my purchases?',
    a: 'Open your profile (tap your name at the top), then Settings &amp; info, then Restore purchases. Purchases are shared by every profile on the device.',
  },
  {
    q: 'Where is my data, and how do I delete it?',
    a: 'Everything stays on your device; there are no accounts. To delete a profile with its progress and history: switch profile, tap the pencil next to it, then Delete profile. Deleting the app removes all of its data.',
  },
  {
    q: 'Can I listen with the silent switch on?',
    a: 'Yes. Sessions play even when your phone is set to silent.',
  },
  {
    q: 'Is this medical advice?',
    a: `No. ${escape(APP_INFO.name)} is for relaxation and wellbeing. It does not diagnose, treat or prevent any condition. If you have health concerns, talk to a doctor.`,
  },
];

export function supportPageHtml(): string {
  return page({
    title: `${APP_INFO.name} — Support`,
    description: `Help and contact for ${APP_INFO.name}, a calm app for meditations and affirmations.`,
    root: './',
    body: `<section class="hero">
  <h1>${escape(APP_INFO.name)}</h1>
  <p class="lead">Short guided moments of calm: choose a theme, a narrator, music and a time, then breathe and listen.</p>
</section>
<section class="card">
  <h2>Contact</h2>
  <p>Questions, ideas or something not working? Write to ${contactHtml} and we'll get back to you.</p>
</section>
<section class="card">
  <h2>Questions</h2>
${FAQ.map((f) => `  <details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('\n')}
</section>
<section class="card">
  <h2>Privacy</h2>
  <p>${escape(APP_INFO.name)} collects no personal data: no accounts, no ads, no tracking. <a href="./privacy/">Read the privacy policy</a>.</p>
</section>`,
  });
}

export function privacyPageHtml(): string {
  return page({
    title: `${APP_INFO.name} — Privacy Policy`,
    description: `Privacy policy of ${APP_INFO.name}: no personal data is collected.`,
    root: '../',
    body: `<section class="hero">
  <h1>Privacy Policy</h1>
  <p class="lead">Last updated: ${escape(PRIVACY_POLICY_UPDATED)}</p>
</section>
<section class="card policy">
${PRIVACY_POLICY.map(
  (s) => `  <h2>${escape(s.heading)}</h2>\n${s.paragraphs.map((p) => `  <p>${escape(p)}</p>`).join('\n')}`,
).join('\n')}
</section>`,
  });
}

/** Files of the site, relative to `site/` (style.css and fonts are hand-written). */
export function siteFiles(): Record<string, string> {
  return { 'index.html': supportPageHtml(), 'privacy/index.html': privacyPageHtml() };
}
