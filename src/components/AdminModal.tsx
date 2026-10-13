'use client';

import React, { useState, useEffect, useRef } from 'react';
import { System7Window } from './System7Window';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onLogin: (password: string) => boolean;
  onLogout: () => void;
}

/**
 * 사서 전역 인가(Admin Access) 모달
 * - 클래식 Mac System 7 컴팩트 윈도우 스타일
 * - 비밀번호 입력(Auto-focus) 및 인증 성공 시 전역 인가 권한 부여
 */
export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isAuthenticated,
  onLogin,
  onLogout,
}) => {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 모달이 열릴 때 상태 초기화 및 자동 포커스
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMessage('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Esc 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) {
      setErrorMessage('암호를 입력해 주십시오.');
      return;
    }

    const success = onLogin(password);
    if (success) {
      setErrorMessage('');
      onClose();
    } else {
      setErrorMessage('인가되지 않은 암호입니다.');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <System7Window
          title="사서 인가 (Admin Access)"
          onClose={onClose}
          className="shadow-[8px_8px_0px_rgba(0,0,0,0.85)] border-2 border-black"
        >
          <div className="p-4 bg-[#e6e9ed] flex flex-col gap-4 font-mono text-xs">
            {isAuthenticated ? (
              // 1. 이미 인증된 상태: 인가 안내 및 로그아웃 버튼
              <div className="flex flex-col gap-3">
                <div className="border border-black bg-white p-3 shadow-[1px_1px_0px_#000]">
                  <div className="flex items-center gap-1.5 text-black font-bold mb-1">
                    <svg
                      className="w-4 h-4 shrink-0"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      style={{ imageRendering: 'pixelated' }}
                    >
                      <rect x="1" y="1" width="14" height="14" fill="#000" />
                      <rect x="2" y="2" width="12" height="12" fill="#fff" />
                      <rect x="4" y="8" width="2" height="2" fill="#000" />
                      <rect x="6" y="10" width="2" height="2" fill="#000" />
                      <rect x="8" y="8" width="2" height="2" fill="#000" />
                      <rect x="10" y="6" width="2" height="2" fill="#000" />
                      <rect x="12" y="4" width="2" height="2" fill="#000" />
                    </svg>
                    <span>사서 전역 인가 상태 [ON]</span>
                  </div>
                  <p className="text-gray-700 text-[11px] leading-relaxed">
                    현재 사서 인가가 유지되고 있습니다. RESTRICTED 스탬프가 날인된 열람제한 카드의 원본 본문이 활성화됩니다.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-400">
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="sys7-btn px-4 py-1 text-xs font-bold hover:bg-black hover:text-white cursor-pointer"
                  >
                    권한 반납 (로그아웃)
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="sys7-btn px-4 py-1 text-xs font-bold hover:bg-black hover:text-white cursor-pointer"
                  >
                    닫기 (Esc)
                  </button>
                </div>
              </div>
            ) : (
              // 2. 미인증 상태: 암호 입력 폼
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <svg
                      aria-label="클래식 열쇠"
                      className="w-4 h-4 shrink-0"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      style={{ imageRendering: 'pixelated' }}
                    >
                      {/* 열쇠 머리 외곽 */}
                      <rect x="1" y="5" width="6" height="6" fill="#000" />
                      {/* 열쇠 머리 구멍 */}
                      <rect x="3" y="7" width="2" height="2" fill="#fff" />
                      {/* 열쇠 축 (Stem) */}
                      <rect x="7" y="7" width="8" height="2" fill="#000" />
                      {/* 열쇠 이빨 1 (Bit 1) */}
                      <rect x="11" y="9" width="2" height="2" fill="#000" />
                      {/* 열쇠 이빨 2 (Bit 2) */}
                      <rect x="14" y="9" width="1" height="3" fill="#000" />
                    </svg>
                    <span>사서 수장고 열람 인가 암호:</span>
                  </label>
                  <input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="암호를 입력하세요..."
                    className="w-full border-2 border-black bg-white px-3 py-1.5 text-black font-mono text-sm focus:outline-none shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"
                  />
                </div>

                {errorMessage && (
                  <div className="border border-red-600 bg-red-50 text-red-700 px-2.5 py-1 text-[11px] font-bold text-center">
                    [ ⚠️ {errorMessage} ]
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-400">
                  <button
                    type="button"
                    onClick={onClose}
                    className="sys7-btn px-4 py-1 text-xs font-bold hover:bg-black hover:text-white cursor-pointer"
                  >
                    취소 (Esc)
                  </button>
                  <button
                    type="submit"
                    className="sys7-btn px-4 py-1 text-xs font-bold hover:bg-black hover:text-white cursor-pointer"
                  >
                    인가 확인 (Enter)
                  </button>
                </div>
              </form>
            )}
          </div>
        </System7Window>
      </div>
    </div>
  );
};
