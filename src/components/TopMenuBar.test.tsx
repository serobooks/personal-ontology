import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopMenuBar } from './TopMenuBar';

describe('TopMenuBar 컴포넌트', () => {
  const defaultProps = {
    onOpenAbout: vi.fn(),
    onOpenIndex: vi.fn(),
    onOpenSearch: vi.fn(),
    onOpenHelp: vi.fn(),
    onOpenAdmin: vi.fn(),
    isAboutOpen: false,
    isIndexOpen: false,
    isSearchOpen: false,
    isHelpOpen: false,
    isAdminOpen: false,
    isAdminAuthenticated: false,
  };

  it('상단 좌측에 사이트 이름으로 "사적 온톨로지"를 표시해야 한다', () => {
    render(<TopMenuBar {...defaultProps} />);
    const siteTitle = screen.getByText('사적 온톨로지');
    expect(siteTitle).toBeDefined();
  });

  it('상단 GNB 탑 레벨에는 About, Explore, Admin, Dear Master, Tateyomi가 노출되어야 한다', () => {
    render(<TopMenuBar {...defaultProps} onOpenMap={vi.fn()} />);

    // 탑 레벨 메뉴 노출 검증
    expect(screen.getByRole('button', { name: 'About' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Explore' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Admin' })).toBeDefined();
    expect(screen.getByText('Dear Master')).toBeDefined();

    // Tateyomi 링크 및 URL 검증
    const tateyomiLink = screen.getByRole('link', { name: /Tateyomi/i });
    expect(tateyomiLink).toBeDefined();
    expect(tateyomiLink.getAttribute('href')).toBe('https://github.com/serobooks/tateyomi/releases/latest');
    expect(tateyomiLink.getAttribute('target')).toBe('_blank');

    // 초기 상태에서는 Index, Search, Map, Help가 직접 노출되지 않아야 함
    expect(screen.queryByRole('button', { name: /^Index$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Search$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Map$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Help$/i })).toBeNull();
  });


  it('Explore 클릭 시 드롭다운이 열리고 Index, Search, Map, 경계선, Help가 순서대로 표시되어야 한다', () => {
    const handleMap = vi.fn();
    const { container } = render(<TopMenuBar {...defaultProps} onOpenMap={handleMap} />);

    // Explore 클릭하여 드롭다운 열기
    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));

    // 드롭다운 항목 검증
    const indexBtn = screen.getByRole('button', { name: /Index/i });
    const searchBtn = screen.getByRole('button', { name: /Search/i });
    const mapBtn = screen.getByRole('button', { name: /Map/i });
    const helpBtn = screen.getByRole('button', { name: /Help/i });

    expect(indexBtn).toBeDefined();
    expect(searchBtn).toBeDefined();
    expect(mapBtn).toBeDefined();
    expect(helpBtn).toBeDefined();

    // 순서 검증: Index -> Search -> Map -> Help
    expect(indexBtn.compareDocumentPosition(searchBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(searchBtn.compareDocumentPosition(mapBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(mapBtn.compareDocumentPosition(helpBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // 은은한 경계선(divider) 요소 확인
    const divider = container.querySelector('.border-gray-300');
    expect(divider).not.toBeNull();
  });

  it('드롭다운 메뉴 클릭 시 해당 핸들러가 호출되어야 한다', () => {
    const handleMap = vi.fn();
    render(<TopMenuBar {...defaultProps} onOpenMap={handleMap} />);

    // 1. Index 클릭
    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
    fireEvent.click(screen.getByRole('button', { name: /Index/i }));
    expect(defaultProps.onOpenIndex).toHaveBeenCalled();

    // 2. Search 클릭
    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(defaultProps.onOpenSearch).toHaveBeenCalled();

    // 3. Map 클릭
    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
    fireEvent.click(screen.getByRole('button', { name: /Map/i }));
    expect(handleMap).toHaveBeenCalled();

    // 4. Help 클릭
    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
    fireEvent.click(screen.getByRole('button', { name: /Help/i }));
    expect(defaultProps.onOpenHelp).toHaveBeenCalled();
  });
});

