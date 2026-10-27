import { describe, expect, it } from 'vitest';

import { createContentSecurityPolicy } from './contentSecurityPolicy';

describe('createContentSecurityPolicy', () => {
  it('스크립트는 번들 자신의 파일만 허용함', () => {
    const policy = createContentSecurityPolicy();

    expect(policy).toContain("script-src 'self'");
    expect(policy).not.toMatch(/script-src[^;]*unsafe/);
  });

  it('외부 출처는 connect-src에만 추가함', () => {
    const policy = createContentSecurityPolicy({
      connectSources: ['https://o1.ingest.sentry.io'],
    });

    expect(policy).toContain("connect-src 'self' https://o1.ingest.sentry.io");
    expect(policy).not.toMatch(/script-src[^;]*sentry/);
  });
});
