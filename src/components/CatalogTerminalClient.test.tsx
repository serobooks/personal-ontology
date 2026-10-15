import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CatalogTerminalClient from './CatalogTerminalClient';
import { TopicCard } from '@/types/catalog';

// 하위 컴포넌트 목킹
vi.mock('@/components/LibrarianWidget', () => ({
  LibrarianWidget: () => <div data-testid="librarian-widget" />,
}));

describe('CatalogTerminalClient', () => {
  const sampleCards: TopicCard[] = [
    {
      id: 'recent-card',
      callNumber: '211-2',
      topic: '고양이의 영혼과 교감하면 할 수 있는 일',
      author: '사서 Hailey',
      classification: '200 고양이',
      acquisitionDate: '2026-10-15',
      summary: '고양이의 영혼과 교감하면 할 수 있는 일',
      threads: [
        {
          id: 'thread-1',
          date: '2026-10-15',
          stampType: 'UNFINISHED',
          note: '고양이의 영혼과 교감하면 할 수 있는 일\n• 복권 번호 맞추기 (X)',
        },
      ],
      tags: ['고양이'],
    },
  ];

  it('initialCards로 전달된 최신 카드가 첫 렌더링부터 즉시 화면에 노출되어야 한다', () => {
    render(<CatalogTerminalClient initialCards={sampleCards} initialSource="notion" />);

    // 101 카드가 아닌 전달된 첫 번째 카드의 청구기호와 제목이 표시되는지 확인
    expect(screen.getByText('211-2')).toBeDefined();
    expect(screen.getAllByText(/고양이의 영혼과 교감하면 할 수 있는 일/).length).toBeGreaterThan(0);
    expect(screen.queryByText('101')).toBeNull();
  });
});


