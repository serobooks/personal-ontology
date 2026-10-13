'use client';

import React from 'react';

interface System7WindowProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  width?: string;
  isActive?: boolean;
}

/**
 * System 7 클래식 윈도우 프레임 컴포넌트
 * - 핀스트라이프(줄무늬) 타이틀 바
 * - 좌측 사각 클로즈 박스
 * - 중앙 흰색 패딩 타이틀
 * - 1px 외곽선 및 3D 베벨/그림자 효과
 */
export const System7Window: React.FC<System7WindowProps> = ({
  title,
  onClose,
  children,
  className = '',
  width = 'w-full',
  isActive = true,
}) => {
  return (
    <div
      className={`bg-[#e6e6e6] text-black ${width} sys7-window-heavy flex flex-col ${className}`}
    >
      {/* 윈도우 타이틀 바 */}
      <div className="relative flex items-center h-6 px-1 border-b border-black bg-[#e6e6e6] overflow-hidden select-none">
        {/* 활성화 상태일 때의 핀스트라이프 배경 */}
        {isActive && (
          <div className="absolute inset-0 pinstripe-bar opacity-80 pointer-events-none" />
        )}

        {/* 좌측 사각 클로즈 박스 */}
        <div className="relative z-10 flex items-center">
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              aria-label="닫기"
              className="sys7-close-box flex items-center justify-center cursor-pointer hover:bg-black hover:text-white"
            />
          )}
        </div>

        {/* 중앙 창 타이틀 */}
        <div className="relative z-10 mx-auto px-2 bg-[#e6e6e6] border-x border-black text-xs font-bold tracking-tight whitespace-nowrap">
          {title}
        </div>
      </div>

      {/* 윈도우 본문 콘텐츠 */}
      <div className="p-3 bg-white border-t border-[#888888] flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
