import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminModal } from './AdminModal';

describe('AdminModal 컴포넌트', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    isAuthenticated: false,
    onLogin: vi.fn().mockReturnValue(true),
    onLogout: vi.fn(),
  };

  it('창 상단 타이틀이 "사서 인가 (Admin Access)"이고 기본 인가 암호 안내가 삭제되어야 한다', () => {
    render(<AdminModal {...defaultProps} />);

    expect(screen.getByText('사서 인가 (Admin Access)')).toBeDefined();
    expect(screen.queryByText(/^Admin Access$/)).toBeNull();
    expect(screen.queryByText(/사서 기본 인가 암호/)).toBeNull();
  });

  it('미인증 상태에서 두 버튼이 표준 sys7-btn 네모 버튼으로 통일되어 있어야 한다', () => {
    render(<AdminModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /취소/ });
    const submitButton = screen.getByRole('button', { name: /인가 확인/ });

    // 두 버튼 모두 표준 sys7-btn 클래스를 사용해야 함
    expect(cancelButton.className).toContain('sys7-btn');
    expect(submitButton.className).toContain('sys7-btn');

    // 패딩 및 폰트 규격도 px-4 py-1 text-xs font-bold로 통일되어야 함
    expect(cancelButton.className).toContain('px-4 py-1');
    expect(submitButton.className).toContain('px-4 py-1');
  });

  it('인증된 상태에서 두 버튼이 표준 sys7-btn 네모 버튼으로 통일되어 있어야 한다', () => {
    render(<AdminModal {...defaultProps} isAuthenticated={true} />);

    const logoutButton = screen.getByRole('button', { name: /권한 반납/ });
    const closeButton = screen.getByText('닫기 (Esc)');

    expect(logoutButton.className).toContain('sys7-btn');
    expect(closeButton.className).toContain('sys7-btn');
    expect(logoutButton.className).toContain('px-4 py-1');
    expect(closeButton.className).toContain('px-4 py-1');
  });

  it('노란색 열쇠 이모지(🔑) 대신 클래식 Mac OS 스타일의 픽셀 열쇠 그래픽이 렌더링되어야 한다', () => {
    const { container } = render(<AdminModal {...defaultProps} />);

    // 현대 스마트폰 컬러 열쇠 이모지(🔑)가 없어야 함
    expect(screen.queryByText('🔑')).toBeNull();

    // 클래식 Mac 1비트 픽셀 비트맵 키 SVG가 존재해야 함
    const pixelKeyIcon = container.querySelector('svg[aria-label="클래식 열쇠"]');
    expect(pixelKeyIcon).not.toBeNull();
  });
});
