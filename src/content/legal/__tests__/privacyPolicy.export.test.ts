/**
 * `npm run legal:export` runs this file with EXPORT_PRIVACY_POLICY=1 to write
 * docs/PRIVACY_POLICY.md and the website pages in site/. In normal test runs it
 * checks that the published copies match the texts shown in the app.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { privacyPolicyMarkdown } from '../privacyPolicy';
import { siteFiles } from '../site';

const file = join(__dirname, '../../../../docs/PRIVACY_POLICY.md');

it('docs/PRIVACY_POLICY.md matches the in-app privacy policy', () => {
  if (process.env.EXPORT_PRIVACY_POLICY) writeFileSync(file, privacyPolicyMarkdown());
  expect(readFileSync(file, 'utf8')).toBe(privacyPolicyMarkdown());
});

describe('website (site/)', () => {
  const siteDir = join(__dirname, '../../../../site');
  it.each(Object.entries(siteFiles()))('%s is up to date', (name, html) => {
    const path = join(siteDir, name);
    if (process.env.EXPORT_PRIVACY_POLICY) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, html);
    }
    expect(readFileSync(path, 'utf8')).toBe(html);
  });

  it('the website shows every section of the privacy policy', () => {
    const html = siteFiles()['privacy/index.html'];
    for (const line of privacyPolicyMarkdown()
      .split('\n')
      .filter((l) => l.startsWith('## '))) {
      expect(html).toContain(`<h2>${line.slice(3).replace(/&/g, '&amp;')}</h2>`);
    }
  });
});
