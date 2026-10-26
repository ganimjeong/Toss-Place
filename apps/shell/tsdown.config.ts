import { defineConfig, type UserConfig } from 'tsdown';

const shared = {
  format: 'cjs',
  platform: 'node',
  // 설치한 앱은 실행 환경 변수를 받지 않으므로 빌드 시점 값을 코드에 넣음
  define: { 'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN ?? '') },
  deps: {
    neverBundle: ['electron'],
    // Electron 런타임에서 워크스페이스 패키지를 찾을 수 없으므로 전부 번들에 포함함
    alwaysBundle: [/^@toss-place\//],
  },
} satisfies UserConfig;

// sandbox가 켜진 preload는 다른 파일을 require할 수 없어서 엔트리별로 따로 빌드함
export default defineConfig([
  { ...shared, entry: { main: 'src/main.ts' } },
  { ...shared, entry: { preload: 'src/preload.ts' }, clean: false },
]);
