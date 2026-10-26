import { afterEach, describe, expect, it, vi } from 'vitest';

import { createBundleConfig } from './index';

afterEach(() => {
  vi.unstubAllEnvs();
});

function findPolicy(plugins: unknown): string {
  for (const item of [plugins].flat(Infinity)) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'api' in item &&
      typeof item.api === 'object' &&
      item.api !== null &&
      'policy' in item.api &&
      typeof item.api.policy === 'string'
    ) {
      return item.api.policy;
    }
  }
  throw new Error('CSP 플러그인을 찾지 못함');
}

describe('createBundleConfig', () => {
  // DSN만 있고 CSP에 출처가 없으면 전송이 전부 막히는데, 앱에는 아무 증상이 없어서 꺼진 줄 모름
  it('DSN이 있으면 그 출처를 CSP connect-src에 넣음', () => {
    vi.stubEnv('SENTRY_DSN', 'https://public@o1.ingest.sentry.io/1');

    const config = createBundleConfig({ port: 5999 });

    expect(findPolicy(config.plugins)).toContain("connect-src 'self' https://o1.ingest.sentry.io");
  });

  it('DSN이 없으면 connect-src는 self만 둠', () => {
    vi.stubEnv('SENTRY_DSN', '');

    const config = createBundleConfig({ port: 5999 });

    expect(findPolicy(config.plugins)).toContain("connect-src 'self';");
  });
});
