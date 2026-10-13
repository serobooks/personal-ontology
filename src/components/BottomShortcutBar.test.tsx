import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BottomShortcutBar } from './BottomShortcutBar';

describe('BottomShortcutBar 컴포넌트', () => {
  const defaultProps = {
    onPrevThread: vi.fn(),
    onNextThread: vi.fn(),
    onPrevTopic: vi.fn(),
    onNextTopic: vi.fn(),
    onRandom: vi.fn(),
    onToggleSearch: vi.fn(),
    onToggleBacklinks: vi.fn(),
    onToggleMap: vi.fn(),
    onEscape: vi.fn(),
    isModalOpen: false,
  };

  it('하단 커맨드 바에 변경된 단축키 안내가 올바르게 렌더링되어야 한다', () => {
    render(<BottomShortcutBar {...defaultProps} />);

    // 변경된 표기 확인: [Esc] 복귀, [/] 검색 등
    expect(screen.getByText(/복귀/)).toBeDefined();
    expect(screen.getByText(/랜덤/)).toBeDefined();
    expect(screen.getByText(/검색/)).toBeDefined();
    expect(screen.getByText(/전체도/)).toBeDefined();
    expect(screen.getByText(/역링크/)).toBeDefined();

    // 중복되던 '[Enter] 색인'이 제거되었는지 검증
    expect(screen.queryByText(/색인/)).toBeNull();
  });

  it('[/] 검색 버튼 클릭 시 onToggleSearch 핸들러가 호출되어야 한다', () => {
    render(<BottomShortcutBar {...defaultProps} />);

    const searchButton = screen.getByRole('button', { name: /검색/ });
    fireEvent.click(searchButton);

    expect(defaultProps.onToggleSearch).toHaveBeenCalled();
  });

  it('[M] 전체도 버튼 클릭 시 onToggleMap 핸들러가 호출되어야 한다', () => {
    render(<BottomShortcutBar {...defaultProps} />);

    const mapButton = screen.getByRole('button', { name: /전체도/ });
    fireEvent.click(mapButton);

    expect(defaultProps.onToggleMap).toHaveBeenCalled();
  });
});
