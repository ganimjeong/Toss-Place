import { css } from '@emotion/react';
import { vars } from '@toss-place/design-system';
import { formatWon } from '@toss-place/utils';

import { useMenusQuery } from '../hooks/useMenusQuery';
import type { Menu } from '../models';

export function MenuGrid({ onSelect }: { onSelect: (menu: Menu) => void }) {
  const { data: menus } = useMenusQuery();

  return (
    <ul css={gridStyle}>
      {menus.map(menu => (
        <li key={menu.id}>
          <button type="button" css={menuButtonStyle} onClick={() => onSelect(menu)}>
            <span css={menuNameStyle}>{menu.name}</span>
            <span css={menuPriceStyle}>{formatWon(menu.price)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function MenuGridSkeleton() {
  return (
    <ul css={gridStyle} aria-hidden>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li key={index} css={[menuButtonStyle, skeletonStyle]} />
      ))}
    </ul>
  );
}

const SKELETON_COUNT = 6;

const gridStyle = css`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${vars.spacing.x3};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const menuButtonStyle = css`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  min-height: 120px;
  padding: ${vars.spacing.x4};
  border: 1px solid ${vars.color.borderSubtle};
  border-radius: ${vars.radius.medium};
  background: ${vars.color.bgSurface};
  text-align: left;
  cursor: pointer;

  &:active {
    background: ${vars.color.bgBase};
  }
`;

const skeletonStyle = css`
  background: ${vars.color.borderSubtle};
`;

const menuNameStyle = css`
  font-size: ${vars.typography.t5.fontSize};
  line-height: ${vars.typography.t5.lineHeight};
  font-weight: ${vars.fontWeight.medium};
  color: ${vars.color.textPrimary};
`;

const menuPriceStyle = css`
  font-size: ${vars.typography.t6.fontSize};
  line-height: ${vars.typography.t6.lineHeight};
  color: ${vars.color.textSecondary};
  font-variant-numeric: tabular-nums;
`;
