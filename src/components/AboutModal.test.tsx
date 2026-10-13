import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AboutModal } from './AboutModal';

describe('AboutModal 컴포넌트', () => {
  it('서고 및 사서 소개 타이틀과 요청된 상세 내용이 렌더링되어야 한다', () => {
    const handleClose = vi.fn();
    render(<AboutModal onClose={handleClose} />);

    // 1. 창 상태창 문구 확인
    expect(screen.getByText('서고 및 사서 소개 (Archive & Librarian)')).toBeDefined();

    // 2. 사적 온톨로지 소개 문구 및 새로운 이동 안내 문구 확인
    expect(screen.getByText(/사적 온톨로지/)).toBeDefined();
    expect(screen.getByText(/체텔카스텐\(Zettelkasten\)/)).toBeDefined();
    expect(
      screen.getByText(/키보드 방향키, 색인, 전체도, 랜덤 카드를 통해 서가 사이를 자유롭게 거닐어 보세요\./)
    ).toBeDefined();

    // 3. 사서 송해영 프로필 및 활동 소개 확인 ('비즈공예도 하고' 제외 확인)
    expect(screen.getByText(/사서 - 송해영/)).toBeDefined();
    expect(screen.getByText(/번역도 하고 뜨개질도 하고 소설도 쓰고 고양이 밥도 주고 타로도 보고 바이브 코딩도 하고 ｴﾄｾﾄﾗ/)).toBeDefined();
    expect(screen.queryByText(/비즈공예/)).toBeNull();

    // 4. 역서 및 프로젝트 목록 확인 (< > 괄호 적용 및 《 》 제거 확인)
    expect(screen.getByText(/- <내 증상에도 이름이 있나요\?>/)).toBeDefined();
    expect(screen.getByText(/- <사랑과 차별과 우정과 LGBTQ\+>/)).toBeDefined();
    expect(screen.getByText(/- <60분 만에 읽는 탄소중립>/)).toBeDefined();
    expect(screen.getByText(/- <남몰래 거리 두는 관계의 기술> 등/)).toBeDefined();
    expect(screen.queryByText(/《/)).toBeNull();
    expect(screen.queryByText(/》/)).toBeNull();

    expect(screen.getByText(/Dear Master/)).toBeDefined();
    expect(screen.getByText(/타테요미/)).toBeDefined();


    // 5. 연락처 확인
    expect(screen.getByText(/serobooks@gmail\.com/)).toBeDefined();
    expect(screen.getByText(/brunch\.co\.kr\/@serobooks/)).toBeDefined();
  });

  it('사적 온톨로지가 사서 소개보다 상단에 위치하고, 사서도 검은색 칸 안에 표시되어야 한다', () => {
    const handleClose = vi.fn();
    render(<AboutModal onClose={handleClose} />);

    const ontologyTitle = screen.getByText('사적 온톨로지');
    const librarianTitle = screen.getByText('사서 - 송해영');

    // 사적 온톨로지가 사서 소개보다 문서상 앞에 위치해야 함
    const comparison = ontologyTitle.compareDocumentPosition(librarianTitle);
    expect(comparison & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // '사서 - 송해영'도 '사적 온톨로지'와 마찬가지로 검은색 칸(bg-black text-white)이어야 함
    expect(librarianTitle.className).toContain('bg-black');
    expect(librarianTitle.className).toContain('text-white');
  });

  it('사진이 제거되어야 하고, 소개글과 박스 사이에 얇은 선이 없어야 한다', () => {
    const handleClose = vi.fn();
    const { container } = render(<AboutModal onClose={handleClose} />);

    // 사진 이미지가 존재하지 않아야 함
    const profileImg = screen.queryByAltText(/사서.*프로필/i);
    expect(profileImg).toBeNull();

    // 사서 소개글 영역에 border-b 클래스가 없어야 함
    const librarianText = screen.getByText(/번역도 하고 뜨개질도 하고/);
    const parentContainer = librarianText.closest('div');
    expect(parentContainer?.className.includes('border-b')).toBeFalsy();
  });
});




