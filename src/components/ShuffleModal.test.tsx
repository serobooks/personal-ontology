import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ShuffleModal } from './ShuffleModal';

describe('ShuffleModal 컴포넌트 검증', () => {
  it('isOpen이 false일 때는 아무것도 렌더링되지 않아야 한다', () => {
    const { container } = render(<ShuffleModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('isOpen이 true일 때 System 7 다이얼로그와 카드 셔플 프레임이 표시되어야 한다', () => {
    render(<ShuffleModal isOpen={true} />);

    // 다이얼로그 제목 및 상태 텍스트 확인
    expect(screen.getByText(/단상 서랍 셔플/i)).toBeDefined();
    expect(screen.getByText(/무작위 색인 카드를 뒤섞는 중/i)).toBeDefined();

    // 셔플 프레임 또는 일러스트 영역 확인
    const shuffleVisual = screen.getByTestId('shuffle-card-animation');
    expect(shuffleVisual).toBeDefined();
    expect(shuffleVisual).not.toBeNull();
  });
});
