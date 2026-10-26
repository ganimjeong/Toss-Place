import { fireEvent, render, screen } from '@testing-library/react';
import { createMockPosBridge } from '@toss-place/pos-bridge';
import { afterEach, describe, expect, it } from 'vitest';

import { Providers } from '../app/Providers';
import { CashPage } from './CashPage';

function renderCashPage() {
  render(
    <Providers>
      <CashPage />
    </Providers>,
  );
}

afterEach(() => {
  delete window.posBridge;
});

describe('CashPage', () => {
  it('센 현금과 있어야 할 현금의 차이를 보여줌', async () => {
    renderCashPage();
    // 있어야 할 현금: 100,000 + 235,500 - 12,000 = 323,500원
    expect(await screen.findByText('-323,500원')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('50,000원 지폐 장수'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('10,000원 지폐 장수'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('1,000원 지폐 장수'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('500원 동전 장수'), { target: { value: '1' } });

    expect(screen.getByText('딱 맞아요')).toBeTruthy();
  });

  it('장수 입력에서 숫자가 아닌 글자는 무시함', async () => {
    renderCashPage();
    await screen.findByText('-323,500원');

    const input = screen.getByLabelText('10,000원 지폐 장수');
    fireEvent.change(input, { target: { value: '1a2' } });

    expect(input).toHaveProperty('value', '12');
  });

  it('금전함 연결이 끊어지면 안내 문구를 보여줌', async () => {
    window.posBridge = {
      ...createMockPosBridge(),
      openCashDrawer: () => Promise.resolve({ ok: false, reason: 'DISCONNECTED' }),
    };
    renderCashPage();

    fireEvent.click(screen.getByRole('button', { name: '금전함 열기' }));

    expect((await screen.findByRole('alert')).textContent).toContain('금전함 연결이 끊어졌어요');
  });
});
