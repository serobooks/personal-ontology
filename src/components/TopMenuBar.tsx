'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TopMenuBarProps {
  onOpenAbout: () => void;
  onOpenIndex: () => void;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  onOpenAdmin: () => void;
  onOpenMap?: () => void;
  isAboutOpen: boolean;
  isIndexOpen: boolean;
  isSearchOpen: boolean;
  isHelpOpen: boolean;
  isAdminOpen: boolean;
  isMapOpen?: boolean;
  isAdminAuthenticated: boolean;
}

/**
 * System 7 상단 데스크톱 메뉴 바
 */
export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onOpenAbout,
  onOpenIndex,
  onOpenSearch,
  onOpenHelp,
  onOpenAdmin,
  onOpenMap,
  isAboutOpen,
  isIndexOpen,
  isSearchOpen,
  isHelpOpen,
  isAdminOpen,
  isMapOpen,
  isAdminAuthenticated,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isExploreOpen, setIsExploreOpen] = useState<boolean>(false);
  const exploreRef = useRef<HTMLDivElement>(null);

  // 실시간 디지털 시계 갱신 (시간 및 분 단위)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      setCurrentTime(`${formattedHours}:${minutes} ${ampm}`);
    };

    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Explore 드롭다운 바깥 클릭 또는 Escape 키 입력 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) {
        setIsExploreOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExploreOpen(false);
      }
    };

    if (isExploreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExploreOpen]);


  return (
    <header className="w-full h-7 bg-white border-b-2 border-black flex items-center justify-between px-3 text-xs select-none z-30 font-medium">
      {/* 좌측: 로고 및 시스템 메뉴 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 font-bold text-sm tracking-tight cursor-default">
          <span className="text-base leading-none">🏛️</span>
          <span>사적 온톨로지</span>
        </div>

        <nav className="flex items-center space-x-1">
          <button
            onClick={onOpenAbout}
            type="button"
            className={`px-2 py-0.5 border border-transparent hover:border-black hover:bg-black hover:text-white transition-none ${
              isAboutOpen ? 'bg-black text-white' : ''
            }`}
          >
            About
          </button>

          {/* Explore 드롭다운 메뉴 (Index, Search, Map, 경계선, Help) */}
          <div ref={exploreRef} className="relative">
            <button
              onClick={() => setIsExploreOpen((prev) => !prev)}
              type="button"
              aria-label="Explore"
              aria-haspopup="true"
              aria-expanded={isExploreOpen}
              className={`px-2 py-0.5 border border-transparent hover:border-black hover:bg-black hover:text-white transition-none cursor-pointer flex items-center gap-1 ${
                isExploreOpen || isIndexOpen || isSearchOpen || isMapOpen || isHelpOpen
                  ? 'bg-black text-white'
                  : ''
              }`}
            >
              <span>Explore</span>
              <span className="text-[9px] leading-none opacity-80">▾</span>
            </button>


            {isExploreOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                className="absolute left-0 top-full mt-0.5 w-36 bg-white border-2 border-black shadow-[2px_2px_0px_#000] py-1 z-50 font-mono text-xs select-none"
              >
                <button
                  type="button"
                  onClick={() => {
                    onOpenIndex();
                    setIsExploreOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between hover:bg-black hover:text-white cursor-pointer ${
                    isIndexOpen ? 'bg-black text-white' : ''
                  }`}
                >
                  <span>Index</span>
                  <span className="text-[10px] opacity-60">I</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenSearch();
                    setIsExploreOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between hover:bg-black hover:text-white cursor-pointer ${
                    isSearchOpen ? 'bg-black text-white' : ''
                  }`}
                >
                  <span>Search</span>
                  <span className="text-[10px] opacity-60">/</span>
                </button>

                {onOpenMap && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenMap();
                      setIsExploreOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1 flex items-center justify-between hover:bg-black hover:text-white cursor-pointer ${
                      isMapOpen ? 'bg-black text-white' : ''
                    }`}
                  >
                    <span>Map</span>
                    <span className="text-[10px] opacity-60">M</span>
                  </button>
                )}

                {/* 너무 두드러지지 않는 은은한 경계선 */}
                <div className="my-1 border-b border-gray-300 mx-1" />

                <button
                  type="button"
                  onClick={() => {
                    onOpenHelp();
                    setIsExploreOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between hover:bg-black hover:text-white cursor-pointer ${
                    isHelpOpen ? 'bg-black text-white' : ''
                  }`}
                >
                  <span>Help</span>
                  <span className="text-[10px] opacity-60">?</span>
                </button>
              </div>
            )}
          </div>

          {/* 사서 Admin 메뉴: 미인증 시 Admin, 인증 시 Admin* [ON] */}
          <button
            onClick={onOpenAdmin}
            type="button"
            className={`px-2 py-0.5 border border-transparent hover:border-black hover:bg-black hover:text-white transition-none font-medium flex items-center gap-1 cursor-pointer ${
              isAdminOpen
                ? 'bg-black text-white'
                : isAdminAuthenticated
                ? 'text-emerald-800 font-bold border-emerald-700/40 bg-emerald-50'
                : ''
            }`}
          >
            <span>{isAdminAuthenticated ? 'Admin* [ON]' : 'Admin'}</span>
          </button>

          <a
            href="https://dear-master.kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 border border-transparent hover:border-black hover:bg-black hover:text-white transition-none flex items-center space-x-0.5"
          >
            <span>Dear Master</span>
            <span className="text-[10px]">↗</span>
          </a>

          <a
            href="https://github.com/serobooks/tateyomi/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 border border-transparent hover:border-black hover:bg-black hover:text-white transition-none flex items-center space-x-0.5"
          >
            <span>Tateyomi</span>
            <span className="text-[10px]">↗</span>
          </a>
        </nav>


      </div>

      {/* 우측: 서고 버전 및 실시간 시계 */}
      <div className="flex items-center space-x-3">
        <span className="text-[11px] text-[#555555] hidden sm:inline">
          System 7.1.0 • 단말기 1호
        </span>
        <div className="border border-black px-2 py-0.5 bg-[#f0f0f0] font-mono text-[11px] font-bold min-w-[70px] text-center shadow-[1px_1px_0px_#000]">
          {currentTime || '12:00 PM'}
        </div>
      </div>
    </header>
  );
};
