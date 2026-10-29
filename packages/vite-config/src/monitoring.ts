import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { sentryVitePlugin } from '@sentry/vite-plugin';
import type { Plugin } from 'vite';

/**
 * 빌드 시점의 모니터링 설정. 모두 환경 변수에서 읽고, 없으면 모니터링을 끔.
 * - SENTRY_DSN: 번들에 넣을 DSN. CSP connect-src에도 이 출처를 추가함
 * - SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT: 있으면 소스맵을 올리고 결과물에서는 지움
 */
export function readMonitoringEnv(env: NodeJS.ProcessEnv, bundleDir: string) {
  // GitHub Actions는 등록하지 않은 시크릿을 빈 문자열로 넘기므로 빈 값도 없는 것으로 봄
  const read = (key: string) => (env[key] === '' ? undefined : env[key]);
  const dsn = read('SENTRY_DSN') ?? '';
  const authToken = read('SENTRY_AUTH_TOKEN');
  const org = read('SENTRY_ORG');
  const project = read('SENTRY_PROJECT');
  const { name, version } = readPackageJson(bundleDir);

  return {
    dsn,
    /** 소스맵 업로드와 번들 초기화가 같은 이름을 써야 Sentry가 둘을 이어줌 */
    release: toReleaseName(name, version),
    dsnOrigin: dsn === '' ? null : new URL(dsn).origin,
    sourceMapUpload:
      authToken !== undefined && org !== undefined && project !== undefined
        ? { authToken, org, project }
        : null,
  };
}

export type MonitoringEnv = ReturnType<typeof readMonitoringEnv>;

export function sourceMapUploadPlugins({ release, sourceMapUpload }: MonitoringEnv): Plugin[] {
  if (sourceMapUpload === null) {
    return [];
  }
  return sentryVitePlugin({
    ...sourceMapUpload,
    release: { name: release },
    // 매장에 배포되는 결과물에는 소스맵을 남기지 않음
    sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
    telemetry: false,
    // 기본값은 업로드 실패를 로그만 남기고 빌드를 통과시킴. 설정이 있는데 올리지 못했다면
    // 소스맵 없는 앱이 배포되므로 빌드를 멈춤. 설정이 없을 때는 위에서 플러그인 자체를 뺌
    errorHandler: error => {
      throw error;
    },
  });
}

/**
 * Sentry 릴리스 이름에는 `/`를 쓸 수 없어서(400 Bad Request) scope 구분자를 `-`로 바꿈.
 * 예: `@toss-place/order`, `0.1.0` → `toss-place-order@0.1.0`
 */
export function toReleaseName(packageName: string, version: string) {
  return `${packageName.replace(/^@/, '').replace('/', '-')}@${version}`;
}

function readPackageJson(dir: string): { name: string; version: string } {
  const parsed: unknown = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'name' in parsed &&
    typeof parsed.name === 'string' &&
    'version' in parsed &&
    typeof parsed.version === 'string'
  ) {
    return { name: parsed.name, version: parsed.version };
  }
  throw new Error(`${dir}/package.json에 name, version이 없습니다.`);
}
