import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LibrarianWidget } from './LibrarianWidget';

describe('LibrarianWidget 컴포넌트', () => {
  const defaultProps = {
    currentTopic: '[101] 메멕스(Memex)와 기계적 연상 기억망',
  };

  it('기존 창 틀(사서 집무실) 없이 배경 위에 사서 아이콘 이미지(/librarian.png)가 직접 렌더링되어야 한다', () => {
    render(<LibrarianWidget {...defaultProps} />);

    // 기존 System 7 윈도우 타이틀 '사서 집무실'은 사라져야 함
    expect(screen.queryByText('사서 집무실')).toBeNull();

    // /librarian.png 이미지가 렌더링되어야 함
    const img = screen.getByRole('img', { name: /사서/ });
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('/librarian.png');
  });

  it('기본 상태에서는 말풍선이 없고, 사서 이미지 상단에 여백을 두고 수평 중앙에 "사서에게 말 걸기"가 렌더링되어야 한다', () => {
    render(<LibrarianWidget {...defaultProps} />);

    // 말풍선은 기본 상태에서 없어야 함
    expect(screen.queryByText(/안내 사서/)).toBeNull();

    // '사서에게 말 걸기' 검은 네모 칸이 노출되어야 함
    const talkPrompt = screen.getByText('사서에게 말 걸기');
    expect(talkPrompt).toBeDefined();
    expect(talkPrompt.className).toContain('bg-black');
    expect(talkPrompt.className).toContain('text-white');

    // 사서 이미지의 위쪽(-top-)에 있고, 좌우 치우침 없이 수평 중앙(left-1/2, -translate-x-1/2)이어야 함
    expect(talkPrompt.className).toContain('-top-');
    expect(talkPrompt.className).toContain('left-1/2');
    expect(talkPrompt.className).toContain('-translate-x-1/2');
    expect(talkPrompt.className).not.toContain('top-1/2');
  });


  it('사서 이미지를 클릭하면 말풍선이 열리고, 호칭은 "사서 S"로 표시되며 모서리는 적절히 둥근 rounded-lg여야 한다', () => {
    render(<LibrarianWidget {...defaultProps} />);

    const librarianBtn = screen.getByRole('button', { name: /사서/ });

    // 클릭하여 말풍선 열기
    fireEvent.click(librarianBtn);
    expect(screen.getByText('사서 S')).toBeDefined();
    expect(screen.queryByText('안내 사서')).toBeNull();
    expect(screen.getByText(/메멕스\(Memex\)/)).toBeDefined();
    expect(screen.queryByText('사서에게 말 걸기')).toBeNull();

    // 말풍선 모서리: 과하지 않게 살짝 둥근 rounded-lg 및 이미지 위 2px 상향 여백(mb-[10px])
    const bubble = screen.getByTestId('bubble-container');
    expect(bubble.className).toContain('rounded-lg');
    expect(bubble.className).not.toContain('rounded-2xl');
    expect(bubble.className).toContain('mb-[10px]');

    // 사서의 대사 문구(랜덤 메시지)가 렌더링되어야 함
    const messageEl = screen.getByTestId('librarian-message');
    expect(messageEl).toBeDefined();
    expect(messageEl.textContent?.length).toBeGreaterThan(0);

    // 임시 비교 탭은 제거되었어야 함
    expect(screen.queryByText(/시안 1/i)).toBeNull();

    // 말풍선 닫기(×) 버튼 클릭하여 닫기
    const closeBtn = screen.getByRole('button', { name: /말풍선 닫기/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText('사서 S')).toBeNull();
    expect(screen.getByText('사서에게 말 걸기')).toBeDefined();
  });
});

