import { css } from '@emotion/react';
import { vars } from '@toss-place/design-system';
import { formatWon } from '@toss-place/utils';

import { getExpectedCash } from '../apis/cashSession';
import { useCashSessionQuery } from '../hooks/useCashSessionQuery';

export function CashSummary({ countedCash }: { countedCash: number }) {
  const { data: session } = useCashSessionQuery();
  const expectedCash = getExpectedCash(session);
  const difference = countedCash - expectedCash;

  return (
    <dl css={summaryStyle}>
      <Row label="시작 시재" amount={session.openingCash} />
      <Row label="현금 매출" amount={session.cashSales} />
      <Row label="현금 지출" amount={-session.cashOut} />
      <Row label="있어야 할 현금" amount={expectedCash} emphasized />
      <Row label="센 현금" amount={countedCash} emphasized />
      <div css={rowStyle}>
        <dt>과부족</dt>
        <dd css={[amountStyle, differenceStyle(difference)]}>{formatDifference(difference)}</dd>
      </div>
    </dl>
  );
}

export function CashSummarySkeleton() {
  return <div css={[summaryStyle, skeletonStyle]} aria-hidden />;
}

function Row({
  label,
  amount,
  emphasized = false,
}: {
  label: string;
  amount: number;
  emphasized?: boolean;
}) {
  return (
    <div css={[rowStyle, emphasized && emphasizedStyle]}>
      <dt>{label}</dt>
      <dd css={amountStyle}>{formatWon(amount)}</dd>
    </div>
  );
}

function formatDifference(difference: number) {
  if (difference === 0) {
    return '딱 맞아요';
  }
  const sign = difference > 0 ? '+' : '-';
  return `${sign}${formatWon(Math.abs(difference))}`;
}

function differenceStyle(difference: number) {
  if (difference === 0) {
    return css`
      color: ${vars.color.success};
    `;
  }
  return css`
    color: ${vars.color.danger};
  `;
}

const SUMMARY_MIN_HEIGHT = '360px';

const summaryStyle = css`
  min-height: ${SUMMARY_MIN_HEIGHT};
  margin: 0;
  padding: ${vars.spacing.x5};
  border-radius: ${vars.radius.large};
  background: ${vars.color.bgSurface};
`;

const skeletonStyle = css`
  background: ${vars.color.borderSubtle};
`;

const rowStyle = css`
  display: flex;
  justify-content: space-between;
  padding: ${vars.spacing.x2} 0;
  font-size: ${vars.typography.t6.fontSize};
  line-height: ${vars.typography.t6.lineHeight};

  dd {
    margin: 0;
  }
`;

const emphasizedStyle = css`
  font-size: ${vars.typography.t5.fontSize};
  line-height: ${vars.typography.t5.lineHeight};
  font-weight: ${vars.fontWeight.bold};
`;

const amountStyle = css`
  font-variant-numeric: tabular-nums;
`;
