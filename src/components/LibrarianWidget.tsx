'use client';

import React, { useState } from 'react';
import { getRandomLibrarianMessage } from '@/data/librarianMessages';

interface LibrarianWidgetProps {
  currentTopic: string;
}

/**
 * 우측 하단 사서 창구 위젯 (창 틀 없는 배경 위 픽셀 아이콘 + 레트로 말풍선)
 */
export const LibrarianWidget: React.FC<LibrarianWidgetProps> = ({ currentTopic }) => {
  const [showBubble, setShowBubble] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>(getRandomLibrarianMessage);

  const handleToggleBubble = () => {
    setShowBubble((prev) => {
      const next = !prev;
      if (next) {
        setCurrentMessage(getRandomLibrarianMessage());
      }
      return next;
    });
  };

  return (
    <div className="fixed bottom-9 right-6 z-20 flex flex-col items-end select-none pointer-events-auto">
      {/* 1. 상단 레트로 말풍선 (Mac Balloon Help 스타일) */}
      {showBubble && (
        <div
          data-testid="bubble-container"
          className="relative mb-[10px] w-76 p-3.5 bg-white border-2 border-black rounded-lg shadow-[3px_3px_0px_#000] text-black font-mono animate-in fade-in zoom-in-95 duration-100"
        >
          {/* 말풍선 헤더 */}
          <div className="flex items-center justify-between pb-1.5 border-b border-black mb-2 text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-black bg-black inline-block" />
              <span>사서 S</span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowBubble(false);
              }}
              className="w-4 h-4 flex items-center justify-center border border-black hover:bg-black hover:text-white transition-none cursor-pointer text-xs font-bold leading-none"
              title="말풍선 접기"
              aria-label="말풍선 닫기"
            >
              ×
            </button>
          </div>

          {/* 본문 (사서 S의 랜덤 대사) */}
          <p data-testid="librarian-message" className="text-xs leading-relaxed text-gray-900">
            &quot;{currentMessage}&quot;
          </p>

          {/* 현재 열람 정보 */}
          <div className="mt-2.5 pt-1.5 border-t border-gray-200 text-[11px] text-gray-600 truncate">
            열람 중: <span className="text-black font-semibold">{currentTopic}</span>
          </div>

          {/* 정통 Mac Balloon 말풍선 꼬리표 */}
          <div className="absolute -bottom-2.5 right-16 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-black">
            <div className="absolute -top-[12px] -left-[7px] w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-white" />
          </div>
        </div>
      )}

      {/* 2. 배경 위 독립 사서 창구 아이콘 버튼 */}
      <button
        type="button"
        onClick={handleToggleBubble}
        className="group relative cursor-pointer focus:outline-none transition-transform active:scale-95"
        aria-label="도서관 사서 창구"
        title={showBubble ? '사서 클릭 시 말풍선 접기' : '사서 클릭 시 안내 대화 열기'}
      >
        {/* 말풍선이 닫혀 있을 때 표시되는 '사서에게 말 걸기' 검은 네모 칸 (librarian.png 상단 여백 및 수평 중앙 정렬) */}
        {!showBubble && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2.5 py-1 border border-white font-mono shadow-[2px_2px_0px_#000] whitespace-nowrap z-10 transition-transform group-hover:scale-105">
            사서에게 말 걸기
          </span>
        )}


        <img
          src="/librarian.png"
          alt="도서관 사서 창구"
          width={200}
          height={220}
          className="w-[200px] h-[220px] drop-shadow-[3px_3px_0px_rgba(0,0,0,0.5)] transition-opacity group-hover:opacity-95"
          draggable={false}
        />
      </button>
    </div>
  );
};
