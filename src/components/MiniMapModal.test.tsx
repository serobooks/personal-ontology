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

  it('B- 서지 카드가 존재할 때 스타일 2 이중 원(Celestial Bullseye ⊙) 마커가 렌더링되고 하단 상태바는 단정하게 유지되어야 한다', () => {
    const { container } = render(<MiniMapModal {...defaultProps} />);

    // B- 서지 카드용 마커가 렌더링되었는지 확인
    const bookMarkers = container.querySelectorAll('[data-testid="book-marker"]');
    expect(bookMarkers.length).toBeGreaterThan(0);

    // 각 서지 마커는 이중 원(외곽 원 circle)을 포함해야 함
    const outerCircles = container.querySelectorAll('[data-testid="book-marker"] circle');
    expect(outerCircles.length).toBeGreaterThan(0);

    // 하단 설명이 두 줄이 되지 않도록 범례 텍스트는 표시되지 않아야 함
    expect(screen.queryByText(/□ 사유 · ◇ 서지/)).toBeNull();

    // 연계 카드 참조 점선(reference-link)이 존재하는지 확인
    const refLinks = container.querySelectorAll('[data-testid="reference-link"]');
    expect(refLinks.length).toBeGreaterThan(0);
  });

  it('성운 간 교집합을 오인시키는 거대 원형 경계선(r > 20) 및 인위적인 애니메이션이 완전히 배제되어야 한다', () => {
    const { container } = render(<MiniMapModal {...defaultProps} />);

    // 1. 벤 다이어그램 교집합 오해를 낳는 거대 원형 경계선 링(반지름 > 20)이 전혀 없어야 함
    const circles = Array.from(container.querySelectorAll('circle'));
    const largeCircles = circles.filter((c) => {
      const r = Number(c.getAttribute('r') || 0);
      return r > 20;
    });
    expect(largeCircles.length).toBe(0);

    // 2. 깜빡임, 펄스, 회전 등의 애니메이션 클래스가 없어야 함
    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(container.querySelector('.animate-pulse')).toBeNull();
    expect(container.querySelector('.beacon-marker')).toBeNull();

    // 3. 직속 부모-자식 실선 터널(tunnel-link)이 렌더링되어야 함
    const tunnelLinks = container.querySelectorAll('[data-testid="tunnel-link"]');
    expect(tunnelLinks.length).toBeGreaterThan(0);
  });
});


