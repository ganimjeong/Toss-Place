import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('type을 정하지 않으면 submit이 아니라 button으로 렌더링함', () => {
    render(<Button>결제</Button>);

    expect(screen.getByRole('button', { name: '결제' }).getAttribute('type')).toBe('button');
  });

  it('비활성화 상태에서는 클릭 핸들러가 불리지 않음', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        결제
      </Button>,
    );

    fireEvent.click(screen.getByRole('button', { name: '결제' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('바깥에서 받은 className을 기본 스타일 뒤에 붙임', () => {
    render(<Button className="extra">결제</Button>);

    expect(screen.getByRole('button').className).toMatch(/ extra$/);
  });
});
