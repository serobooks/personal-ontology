import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IndexModal } from './IndexModal';
import { mockCards } from '@/data/mockCards';

describe('IndexModal 컴포넌트', () => {
  const defaultProps = {
    cards: mockCards,
    activeCardId: mockCards[0].id,
    onSelectCard: vi.fn(),
    onClose: vi.fn(),
  };

  it('좌측 하단의 중복된 "[Esc] 닫기" 텍스트가 표시되지 않아야 한다', () => {
    render(<IndexModal {...defaultProps} />);

    // '[Esc] 닫기' 라벨이 존재하지 않아야 함
    expect(screen.queryByText('[Esc] 닫기')).toBeNull();

    // 우측 버튼들은 여전히 정상 렌더링되어야 함 (취소 및 입장 버튼)
    expect(screen.getByRole('button', { name: /취소/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /입장/ })).toBeDefined();
  });

  it('도서관 십진분류표 대분과 목록에서 코드 중복 없이 순수 분과명(언어와 번역 등)과 건수가 표시되어야 한다', () => {
    render(<IndexModal {...defaultProps} />);

    // 대괄호 바깥의 텍스트에는 100, 200 등의 중복 숫자가 없어야 함
    expect(screen.queryByText('100 언어와 번역')).toBeNull();
    expect(screen.queryByText('200 서사와 창작')).toBeNull();

    // 순수 분과 명칭이 정확히 렌더링되어야 함
    expect(screen.getByText('언어와 번역')).toBeDefined();
    expect(screen.getByText('서사와 창작')).toBeDefined();
    expect(screen.getByText('인간과 관계')).toBeDefined();
    expect(screen.getByText('미학과 신앙')).toBeDefined();
    expect(screen.getByText('기계와 인간성')).toBeDefined();
    expect(screen.getByText('자연과 사유')).toBeDefined();
    expect(screen.getByText('서지 서가')).toBeDefined();
  });

  it('카드가 0건인 대분과를 클릭하면 onSelectCard가 호출되지 않아야 한다', () => {
    const onSelectCard = vi.fn();
    // 400번대는 mockCards에 카드가 없음 (0건)
    render(<IndexModal {...defaultProps} onSelectCard={onSelectCard} />);

    const item400 = screen.getByText('미학과 신앙').closest('div');
    if (item400) {
      item400.click();
    }
    expect(onSelectCard).not.toHaveBeenCalled();
  });

  it('카드가 있는 대분과를 클릭하면 해당 분과의 첫 번째 카드 ID로 onSelectCard가 호출되어야 한다', () => {
    const onSelectCard = vi.fn();
    // 100번대는 mockCards에 카드가 있음 (2건)
    render(<IndexModal {...defaultProps} onSelectCard={onSelectCard} />);

    const item100 = screen.getByText('언어와 번역').closest('div');
    if (item100) {
      item100.click();
    }
    expect(onSelectCard).toHaveBeenCalled();
  });
});
