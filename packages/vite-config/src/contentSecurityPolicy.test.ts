import { describe, expect, it } from 'vitest';

import { CONTENT_SECURITY_POLICY } from './contentSecurityPolicy';

describe('CONTENT_SECURITY_POLICY', () => {
  it('스크립트는 번들 자신의 파일만 허용함', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self'");
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/script-src[^;]*unsafe/);
  });
});
