import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export interface BundleEntry {
  title: string;
  /** 각 번들 vite.config.ts의 port와 맞춰야 함 */
  devServerPort: number;
}

/**
 * 셸에 들어가는 번들 목록.
 * 번들을 추가하면 셸 package.json의 devDependencies에도 넣어야 빌드 순서가 맞음 (bundles.test.ts가 확인함)
 */
export const BUNDLES = {
  order: { title: '주문', devServerPort: 5173 },
  cash: { title: '시재관리', devServerPort: 5174 },
} as const satisfies Record<string, BundleEntry>;

export type BundleName = keyof typeof BUNDLES;

export const BUNDLE_NAMES = Object.keys(BUNDLES).filter(isBundleName);

function isBundleName(name: string): name is BundleName {
  return name in BUNDLES;
}

/** 빌드할 때 번들 결과물을 셸 dist 아래 이 폴더로 복사함. 패키징 전후 경로를 같게 하려는 것 */
export const BUNDLE_OUT_DIR = 'bundles';

interface ResolveOptions {
  isDev: boolean;
  /** main.cjs가 있는 폴더. 패키징하면 app.asar 안의 dist가 됨 */
  baseDir?: string;
}

/**
 * 개발 중에는 번들별 Vite 개발 서버, 배포 시에는 셸 dist에 복사된 번들 파일을 엶.
 * 나중에 번들을 원격에서 내려받게 되면 이 함수만 바꾸면 됨.
 */
export function resolveBundleUrl(name: BundleName, { isDev, baseDir = __dirname }: ResolveOptions) {
  if (isDev) {
    return `http://localhost:${BUNDLES[name].devServerPort}`;
  }
  // 'file://' + 경로로 만들면 Windows의 C:\ 경로와 공백, 한글이 URL로 바뀌지 않음
  return pathToFileURL(join(baseDir, BUNDLE_OUT_DIR, name, 'index.html')).href;
}
