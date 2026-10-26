import { css } from '@emotion/react';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { Button, vars } from '@toss-place/design-system';
import { useState } from 'react';

import { CashCountForm } from '../cash/components/CashCountForm';
import { CashSummary, CashSummarySkeleton } from '../cash/components/CashSummary';
import { createEmptyCashCount, sumCashCount, type Denomination } from '../cash/denominations';
import { useOpenCashDrawer } from '../cash/hooks/useOpenCashDrawer';

export function CashPage() {
  const [count, setCount] = useState(createEmptyCashCount);
  const drawer = useOpenCashDrawer();

  const handleChange = (denomination: Denomination, quantity: number) => {
    setCount(prev => ({ ...prev, [denomination]: Math.max(0, quantity) }));
  };

  return (
    <main css={layoutStyle}>
      <section css={panelStyle} aria-labelledby="cash-count-title">
        <header css={headerStyle}>
          <h1 id="cash-count-title" css={titleStyle}>
            현금 세기
          </h1>
          <Button variant="secondary" size="medium" onClick={() => void drawer.open()}>
            금전함 열기
          </Button>
        </header>
        {drawer.errorMessage !== null && (
          <p role="alert" css={errorStyle}>
            {drawer.errorMessage}
          </p>
        )}
        <CashCountForm count={count} onChange={handleChange} />
      </section>

      <ErrorBoundary fallback={<p>시재 정보를 불러오지 못했어요.</p>}>
        <Suspense fallback={<CashSummarySkeleton />}>
          <CashSummary countedCash={sumCashCount(count)} />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}

const layoutStyle = css`
  display: grid;
  grid-template-columns: 1fr 380px;
  align-items: start;
  gap: ${vars.spacing.x5};
  min-height: 100vh;
  padding: ${vars.spacing.x5};
`;

const panelStyle = css`
  padding: ${vars.spacing.x5};
  border-radius: ${vars.radius.large};
  background: ${vars.color.bgSurface};
`;

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${vars.spacing.x3};
`;

const titleStyle = css`
  margin: 0;
  font-size: ${vars.typography.t3.fontSize};
  line-height: ${vars.typography.t3.lineHeight};
`;

const errorStyle = css`
  margin: 0 0 ${vars.spacing.x3};
  color: ${vars.color.textDanger};
  font-size: ${vars.typography.t6.fontSize};
`;
