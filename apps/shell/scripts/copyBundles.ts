/**
 * 웹뷰 번들 빌드 결과를 셸 dist/bundles 아래로 복사함.
 * 레포 폴더 구조에 기대지 않아야 패키징한 앱(app.asar)에서도 같은 경로로 번들을 찾음.
 */
import { cpSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { BUNDLE_NAMES, BUNDLE_OUT_DIR } from '../src/bundles.ts';

const require = createRequire(import.meta.url);
const outDir = join(import.meta.dirname, '..', 'dist', BUNDLE_OUT_DIR);

for (const name of BUNDLE_NAMES) {
  // 셸 package.json에 선언한 번들만 찾을 수 있음. 선언을 빠뜨리면 빌드 순서도 보장되지 않으므로 여기서 실패하는 게 맞음
  const bundleDir = dirname(require.resolve(`@toss-place/${name}/package.json`));
  const distDir = join(bundleDir, 'dist');
  if (!existsSync(join(distDir, 'index.html'))) {
    throw new Error(`${name} 번들 빌드 결과가 없습니다. 루트에서 yarn build를 먼저 실행해 주세요.`);
  }
  cpSync(distDir, join(outDir, name), { recursive: true });
}
