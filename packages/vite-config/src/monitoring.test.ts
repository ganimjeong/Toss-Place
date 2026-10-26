import { describe, expect, it } from 'vitest';

import { readMonitoringEnv } from './monitoring';

const packageDir = import.meta.dirname + '/..';

describe('readMonitoringEnv', () => {
  it('DSN이 없으면 모니터링 관련 값을 모두 끔', () => {
    expect(readMonitoringEnv({}, packageDir)).toMatchObject({
      dsn: '',
      dsnOrigin: null,
      sourceMapUpload: null,
    });
  });

  it('DSN의 출처만 CSP에 쓸 수 있게 뽑음', () => {
    const env = readMonitoringEnv(
      { SENTRY_DSN: 'https://public@o1.ingest.sentry.io/123' },
      packageDir,
    );

    expect(env.dsnOrigin).toBe('https://o1.ingest.sentry.io');
  });

  it('릴리스 이름은 패키지 이름과 버전으로 정함', () => {
    expect(readMonitoringEnv({}, packageDir).release).toBe('@toss-place/vite-config@0.0.0');
  });

  it('CI에서 등록하지 않은 시크릿처럼 빈 문자열이면 없는 것으로 봄', () => {
    const env = readMonitoringEnv(
      { SENTRY_DSN: '', SENTRY_AUTH_TOKEN: '', SENTRY_ORG: 'org', SENTRY_PROJECT: 'project' },
      packageDir,
    );

    expect(env).toMatchObject({ dsnOrigin: null, sourceMapUpload: null });
  });

  it('업로드 토큰, 조직, 프로젝트가 모두 있어야 소스맵을 올림', () => {
    const env = readMonitoringEnv({ SENTRY_AUTH_TOKEN: 'token', SENTRY_ORG: 'org' }, packageDir);

    expect(env.sourceMapUpload).toBeNull();
  });
});
