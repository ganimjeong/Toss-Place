import { defineConfig } from 'tsdown';

// 워크스페이스 안에서는 src를 바로 쓰고, npm에는 빌드 결과만 올림
export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
});
