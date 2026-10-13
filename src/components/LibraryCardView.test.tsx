import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LibraryCardView } from './LibraryCardView';
import { TopicCard, CardThread } from '@/types/catalog';

describe('LibraryCardView 컴포넌트 - RESTRICTED 열람 제한', () => {
  const dummyCard: TopicCard = {
    id: 'test-card',
    callNumber: '201',
    topic: '바벨의 도서관과 무한 장서 우주',
    author: '호르헤 루이스 보르헤스',
    classification: '201 문학 / 형이상학',
    acquisitionDate: '1941-11-03',
    summary: '무한한 육각형 벌집 구조의 우주 도서관에 관한 사유.',
    tags: ['도서관', '무한', '바벨'],
    threads: [],
  };

  const restrictedThread: CardThread = {
    id: 'thread-r1',
    date: '1979-05-18',
    stampType: 'RESTRICTED',
    note: '기밀 사유 메모입니다.',
  };

  const defaultProps = {
    card: dummyCard,
    activeThread: restrictedThread,
    activeThreadIndex: 1,
    totalThreads: 2,
    onPrevThread: vi.fn(),
    onNextThread: vi.fn(),
    onSelectTopic: vi.fn(),
    onOpenBacklinks: vi.fn(),
    backlinkCount: 0,
    allCards: [dummyCard],
    isAuthenticated: false,
  };

  it('열람 제한(RESTRICTED) 상태에서 상자 중첩 없이 상하 가로줄과 "열람 권한 필요" 뱃지가 표시되어야 한다', () => {
    const { container } = render(<LibraryCardView {...defaultProps} />);

    // '사서 열람 권한이 필요한 구역입니다' 중복 문장은 지워져야 함
    expect(screen.queryByText('사서 열람 권한이 필요한 구역입니다.')).toBeNull();

    // 뱃지 문구는 '[ CLASSIFIED / 열람 권한 필요 ]'로 렌더링되어야 함
    expect(screen.getByText(/열람 권한 필요/)).toBeDefined();

    // 상단 메뉴 Admin 안내 텍스트 노출 확인
    expect(screen.getByText(/상단 메뉴의/)).toBeDefined();

    // 2010년대 모던 웹 파스텔 보라색 스타일이 완전히 제거되었는지 검증
    expect(container.querySelector('.bg-purple-50\\/60')).toBeNull();
    expect(container.querySelector('.border-purple-800\\/60')).toBeNull();
  });

  it('스탬프 유형이 ESTABLISHED일 때 stamp-established 클래스로 렌더링되어야 한다', () => {
    const establishedThread: CardThread = {
      id: 'thread-e1',
      date: '1984-01-24',
      stampType: 'ESTABLISHED',
      note: '완결되어 안착한 사유입니다.',
    };

    render(<LibraryCardView {...defaultProps} activeThread={establishedThread} />);

    const stamp = screen.getByText('ESTABLISHED');
    expect(stamp).toBeDefined();
    expect(stamp.className).toContain('stamp-established');
  });

  it('스탬프 유형이 QUOTATION일 때 stamp-quotation 클래스와 QUOTATION 문구로 렌더링되어야 한다', () => {
    const quotationThread: CardThread = {
      id: 'thread-q1',
      date: '1984-02-15',
      stampType: 'QUOTATION',
      note: '도서관은 우주 그 자체다.',
    };

    render(<LibraryCardView {...defaultProps} activeThread={quotationThread} />);

    const stamp = screen.getByText('QUOTATION');
    expect(stamp).toBeDefined();
    expect(stamp.className).toContain('stamp-quotation');
  });

  it('기존 QUOTE 스탬프 유형도 stamp-quotation 클래스와 호환되어야 한다', () => {
    const legacyQuoteThread: CardThread = {
      id: 'thread-q2',
      date: '1984-02-16',
      stampType: 'QUOTE',
      note: '옛 인용구 사유 메모입니다.',
    };

    render(<LibraryCardView {...defaultProps} activeThread={legacyQuoteThread} />);

    const stamp = screen.getByText('QUOTATION');
    expect(stamp).toBeDefined();
    expect(stamp.className).toContain('stamp-quotation');
  });

  it('단상 1/1과 같은 불필요한 단상 카운트 인디케이터가 렌더링되지 않아야 한다', () => {
    render(<LibraryCardView {...defaultProps} />);

    // '단상' 및 '1 / 2'와 같은 단상 카운트 뱃지가 렌더링되지 않아야 함
    expect(screen.queryByText(/단상 \d+ \/ \d+/)).toBeNull();
  });

  it('우측 상단에서 중복된 "수서등록" 날짜가 제거되고 슬래시 없는 "CLASSIFICATION" 단일 라벨이 표기되어야 한다', () => {
    render(<LibraryCardView {...defaultProps} />);

    // 수서등록 날짜 라벨이 완전히 제거되어야 함
    expect(screen.queryByText(/수서등록/)).toBeNull();

    // 좌측의 CALL NUMBER와 대칭을 이루는 CLASSIFICATION 단일 라벨이 렌더링되어야 함 (슬래시 제거)
    expect(screen.getByText('CLASSIFICATION')).toBeDefined();
    expect(screen.queryByText('CLASSIFICATION / 분과 서가')).toBeNull();
  });

  it('B- 서지 카드의 경우 우측 상단 라벨이 "BIBLIOGRAPHY" 단일 라벨로 표기되어야 한다', () => {
    const bookCard: TopicCard = {
      ...dummyCard,
      callNumber: 'B-1',
      topic: '러브 머신(제임스 멀둔, 2026)',
      classification: 'B- 서지 서가 / 인문 / AI',
    };

    render(<LibraryCardView {...defaultProps} card={bookCard} />);

    // 빨간색 [BIBLIOGRAPHICAL / 서지 카드] 라벨은 제거되어야 함
    expect(screen.queryByText('[BIBLIOGRAPHICAL / 서지 카드]')).toBeNull();

    // 우측 상단에 서지 서가 라벨이 슬래시 없는 BIBLIOGRAPHY 단일 라벨로 렌더링되어야 함
    expect(screen.getByText('BIBLIOGRAPHY')).toBeDefined();
    expect(screen.queryByText('BIBLIOGRAPHY / 서지 서가')).toBeNull();

    // 책 제목은 본문에 여전히 큼직하게 유지되어야 함
    expect(screen.getByText('러브 머신(제임스 멀둔, 2026)')).toBeDefined();
  });
});
