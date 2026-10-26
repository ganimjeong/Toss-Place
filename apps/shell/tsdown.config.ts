import { defineConfig, type UserConfig } from 'tsdown';

const shared = {
  format: 'cjs',
  platform: 'node',
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
