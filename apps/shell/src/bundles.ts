import { join } from 'node:path';

export interface BundleEntry {
  title: string;
  /** 각 번들 vite.config.ts의 port와 맞춰야 함 */
  devServerPort: number;
}

export const BUNDLES = {
  order: { title: '주문', devServerPort: 5173 },
  cash: { title: '시재관리', devServerPort: 5174 },
} as const satisfies Record<string, BundleEntry>;

export type BundleName = keyof typeof BUNDLES;

export const BUNDLE_NAMES = Object.keys(BUNDLES).filter(isBundleName);

function isBundleName(name: string): name is BundleName {
  return name in BUNDLES;
}

/**
 * 개발 중에는 번들별 Vite 개발 서버, 배포 시에는 빌드된 번들 파일을 엶.
 * 나중에 번들을 원격에서 내려받게 되면 이 함수만 바꾸면 됨.
 */
export function resolveBundleUrl(name: BundleName, { isDev }: { isDev: boolean }) {
  if (isDev) {
    return `http://localhost:${BUNDLES[name].devServerPort}`;
  }
  return `file://${join(__dirname, `../../../bundles/${name}/dist/index.html`)}`;
}
