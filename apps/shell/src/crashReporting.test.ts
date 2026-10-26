import { describe, expect, it, vi } from 'vitest';

import { toMinidumpUrl } from './crashReporting';

vi.mock('electron', () => ({ app: {}, crashReporter: {} }));

describe('toMinidumpUrl', () => {
  it('DSN을 Sentry minidump 업로드 주소로 바꿈', () => {
    expect(toMinidumpUrl('https://public@o1.ingest.sentry.io/123')).toBe(
      'https://o1.ingest.sentry.io/api/123/minidump/?sentry_key=public',
    );
  });

  it('DSN이 없으면 크래시 리포트를 켜지 않음', () => {
    expect(toMinidumpUrl('')).toBeNull();
  });

  it('키나 프로젝트가 빠진 DSN은 조용히 넘기지 않음', () => {
    expect(() => toMinidumpUrl('https://o1.ingest.sentry.io/123')).toThrow();
  });
});
