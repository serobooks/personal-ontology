import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MiniMapModal } from './MiniMapModal';
import { mockCards } from '@/data/mockCards';

describe('MiniMapModal 서고 전체도 컴포넌트 검증', () => {
  const currentCard = mockCards.find((c) => c.callNumber === '101-a1') || mockCards[0];
  const defaultProps = {
    isOpen: true,
    currentCard,
    allCards: mockCards,
    onClose: vi.fn(),
  };

  it('isOpen이 false일 때는 아무것도 렌더링되지 않아야 한다', () => {
    const { container } = render(<MiniMapModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('isOpen이 true일 때 서고 전체도 타이틀이 표시되고, 비유적 표현(지상, 심연, 굴착됨)과 회전 링이 없어야 한다', () => {
    const { container } = render(<MiniMapModal {...defaultProps} />);

    // 1. 단정한 타이틀 확인
    expect(screen.getByText(/서고 전체도/i)).toBeDefined();

    // 2. 비유적 표현(지상, 심연, SURFACE, ABYSS, 굴착됨)이 완전히 배제되어야 함
    expect(screen.queryByText(/SURFACE/i)).toBeNull();
    expect(screen.queryByText(/ABYSS/i)).toBeNull();
    expect(screen.queryByText(/지상/)).toBeNull();
    expect(screen.queryByText(/심연/)).toBeNull();
    expect(screen.queryByText(/굴착됨/)).toBeNull();

    // 3. 펄스 링(회전 애니메이션 클래스)이 존재하지 않아야 함
    expect(container.querySelector('.animate-spin')).toBeNull();

    // 4. 전체도 캔버스와 현재 위치 마커 확인
    const overviewMap = screen.getByTestId('overview-map');
    expect(overviewMap).toBeDefined();

    const currentMarker = screen.getByTestId('current-location-marker');
    expect(currentMarker).toBeDefined();
  });

  it('하단에 표준 크기의 "닫기 (Esc)" 버튼이 렌더링되고 클릭 시 onClose가 호출되어야 한다', () => {
    const onClose = vi.fn();
    render(<MiniMapModal {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: '닫기 (Esc)' });
    expect(closeBtn).toBeDefined();

    closeBtn.click();
    expect(onClose).toHaveBeenCalled();
  });
});
