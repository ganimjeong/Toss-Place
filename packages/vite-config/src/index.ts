import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

// Vite가 워크스페이스 설정 패키지를 번들하지 않고 Node로 바로 읽기 때문에 확장자를 명시함
import { contentSecurityPolicy } from './contentSecurityPolicy.ts';
import { readMonitoringEnv, sourceMapUploadPlugins } from './monitoring.ts';

export { createContentSecurityPolicy } from './contentSecurityPolicy.ts';

interface BundleConfigOptions {
  /** 번들마다 겹치지 않는 개발 서버 포트. 셸의 번들 목록과 맞춰야 함 */
  port: number;
}

/**
 * 모든 웹뷰 번들이 같이 쓰는 Vite 설정.
 * 보안 정책이나 빌드 방식은 번들마다 다를 이유가 없어서 한곳에서 관리함.
 */
export function createBundleConfig({ port }: BundleConfigOptions) {
  const monitoring = readMonitoringEnv(process.env, process.cwd());

  return defineConfig({
    // Electron 셸이 file:// 로 번들을 열기 때문에 상대 경로로 빌드함
    base: './',
    plugins: [
      react({ jsxImportSource: '@emotion/react' }),
      vanillaExtractPlugin(),
      contentSecurityPolicy({
        connectSources: monitoring.dsnOrigin === null ? [] : [monitoring.dsnOrigin],
      }),
      ...sourceMapUploadPlugins(monitoring),
    ],
    define: {
      'import.meta.env.SENTRY_DSN': JSON.stringify(monitoring.dsn),
      'import.meta.env.BUNDLE_RELEASE': JSON.stringify(monitoring.release),
    },
    build: {
      // 업로드할 때만 만들고, 번들에는 sourceMappingURL 주석을 남기지 않음
      sourcemap: monitoring.sourceMapUpload === null ? false : 'hidden',
    },
    server: { port, strictPort: true },
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
    },
  });
}
