import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HelpModal } from './HelpModal';

describe('HelpModal 컴포넌트', () => {
  it('서고 이용 안내 제목과 주요 단축키 가이드가 렌더링되어야 한다', () => {
    const handleClose = vi.fn();
    render(<HelpModal onClose={handleClose} />);

    expect(screen.getByText('서고 이용 안내 (Help Guide)')).toBeDefined();
    expect(screen.getByText('사적 온톨로지 이용 지침')).toBeDefined();
    expect(screen.queryByText(/이용 지침 \(Help Guide\)/)).toBeNull();
    expect(screen.queryByText(/모든 것은 다른 모든 것과/)).toBeNull();
    expect(screen.getByText(/방향키 조작 체계/)).toBeDefined();
    expect(screen.getByText(/같은 주제 내 이동/)).toBeDefined();
    expect(screen.getByText(/다른 주제 전환/)).toBeDefined();
  });

  it('확인 버튼 클릭 시 onClose 핸들러가 호출되어야 한다', () => {
    const handleClose = vi.fn();
    render(<HelpModal onClose={handleClose} />);

    const closeButton = screen.getByRole('button', { name: /확인/ });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalled();
  });
});
