import { Menu, type MenuItemConstructorOptions } from 'electron';

import { BUNDLE_NAMES, BUNDLES, type BundleName } from './bundles';

export function createAppMenu(onSelectBundle: (name: BundleName) => void) {
  const bundleItems: MenuItemConstructorOptions[] = BUNDLE_NAMES.map((name, index) => ({
    label: BUNDLES[name].title,
    // 매장에서 키보드로 빠르게 화면을 바꿀 수 있게 번호 단축키를 둠
    accelerator: `CmdOrCtrl+${index + 1}`,
    click: () => onSelectBundle(name),
  }));

  return Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' as const }] : []),
    { label: '화면', submenu: bundleItems },
    { role: 'editMenu' },
    { role: 'viewMenu' },
  ]);
}
