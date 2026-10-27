import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import packageJson from '../package.json' with { type: 'json' };
import { BUNDLE_NAMES, BUNDLES, resolveBundleUrl } from './bundles';

describe('BUNDLES', () => {
  it('번들마다 개발 서버 포트가 겹치지 않음', () => {
    const ports = BUNDLE_NAMES.map(name => BUNDLES[name].devServerPort);

    expect(new Set(ports).size).toBe(ports.length);
  });

  it('모든 번들이 셸 의존성으로 선언돼 있음', () => {
    // 루트 yarn build는 --topological-dev라 devDependencies까지 보고 순서를 정함. 선언을 빠뜨리면 셸이 번들보다 먼저 빌드될 수 있음
    const dependencies = Object.keys(packageJson.devDependencies);

    expect(dependencies).toEqual(
      expect.arrayContaining(BUNDLE_NAMES.map(name => `@toss-place/${name}`)),
    );
  });
});

describe('resolveBundleUrl', () => {
  it('개발 중에는 번들의 개발 서버 주소를 돌려줌', () => {
    expect(resolveBundleUrl('cash', { isDev: true })).toBe('http://localhost:5174');
  });

  // 기대 URL을 문자열로 적으면 OS마다 절대 경로 해석이 달라서(Windows는 드라이브 문자가 붙음) 성질로 검사함
  it('배포 시에는 셸 dist에 복사된 번들 파일 주소를 돌려줌', () => {
    const baseDir = resolve('app.asar', 'dist');

    const url = resolveBundleUrl('order', { isDev: false, baseDir });

    expect(url.startsWith('file:///')).toBe(true);
    expect(fileURLToPath(url)).toBe(join(baseDir, 'bundles', 'order', 'index.html'));
  });

  it('경로의 공백, 한글, 백슬래시가 URL에 그대로 남지 않음', () => {
    const baseDir = resolve('Mini POS', '포스');

    const url = resolveBundleUrl('order', { isDev: false, baseDir });

    expect(url).not.toMatch(/[\s\\가-힣]/);
    expect(fileURLToPath(url)).toBe(join(baseDir, 'bundles', 'order', 'index.html'));
  });
});
