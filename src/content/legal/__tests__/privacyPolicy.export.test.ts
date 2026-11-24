/**
 * `npm run legal:export` runs this file with EXPORT_PRIVACY_POLICY=1 to write
 * docs/PRIVACY_POLICY.md. In normal test runs it checks that the published copy
 * matches the policy shown in the app.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { privacyPolicyMarkdown } from '../privacyPolicy';

const file = join(__dirname, '../../../../docs/PRIVACY_POLICY.md');

it('docs/PRIVACY_POLICY.md matches the in-app privacy policy', () => {
  if (process.env.EXPORT_PRIVACY_POLICY) writeFileSync(file, privacyPolicyMarkdown());
  expect(readFileSync(file, 'utf8')).toBe(privacyPolicyMarkdown());
});
