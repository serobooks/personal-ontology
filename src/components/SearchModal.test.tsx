import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchModal } from './SearchModal';
import { mockCards } from '@/data/mockCards';

describe('SearchModal 컴포넌트', () => {
  const defaultProps = {
    cards: mockCards,
    onSelectCard: vi.fn(),
    onClose: vi.fn(),
  };

  it('창 상단 타이틀이 "카드 검색 (Find Card)"으로 렌더링되어야 한다', () => {
    render(<SearchModal {...defaultProps} />);

    expect(screen.getByText('카드 검색 (Find Card)')).toBeDefined();
    expect(screen.queryByText('Find Card...')).toBeNull();
  });

  it('좌측 하단의 중복된 "[Esc] 닫기" 텍스트가 표시되지 않아야 한다', () => {
    render(<SearchModal {...defaultProps} />);

    // '[Esc] 닫기' 라벨이 존재하지 않아야 함
    expect(screen.queryByText('[Esc] 닫기')).toBeNull();

    // 우측 버튼들은 여전히 정상 렌더링되어야 함
    expect(screen.getByRole('button', { name: /취소/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /이동/ })).toBeDefined();
  });

  it('우측의 "단상 N편" 텍스트가 렌더링되지 않아야 한다', () => {
    render(<SearchModal {...defaultProps} />);

    // '단상 1편', '단상 2편' 등 단상 편수 텍스트가 나타나지 않아야 함
    expect(screen.queryByText(/단상 \d+편/)).toBeNull();
  });

  it('검색어가 입력되지 않았을 때 검색 결과 건수와 카드 목록 및 [ 0 CARDS FOUND ]가 표시되지 않고 빈칸이어야 한다', () => {
    render(<SearchModal {...defaultProps} />);

    // '검색 결과: N건' 라벨이 표시되지 않아야 함
    expect(screen.queryByText(/검색 결과:/)).toBeNull();

    // 카드 목록이 표시되지 않아야 함
    const firstCallNumber = mockCards[0].callNumber;
    expect(screen.queryByText(firstCallNumber)).toBeNull();

    // 입력 전이므로 '[ 0 CARDS FOUND ]'도 표시되지 않아야 함
    expect(screen.queryByText(/0 CARDS FOUND/)).toBeNull();
  });

  it('검색어를 입력하면 해당 메모 본문(note) 및 검색 결과 건수가 표시되어야 한다', () => {
    render(<SearchModal {...defaultProps} />);

    const input = screen.getByRole('textbox');
    // mockCards에 있는 키워드 검색
    const targetCard = mockCards[0];
    const searchKeyword = targetCard.callNumber;

    fireEvent.change(input, { target: { value: searchKeyword } });

    // 검색 결과 건수 표시
    expect(screen.getByText(/검색 결과:/)).toBeDefined();

    // 메모 본문 또는 청구기호 표시
    expect(screen.getByText(targetCard.callNumber)).toBeDefined();
  });

  it('아무 메모에도 해당하지 않는 검색어를 입력하면 [ 0 CARDS FOUND ]와 검색 결과 0건이 표시되어야 한다', () => {
    render(<SearchModal {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '존재하지않는특수검색어xyz123' } });

    expect(screen.getByText('검색 결과: 0건')).toBeDefined();
    expect(screen.getByText('[ 0 CARDS FOUND ]')).toBeDefined();
  });

  it('키보드 ArrowDown 입력 시 선택 항목이 다음 카드로 변경되어야 한다', () => {
    render(<SearchModal {...defaultProps} />);

    const input = screen.getByRole('textbox');
    // 복수 개의 카드가 매칭되는 키워드 입력 ('101' -> 101, 101-a 매칭)
    fireEvent.change(input, { target: { value: '101' } });

    const items = screen.getAllByText(/101/);
    expect(items.length).toBeGreaterThan(1);

    // ArrowDown 입력
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Enter 입력 시 선택된 카드의 onSelectCard가 호출되어야 함
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(defaultProps.onSelectCard).toHaveBeenCalled();
  });
});

