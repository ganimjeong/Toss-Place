import { app, crashReporter } from 'electron';

/**
 * Sentry DSN(https://<key>@<host>/<project>)을 minidump 업로드 주소로 바꿈.
 * Electron 내장 crashReporter가 이 주소로 네이티브 크래시를 올리면 Sentry가 이슈로 만듦.
 */
export function toMinidumpUrl(dsn: string): string | null {
  if (dsn === '') {
    return null;
  }
  const { protocol, host, username, pathname } = new URL(dsn);
  const projectId = pathname.replace(/^\//, '');
  if (username === '' || projectId === '') {
    throw new Error('SENTRY_DSN 형식이 올바르지 않습니다.');
  }
  return `${protocol}//${host}/api/${projectId}/minidump/?sentry_key=${username}`;
}

/**
 * 렌더러, GPU, 메인 프로세스가 죽었을 때 minidump를 보냄. JS 에러는 각 번들의 Sentry가 맡음.
 * 크래시는 앱 준비 전에도 날 수 있어서 가능한 한 먼저 부름.
 */
export function startCrashReporting(dsn: string) {
  const submitURL = toMinidumpUrl(dsn);
  if (submitURL === null) {
    return;
  }
  crashReporter.start({
    submitURL,
    uploadToServer: true,
    globalExtra: { release: `mini-pos@${app.getVersion()}`, platform: process.platform },
  });
}
